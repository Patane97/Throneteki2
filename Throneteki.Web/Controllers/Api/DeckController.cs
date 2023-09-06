using JorgeSerrano.Json;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using OpenIddict.Validation.AspNetCore;
using System.Linq.Dynamic.Core;
using System.Net.Http.Headers;
using System.Text.Json;
using System.Threading;
using Throneteki.Data;
using Throneteki.Data.Models;
using Throneteki.Web.Models;
using Throneteki.Web.Models.Decks;
using Throneteki.Web.Models.Options;
using Throneteki.Web.Services;

namespace Throneteki.Web.Controllers.Api;

[ApiController]
[Authorize(AuthenticationSchemes = OpenIddictValidationAspNetCoreDefaults.AuthenticationScheme)]
[Route("/api/decks/")]
public class DeckController : ControllerBase
{
    private readonly ThronetekiDbContext _context;
    private readonly UserManager<ThronetekiUser> _userManager;
    private readonly ILogger<DeckController> _logger;
    private readonly DeckService _deckService;
    private readonly ThronesDbOptions _thronesDbOptions;
    private readonly JsonSerializerOptions _jsonOptions;

    public DeckController(ThronetekiDbContext context, UserManager<ThronetekiUser> userManager, 
        IOptions<ThronesDbOptions> thronesDbOptions, ILogger<DeckController> logger, DeckService deckService)
    {
        _context = context;
        _userManager = userManager;
        _logger = logger;
        _deckService = deckService;
        _thronesDbOptions = thronesDbOptions.Value;
        _jsonOptions = new JsonSerializerOptions { PropertyNamingPolicy = new JsonSnakeCaseNamingPolicy() };
    }

    [HttpPost]
    public async Task<IActionResult> AddDeck(AddDeckRequest request, CancellationToken cancellationToken)
    {
        var user = await _userManager.FindByNameAsync(User.Identity!.Name);
        if (user == null)
        {
            return Unauthorized();
        }

        if (!ModelState.IsValid)
        {
            return BadRequest(new ApiResponse
            {
                Success = false,
                Messages = ModelState.Select(e => $"{e.Key} - {e.Value}").ToList()
            });
        }

        await _deckService.AddOrUpdateDeck(user, request, cancellationToken);

        return Ok(new ApiResponse
        {
            Success = true
        });
    }

    [HttpPut("{deckId}")]
    public async Task<IActionResult> EditDeck(EditDeckRequest request, CancellationToken cancellationToken)
    {
        var user = await _userManager.FindByNameAsync(User.Identity!.Name);
        if (user == null)
        {
            return Unauthorized();
        }

        if (!ModelState.IsValid)
        {
            return BadRequest(new ApiResponse
            {
                Success = false,
                Messages = ModelState.Select(e => $"{e.Key} - {e.Value}").ToList()
            });
        }

        var deck = await _deckService.GetDeckById(request.Id);
        if (deck == null)
        {
            return NotFound();
        }

        if (deck.Owner != user.UserName)
        {
            return Forbid();
        }

        await _deckService.AddOrUpdateDeck(user, request, cancellationToken);

        return Ok(new ApiResponse
        {
            Success = true
        });
    }

    [HttpGet]
    public async Task<IActionResult> GetDecks([FromQuery] string? restrictedList, [FromQuery] DataLoadOptions options)
    {
        var user = await _userManager.FindByNameAsync(User.Identity!.Name);
        if (user == null)
        {
            return Unauthorized();
        }

        return Ok(await _deckService.GetDecksForUser(user, restrictedList, options));
    }

    [HttpGet("{deckId}")]
    public async Task<IActionResult> GetDeck(int deckId, [FromQuery] string? restrictedList)
    {
        var user = await _userManager.FindByNameAsync(User.Identity!.Name);
        if (user == null)
        {
            return Unauthorized();
        }

        var deck = await _deckService.GetDeckById(deckId, restrictedList);

        if (deck == null)
        {
            return NotFound();
        }

        if (deck.Owner != user.UserName)
        {
            return Forbid();
        }

        return Ok(new ApiDataResponse<ApiDeck>
        {
            Success = true,
            Data = deck
        });
    }

    [HttpDelete]
    public async Task<IActionResult> DeleteDecks(DeleteDecksRequest request)
    {
        var user = await _userManager.FindByNameAsync(User.Identity!.Name);
        if (user == null)
        {
            return Unauthorized();
        }

        await _deckService.DeleteDecks(user, request.DeckIds);

        return Ok(new ApiResponse
        {
            Success = true
        });
    }

