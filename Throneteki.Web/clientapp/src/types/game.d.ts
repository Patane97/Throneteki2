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
    controls: PromptControl[];
    menuTitle?: string;
    promptTitle?: string;
    phase: GamePhase;
    buttons: PromptButton[];
    deckData: any;
    numDeckCards: number;
    activePlayer: boolean;
    selectCard?: boolean;
    activePlot?: Card | null;
    agenda?: Card | null;
    cardPiles: CardPiles;
    faction?: Faction;
    firstPlayer: boolean;
    numDrawCards: number;
    plotSelected: boolean;
    stats: GamePlayerStats;
    title?: string;
    user?: any;
    name: string;
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
