using Throneteki.Models.Models;

namespace Throneteki.Lobby.Models;

public class LobbyGamePlayerSummary
{
    public bool DeckSelected { get; set; }
    public DeckValidationStatus? DeckStatus { get; set; }
    public string? DeckName { get; set; }
    public string Name { get; set; } = null!;
    public LobbyUser? User { get; set; }
}