import { PayloadAction, createSlice } from '@reduxjs/toolkit';
import { HandOff } from '../../types/lobby';
import { Game } from '../../types/game';
import {
    CardDropped,
    CardMenuItemClicked,
    GameStatChange,
    OptionAndValue,
    PromptClicked
} from '../../types/gameMessages';

export interface GameNodeState {
    connection?: signalR.HubConnection | null;
    gameHost?: string;
    currentGame?: Game;
    isConnected: boolean;
    isEstablishingConnection: boolean;
    isWaitingForResponse: boolean;
    responseTime: number;
    rootGameState?: string;
}

const initialState: GameNodeState = {
    isConnected: false,
    isEstablishingConnection: false,
    isWaitingForResponse: false,
    responseTime: -1
};

const gameNodeSlice = createSlice({
    name: 'gameNode',
    initialState,
    reducers: {
        startConnecting: (state, action: PayloadAction<HandOff>) => {
            state.isEstablishingConnection = true;
            state.gameHost = action.payload.url;
        },
        connectionEstablished: (state) => {
            state.isConnected = true;
            state.isEstablishingConnection = false;
        },
        disconnect: (state) => {
            state.isConnected = false;
        },
        receiveClearGameState: (state) => {
            state.currentGame = null;
            state.isWaitingForResponse = false;
        },
        receieveGameState: (state, action: PayloadAction<Game>) => {
            state.currentGame = action.payload;
            state.isWaitingForResponse = false;
        },
        responseTimeReceived: (state, action: PayloadAction<number>) => {
            state.responseTime = action.payload;
        },
        sendCardClickedMessage: (state, _: PayloadAction<string>) => {
            state.isWaitingForResponse = true;
        },
        sendCardDroppedMessage: (state, _: PayloadAction<CardDropped>) => {
            state.isWaitingForResponse = true;
        },
        sendChangeStatMessage: (state, _: PayloadAction<GameStatChange>) => {
            state.isWaitingForResponse = true;
        },
        sendConcedeMessage: (state, _: PayloadAction) => {
            state.isWaitingForResponse = true;
        },
        sendGameChatMessage: (state, _: PayloadAction<string>) => {
            state.isWaitingForResponse = true;
        },
        sendLeaveGameMessage: (state, _: PayloadAction) => {
            state.isWaitingForResponse = true;
        },
        sendPromptClickedMessage: (state, _: PayloadAction<PromptClicked>) => {
            state.isWaitingForResponse = true;
        },
        sendMenuItemClickMessage: (state, _: PayloadAction<CardMenuItemClicked>) => {
            state.isWaitingForResponse = true;
        },
        sendShowDrawDeckMessage: (state, _: PayloadAction<boolean>) => {
            state.isWaitingForResponse = true;
        },
        sendShuffleDeckMessage: (state, _: PayloadAction) => {
            state.isWaitingForResponse = true;
        },
        sendToggleKeywordSettingMessage: (state, _: PayloadAction<OptionAndValue>) => {
            state.isWaitingForResponse = true;
        },
        sendToggleMuteSpectatorsMessage: (state, _: PayloadAction) => {
            state.isWaitingForResponse = true;
        },
        sendTogglePromptDupesMessage: (state, _: PayloadAction<boolean>) => {
            state.isWaitingForResponse = true;
        },
        sendTogglePromptedActionWindowMessage: (state, _: PayloadAction<OptionAndValue>) => {
            state.isWaitingForResponse = true;
        },
        sendToggleTimerSettingMessage: (state, _: PayloadAction<OptionAndValue>) => {
            state.isWaitingForResponse = true;
        },
        setRootState: (state, action: PayloadAction<string>) => {
            state.rootGameState = action.payload;
        }
    }
});

export const gameNodeActions = gameNodeSlice.actions;

export default gameNodeSlice.reducer;
