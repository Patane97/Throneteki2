using AutoMapper;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using Throneteki.Lobby.Commands;
using Throneteki.Lobby.Commands.Handlers;
using Throneteki.Lobby.Models;
using Throneteki.Lobby.Services;

namespace Throneteki.Lobby;

public class LobbyHub : Hub
{
    private readonly LobbyService _lobbyService;
    private readonly LobbyCommandHandlerFactory _commandHandlerFactory;
    private readonly IMapper _mapper;

    public LobbyHub(LobbyService lobbyService, LobbyCommandHandlerFactory commandHandlerFactory, IMapper mapper)
    {
        _lobbyService = lobbyService;
        _commandHandlerFactory = commandHandlerFactory;
        _mapper = mapper;
    }

    public override async Task OnConnectedAsync()
    {
        await _lobbyService.UserConnected(Context);
        await base.OnConnectedAsync();
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        await _lobbyService.UserDisconnected(Context);
        await base.OnDisconnectedAsync(exception);
    }

    public async Task Ping()
    {
        await Clients.Caller.SendAsync(LobbyMethods.Pong);
    }

    [Authorize]
    public Task LobbyChat(string message)
    {
        var command = BuildCommand<LobbyChatCommand>();

        command.Message = message;

        var handler = _commandHandlerFactory.GetCommandHandler<LobbyChatCommand>();

        return handler.HandleAsync(command);
    }

    [Authorize]
    public Task NewGame(NewGameRequest request)
    {
        var command = _mapper.Map<NewGameCommand>(request);

        BuildCommand(command);

        var handler = _commandHandlerFactory.GetCommandHandler<NewGameCommand>();

        return handler.HandleAsync(command);
    }

    [Authorize]
    public Task JoinGame(Guid gameId)
    {
        var command = BuildCommand<JoinGameCommand>();

        command.GameId = gameId;

        var handler = _commandHandlerFactory.GetCommandHandler<JoinGameCommand>();

        return handler.HandleAsync(command);
    }

    [Authorize]
    public Task SelectDeck(int deckId)
    {
        var command = BuildCommand<SelectDeckCommand>();
        command.DeckId = deckId;

        var handler = _commandHandlerFactory.GetCommandHandler<SelectDeckCommand>();

        return handler.HandleAsync(command);
    }

    [Authorize]
    public Task StartGame(string _)
    {
        var command = BuildCommand<StartGameCommand>();

        var handler = _commandHandlerFactory.GetCommandHandler<StartGameCommand>();

        return handler.HandleAsync(command);
    }

    [Authorize]
    public Task LeaveGame(string _)
    {
        var command = BuildCommand<LeaveGameCommand>();

        var handler = _commandHandlerFactory.GetCommandHandler<LeaveGameCommand>();

        return handler.HandleAsync(command);
    }

    private TCommand BuildCommand<TCommand>() where TCommand : ILobbyCommand, new()
    {
        return new TCommand
        {
            Username = Context.User?.Identity?.Name ?? throw new InvalidOperationException(),
            ConnectionId = Context.ConnectionId
        };
    }

    private void BuildCommand(ILobbyCommand command)
    {
        command.Username = Context.User?.Identity?.Name ?? throw new InvalidOperationException();
        command.ConnectionId = Context.ConnectionId;
    }
}