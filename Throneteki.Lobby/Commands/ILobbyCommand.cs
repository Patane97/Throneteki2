namespace Throneteki.Lobby.Commands;

public interface ILobbyCommand
{
    string ConnectionId { get; set; }
    string Username { get; set; }
}