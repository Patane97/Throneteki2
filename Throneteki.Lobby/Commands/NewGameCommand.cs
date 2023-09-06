namespace Throneteki.Lobby.Commands;

public class NewGameCommand : ILobbyCommand
{
    public string ConnectionId { get; set; } = null!;
    public string Username { get; set; } = null!;
    public string Name { get; set; } = null!;
    public string? Password { get; set; }
    public bool AllowSpectators { get; set; }
    public string GameType { get; set; } = null!;
    public bool UseGameTimeLimit { get; set; }
    public int GameTimeLimit { get; set; }
    public bool GamePrivate { get; set; }
    public bool UseChessClocks { get; set; }
    public int GameChessClockLimit { get; set; }
    public bool ShowHands { get; set; }
    public string? RestrictedListId { get; set; }
}