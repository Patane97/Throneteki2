using AutoMapper;
using Throneteki.DeckValidation;
using Throneteki.Lobby.Services;
using Throneteki.Models.Models;
using Throneteki.WebService;

namespace Throneteki.Lobby.Commands.Handlers;

public class SelectDeckCommandHandler : ILobbyCommandHandler<SelectDeckCommand>
{
    private readonly ThronetekiService.ThronetekiServiceClient _thronetekiService;
    private readonly LobbyService _lobbyService;
    private readonly IMapper _mapper;

    public SelectDeckCommandHandler(ThronetekiService.ThronetekiServiceClient thronetekiService, LobbyService lobbyService, IMapper mapper)
    {
        _thronetekiService = thronetekiService;
        _lobbyService = lobbyService;
        _mapper = mapper;
    }

    public async Task HandleAsync(SelectDeckCommand command)
    {
        var user = (await _thronetekiService.GetUserByUsernameAsync(
            new GetUserByUsernameRequest
            {
                Username = command.Username
            })).User;

        var game = _lobbyService.GetGameForUser(user.Username);
        if (game == null)
        {
            return;
        }

        var deck = (await _thronetekiService.GetDeckByIdAsync(new GetDeckByIdRequest { DeckId = command.DeckId })).Deck;
        if (deck == null)
        {
            return;
        }

        var lobbyDeck = _mapper.Map<LobbyDeck>(deck);


        var packs = _mapper.Map<IEnumerable<LobbyPack>>((await _thronetekiService.GetAllPacksAsync(new GetAllPacksRequest())).Packs);

        var deckValidator = new DeckValidator(packs,
            game.RestrictedList != null ? new[] { game.RestrictedList } : Array.Empty<LobbyRestrictedList>());

        lobbyDeck.ValidationStatus = deckValidator.ValidateDeck(lobbyDeck);
        game.SelectDeck(user.Username, lobbyDeck);

        await _lobbyService.SendGameState(game);
    }
}