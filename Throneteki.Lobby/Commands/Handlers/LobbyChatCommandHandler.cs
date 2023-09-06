using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Options;
using Throneteki.Lobby.Models;
using Throneteki.Lobby.Services;
using Throneteki.WebService;

namespace Throneteki.Lobby.Commands.Handlers;

public class LobbyChatCommandHandler : ILobbyCommandHandler<LobbyChatCommand>
{
    private readonly ThronetekiService.ThronetekiServiceClient _thronetekiService;
    private readonly IHubContext<LobbyHub> _hubContext;
    private readonly ILogger<LobbyService> _logger;
    private readonly LobbyService _lobbyService;
    private readonly LobbyOptions _lobbyOptions;

    public LobbyChatCommandHandler(ThronetekiService.ThronetekiServiceClient thronetekiService, IOptions<LobbyOptions> lobbyOptions, IHubContext<LobbyHub> hubContext,
        ILogger<LobbyService> logger, LobbyService lobbyService)
    {
        _thronetekiService = thronetekiService;
        _hubContext = hubContext;
        _logger = logger;
        _lobbyService = lobbyService;
        _lobbyOptions = lobbyOptions.Value;
    }

    public async Task HandleAsync(LobbyChatCommand command)
    {
        var user = (await _thronetekiService.GetUserByUsernameAsync(
            new GetUserByUsernameRequest
            {
                Username = command.Username
            })).User;

        if ((DateTime.UtcNow - user.Registered.ToDateTime()).TotalSeconds < _lobbyOptions.MinLobbyChatTime)
        {
            await _hubContext.Clients.Client(command.ConnectionId).SendAsync(LobbyMethods.NoChat);
        }

        var response = await _thronetekiService.AddLobbyMessageAsync(new AddLobbyMessageRequest
        {
            Message = command.Message[..Math.Min(512, command.Message.Length)],
            UserId = user.Id
        });

        if (response?.Message == null)
        {
            _logger.LogError("Error adding lobby message");
            return;
        }

        var newMessage = new Models.LobbyMessage
        {
            Id = response.Message.Id,
            Message = response.Message.Message,
            Time = response.Message.Time.ToDateTime(),
            User = new LobbyUser
            {
                Id = user.Id,
                Avatar = user.Avatar,
                Username = user.Username,
                Role = response.Message.User.Role
            }
        };

        var excludedConnectionIds = new List<string>();

        excludedConnectionIds.AddRange(_lobbyService.GetConnectionsNotBlockedByUser(user));

        await _hubContext.Clients.AllExcept(excludedConnectionIds).SendAsync(LobbyMethods.LobbyChat, newMessage);
    }
}