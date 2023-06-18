import React from 'react';
import { GamePlayer } from '../../../../types/game';
import PlayerStats from '../PlayerStats';
import PlayerBoard from '../PlayerBoard';
import { BoardSide } from '../../../../types/enums';
import { GameBoardProps } from '../GameBoard';
import { Carousel } from 'react-bootstrap';

const MeleeGameBoard = (props: GameBoardProps) => {
    return (
        <div className='play-area container-fluid h-100 p-0'>
            <div className='upper-area h-50'>
                <Carousel className='h-100' indicators={false} interval={null}>
                    {props.otherPlayers.map((otherPlayer: GamePlayer) => (
                        <Carousel.Item key={otherPlayer.name}>
                            <div className='player-section'>
                                <PlayerStats
                                    agenda={otherPlayer.agenda}
                                    faction={otherPlayer.faction}
                                    activePlayer={otherPlayer.activePlayer}
                                    firstPlayer={otherPlayer.firstPlayer}
                                    showControls={false}
                                    stats={otherPlayer.stats}
                                    user={otherPlayer.user}
                                    cardPiles={otherPlayer.cardPiles}
                                    isMe={false}
                                    numDeckCards={otherPlayer.numDeckCards}
                                    onCardClick={props.onCardClick}
                                    onDragDrop={props.onDragDrop}
                                    onToggleVisibilityClick={props.onToggleDrawDeckVisibleClick}
                                    onMenuItemClick={props.onMenuItemClick}
                                    onMouseOut={props.onMouseOut}
                                    onMouseOver={props.onMouseOver}
                                    onShuffleClick={props.onShuffleClick}
                                    side={BoardSide.Top}
                                    size={props.settings.cardSize}
                                    spectating={props.isSpectating()}
                                />

                                <PlayerBoard
                                    cardsInPlay={otherPlayer.cardPiles.cardsInPlay}
                                    isSpectating={props.isSpectating()}
                                    onCardClick={props.onCardClick}
                                    onMenuItemClick={props.onMenuItemClick}
                                    onMouseOut={props.onMouseOut}
                                    onMouseOver={props.onMouseOver}
                                    rowDirection='reverse'
                                    user={otherPlayer.user}
                                />
                            </div>
                        </Carousel.Item>
                    ))}
                </Carousel>
            </div>
            <div className='lower-area h-50'>
                {
                    <div className='player-section'>
                        <PlayerBoard
                            cardsInPlay={props.thisPlayer.cardPiles.cardsInPlay}
                            cardSize={props.settings.cardSize}
                            hand={props.thisPlayer.cardPiles.hand}
                            isMe={!props.isSpectating()}
                            isSpectating={props.isSpectating()}
                            manualMode={props.manualMode}
                            onCardClick={props.onCardClick}
                            onDragDrop={props.onDragDrop}
                            onMenuItemClick={props.onMenuItemClick}
                            onMouseOut={props.onMouseOut}
                            onMouseOver={props.onMouseOver}
                            rowDirection='default'
                            shadows={props.thisPlayer.cardPiles.shadows}
                            user={props.thisPlayer.user}
                        />
                        <PlayerStats
                            agenda={props.thisPlayer.agenda}
                            faction={props.thisPlayer.faction}
                            firstPlayer={props.thisPlayer.firstPlayer}
                            activePlayer={props.thisPlayer.activePlayer}
                            cardPiles={props.thisPlayer.cardPiles}
                            isMe={!props.isSpectating()}
                            manualMode={true}
                            muteSpectators={props.activeGame.muteSpectators}
                            numDeckCards={props.thisPlayer.numDrawCards}
                            numMessages={props.newMessages}
                            onMessagesClick={props.onMessagesClick}
                            onCardClick={props.onCardClick}
                            onDragDrop={props.onDragDrop}
                            onToggleVisibilityClick={props.onToggleDrawDeckVisibleClick}
                            onMenuItemClick={props.onMenuItemClick}
                            onShuffleClick={props.onShuffleClick}
                            onMouseOut={props.onMouseOut}
                            onMouseOver={props.onMouseOver}
                            onMuteClick={props.onMuteClick}
                            onSettingsClick={props.onSettingsClick}
                            showControls={!props.isSpectating() && true}
                            showDeck={props.thisPlayer.showDeck}
                            showMessages
                            side={BoardSide.Bottom}
                            size={props.settings.cardSize}
                            spectating={props.isSpectating()}
                            stats={props.thisPlayer.stats}
                            user={props.thisPlayer.user}
                        />
                    </div>
                }
            </div>
        </div>
    );
};

export default MeleeGameBoard;
