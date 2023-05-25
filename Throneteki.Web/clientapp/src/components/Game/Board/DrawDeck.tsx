import React from 'react';
import { useTranslation } from 'react-i18next';
import CardPileLink from './CardPileLink';
import Droppable from './Droppable';
import { BoardSide, CardLocation, CardSize } from '../../../types/enums';
import {
    CardMenuItem,
    CardMouseOverEventArgs,
    GameCard,
    PopupChangeEventArgs
} from '../../../types/game';

interface DrawDeckProps {
    cardCount: number;
    cards: GameCard[];
    isMe: boolean;
    manualMode: boolean;
    numDeckCards: number;
    onCardClick: (card: GameCard) => void;
    onDragDrop?: (card: string, source: CardLocation, target: CardLocation) => void;
    onMenuItemClick: (card: GameCard, menuItem: CardMenuItem) => void;
    onMouseOut: (card: GameCard) => void;
    onMouseOver: (arg: CardMouseOverEventArgs) => void;
    onPopupChange?: (args: PopupChangeEventArgs) => void;
    onShuffleClick: () => void;
    onToggleVisibilityClick: (visible: boolean) => void;
    popupLocation: BoardSide;
    showDeck?: boolean;
    size: CardSize;
    spectating: boolean;
}

const DrawDeck = (props: DrawDeckProps) => {
    const { t } = useTranslation();
    const {
        cards,
        isMe,
        manualMode,
        onDragDrop,
        onPopupChange,
        onShuffleClick,
        onToggleVisibilityClick,
        showDeck = false,
        spectating
    } = props;

    const drawDeckPopupMenu = showDeck
        ? [{ text: 'Close and Shuffle', handler: () => onShuffleClick && onShuffleClick() }]
        : [
              {
                  text: 'View Hidden',
                  handler: () => {
                      onToggleVisibilityClick && onToggleVisibilityClick(true);
                  }
              }
          ];

    const hasCards = cards?.length !== 0;

    const drawDeck = (
        <CardPileLink
            {...props}
            className='draw'
            disablePopup={!hasCards && (spectating || !isMe)}
            hiddenTopCard
            onPopupChange={(event) =>
                onPopupChange && !event.visible && onPopupChange({ visible: false })
            }
            popupMenu={drawDeckPopupMenu}
            source={CardLocation.Draw}
            cards={cards}
            title={t('Draw')}
        />
    );

    return isMe ? (
        <Droppable onDragDrop={onDragDrop} source={CardLocation.Draw} manualMode={manualMode}>
            {drawDeck}
        </Droppable>
    ) : (
        drawDeck
    );
};

export default DrawDeck;
