namespace Throneteki.Lobby.Commands;

public class StartGameCommand : ILobbyCommand
{
    public string ConnectionId { get; set; } = null!;
    public string Username { get; set; } = null!;
}