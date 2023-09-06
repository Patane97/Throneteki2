using Microsoft.AspNetCore.SignalR;
using Throneteki.Lobby.Models;
using Throneteki.Lobby.Services;
using Throneteki.WebService;

namespace Throneteki.Lobby.Commands.Handlers;

public class LeaveGameCommandHandler : ILobbyCommandHandler<LeaveGameCommand>
{
    private readonly ThronetekiService.ThronetekiServiceClient _thronetekiService;
    private readonly LobbyService _lobbyService;
    private readonly IHubContext<LobbyHub> _hubContext;

    public LeaveGameCommandHandler(ThronetekiService.ThronetekiServiceClient thronetekiService, LobbyService lobbyService, IHubContext<LobbyHub> hubContext)
    {
        _thronetekiService = thronetekiService;
        _lobbyService = lobbyService;
        _hubContext = hubContext;
    }

    public async Task HandleAsync(LeaveGameCommand command)
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

        game.PlayerLeave(user.Username);

        _lobbyService.RemoveGameForUser(user.Username);

        await _hubContext.Clients.Client(command.ConnectionId).SendAsync(LobbyMethods.ClearGameState);

        await _hubContext.Groups.RemoveFromGroupAsync(command.ConnectionId, game.Id.ToString());

        if (game.IsEmpty)
        {
            await _lobbyService.BroadcastGameMessage(LobbyMethods.RemoveGame, game);
            _lobbyService.RemoveGame(game.Id);
        }
        else
        {
            await _lobbyService.BroadcastGameMessage(LobbyMethods.UpdateGame, game);
        }
    }
}