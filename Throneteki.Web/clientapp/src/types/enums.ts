export enum DrawCardType {
    Plot = 'Plot',
    Draw = 'Draw',
    Banner = 'Banner'
}

export enum GameType {
    Casual = 'casual',
    Beginner = 'beginner',
    Competitive = 'competitive'
}

export enum GameMode {
    Joust = 'joust',
    Melee = 'melee'
}

export enum RestrictedListCardSet {
    Original = 'original',
    Redesign = 'redesign'
}

export enum GameCommands {
    CardClicked = 'cardClicked',
    ChangeStat = 'changeStat',
    Chat = 'chat',
    Concede = 'concede',
    Drop = 'drop',
    LeaveGame = 'leavegame',
    MenuButton = 'menuButton',
    MenuItemClicked = 'menuItemClick',
    ShowDrawDeck = 'showDrawDeck',
    ShuffleDeck = 'shuffleDeck',
    ToggleKeywordSetting = 'toggleKeywordSetting',
    ToggleMuteSpectators = 'toggleMuteSpectators',
    TogglePromptDupes = 'toggleDupes',
    TogglePromptedActionWindow = 'togglePromptedActionWindow',
    ToggleTimerSetting = 'toggleTimerSetting'
}

export enum Icon {
    Intrigue = 'intrigue',
    Military = 'military',
    Power = 'power'
}

export enum PromptControlType {
    TraitName = 'trait-name',
    SelectFromValues = 'select-from-values'
}

export enum GamePhase {
    Setup = 'setup',
    Plot = 'plot',
    Draw = 'draw',
    Marshal = 'marshal',
    Challenge = 'challenge',
    Dominance = 'dominance',
    Standing = 'standing',
    Taxation = 'taxation'
}

export enum CardLocation {
    Banners = 'agenda',
    Conclave = 'conclave',
    Dead = 'dead pile',
    Discard = 'discard pile',
    Draw = 'draw deck',
    FullDeck = 'full deck',
    Hand = 'hand',
    OutOfGame = 'out of game',
    PlayArea = 'play area',
    Plots = 'plot deck',
    RevealedPlots = 'revealed plots',
    Rookery = 'rookery',
    Shadows = 'shadows',
    Underneath = 'underneath',
    Zoom = 'zoom'
}

export enum CardOrientation {
    Horizontal = 'horizontal',
    Kneeled = 'kneeled',
    Vertical = 'vertical'
}

export enum BoardSide {
    Bottom = 'bottom',
    Top = 'top'
}

export enum CardSize {
    Small = 'small',
    Normal = 'normal',
    Large = 'large',
    ExtraLarge = 'x-large',
    Icon = 'icon'
}

export enum TagTypes {
    Deck = 'Deck'
}
