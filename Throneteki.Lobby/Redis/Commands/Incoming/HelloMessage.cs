﻿using Throneteki.Lobby.Models;

namespace Throneteki.Lobby.Redis.Commands.Incoming;

public class HelloMessage
{
    public int MaxGames { get; set; }
    public string? Version { get; set; }
    public string? Url { get; set; }
//    public IReadOnlyCollection<LobbyGame> Games { get; set; } = new List<LobbyGame>();
}