using System.Collections.Concurrent;
using System.Diagnostics.CodeAnalysis;
using Microsoft.AspNetCore.SignalR;
using Throneteki.Lobby.Models;
using Throneteki.WebService;
using LobbyMessage = Throneteki.Lobby.Models.LobbyMessage;

namespace Throneteki.Lobby.Services;

public class LobbyService
{
    private static readonly ConcurrentDictionary<string, ThronetekiUser> UsersByName = new();
    private static readonly ConcurrentDictionary<string, string> ConnectionsByUsername = new();
    private static readonly ConcurrentDictionary<string, string> Connections = new();
    private static readonly ConcurrentDictionary<string, LobbyGame> GamesByUsername = new();
    private static readonly ConcurrentDictionary<Guid, LobbyGame> GamesById = new();

    private static readonly TimeSpan StaleGameTimeout = TimeSpan.FromMinutes(10);
    private readonly IHubContext<LobbyHub> _hubContext;
    private readonly ILogger<LobbyService> _logger;
    private readonly ThronetekiService.ThronetekiServiceClient _thronetekiService;

    public LobbyService(ThronetekiService.ThronetekiServiceClient thronetekiService, IHubContext<LobbyHub> hubContext,
        ILogger<LobbyService> logger)
    {
        _thronetekiService = thronetekiService;
        _hubContext = hubContext;
        _logger = logger;
    }

    public async Task UserConnected(HubCallerContext context)
    {
        Connections[context.ConnectionId] = context.ConnectionId;

        ThronetekiUser? user = null;
        if (context.User?.Identity?.IsAuthenticated == true)
        {
            user = (await _thronetekiService.GetUserByUsernameAsync(
                new GetUserByUsernameRequest
                {
                    Username = context.User.Identity.Name
                }, cancellationToken: context.ConnectionAborted)).User;

            UsersByName[user.Username] = user;
            ConnectionsByUsername[user.Username] = context.ConnectionId;
        }

        var userSummaries =
            (user != null ? FilterUserListForUserByBlockList(user, UsersByName.Values) : UsersByName.Values).Select(u =>
                new
                {
                    u.Id,
                    u.Avatar,
                    u.Role,
                    u.Username
                });

        await _hubContext.Clients.Client(context.ConnectionId)
            .SendAsync(LobbyMethods.Users, userSummaries, context.ConnectionAborted);
        var lobbyMessages = await _thronetekiService.GetLobbyMessagesForUserAsync(
            new GetLobbyMessagesForUserRequest { UserId = user != null ? user.Id : string.Empty },
            cancellationToken: context.ConnectionAborted);
        await _hubContext.Clients.Client(context.ConnectionId).SendAsync(LobbyMethods.LobbyMessages, lobbyMessages
            .Messages.OrderBy(m => m.Time).Select(message => new LobbyMessage
            {
                Id = message.Id,
                Message = message.Message,
                Time = message.Time.ToDateTime(),
                User = new LobbyUser
                {
                    Id = message.User.Id,
                    Role = message.User.Role,
                    Username = message.User.Username,
                    Avatar = message.User.Avatar
                }
            }), context.ConnectionAborted);

        var gamesToSend = GamesById.Values.Where(g => user == null || g.IsVisibleFor(user))
            .OrderByDescending(g => g.IsStarted)
            .ThenByDescending(g => g.CreatedAt)
            .Select(g => g.GetState(null));

        await _hubContext.Clients.Client(context.ConnectionId).SendAsync(LobbyMethods.Games, gamesToSend);

        if (user != null)
        {
            var excludedConnectionIds = new List<string> { context.ConnectionId };

            excludedConnectionIds.AddRange(UsersByName.Values.Where(u =>
                    u.BlockList.Any(bl => bl.UserId == user.Id) &&
                    user.BlockList.Any(bl => bl.UserId == u.Id))
                .Select(u => Connections[ConnectionsByUsername[u.Username]]));

            await _hubContext.Clients.AllExcept(excludedConnectionIds).SendAsync(LobbyMethods.NewUser, new LobbyUser
            {
                Id = user.Id,
                Avatar = user.Avatar,
                Username = user.Username
            }, context.ConnectionAborted);

            if (GamesByUsername.TryGetValue(user.Username, out var game) && game.IsStarted)
            {
                if (game.Node == null)
                {
                    throw new Exception("Game node was null when it really should not have been");
                }

                await _hubContext.Clients.Client(context.ConnectionId).SendAsync(LobbyMethods.HandOff, new
                {
                    url = game.Node.Url,
                    name = game.Node.Name,
                    gameId = game.Id.ToString()
                }, context.ConnectionAborted);
            }
        }
    }

