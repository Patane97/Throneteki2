using Google.Protobuf.WellKnownTypes;
using Microsoft.AspNetCore.SignalR;
using Throneteki.Lobby.Models;
using Throneteki.Lobby.Services;
using Throneteki.WebService;

namespace Throneteki.Lobby.Commands.Handlers;

public class StartGameCommandHandler : ILobbyCommandHandler<StartGameCommand>
{
    private readonly ThronetekiService.ThronetekiServiceClient _thronetekiService;
    private readonly LobbyService _lobbyService;
    private readonly IHubContext<LobbyHub> _hubContext;
    private readonly GameNodeManager _nodeManager;

    public StartGameCommandHandler(ThronetekiService.ThronetekiServiceClient thronetekiService, LobbyService lobbyService, IHubContext<LobbyHub> hubContext, GameNodeManager nodeManager)
    {
        _thronetekiService = thronetekiService;
        _lobbyService = lobbyService;
        _hubContext = hubContext;
        _nodeManager = nodeManager;
    }

    public async Task HandleAsync(StartGameCommand command)
    {
        var user = (await _thronetekiService.GetUserByUsernameAsync(
            new GetUserByUsernameRequest
            {
                Username = command.Username
            })).User;

        var game = _lobbyService.GetGameForUser(user.Username);
        if (game == null)
        {
            return;
        }

        if (game.Owner.Username != user.Username || !game.Players.All(p => p.User.DeckSelected))
        {
            return;
        }

        var node = _nodeManager.GetNextAvailableNode();
        if (node == null)
        {
            await _hubContext.Clients.Client(command.ConnectionId)
                .SendAsync(LobbyMethods.GameError, "No game nodes available. Try again later.");
            return;
        }

        game.IsStarted = true;
        game.Node = node;

        await _lobbyService.BroadcastGameMessage(LobbyMethods.UpdateGame, game);
        await _nodeManager.StartGame(node, game.GetStartGameDetails());

        var gameState = game.GetSaveState();

        await _thronetekiService.CreateGameAsync(new CreateGameRequest
        {
            Game = new ThronetekiGame
            {
                Id = gameState.SavedGameId,
                GameId = gameState.GameId.ToString(),
                StartedAt = gameState.StartedAt.ToTimestamp(),
                FinishedAt = gameState.FinishedAt.HasValue
                    ? gameState.FinishedAt.Value.ToTimestamp()
                    : new Timestamp { Nanos = 0, Seconds = 0 },
                WinReason = gameState.WinReason ?? string.Empty,
                Winner = gameState.Winner ?? string.Empty,
                Players =
                {
                    gameState.Players.Select(p => new ThronetekiGamePlayer
                    {
                        Player = p.Name,
                        DeckId = p.DeckId,
                        TotalPower = p.Power
                    })
                }
            }
        });

        await _hubContext.Clients.Group(game.Id.ToString()).SendAsync(LobbyMethods.HandOff, new
        {
            url = node.Url,
            name = node.Name,
            gameId = game.Id.ToString()
        });
    }
}