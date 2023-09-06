namespace Throneteki.Lobby.Commands.Handlers;

public class LobbyCommandHandlerFactory
{
    private readonly IServiceProvider _serviceProvider;

    public LobbyCommandHandlerFactory(IServiceProvider serviceProvider)
    {
        _serviceProvider = serviceProvider;
    }

    public ILobbyCommandHandler<TCommand> GetCommandHandler<TCommand>() where TCommand : ILobbyCommand
    {
        return _serviceProvider.GetRequiredService<ILobbyCommandHandler<TCommand>>();
    }
}