    public async Task UserDisconnected(HubCallerContext context)
    {
        Connections.TryRemove(context.ConnectionId, out _);

        if (context.User?.Identity is { IsAuthenticated: true, Name: not null })
        {
            var user = (await _thronetekiService.GetUserByUsernameAsync(
                new GetUserByUsernameRequest
                {
                    Username = context.User.Identity.Name
                })).User;

            if (context.User.Identity.Name != null)
            {
                ConnectionsByUsername.TryRemove(context.User.Identity.Name, out _);
                UsersByName.TryRemove(context.User.Identity.Name, out _);
            }

            var excludedConnectionIds = new List<string> { context.ConnectionId };

            excludedConnectionIds.AddRange(UsersByName.Values.Where(u =>
                    u.BlockList.Any(bl => bl.UserId == user.Id) &&
                    user.BlockList.Any(bl => bl.UserId == u.Id))
                .Select(u => Connections[ConnectionsByUsername[u.Username]]));

            await _hubContext.Clients.AllExcept(excludedConnectionIds).SendAsync(LobbyMethods.UserLeft, user.Username);

            if (GamesByUsername.TryGetValue(user.Username, out var game))
            {
                game.UserDisconnect(user.Username);

                if (game.IsEmpty)
                {
                    await BroadcastGameMessage(LobbyMethods.RemoveGame, game);
                    GamesById.TryRemove(game.Id, out _);
                }
                else
                {
                    await BroadcastGameMessage(LobbyMethods.UpdateGame, game);
                }

                if (!game.IsStarted)
                {
                    GamesByUsername.TryRemove(user.Username, out _);
                }
            }
        }
    }

    public IEnumerable<string> GetConnectionsNotBlockedByUser(ThronetekiUser user)
    {
        return UsersByName.Values.Where(u =>
            u.BlockList.Any(bl => bl.UserId == user.Id) &&
            user.BlockList.Any(bl => bl.UserId == u.Id)).Select(u => Connections[ConnectionsByUsername[u.Username]]);
    }

    public LobbyGame? GetGameForUser(string username)
    {
        return GamesByUsername.TryGetValue(username, out var value) ? value : null;
    }

    public LobbyGame? GetGameById(Guid id)
    {
        return GamesById.TryGetValue(id, out var value) ? value : null;
    }

    public void RemoveGameForUser(string username)
    {
        GamesByUsername.TryRemove(username, out _);
    }

    public void RemoveGame(Guid id)
    {
        GamesById.TryRemove(id, out _);
    }

    public void AddGameForUser(LobbyGame game, string username)
    {
        GamesById[game.Id] = game;
        GamesByUsername[username] = game;
    }

    public async Task CloseGame(Guid gameId)
    {
        if (!GamesById.ContainsKey(gameId))
        {
            return;
        }

        var game = GamesById[gameId];

        GamesById.Remove(gameId, out _);
        foreach (var (key, g) in GamesByUsername)
            if (g.Id == gameId)
            {
                GamesByUsername.TryRemove(key, out _);
            }

        await BroadcastGameMessage(LobbyMethods.RemoveGame, game);
    }

    public async Task ClearStalePendingGames()
    {
        var staleGames = GamesById.Values
            .Where(game => !game.IsStarted && DateTime.UtcNow - game.CreatedAt > StaleGameTimeout).ToList();

        foreach (var game in staleGames)
        {
            GamesById.Remove(game.Id, out _);
            foreach (var (key, g) in GamesByUsername)
            {
                if (g.Id == game.Id)
                {
                    GamesByUsername.TryRemove(key, out _);
                }
            }

            await BroadcastGameMessage(LobbyMethods.RemoveGame, game);
        }
    }

