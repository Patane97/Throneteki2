namespace Throneteki.Lobby.Commands;

public class SelectDeckCommand : ILobbyCommand
{
    public string ConnectionId { get; set; } = null!;
    public string Username { get; set; } = null!;
    public int DeckId { get; set; }
}