    [HttpDelete("{deckId}")]
    public async Task<IActionResult> DeleteDeck(int deckId)
    {
        var user = await _userManager.FindByNameAsync(User.Identity!.Name);
        if (user == null)
        {
            return Unauthorized();
        }

        var deck = await _deckService.GetDeckById(deckId);
        if (deck == null)
        {
            return NotFound();
        }

        if (deck.Owner != user.UserName)
        {
            return Forbid();
        }

        await _deckService.DeleteDeck(deck.Id);

        return Ok(new ApiResponse
        {
            Success = true
        });
}

    [HttpGet("groupFilter")]
    public async Task<IActionResult> GetGroupFilterForDecks(string column, [FromQuery] DataLoadOptions options)
    {
        var user = await _userManager.FindByNameAsync(User.Identity!.Name);
        if (user == null)
        {
            return Unauthorized();
        }

        var query = _context.Decks
            .Where(d => d.UserId == user.Id);

        if (options.Filters != null && options.Filters.Any())
        {
            query = options.Filters
                .Where(filter => filter.Value != null && !filter.Value.Contains(','))
                .Aggregate(query, (current, filter) => current.Where($"{filter.Id}.Contains(@0)", filter.Value));
        }

        return Ok(query.Select(column).Distinct());
    }

    [HttpGet("thronesdb/status")]
    public async Task<IActionResult> GetThronesDbLinkStatus()
    {
        var user = await _userManager.FindByNameAsync(User.Identity!.Name);
        if (user == null)
        {
            return Unauthorized();
        }

        var thronesDbToken = await _userManager.Users
            .Where(u => u.Id == user.Id)
            .SelectMany(u => u.ExternalTokens)
            .FirstOrDefaultAsync(t => t.ExternalId == "ThronesDB");

        if (thronesDbToken == null)
        {
            return Ok(new
            {
                Success = true,
                Linked = false
            });
        }

        if (thronesDbToken.Expiry <= DateTime.UtcNow)
        {
            var httpClient = new HttpClient
            {
                BaseAddress = new Uri("https://thronesdb.com/api/")
            };

            if (!await RefreshThronesDbToken(httpClient, thronesDbToken))
            {
                {
                    return Ok(new
                    {
                        Success = true,
                        Linked = false
                    });
                }
            }
        }

        return Ok(new
        {
            Success = true,
            Linked = true
        });
    }

    [HttpPost("thronesdb/sync")]
    public async Task<IActionResult> SyncThronesDbDecks(CancellationToken cancellationToken)
    {
        var user = await _userManager.FindByNameAsync(User.Identity!.Name);
        if (user == null)
        {
            return Unauthorized();
        }

        user = await _userManager.Users.Include(u => u.ExternalTokens).FirstOrDefaultAsync(u => u.Id == user.Id, cancellationToken);
        if (user == null)
        {
            return Unauthorized();
        }

        var token = user.ExternalTokens.FirstOrDefault(t => t.ExternalId == "ThronesDB");
        if (token == null)
        {
            return Ok(new ApiResponse
            {
                Success = false,
                Messages = new List<string> { "You need to link your ThronesDB account" }
            });
        }

        var dbDecks = await _context.Decks
            .Include(d => d.DeckCards)
            .Where(d => d.UserId == user.Id && d.ExternalId != null)
            .ToDictionaryAsync(k => k.ExternalId!, v => v, cancellationToken);
        var dbFactions = await _context.Factions.ToDictionaryAsync(k => k.Code, v => v, cancellationToken: cancellationToken);
        var dbCards = await _context.Cards.ToDictionaryAsync(k => k.Code, v => v, cancellationToken: cancellationToken);

        var thronesDbDecks = await FetchThronesDbDecks(token);
        if (thronesDbDecks == null)
        {
            return BadRequest(new ApiResponse
            {
                Success = false,
                Messages = new List<string> { "An error occurred importing decks, please try again later" }
            });
        }

        foreach (var deck in thronesDbDecks)
        {
            var deckId = deck.Uuid;
            if (deckId == null)
            {
                continue;
            }

            if (!dbDecks.TryGetValue(deckId, out var dbDeck))
            {
                dbDeck = new Deck();
                _context.Decks.Add(dbDeck);
            }

            if (dbDeck.Updated >= deck.DateUpdate)
            {
                continue;
            }

            MapDeckFromThronesDbDeck(dbFactions, dbCards, user, deck, dbDeck);
        }

        await _context.SaveChangesAsync(cancellationToken);

        return Ok(new ApiResponse
        {
            Success = true
        });
    }

