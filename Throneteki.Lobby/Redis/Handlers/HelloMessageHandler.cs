using Throneteki.Lobby.Models;
using Throneteki.Lobby.Redis.Commands.Incoming;
using Throneteki.Lobby.Services;

namespace Throneteki.Lobby.Redis.Handlers;

public class HelloMessageHandler : IRedisCommandHandler<RedisIncomingMessage<HelloMessage>>
{
    private readonly GameNodeManager _gameNodeManager;
    private readonly LobbyService _lobbyService;

    public HelloMessageHandler(GameNodeManager gameNodeManager, LobbyService lobbyService)
    {
        _gameNodeManager = gameNodeManager;
        _lobbyService = lobbyService;
    }

    public async Task Handle(RedisIncomingMessage<HelloMessage> message)
    {
        if (message.Arg == null)
        {
            return;
        }

        var node = new LobbyNode
        {
            Name = message.Source,
            Url = message.Arg.Url,
            MaxGames = message.Arg.MaxGames,
            Version = message.Arg.Version
        };

        _gameNodeManager.AddNode(node);
        await _lobbyService.SyncGames(node, message.Arg.Games);
    }
}