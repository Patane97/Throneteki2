import React, { useCallback, useEffect, useState } from 'react';
import classNames from 'classnames';
import ZoomCardImage from './ZoomCardImage';
import CardPilePopup from './CardPilePopup';
import {
    CardMouseOverEventArgs,
    GameCard,
    PopupChangeEventArgs,
    PopupMenuItem
} from '../../../types/game';
import { BoardSide, CardLocation, CardOrientation, CardSize } from '../../../types/enums';

interface CardPileLinkProps {
    cards: GameCard[];
    className: string;
    closeOnClick?: boolean;
    disableMouseOver?: boolean;
    disablePopup?: boolean;
    hiddenTopCard?: boolean;
    manualMode: boolean;
    numDeckCards?: number;
    onCardClick: (card: GameCard) => void;
    onDragDrop?: (card: string, source: CardLocation, target: CardLocation) => void;
    onMouseOut: (card: GameCard) => void;
    onMouseOver: (args: CardMouseOverEventArgs) => void;
    onPopupChange?: (args: PopupChangeEventArgs) => void;
    orientation?: CardOrientation;
    popupLocation: BoardSide;
    popupMenu?: PopupMenuItem[];
    size: CardSize;
    source: CardLocation;
    title: string;
}

const CardPileLink = ({
    cards,
    className,
    closeOnClick = false,
    disableMouseOver = false,
    disablePopup,
    hiddenTopCard,
    manualMode,
    numDeckCards = 0,
    onCardClick,
    onDragDrop,
    onMouseOut,
    onMouseOver,
    onPopupChange,
    orientation = CardOrientation.Vertical,
    popupLocation,
    popupMenu,
    size,
    source,
    title
}: CardPileLinkProps) => {
    const [showPopup, setShowPopup] = useState(false);
    const [manualPopup, setManualPopup] = useState(false);
    const updatePopupVisibility = useCallback(
        (value: boolean) => {
            setShowPopup(value);

            onPopupChange && onPopupChange({ source: source, visible: value });
        },
        [source, onPopupChange]
    );

    useEffect(() => {
        if (manualPopup) {
            return;
        }

        if (cards?.some((card) => card.selectable)) {
            updatePopupVisibility(true);
        } else {
            updatePopupVisibility(false);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [cards, manualPopup]);

    const classNameStr = classNames('card-pile-link', className, {
        horizontal: orientation === CardOrientation.Horizontal,
        vertical: orientation === CardOrientation.Vertical
    });

    const topCard = () => {
        if (hiddenTopCard || cards.length === 0) {
            return;
        }
        const card = cards[0];
        if (!card.facedown && card.location !== CardLocation.Draw) {
            return card;
        }
    };

    const card = topCard();

    return (
        <div
            className={classNameStr}
            onClick={() => {
                if (!disablePopup) {
                    updatePopupVisibility(!showPopup);
                    setManualPopup(!showPopup);
                }
            }}
        >
            {card && (
                <div
                    className='icon'
                    onMouseOver={() =>
                        onMouseOver({
                            image: <ZoomCardImage imageUrl={`/img/cards/${card.code}.png`} />,
                            size: 'normal'
                        })
                    }
                    onMouseOut={() => onMouseOut(card)}
                >
                    <ZoomCardImage
                        imageUrl={`/img/cards/${card.code}.png`}
                        orientation={CardOrientation.Vertical}
                        size={CardSize.Icon}
                    />
                </div>
            )}
            <div className={'text ' + title.toLowerCase()}>{title}:</div>
            <div className={'counter ' + title.toLowerCase()}>
                {source === CardLocation.Draw ? numDeckCards : cards.length}
            </div>
            {!disablePopup && showPopup && (
                <CardPilePopup
                    cards={cards}
                    disableMouseOver={disableMouseOver}
                    manualMode={manualMode}
                    onCardClick={(card) => {
                        if (closeOnClick) {
                            updatePopupVisibility(false);
                            setManualPopup(false);
                        }

                        onCardClick && onCardClick(card);
                    }}
                    onCloseClick={() => {
                        updatePopupVisibility(!showPopup);
                        setManualPopup(!showPopup);
                    }}
                    onDragDrop={onDragDrop}
                    onMouseOut={onMouseOut}
                    onMouseOver={onMouseOver}
                    orientation={orientation}
                    popupLocation={popupLocation}
                    popupMenu={popupMenu}
                    size={size}
                    source={source}
                    title={title}
                />
            )}
        </div>
    );
};

export default CardPileLink;