    [HttpGet("thronesdb")]
    public async Task<IActionResult> GetThronesDbDecks(CancellationToken cancellationToken)
    {
        var user = await _userManager.FindByNameAsync(User.Identity!.Name);
        if (user == null)
        {
            return Unauthorized();
        }

        user = await _userManager.Users.Include(u => u.ExternalTokens).FirstOrDefaultAsync(u => u.Id == user.Id, cancellationToken);
        if (user == null)
        {
            return Unauthorized();
        }

        var token = user.ExternalTokens.FirstOrDefault(t => t.ExternalId == "ThronesDB");
        if (token == null)
        {
            return Ok(new ApiResponse
            {
                Success = false,
                Messages = new List<string> { "You need to link your ThronesDB account" }
            });
        }

        var dbDecks = await _context.Decks
            .Include(d => d.DeckCards)
            .Where(d => d.UserId == user.Id && d.ExternalId != null)
            .ToDictionaryAsync(k => k.ExternalId!, v => v, cancellationToken);

        var decks = await FetchThronesDbDecks(token);
        if (decks == null)
        {
            return BadRequest(new ApiResponse
            {
                Success = false,
                Messages = new List<string> { "An error occurred fetching decks from ThronesDB" }
            });
        }

        decks = decks.ToList();

        foreach (var deck in decks)
        {
            if (deck.Uuid != null && dbDecks.ContainsKey(deck.Uuid))
            {
                deck.IsSynced = true;
            }
        }

        return Ok(new ApiDataResponse<IEnumerable<ThronesDbDeck>>
        {
            Success = true,
            Data = decks
        });
    }

    private async Task<IEnumerable<ThronesDbDeck>?> FetchThronesDbDecks(ExternalToken token)
    {
        var httpClient = new HttpClient
        {
            BaseAddress = new Uri("https://thronesdb.com/api/")
        };

        if (token.Expiry < DateTime.UtcNow)
        {
            if (!await RefreshThronesDbToken(httpClient, token))
            {
                return null;
            }
        }

        httpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token.AccessToken);

