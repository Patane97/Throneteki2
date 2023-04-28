import { GameType } from './enums';

export interface UserSummary {
    username: string;
    name: string;
    role: string;
    avatar: string;
}

export interface LobbyUser {
    name: string;
}

export interface LobbyMessage {
    id: number;
    message: string;
    user: UserSummary;
    time: Date;
    deleted: boolean;
    deletedBy: string;
}

export interface LobbyGame {
    allowSpectators: boolean;
    createdAt: Date;
    full: boolean;
    gamePrivate: boolean;
    gameType: GameType;
    id: string;
    name: string;
    needsPassword: boolean;
    node: string;
    owner: string;
    players: LobbyGamePlayer[];
    showHand: boolean;
    spectators: UserSummary[];
    started: boolean;
    useChessClocks: boolean;
    useGameTimeLimit: boolean;
}

export interface LobbyGamePlayer {
    avatar: string;
    deckName?: string;
    deckSelected: boolean;
    deckStatus: any;
    name: string;
    role: string;
}

export interface HandOff {
    gameId: string;
    name: string;
    url: string;
}

export type Filter = Record<string, boolean>;
