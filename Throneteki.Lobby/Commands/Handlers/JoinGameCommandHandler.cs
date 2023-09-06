using Microsoft.AspNetCore.SignalR;
using Throneteki.Lobby.Models;
using Throneteki.Lobby.Services;
using Throneteki.WebService;

namespace Throneteki.Lobby.Commands.Handlers;

public class JoinGameCommandHandler : ILobbyCommandHandler<JoinGameCommand>
{
    private readonly ThronetekiService.ThronetekiServiceClient _thronetekiService;
    private readonly LobbyService _lobbyService;
    private readonly IHubContext<LobbyHub> _hubContext;

    public JoinGameCommandHandler(ThronetekiService.ThronetekiServiceClient thronetekiService, LobbyService lobbyService, IHubContext<LobbyHub> hubContext)
    {
        _thronetekiService = thronetekiService;
        _lobbyService = lobbyService;
        _hubContext = hubContext;
    }

    public async Task HandleAsync(JoinGameCommand command)
    {
        var user = (await _thronetekiService.GetUserByUsernameAsync(
            new GetUserByUsernameRequest
            {
                Username = command.Username
            })).User;

        if (_lobbyService.GetGameForUser(user.Username) != null)
        {
            await _hubContext.Clients.Client(command.ConnectionId).SendAsync(LobbyMethods.JoinFailed,
                "You are already in a game, leave that one first.");

            return;
        }

        var game = _lobbyService.GetGameById(command.GameId);
        if (game == null)
        {
            await _hubContext.Clients.Client(command.ConnectionId).SendAsync(LobbyMethods.JoinFailed,
                "Game not found.");

            return;
        }

        var message = game.PlayerJoin(user);
        if (message != null)
        {
            await _hubContext.Clients.Client(command.ConnectionId).SendAsync(LobbyMethods.JoinFailed, message);

            return;
        }

        _lobbyService.AddGameForUser(game, user.Username);
        await _hubContext.Groups.AddToGroupAsync(command.ConnectionId, game.Id.ToString());

        await _lobbyService.SendGameState(game);

        await _lobbyService.BroadcastGameMessage(LobbyMethods.UpdateGame, game);
    }
}