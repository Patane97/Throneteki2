namespace Throneteki.Lobby.Commands;

public class LeaveGameCommand : ILobbyCommand
{
    public string ConnectionId { get; set; } = null!;
    public string Username { get; set; } = null!;
}