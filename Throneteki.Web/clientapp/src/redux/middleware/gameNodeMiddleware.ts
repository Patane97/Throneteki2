import { Middleware } from 'redux';
import { Socket, io } from 'socket.io-client';

import { HandOff } from '../../types/lobby';
import { gameNodeActions } from '../slices/gameNodeSlice';
import { getUser } from '../../helpers/UserHelper';
import * as jsondiffpatch from 'jsondiffpatch';
import {
    CardDropped,
    CardMenuItemClicked,
    GameStatChange,
    OptionAndValue,
    PromptClicked
} from '../../types/gameMessages';
import { GameCommands } from '../../types/enums';

const patcher = jsondiffpatch.create({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    objectHash: (obj: any, index: number) => {
        return obj.uuid || obj.name || obj.id || obj._id || '$$index:' + index;
    }
});

const gameNodeMiddleware: Middleware = (store) => {
    let connection: Socket | null = null;

    return (next) => (action) => {
        const isConnectionEstablished = connection && store.getState().gameNode.isConnected;
        const user = getUser();
        if (gameNodeActions.startConnecting.match(action)) {
            const handOff = action.payload as HandOff;
            connection = io(handOff.url, {
                auth: {
                    token: user?.access_token || ''
                },
                path: '/' + handOff.name + '/socket.io',
                reconnection: true,
                reconnectionDelay: 1000,
                reconnectionDelayMax: 5000,
                reconnectionAttempts: 5
            });

            connection.connect();

            setInterval(() => {
                const start = Date.now();

                connection?.volatile.emit('ping', () => {
                    const latency = Date.now() - start;
                    store.dispatch(gameNodeActions.responseTimeReceived(latency));
                });
            }, 2 * 1000 * 60);

            connection.on('connect', () => {
                store.dispatch(gameNodeActions.connectionEstablished());

                connection?.emit('ping');
            });

            connection.on('pong', (responseTime) => {
                store.dispatch(gameNodeActions.responseTimeReceived(responseTime));
            });

            connection.on('gamestate', (game) => {
                let gameState;

                if (store.getState().gameNode.rootGameState) {
                    if (game) {
                        const currentState = patcher.clone(store.getState().gameNode.currentGame);
                        gameState = patcher.patch(currentState, game);
                    } else {
                        gameState = store.getState().gameNode.currentGame;
                    }
                } else {
                    gameState = game;
                    store.dispatch(gameNodeActions.setRootState(game));
                }

                store.dispatch(gameNodeActions.receieveGameState(gameState));
            });

            connection.on('cleargamestate', () => {
                connection.close();
                connection = null;

                store.dispatch(gameNodeActions.receiveClearGameState());
                store.dispatch(gameNodeActions.disconnect());
            });
        }

        if (!isConnectionEstablished || !connection) {
            next(action);

            return;
        }

        if (gameNodeActions.sendPromptClickedMessage.match(action)) {
            const prompt = action.payload as PromptClicked;

            connection.emit(
                'game',
                GameCommands.MenuButton,
                prompt.arg,
                prompt.method,
                prompt.promptId
            );
        } else if (gameNodeActions.sendCardClickedMessage.match(action)) {
            connection.emit('game', GameCommands.CardClicked, action.payload);
        } else if (gameNodeActions.sendMenuItemClickMessage.match(action)) {
            const menuItemClicked = action.payload as CardMenuItemClicked;
            connection.emit(
                'game',
                GameCommands.CardClicked,
                menuItemClicked.card,
                menuItemClicked.menuItem
            );
        } else if (gameNodeActions.sendGameChatMessage.match(action)) {
            connection.emit('game', GameCommands.Chat, action.payload);
        } else if (gameNodeActions.sendChangeStatMessage.match(action)) {
            const gameStatChange = action.payload as GameStatChange;

            connection.emit(
                'game',
                GameCommands.ChangeStat,
                gameStatChange.statToChange,
                gameStatChange.amount
            );
        } else if (gameNodeActions.sendCardDroppedMessage.match(action)) {
            const cardDropped = action.payload as CardDropped;

            connection.emit(
                'game',
                GameCommands.Drop,
                cardDropped.uuid,
                cardDropped.source,
                cardDropped.target
            );
        } else if (gameNodeActions.sendShowDrawDeckMessage.match(action)) {
            connection.emit('game', GameCommands.ShowDrawDeck, action.payload);
        } else if (gameNodeActions.sendToggleMuteSpectatorsMessage.match(action)) {
            connection.emit('game', GameCommands.ToggleMuteSpectators);
        } else if (gameNodeActions.sendToggleKeywordSettingMessage.match(action)) {
            const optionValue = action.payload as OptionAndValue;

            connection.emit(
                'game',
                GameCommands.ToggleKeywordSetting,
                optionValue.option,
                optionValue.value
            );
        } else if (gameNodeActions.sendTogglePromptDupesMessage.match(action)) {
            connection.emit('game', GameCommands.TogglePromptDupes, action.payload);
        } else if (gameNodeActions.sendTogglePromptedActionWindowMessage.match(action)) {
            const optionValue = action.payload as OptionAndValue;

            connection.emit(
                'game',
                GameCommands.TogglePromptedActionWindow,
                optionValue.option,
                optionValue.value
            );
        } else if (gameNodeActions.sendToggleTimerSettingMessage.match(action)) {
            const optionValue = action.payload as OptionAndValue;

            connection.emit(
                'game',
                GameCommands.ToggleTimerSetting,
                optionValue.option,
                optionValue.value
            );
        } else if (gameNodeActions.sendConcedeMessage.match(action)) {
            connection.emit('game', GameCommands.Concede);
        } else if (gameNodeActions.sendLeaveGameMessage.match(action)) {
            connection.emit('game', GameCommands.LeaveGame);
        } else if (gameNodeActions.sendShuffleDeckMessage.match(action)) {
            connection.emit('game', GameCommands.ShuffleDeck);
        }

        next(action);
    };
};

export default gameNodeMiddleware;
