using Microsoft.AspNetCore.SignalR;
using Throneteki.Lobby.Models;
using Throneteki.Lobby.Services;
using Throneteki.Models.Services;
using Throneteki.WebService;

namespace Throneteki.Lobby.Commands.Handlers;

public class NewGameCommandHandler : ILobbyCommandHandler<NewGameCommand>
{
    private readonly ThronetekiService.ThronetekiServiceClient _thronetekiService;
    private readonly CardService _cardService;
    private readonly IHubContext<LobbyHub> _hubContext;
    private readonly LobbyService _lobbyService;

    public NewGameCommandHandler(ThronetekiService.ThronetekiServiceClient thronetekiService, CardService cardService, IHubContext<LobbyHub> hubContext,
        LobbyService lobbyService)
    {
        _thronetekiService = thronetekiService;
        _cardService = cardService;
        _hubContext = hubContext;
        _lobbyService = lobbyService;
    }

    public async Task HandleAsync(NewGameCommand command)
    {
        var user = (await _thronetekiService.GetUserByUsernameAsync(
            new GetUserByUsernameRequest
            {
                Username = command.Username
            })).User;

        _lobbyService.GetGameForUser(user.Username);
        // Check for quickjoin

        var restrictedLists = await _cardService.GetRestrictedLists();

        var restrictedList = command.RestrictedListId == null
            ? restrictedLists.First()
            : restrictedLists.FirstOrDefault(r => r.Id == command.RestrictedListId);

        var newGame = new LobbyGame(command, user, restrictedList);

        newGame.AddUser(new LobbyGamePlayer { User = user }, GameUserType.Player);

        _lobbyService.AddGameForUser(newGame, user.Username);

        await _lobbyService.BroadcastGameMessage(LobbyMethods.NewGame, newGame);

        await _hubContext.Groups.AddToGroupAsync(command.ConnectionId, newGame.Id.ToString());
        await _lobbyService.SendGameState(newGame);
    }
}