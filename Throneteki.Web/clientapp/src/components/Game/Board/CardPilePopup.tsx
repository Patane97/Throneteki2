import React from 'react';
import classNames from 'classnames';

import CardTiledList from './CardTiledList';
import Droppable from './Droppable';
import MovablePanel from './MovablePanel';
import { CardMouseOverEventArgs, GameCard, PopupMenuItem } from '../../../types/game';
import { BoardSide, CardLocation, CardOrientation, CardSize } from '../../../types/enums';

interface CardPilePopupProps {
    cards: GameCard[];
    disableMouseOver: boolean;
    manualMode: boolean;
    onCardClick: (card: GameCard) => void;
    onCloseClick: () => void;
    onDragDrop?: (card: string, source: CardLocation, target: CardLocation) => void;
    onMouseOut: (card: GameCard) => void;
    onMouseOver: (args: CardMouseOverEventArgs) => void;
    orientation: CardOrientation;
    popupLocation: BoardSide;
    popupMenu?: PopupMenuItem[];
    size: CardSize;
    source: CardLocation;
    title: string;
}

const CardPilePopup = ({
    cards,
    disableMouseOver,
    manualMode,
    onCardClick,
    onCloseClick,
    onDragDrop,
    onMouseOut,
    onMouseOver,
    orientation,
    popupLocation,
    popupMenu,
    size,
    source,
    title
}: CardPilePopupProps) => {
    let popup = null;
    let cardList = [];

    const listProps = {
        disableMouseOver,
        manualMode,
        onCardClick,
        onCardMouseOut: onMouseOut,
        onCardMouseOver: onMouseOver,
        orientation: orientation,
        size,
        source
    };

    if (cards && cards.some((card) => card.group)) {
        const cardGroup = cards.reduce((grouping, card) => {
            (grouping[card.group] = grouping[card.group] || []).push(card);

            return grouping;
        }, {} as { [key: string]: GameCard[] });
        const sortedKeys = Object.keys(cardGroup).sort();
        for (const key of sortedKeys) {
            cardList.push(
                <CardTiledList cards={cardGroup[key]} key={key} title={key} {...listProps} />
            );
        }
    } else {
        cardList = [<CardTiledList key='one' cards={cards} {...listProps} />];
    }

    const popupClass = classNames('panel', 'panel-body', {
        'our-side': popupLocation === 'bottom',
        [size]: true
    });

    const innerClass = classNames('inner', {
        [size]: true,
        [source]: true
    });
    let linkIndex = 0;

    const popupMenuToRender = popupMenu && (
        <div>
            {popupMenu.map((menuItem) => {
                return (
                    <a
                        className='btn btn-primary'
                        key={linkIndex++}
                        onClick={() => {
                            menuItem.handler && menuItem.handler();

                            if (menuItem.closeOnClick) {
                                onCloseClick();
                            }
                        }}
                    >
                        {menuItem.text}
                    </a>
                );
            })}
        </div>
    );

    popup = (
        <MovablePanel
            size={size}
            title={title}
            name={source}
            onCloseClick={onCloseClick}
            side={popupLocation}
        >
            <Droppable onDragDrop={onDragDrop} source={source} manualMode={manualMode}>
                <div className={popupClass} onClick={(event) => event.stopPropagation()}>
                    {popupMenuToRender}
                    <div className={innerClass}>{cardList}</div>
                </div>
            </Droppable>
        </MovablePanel>
    );

    return popup;
};

export default CardPilePopup;
