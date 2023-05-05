﻿using Throneteki.WebService;

namespace Throneteki.DeckValidation;

public class ValidationRule
{
    public string? Message { get; set; }
    public Func<LobbyDeck, bool> Condition { get; set; } = deck => true;
}