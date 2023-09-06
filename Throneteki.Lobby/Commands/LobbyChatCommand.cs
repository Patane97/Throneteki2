namespace Throneteki.Lobby.Commands;

public class LobbyChatCommand : ILobbyCommand
{
    public string ConnectionId { get; set; } = null!;
    public string Username { get; set; } = null!;
    public string Message { get; set; } = null!;
}