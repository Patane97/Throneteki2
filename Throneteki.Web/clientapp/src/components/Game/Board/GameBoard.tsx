import React, { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../../redux/hooks';
import { Trans } from 'react-i18next';
import { ThronetekiUser } from '../../../types/user';
import { useAuth } from 'react-oidc-context';
import {
    CardMenuItem,
    CardMouseOverEventArgs,
    Game,
    GameCard,
    GamePlayer
} from '../../../types/game';
import classNames from 'classnames';
import { useGetCardsQuery } from '../../../redux/api/apiSlice';
import ActivePlayerPrompt from './ActivePlayerPrompt';
import GameChat from './GameChat';
import { gameNodeActions } from '../../../redux/slices/gameNodeSlice';
import LoadingSpinner from '../../LoadingSpinner';
import { CardLocation, GameMode } from '../../../types/enums';
import CardZoom from './CardZoom';
import GameConfigurationModal from './GameConfigurationModal';
import JoustGameBoard from './Joust/JoustGameBoard';
import MeleeGameBoard from './Melee/MeleeGameBoard';

export interface GameBoardProps {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    settings: any;
    activeGame: Game;
    thisPlayer: GamePlayer;
    otherPlayers: GamePlayer[];
    manualMode: boolean;
    newMessages: number;
    onMessagesClick: () => void;
    onMuteClick: () => void;
    onSettingsClick: () => void;
    isSpectating: () => boolean;
    onCardClick: (card: GameCard) => {
        payload: string;
        type: 'gameNode/sendCardClickedMessage';
    };
    onDragDrop: (card: string, source: CardLocation, target: CardLocation) => void;
    onMenuItemClick: (card: GameCard, menuItem: CardMenuItem) => void;
    onMouseOut: () => void;
    onMouseOver: (arg: CardMouseOverEventArgs) => void;
    onToggleDrawDeckVisibleClick: (visible: boolean) => void;
    onShuffleClick: () => void;
}

const placeholderPlayer: GamePlayer = {
    activePlayer: false,
    activePlot: null,
    agenda: null,
    cardPiles: {
        bannerCards: [],
        cardsInPlay: [],
        conclavePile: [],
        deadPile: [],
        discardPile: [],
        drawDeck: [],
        hand: [],
        outOfGamePile: [],
        plotDeck: [],
        plotDiscard: [],
        shadows: []
    },
    deckData: {},
    faction: {},
    firstPlayer: false,
    name: 'Placeholder',
    numDrawCards: 0,
    numDeckCards: 0,
    plotSelected: false,
    showDeck: false,
    stats: {
        claim: 0,
        gold: 0,
        reserve: 0,
        initiative: 0,
        totalPower: 0
    },
    title: null,
    user: null,
    controls: [],
    menuTitle: undefined,
    promptTitle: undefined,
    phase: undefined,
    buttons: []
};

const defaultPlayerInfo = (source?: GamePlayer) => {
    const player = Object.assign({}, placeholderPlayer, source);
    player.cardPiles = Object.assign({}, placeholderPlayer.cardPiles, player.cardPiles);
    return player;
};

const GameBoard = () => {
    const auth = useAuth();
    const { currentGame: activeGame } = useAppSelector((state) => state.gameNode);
    const user = auth.user?.profile as ThronetekiUser;
    const { isLoading, data: cards } = useGetCardsQuery({});
    const [showMessages, setShowMessages] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [newMessages, setNewMessages] = useState(0);
    const [lastMessageCount, setLastMessageCount] = useState(0);
    const [cardToZoom, setCardToZoom] = useState<CardMouseOverEventArgs | null>(null);
    const dispatch = useAppDispatch();

    useEffect(() => {
        const currentMessageCount = activeGame?.messages.length || 0;

        if (showMessages) {
            setLastMessageCount(currentMessageCount);
            setNewMessages(0);
        } else {
            setNewMessages(currentMessageCount - lastMessageCount);
        }
    }, [activeGame?.messages.length, lastMessageCount, showMessages]);

    const RenderBoard = (props: GameBoardProps) => {
        switch (activeGame.gameMode) {
            case GameMode.Joust:
                return <JoustGameBoard {...props} />;
            case GameMode.Melee:
                return <MeleeGameBoard {...props} />;
            default:
                return (
                    <div>
                        <Trans>There has been a problem with loading the game board</Trans>
                    </div>
                );
        }
    };

    if (isLoading) {
        return <LoadingSpinner text='Please wait while the card data is loaded' />;
    }

    if (!activeGame) {
        return (
            <div>
                <Trans>There has been a problem with the connection to the game server</Trans>
            </div>
        );
    }

    if (!user?.name) {
        return (
            <div>
                <Trans>You are not logged in</Trans>
            </div>
        );
    }

    let thisPlayer = activeGame.players[user.name];

    if (!thisPlayer) {
        return (
            <div>
                <Trans>An error occured during the game</Trans>
            </div>
        );
    }

    let otherPlayers = Object.values(activeGame.players).filter((player) => {
        return player.name !== thisPlayer.name;
    });

    thisPlayer = defaultPlayerInfo(thisPlayer);

    // TODO: Replace below with dummy opponents option in lobby (dev only)
    const buildDummyOpponents = () => {
        const amount = activeGame.gameMode === GameMode.Melee ? 3 : 1;
        const otherPlayers = [];
        for (let i = 1; i <= amount; i++) {
            const otherPlayer = defaultPlayerInfo();
            otherPlayer.name += `_${i}`;
            otherPlayers.push(otherPlayer);
        }
        return otherPlayers;
    };
    otherPlayers =
        otherPlayers.length > 0
            ? otherPlayers.map((otherPlayer) => defaultPlayerInfo(otherPlayer))
            : buildDummyOpponents();

    const boardClass = classNames(
        'game-board',
        activeGame.gameMode,
        'd-flex justify-content-between flex-row',
        {
            'select-cursor': thisPlayer && thisPlayer.selectCard
        }
    );

    const onCardClick = (card: GameCard) =>
        dispatch(gameNodeActions.sendCardClickedMessage(card.uuid));
    const onDragDrop = (card: string, source: CardLocation, target: CardLocation) => {
        dispatch(
            gameNodeActions.sendCardDroppedMessage({
                uuid: card,
                source: source,
                target: target
            })
        );
    };
    const onToggleDrawDeckVisibleClick = (visible: boolean) => {
        dispatch(gameNodeActions.sendShowDrawDeckMessage(visible));
    };
    const onMenuItemClick = (card: GameCard, menuItem: CardMenuItem) => {
        dispatch(gameNodeActions.sendMenuItemClickMessage({ card: card.uuid, menuItem }));
    };
    const onMouseOut = () => {
        setCardToZoom(null);
    };
    const onMouseOver = (arg: CardMouseOverEventArgs) => {
        if (arg.image) {
            setCardToZoom(arg);
        }
    };
    const onShuffleClick = () => dispatch(gameNodeActions.sendShuffleDeckMessage());
    const onCommand = (command: string, arg: string, method: string, promptId: string) => {
        dispatch(gameNodeActions.sendPromptClickedMessage({ arg, command, method, promptId }));
    };
    const onTitleClick = () => true;
    const sendChatMessage = (message: string) => {
        dispatch(gameNodeActions.sendGameChatMessage(message));
    };
    const onMuteClick = () => {
        dispatch(gameNodeActions.sendToggleMuteSpectatorsMessage());
    };
    const onMessagesClick = () => {
        const showState = !showMessages;

        if (showState) {
            setNewMessages(0);
            setLastMessageCount(activeGame.messages.length);
        }

        setShowMessages(showState);
    };
    const onKeywordSettingToggle = (option: string, value: string | boolean) => {
        dispatch(gameNodeActions.sendToggleKeywordSettingMessage({ option: option, value: value }));
    };
    const onPromptDupesToggle = (value: boolean) => {
        dispatch(gameNodeActions.sendTogglePromptDupesMessage(value));
    };
    const onPromptedActionWindowToggle = (option: string, value: string | boolean) => {
        dispatch(
            gameNodeActions.sendTogglePromptedActionWindowMessage({ option: option, value: value })
        );
    };
    const onTimerSettingToggle = (option: string, value: string | boolean) => {
        dispatch(gameNodeActions.sendToggleTimerSettingMessage({ option: option, value: value }));
    };

    const onSettingsClick = () => setShowModal(true);

    const isSpectating = () => !activeGame.players[user.name as string];

    const settings = JSON.parse(user.throneteki_settings);

    return (
        <div className={boardClass}>
            {showModal && (
                <GameConfigurationModal
                    onClose={() => setShowModal(false)}
                    keywordSettings={thisPlayer.keywordSettings}
                    onKeywordSettingToggle={onKeywordSettingToggle}
                    onPromptDupesToggle={onPromptDupesToggle}
                    onPromptedActionWindowToggle={onPromptedActionWindowToggle}
                    onTimerSettingToggle={onTimerSettingToggle}
                    promptDupes={thisPlayer.promptDupes}
                    promptedActionWindows={thisPlayer.promptedActionWindows}
                    timerSettings={thisPlayer.timerSettings}
                />
            )}
            <div className='main-window col-10'>
                <RenderBoard
                    settings={settings}
                    activeGame={activeGame}
                    thisPlayer={thisPlayer}
                    otherPlayers={otherPlayers}
                    manualMode={true}
                    newMessages={newMessages}
                    onMessagesClick={onMessagesClick}
                    onMuteClick={onMuteClick}
                    onSettingsClick={onSettingsClick}
                    isSpectating={isSpectating}
                    onCardClick={onCardClick}
                    onDragDrop={onDragDrop}
                    onMenuItemClick={onMenuItemClick}
                    onMouseOut={onMouseOut}
                    onMouseOver={onMouseOver}
                    onToggleDrawDeckVisibleClick={onToggleDrawDeckVisibleClick}
                    onShuffleClick={onShuffleClick}
                />
            </div>
            {cardToZoom && <CardZoom card={cardToZoom} />}
            <div className='side-window col-2 d-flex flex-column'>
                {showMessages && (
                    <div className='game-chat flex-grow-1 flex-shrink-1 d-flex flex-column'>
                        <GameChat
                            messages={activeGame.messages}
                            onCardMouseOut={onMouseOut}
                            onCardMouseOver={onMouseOver}
                            onSendChat={sendChatMessage}
                            muted={isSpectating() && activeGame.muteSpectators}
                        />
                    </div>
                )}
                <div className='inset-pane w-100 d-flex flex-column justify-content-end'>
                    {isSpectating() ? (
                        <div />
                    ) : (
                        <ActivePlayerPrompt
                            cards={cards}
                            buttons={thisPlayer.buttons}
                            controls={thisPlayer.controls}
                            promptText={thisPlayer.menuTitle}
                            promptTitle={thisPlayer.promptTitle}
                            onButtonClick={onCommand}
                            onMouseOver={onMouseOver}
                            onMouseOut={onMouseOut}
                            onTitleClick={onTitleClick}
                            user={user}
                            phase={thisPlayer.phase}
                        />
                    )}
                    {/*this.getTimer()*/}
                </div>
            </div>
            <PlayerStats
                agenda={thisPlayer.agenda}
                faction={thisPlayer.faction}
                firstPlayer={thisPlayer.firstPlayer}
                activePlayer={thisPlayer.activePlayer}
                cardPiles={thisPlayer.cardPiles}
                isMe={!isSpectating()}
                manualMode={true}
                muteSpectators={activeGame.muteSpectators}
                numDeckCards={thisPlayer.numDrawCards}
                numMessages={newMessages}
                onMessagesClick={onMessagesClick}
                onCardClick={onCardClick}
                onDragDrop={onDragDrop}
                onToggleVisibilityClick={onToggleDrawDeckVisibleClick}
                onMenuItemClick={onMenuItemClick}
                onShuffleClick={onShuffleClick}
                onMouseOut={onMouseOut}
                onMouseOver={onMouseOver}
                onMuteClick={onMuteClick}
                onPopupChange={(args) => {
                    if (args.source === CardLocation.Draw && !args.visible) {
                        dispatch(gameNodeActions.sendShowDrawDeckMessage(false));
                    }
                }}
                onSettingsClick={() => setShowModal(true)}
                showControls={!isSpectating() && true}
                showDeck={thisPlayer.showDeck}
                showMessages
                side={BoardSide.Bottom}
                size={settings.cardSize}
                spectating={isSpectating()}
                stats={thisPlayer.stats}
                user={thisPlayer.user}
            />
        </div>
    );
};

export default GameBoard;
