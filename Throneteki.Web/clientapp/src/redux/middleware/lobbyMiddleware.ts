import { Middleware } from 'redux';
import * as signalR from '@microsoft/signalr';
import { lobbyActions } from '../slices/lobbySlice';
import { HandOff, LobbyGame, LobbyMessage, UserSummary } from '../../types/lobby';
import { getUser } from '../../helpers/UserHelper';
import { gameNodeActions } from '../slices/gameNodeSlice';

enum LobbyEvent {
    ClearGameState = 'cleargamestate',
    GameError = 'gameerror',
    GameState = 'gamestate',
    HandOff = 'handoff',
    LeaveGame = 'leavegame',
    LobbyChat = 'lobbychat',
    LobbyMessages = 'lobbymessages',
    NewGame = 'newgame',
    NewUserMessage = 'newuser',
    PongMessage = 'pong',
    UpdateGame = 'updategame',
    UserLeftMessage = 'userleft',
    UsersMessage = 'users',
    RemoveGame = 'removegame',
    RemoveGames = 'removegames',
    SelectDeck = 'selectdeck',
    StartGame = 'startgame',
    JoinGame = 'joingame',
    Games = 'games'
}

const lobbyMiddleware: Middleware = (store) => {
    let connection: signalR.HubConnection | null = null;
    let pingSentTime: Date;

    return (next) => (action) => {
        const isConnectionEstablished = connection && store.getState().lobby.isConnected;

        if (lobbyActions.startConnecting.match(action)) {
            connection = new signalR.HubConnectionBuilder()
                .withUrl('/lobbyhub', {
                    accessTokenFactory: () => {
                        const user = getUser();
                        console.info('user', user);
                        return user?.access_token || '';
                    }
                })
                .withAutomaticReconnect()
                .build();

            connection.start().then(() => {
                store.dispatch(lobbyActions.connectionEstablished());

                connection?.invoke('ping');
                pingSentTime = new Date();
            });
            // .catch((err) => lobbyActions.connectionFailed(err));

            connection.on(LobbyEvent.ClearGameState, () => {
                store.dispatch(lobbyActions.receiveClearGameState());
            });

            connection.on(LobbyEvent.LobbyChat, (message: LobbyMessage) => {
                store.dispatch(lobbyActions.receiveLobbyChat(message));
            });

            connection.on(LobbyEvent.LobbyMessages, (messages: LobbyMessage[]) => {
                store.dispatch(lobbyActions.receiveLobbyMessages(messages));
            });

            connection.on(LobbyEvent.HandOff, (handOffDetails: HandOff) => {
                store.dispatch(gameNodeActions.startConnecting(handOffDetails));
                store.dispatch(lobbyActions.receiveClearGameState());
            });

            connection.on(LobbyEvent.NewUserMessage, (user: UserSummary) => {
                store.dispatch(lobbyActions.receiveUser({ user }));
            });

            connection.on(LobbyEvent.UserLeftMessage, (user: string) => {
                store.dispatch(lobbyActions.receiveUserLeft({ user }));
            });

            connection.on(LobbyEvent.UsersMessage, (users: UserSummary[]) => {
                store.dispatch(lobbyActions.receiveUsers({ users }));
            });

            connection.on(LobbyEvent.NewGame, (game: LobbyGame) => {
                store.dispatch(lobbyActions.receiveNewGame(game));
            });

            connection.on(LobbyEvent.UpdateGame, (game: LobbyGame) => {
                store.dispatch(lobbyActions.receiveUpdateGame(game));
            });

            connection.on(LobbyEvent.RemoveGame, (game: LobbyGame) => {
                store.dispatch(lobbyActions.receiveRemoveGame(game));
            });

            connection.on(LobbyEvent.RemoveGames, (games: LobbyGame[]) => {
                store.dispatch(lobbyActions.receiveRemoveGames(games));
            });

            connection.on(LobbyEvent.GameState, (game: LobbyGame) => {
                store.dispatch(lobbyActions.receiveGameState(game));
            });

            connection.on(LobbyEvent.GameError, (error: string) => {
                store.dispatch(lobbyActions.receiveGameError(error));
            });

            connection.on(LobbyEvent.Games, (games: LobbyGame[]) => {
                store.dispatch(lobbyActions.receiveGames(games));
            });

            connection.on(LobbyEvent.PongMessage, () => {
                store.dispatch(
                    lobbyActions.receivePing({
                        responseTime: new Date().getTime() - pingSentTime.getTime()
                    })
                );

                setTimeout(() => {
                    connection?.invoke('ping');
                    pingSentTime = new Date();
                }, 2 * 1000 * 60);
            });
        }

        if (!isConnectionEstablished || !connection) {
            next(action);

            return;
        }

        if (lobbyActions.disconnect.match(action)) {
            connection.stop().then(() => {
                store.dispatch(lobbyActions.disconnect());

                connection = null;
            });
        } else if (lobbyActions.leaveGame.match(action)) {
            store.dispatch(lobbyActions.sendLeaveGame());
            store.dispatch(gameNodeActions.disconnect());
        } else if (lobbyActions.sendLeaveGame.match(action)) {
            connection.send(LobbyEvent.LeaveGame, '');
        } else if (lobbyActions.sendLobbyChat.match(action)) {
            connection.send(LobbyEvent.LobbyChat, action.payload);
        } else if (lobbyActions.sendNewGame.match(action)) {
            connection.send(LobbyEvent.NewGame, action.payload);
        } else if (lobbyActions.sendSelectDeck.match(action)) {
            connection.send(LobbyEvent.SelectDeck, action.payload);
        } else if (lobbyActions.sendStartGame.match(action)) {
            connection.send(LobbyEvent.StartGame, '');
        } else if (lobbyActions.sendJoinGame.match(action)) {
            connection.send(LobbyEvent.JoinGame, action.payload);
        }

        next(action);
    };
};

export default lobbyMiddleware;
