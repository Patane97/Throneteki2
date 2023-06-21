using System.ComponentModel.DataAnnotations;

namespace Throneteki.Lobby.Models;

public class NewGameRequest
{
    [Required]
    public string Name { get; set; } = null!;

    public string? Password { get; set; }
    public bool AllowSpectators { get; set; }

    [Required]
    public string GameType { get; set; } = null!;
    [Required]
    public string GameMode { get; set; } = null!;

    public bool UseGameTimeLimit { get; set; }
    public int GameTimeLimit { get; set; }
    public bool GamePrivate { get; set; }
    public bool UseChessClocks { get; set; }
    public int GameChessClockLimit { get; set; }
    public bool ShowHands { get; set; }
    public string? RestrictedListId { get; set; }
}