    public async Task ClearGamesForNode(LobbyNode node)
    {
        var gamesOnNode = GamesById.Values
            .Where(game => game.Node?.Name == node.Name).ToList();

        foreach (var game in gamesOnNode)
        {
            GamesById.Remove(game.Id, out _);
            foreach (var (key, g) in GamesByUsername)
            {
                if (g.Id == game.Id)
                {
                    GamesByUsername.TryRemove(key, out _);
                }
            }
        }

        await _hubContext.Clients.All.SendAsync(LobbyMethods.RemoveGames, gamesOnNode.Select(g => g.GetState(null)));
    }

    public async Task BroadcastGameMessage(string message, LobbyGame game)
    {
        var gameState = game.GetState(null);

        await _hubContext.Clients.AllExcept(ConnectionsByUsername.Values).SendAsync(message, gameState);

        var connectionsToSend = new List<string>();

        foreach (var (username, connection) in ConnectionsByUsername)
        {
            var user = UsersByName[username];

            if (!game.IsVisibleFor(user))
            {
                return;
            }

            connectionsToSend.Add(connection);
        }

        await _hubContext.Clients.Clients(connectionsToSend).SendAsync(message, gameState);
    }

    public async Task SendGameState(LobbyGame game)
    {
        if (game.IsStarted)
        {
            return;
        }

        foreach (var player in game.GameUsers)
        {
            if (!ConnectionsByUsername.ContainsKey(player.User.Name))
            {
                _logger.LogError("Trying to send game state to {playerName} but they're disconnected",
                    player.User.Name);
                continue;
            }

            var connection = ConnectionsByUsername[player.User.Name];
            await _hubContext.Clients.Client(connection).SendAsync(LobbyMethods.GameState, game.GetState(player.User));
        }
    }

    public async Task SyncGames(LobbyNode node, IEnumerable<LobbyGameSummary> nodeGames)
    {
        foreach (var game in nodeGames)
        {
            var lobbyGame = new LobbyGame(game.Owner)
            {
                Id = game.Id,
                IsStarted = game.Started,
                Name = game.Name,
                AllowSpectators = game.AllowSpectators,
                CreatedAt = game.CreatedAt,
                GameType = game.GameType,
                IsChessClocksEnabled = game.UseChessClocks,
                IsGameTimeLimited = game.UseGameTimeLimit,
                Node = node,
                IsPrivate = game.GamePrivate,
                ShowHand = game.ShowHand
            };

            lobbyGame.Players.AddRange(game.Players.Values.Select(p => new GameUser
                {
                    User = new LobbyGamePlayer
                    {
                        User = new ThronetekiUser
                        {
                            Username = p.Name,
                            Avatar = p.User?.Avatar ?? string.Empty,
                            Role = p.User?.Avatar
                        }
                    },
                    GameUserType = GameUserType.Player
                }
            ));

            GamesById.TryAdd(lobbyGame.Id, lobbyGame);
            foreach (var player in game.Players.Values)
            {
                GamesByUsername[player.Name] = lobbyGame;
            }
        }

        await BroadcastGameList();
    }

    private async Task BroadcastGameList()
    {
        var gameStates = GamesById.Values.Select(g => g.GetState(null));

        await _hubContext.Clients.All.SendAsync(LobbyMethods.Games, gameStates);
    }

    [SuppressMessage("ReSharper", "SimplifyLinqExpressionUseAll", Justification = "More readable this way")]
    private static IEnumerable<ThronetekiUser> FilterUserListForUserByBlockList(ThronetekiUser sourceUser,
        IEnumerable<ThronetekiUser> userList)
    {
        return userList.Where(u =>
            !u.BlockList.Any(bl => bl.UserId == sourceUser.Id) &&
            !sourceUser.BlockList.Any(bl => bl.UserId == u.Id));
    }
}