export interface Faction {
    code: string;
    name: string;
}

export interface Pack {
    id: number;
    code: string;
    name: string;
    releaseDate: Date;
}

export interface Card {
    source: string;
    id: number;
    code: string;
    type: string;
    name: string;
    quantity: number;
    unique: boolean;
    faction: Faction;
    loyal: boolean;
    income?: number;
    initiative?: number;
    cost: number;
    icons: string[];
    strength: number;
    traits: string[];
    text: string;
    flavor: string;
    deckLimit: number;
    illustrator: string;
    packCode: string;
    label: string;
}

export interface ApiResponse {
    success: boolean;
    message: string;
}
