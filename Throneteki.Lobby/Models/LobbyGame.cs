using System.Collections.Concurrent;
using System.Security.Cryptography;
using System.Text;
using Throneteki.Models.Models;
using Throneteki.WebService;

namespace Throneteki.Lobby.Models;

public class LobbyGame
{
    private readonly ConcurrentDictionary<string, GameUser> _gameUsers = new();

    public LobbyGame(NewGameRequest request, ThronetekiUser owner, LobbyRestrictedList? restrictedList)
    {
        RestrictedList = restrictedList;
        AllowSpectators = request.AllowSpectators;
        IsPrivate = request.GamePrivate;
        Name = request.Name;
        Password = string.IsNullOrEmpty(request.Password) ? null : HashPassword(request.Password);
        Owner = owner;
        GameType = request.GameType;
        GameMode = request.GameMode;
        ShowHand = request.ShowHands;
        IsGameTimeLimited = request.UseGameTimeLimit;
    }

    public bool AllowSpectators { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public string GameType { get; set; }
    public string GameMode { get; set; }
    public ICollection<GameUser> GameUsers => _gameUsers.Values;
    public ICollection<GameUser> Players => _gameUsers.Values.Where(gu => gu.GameUserType == GameUserType.Player).ToList();
    public Guid Id { get; set; } = Guid.NewGuid();
    public bool IsChessClocksEnabled { get; set; }
    public bool IsGameTimeLimited { get; set; }
    public bool IsPrivate { get; set; }
    public bool IsStarted { get; set; }
    public string? Name { get; set; }
    public ThronetekiUser Owner { get; set; }
    public string? Password { get; set; }
    public bool ShowHand { get; set; }
    public bool IsEmpty => !Players.Any();
    public LobbyRestrictedList? RestrictedList { get; }
    public LobbyNode? Node { get; set; }
    public int SavedGameId { get; set; }
    public ThronetekiUser? Winner { get; set; }
    public string? WinReason { get; set; }
    public DateTime? FinishedAt { get; set; }

    public void AddUser(LobbyGamePlayer user, GameUserType userType)
    {
        _gameUsers[user.Name] = new GameUser { GameUserType = userType, User = user };
    }

    private static string HashPassword(string password)
    {
        using var sha256 = SHA256.Create();

        var secretBytes = Encoding.UTF8.GetBytes(password);
        var secretHash = sha256.ComputeHash(secretBytes);

        return Convert.ToHexString(secretHash);
    }

    public object GetState(LobbyGamePlayer? player)
    {
        /*
        var playerSummaries = {};
        var playersInGame = _.filter(this.players, player => !player.left);

        _.each(playersInGame, player => {
            var deck = undefined;

            if(activePlayer === player.name && player.deck) {
                deck = { name: player.deck.name, selected: player.deck.selected, status: player.deck.status };
            } else if(player.deck) {
                deck = { selected: player.deck.selected, status: player.deck.status };
            } else {
                deck = {};
            }

            playerSummaries[player.name] = {
                agenda: this.started && player.agenda ? player.agenda.cardData.code : undefined,
                deck: activePlayer ? deck : {},
                faction: this.started && player.faction ? player.faction.cardData.code : undefined,
                id: player.id,
                left: player.left,
                name: player.name,
                owner: player.owner,
                role: player.user.role,
                settings: player.user.settings
            };
        });

        return {
            allowSpectators: this.allowSpectators,
            createdAt: this.createdAt,
            gamePrivate: this.gamePrivate,
            gameType: this.gameType,
            event: this.event,
            full: Object.values(this.players).length >= this.maxPlayers,
            id: this.id,
            messages: activePlayer ? this.gameChat.messages : undefined,
            name: this.name,
            needsPassword: !!this.password,
            node: this.node ? this.node.identity : undefined,
            owner: this.owner.username,
            players: playerSummaries,
            restrictedList: this.restrictedList,
            showHand: this.showHand,
            started: this.started,
            spectators: _.map(this.spectators, spectator => {
                return {
                    id: spectator.id,
                    name: spectator.name,
                    settings: spectator.settings
                };
            }),
            useGameTimeLimit: this.useGameTimeLimit,
            gameTimeLimit: this.gameTimeLimit,
            muteSpectators: this.muteSpectators,
            useChessClocks: this.useChessClocks,
            chessClockTimeLimit: this.chessClockTimeLimit
        };
        */

        return new
        {
            AllowSpectators,
            CreatedAt,
            GamePrivate = IsPrivate,
            GameType,
            Id,
            Name,
            NeedsPassword = !string.IsNullOrEmpty(Password),
            Owner = Owner.Username,
            Players = GameUsers.Where(gu => gu.GameUserType == GameUserType.Player).Select(gu => gu.User.GetSummary(player)),
            ShowHand,
            Spectators = GameUsers.Where(gu => gu.GameUserType == GameUserType.Spectator).Select(gu => gu.User.GetSummary()),
            Started = IsStarted,
            UseChessClocks = IsChessClocksEnabled,
            UseGameTimeLimit = IsGameTimeLimited,
            RestrictedListId = RestrictedList?.Id
        };
    }

    public object GetStartGameDetails()
    {
        return new
        {
            AllowSpectators,
            CreatedAt,
            //event: this.event,
            GamePrivate = IsPrivate,
            GameType,
            GameMode,
            Id,
            Name,
            Owner,
            Players = GameUsers.Where(gu => gu.GameUserType == GameUserType.Player).Select(gu => gu.User.GetDetails()),
            //            restrictedList: this.restrictedList,
            ShowHand,
            Spectators = GameUsers.Where(gu => gu.GameUserType == GameUserType.Spectator).Select(gu => gu.User.GetDetails()),
            //useRookery: this.useRookery,
            UseChessClocks = IsChessClocksEnabled,
            UseGameTimeLimit = IsGameTimeLimited
            //       gameTimeLimit: this.gameTimeLimit,
            //         muteSpectators: this.muteSpectators,
//            chessClockTimeLimit: this.chessClockTimeLimit
        };
    }

    public bool IsVisibleFor(ThronetekiUser user)
    {
        return true;
    }

    public void SelectDeck(string username, LobbyDeck deck)
    {
        var player = _gameUsers[username];

        player.User.Deck = deck;
    }

    public void UserDisconnect(string username)
    {
        if (IsStarted || !_gameUsers.ContainsKey(username))
        {
            return;
        }

        AddMessage($"{username} has disconnected.");

        var user = _gameUsers[username];

        if (user.GameUserType == GameUserType.Player)
        {
            if (Owner.Username == username)
            {
                var otherPlayer = GameUsers
                    .FirstOrDefault(gu => gu.GameUserType == GameUserType.Player && gu.User.Name != username);

                if (otherPlayer != null)
                {
                    Owner = otherPlayer.User.User;
                }
            }
        }

        _gameUsers.Remove(username, out _);
    }

    private void AddMessage(string format, params object[] args)
    {
    }

    public string? PlayerJoin(ThronetekiUser user, string? password = null)
    {
        if (Players.Count == 2 || IsStarted)
        {
            return "Cannot join a full or started game";
        }

        if (IsUserBlocked(user))
        {
            return "You cannot join this game";
        }

        AddUser(new LobbyGamePlayer { User = user }, GameUserType.Player);

        return null;
        /*

        if (this.password) {
            if (crypto.createHash('md5').update(password).digest('hex') !== this.password) {
                return 'Incorrect game password';
            }
        }

        this.addMessage('{0} has joined the game', user.username);

        if (!this.isOwner(this.owner.username)) {
            let otherPlayer = Object.values(this.players).find(
                (player) => player.name !== this.owner.username
            );

            if (otherPlayer) {
                this.owner = otherPlayer.user;
                otherPlayer.owner = true;
            }
        }

        return undefined;*/
    }

    public void PlayerLeave(string username)
    {
        var player = _gameUsers[username];

        if (!IsStarted)
        {
            AddMessage($"{0} has left the game", player);
        }

        if (player.GameUserType == GameUserType.Player)
        {
            if (IsStarted)
            {
                player.HasLeft = true;
            }
            else
            {
                RemoveAndResetOwner(player);

                _gameUsers.Remove(username, out _);
            }
        }
        else
        {
            _gameUsers.Remove(username, out _);
        }
    }

    private bool IsUserBlocked(ThronetekiUser user)
    {
        return Players.Any(p =>
            p.User.User.BlockList.Any(bl => bl.UserId == user.Id) ||
            user.BlockList.Any(bl => Players.Any(p2 => bl.UserId == p2.User.User.Id)));
    }

    private void RemoveAndResetOwner(GameUser player)
    {
        if (player.Name == Owner.Username)
        {
            var otherPlayer = Players.FirstOrDefault(gu => gu.Name != player.Name);

            if (otherPlayer != null)
            {
                Owner = otherPlayer.User.User;
            }
        }
    }

    public LobbySavedGame GetSaveState()
    {
        return new LobbySavedGame
        {
            SavedGameId = SavedGameId, GameId = Id, StartedAt = CreatedAt,
            Winner = Winner?.Username,
            WinReason = WinReason,
            FinishedAt = FinishedAt,
            Players = Players.Select(p => new LobbySavedGamePlayer
            {
                Name = p.User.Name, 
                DeckId = p.User.Deck!.Id, 
                Power = 0
            })
        };
    }
}

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

public class LobbySavedGamePlayer
{
    public string Name { get; set; } = null!;
    public int DeckId { get; set; }
    public int Power { get; set; }
}