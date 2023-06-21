using Throneteki.Models.Models;
using Throneteki.WebService;

namespace Throneteki.Lobby.Models;

public class LobbyGamePlayer
{
    public string Avatar => User.Avatar;
    public bool DeckSelected => Deck != null;
    public string Name => User.Username;
    public string Role => User.Role;
    public LobbyDeck? Deck { get; set; }
    public ThronetekiUser User { get; set; } = null!;

    public LobbyGamePlayerSummary GetSummary(LobbyGamePlayer? player = null)
    {
        return new LobbyGamePlayerSummary
        {
            DeckSelected = DeckSelected,
            DeckStatus = Deck?.ValidationStatus,
            DeckName = player != null && player.Name == User.Username ? Deck?.Name : null,
            Name = Name,
            User = new LobbyUser
            {
                Username = Name,
                Avatar = Avatar,
                Role = Role
            }
        };
    }

    public object GetDetails()
    {
        return new
        {
            Avatar,
            Deck,
            Name,
            Role,
            User.Settings,
            PromptedActionWindows = User.Settings.ActionWindows
        };
    }
}