        return await httpClient.GetFromJsonAsync<IEnumerable<ThronesDbDeck>>("oauth2/decks", _jsonOptions);
    }

    [HttpPost("thronesdb")]
    public async Task<IActionResult> ImportThronesDbDecks([FromBody] IEnumerable<int> deckIds, CancellationToken cancellationToken)
    {
        var user = await _userManager.FindByNameAsync(User.Identity!.Name);
        if (user == null)
        {
            return Unauthorized();
        }

        user = await _userManager.Users.Include(u => u.ExternalTokens).FirstOrDefaultAsync(u => u.Id == user.Id, cancellationToken);
        if (user == null)
        {
            return Unauthorized();
        }

        var token = user.ExternalTokens.FirstOrDefault(t => t.ExternalId == "ThronesDB");
        if (token == null)
        {
            return Ok(new ApiResponse
            {
                Success = false,
                Messages = new List<string> { "You need to link your ThronesDB account" }
            });
        }

        var thronesDbDecks = await FetchThronesDbDecks(token);
        if (thronesDbDecks == null)
        {
            return BadRequest(new ApiResponse
            {
                Success = false,
                Messages = new List<string> { "An error occurred importing decks, please try again later" }
            });
        }

        var decks = thronesDbDecks.Where(d => deckIds.Contains(d.Id));
        var dbDecks = await _context.Decks
            .Include(d => d.DeckCards)
            .Where(d => d.UserId == user.Id && d.ExternalId != null)
            .ToDictionaryAsync(k => k.ExternalId!, v => v, cancellationToken);
        var dbFactions = await _context.Factions.ToDictionaryAsync(k => k.Code, v => v, cancellationToken: cancellationToken);
        var dbCards = await _context.Cards.ToDictionaryAsync(k => k.Code, v => v, cancellationToken: cancellationToken);

        foreach (var deck in decks)
        {
            var deckId = deck.Uuid;
            if (deckId == null)
            {
                continue;
            }

            if (!dbDecks.TryGetValue(deckId, out var dbDeck))
            {
                dbDeck = new Deck();
                _context.Decks.Add(dbDeck);
            }
            
            MapDeckFromThronesDbDeck(dbFactions, dbCards, user, deck, dbDeck);
        }

        await _context.SaveChangesAsync(cancellationToken);

        return Ok(new ApiResponse
        {
            Success = true
        });
    }

    private static void MapDeckFromThronesDbDeck(IReadOnlyDictionary<string, Faction> dbFactions, IReadOnlyDictionary<string, Card> dbCards,
        ThronetekiUser user, ThronesDbDeck deck, Deck dbDeck)
    {
        const string bannerAgendaCode = "06018";

        dbDeck.ExternalId = deck.Uuid;
        dbDeck.Name = deck.Name ?? string.Empty;

        dbDeck.Created = deck.DateCreation;
        dbDeck.Updated = deck.DateUpdate;
        dbDeck.Faction = dbFactions[deck.FactionCode!];
        dbDeck.UserId = user.Id;

        if (deck.Agendas != null && deck.Agendas.Any(a => a == bannerAgendaCode))
        {
            dbDeck.Agenda = dbCards[bannerAgendaCode];

            foreach (var agenda in deck.Agendas.Where(a => a != bannerAgendaCode))
            {
                if (!dbDeck.DeckCards.Any(dc => dc.CardId == dbCards[agenda].Id))
                {
                    dbDeck.DeckCards.Add(new DeckCard
                    {
                        Card = dbCards[agenda],
                        CardType = DeckCardType.Banner,
                        DeckId = dbDeck.Id,
                        Count = 1
                    });
                }
            }
        }
        else if (deck.Agendas != null && deck.Agendas.Any())
        {
            dbDeck.Agenda = dbCards[deck.Agendas.First()];
        }

        foreach (var (code, count) in deck.Slots!)
        {
            if (!dbDeck.DeckCards.Any(dc => dc.CardId == dbCards[code].Id))
            {
                if (dbCards[code].Type == "agenda")
                {
                    continue;
                }

                dbDeck.DeckCards.Add(new DeckCard
                {
                    Card = dbCards[code],
                    CardType = dbCards[code].Type == "plot" ? DeckCardType.Plot : DeckCardType.Draw,
                    Deck = dbDeck,
                    Count = count
                });
            }
        }
    }

    [HttpPost("{deckId}/toggleFavourite")]
    public async Task<IActionResult> ToggleFavouriteDeck(int deckId)
    {
        var user = await _userManager.FindByNameAsync(User.Identity!.Name);
        if (user == null)
        {
            return Unauthorized();
        }

        var deck = await _deckService.GetDeckById(deckId);
        if (deck == null)
        {
            return NotFound();
        }

        if (deck.Owner != user.UserName)
        {
            return Forbid();
        }

        deck.IsFavourite = !deck.IsFavourite;

        await _deckService.Update(deck);

        return Ok(new ApiResponse
        {
            Success = true
        });
    }

    private async Task<bool> RefreshThronesDbToken(HttpClient httpClient, ExternalToken token, CancellationToken cancellationToken = default)
    {
        if (_thronesDbOptions.ClientId == null || _thronesDbOptions.ClientSecret == null)
        {
            return false;
        }

        var request = new List<KeyValuePair<string, string>>
        {
            new("client_id", _thronesDbOptions.ClientId),
            new("client_secret", _thronesDbOptions.ClientSecret),
            new("grant_type", "refresh_token"),
            new("refresh_token", token.RefreshToken)
        };

        using var content = new FormUrlEncodedContent(request);
        content.Headers.ContentType = new MediaTypeHeaderValue("application/x-www-form-urlencoded");

        var response = await httpClient.PostAsync("https://thronesdb.com/oauth/v2/token", content, cancellationToken);

        if (!response.IsSuccessStatusCode)
        {
            var responseStr = await response.Content.ReadAsStringAsync(cancellationToken);
            _logger.LogWarning("Error refreshing thronesdb token: {response}", responseStr);

            return false;
        }

        var tokenResponse = await response.Content.ReadFromJsonAsync<TokenResponse>(_jsonOptions, cancellationToken);

        if (tokenResponse?.AccessToken == null || tokenResponse.RefreshToken == null)
        {
            return false;
        }

        token.AccessToken = tokenResponse.AccessToken;
        token.RefreshToken = tokenResponse.RefreshToken;
        token.Expiry = DateTime.UtcNow.AddSeconds(tokenResponse.ExpiresIn);

        await _context.SaveChangesAsync(cancellationToken);

        return true;
    }
}