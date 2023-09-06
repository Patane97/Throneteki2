import { Card } from './data';
import { CardLocation, GamePhase } from './enums';

export interface CardPiles {
    bannerCards: GameCard[];
    cardsInPlay: GameCard[];
    conclavePile: GameCard[];
    deadPile: GameCard[];
    discardPile: GameCard[];
    drawDeck: GameCard[];
    hand: GameCard[];
    outOfGamePile: GameCard[];
    plotDeck: GameCard[];
    plotDiscard: GameCard[];
    shadows: GameCard[];
}

export interface GamePlayer {
    activePlayer: boolean;
    activePlot?: GameCard;
    agenda?: GameCard;
    buttons: PromptButton[];
    cardPiles: CardPiles;
    controls: PromptControl[];
    deckData: any;
    disconnected?: boolean;
    faction?: Faction;
    firstPlayer: boolean;
    keywordSettings?: KeywordSettings;
    left?: boolean;
    menuTitle?: string;
    name: string;
    numDeckCards: number;
    numDrawCards: number;
    plotSelected: boolean;
    promptDupes?: boolean;
    promptedActionWindows?: PromptedActionWindows;
    promptTitle?: string;
    phase: GamePhase;
    selectCard?: boolean;
    showDeck: boolean;
    stats: GamePlayerStats;
    timerSettings?: TimerSettings;
    title?: string;
    user?: any;
}

interface ChatMessage {
    activePlayer?: string;
    argType?: string;
    avatar?: string;
    code?: string;
    image?: string;
    label?: string;
    link?: string;
    message: { [key: string]: ChatMessage };
    name?: string;
    role?: string;
    type?: string;
}

export interface Game {
    muteSpectators: boolean;
    messages: ChatMessage[];
    allowSpectators: boolean;
    createdAt: Date;
    full: boolean;
    gamePrivate: boolean;
    gameType: GameType;
    gameMode: GameMode;
    id: string;
    name: string;
    needsPassword: boolean;
    node: string;
    owner: string;
    players: { [key: string]: GamePlayer };
    showHand: boolean;
    spectators: UserSummary[];
    started: boolean;
    useChessClocks: boolean;
    useGameTimeLimit: boolean;
    winner?: string;
}

export interface GamePlayerStats {
    claim: number;
    initiative: number;
    gold: number;
    reserve: number;
    totalPower: number;
}

export interface PromptButton {
    arg: string;
    card: GameCard;
    command: string;
    disabled: boolean;
    icon: Icon;
    method: string;
    promptId: string;
    text: string;
    values: any;
}

export interface PromptControl {
    name: string;
    source: Card;
    type: PromptControlType;
}

export interface Prompt {
    text: string;
}

export interface PopupChangeEventArgs {
    source?: CardLocation;
    visible: boolean;
}

export interface CardMouseOverEventArgs {
    image: JSX.Element;
    size: CardSize;
}

export interface GameCard extends Card {
    attachments: GameCard[];
    canPlay: boolean;
    childCards: GameCard[];
    controlled: unknown;
    facedown: boolean;
    group: string;
    kneeled: boolean;
    location: CardLocation;
    menu: CardMenuItem[];
    new: boolean;
    order: number;
    selectable: boolean;
    selected: boolean;
    uuid: string;
    unselectable: boolean;
}

export interface PopupMenuItem {
    closeOnClick?: boolean;
    handler: () => void;
    text: string;
}

export interface CardMenuItem {
    menu: string;
    command: string;
    disabled: boolean;
    text: string;
}

export type StatsIndexer = 'claim' | 'initiative' | 'gold' | 'reserve' | 'totalPower';

export interface KeywordSettings {
    chooseCards: boolean;
    chooseOrder: boolean;
}

export interface TimerSettings {
    windowTimer: number;
    events: boolean;
    abilities: boolean;
}

export interface PromptedActionWindows {
    plot: boolean;
    draw: boolean;
    challengeBegin: boolean;
    attackersDeclared: boolean;
    defendersDeclared: boolean;
    dominance: boolean;
    standing: boolean;
    taxation: boolean;
}
