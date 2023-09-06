namespace Throneteki.Lobby.Commands.Handlers;

public interface ILobbyCommandHandler<in TCommand> where TCommand : ILobbyCommand
{
    Task HandleAsync(TCommand command);
}