using Quartz;
using Throneteki.Lobby.Services;

namespace Throneteki.Lobby;

public class GameNodeTimeoutJob : IJob
{
    private readonly GameNodeManager _nodeManager;
    private readonly LobbyService _lobbyService;

    private static readonly TimeSpan NodeTimeout = TimeSpan.FromMinutes(5);

    public GameNodeTimeoutJob(GameNodeManager nodeManager, LobbyService lobbyService)
    {
        _nodeManager = nodeManager;
        _lobbyService = lobbyService;
    }

    public async Task Execute(IJobExecutionContext context)
    {
        foreach (var node in _nodeManager.GameNodes.Values.Where(node => !node.IsDisconnected))
        {
            if (node.LastPingSentTime.HasValue && DateTime.UtcNow - node.LastPingSentTime > NodeTimeout)
            {
                node.IsDisconnected = true;
                await _lobbyService.ClearGamesForNode(node);
            }
            else if (!node.LastPingSentTime.HasValue)
            {
                if (DateTime.UtcNow - node.LastMessageReceivedTime > NodeTimeout)
                {
                    node.LastPingSentTime = DateTime.UtcNow;
                    await _nodeManager.PingNode(node);
                }
            }
        }
    }
}