namespace Throneteki.Lobby.Models;

public class LobbySavedGame
{
    public int SavedGameId { get; set; }
    public Guid GameId { get; set; }
    public DateTime StartedAt { get; set; }
    public string? Winner { get; set; }
    public string? WinReason { get; set; }
    public DateTime? FinishedAt { get; set; }
    public IEnumerable<LobbySavedGamePlayer> Players { get; set; } = new List<LobbySavedGamePlayer>();
}