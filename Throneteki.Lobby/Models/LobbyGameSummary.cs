using Throneteki.WebService;

namespace Throneteki.Lobby.Models;

public class LobbyGameSummary
{
    public bool AllowSpectators { get; set; }
    public DateTime CreatedAt { get; set; }
    public bool GamePrivate { get; set; }
    public string GameType { get; set; } = null!;
    public Guid Id { get; set; }
    public string Name { get; set; } = null!;
    public bool NeedsPassword { get; set; }
    public ThronetekiUser Owner { get; set; } = null!;

    public IDictionary<string, LobbyGamePlayerSummary> Players { get; set; } =
        new Dictionary<string, LobbyGamePlayerSummary>();
    public bool ShowHand { get; set; }
    public IEnumerable<LobbyGamePlayerSummary> Spectators { get; set; } = new List<LobbyGamePlayerSummary>();
    public bool Started { get; set; }
    public bool UseChessClocks { get; set; }
    public bool UseGameTimeLimit { get; set; }
    public string? RestrictedListId { get; set; }
}