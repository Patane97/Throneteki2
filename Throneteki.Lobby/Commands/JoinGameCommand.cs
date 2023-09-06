namespace Throneteki.Lobby.Commands;

public class JoinGameCommand : ILobbyCommand
{
    public string ConnectionId { get; set; } = null!;
    public string Username { get; set; } = null!;
    public Guid GameId { get; set; }
}