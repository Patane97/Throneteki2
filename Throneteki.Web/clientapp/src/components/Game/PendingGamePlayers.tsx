import React from 'react';
import { Button } from 'react-bootstrap';
import { useTranslation, Trans } from 'react-i18next';
import { LobbyGame } from '../../types/lobby';
import { ThronetekiUser } from '../../types/user';
import Avatar from '../Site/Avatar';
import Panel from '../Site/Panel';
import DeckStatus from '../Decks/DeckStatus';

interface PendingGamePlayersProps {
    currentGame: LobbyGame;
    user: ThronetekiUser;
    onSelectDeck: () => void;
}

const PendingGamePlayers = ({ currentGame, user, onSelectDeck }: PendingGamePlayersProps) => {
    const { t } = useTranslation();

    let firstPlayer = true;
    return (
        <Panel title={t('Players')}>
            {Object.values(currentGame.players).map((player) => {
                const playerIsMe = player && player.user.username === user?.name;

                let deck = null;
                let selectLink = null;
                let status = null;

                if (player && player.deckSelected) {
                    if (playerIsMe) {
                        deck = (
                            <span className='deck-selection clickable me-2' onClick={onSelectDeck}>
                                {player.deckName}
                            </span>
                        );
                    } else {
                        deck = (
                            <span className='deck-selection me-2'>
                                <Trans>Deck Selected</Trans>
                            </span>
                        );
                    }

                    status = <DeckStatus status={player.deckStatus} />;
                } else if (player && playerIsMe) {
                    selectLink = (
                        <Button onClick={onSelectDeck}>
                            <Trans>Select Deck</Trans>
                        </Button>
                    );
                }
                const userClass =
                    'username' +
                    (player.user.role ? ` ${player.user.role.toLowerCase()}-role` : '');
                let rowClass = 'player-row';
                if (firstPlayer) {
                    rowClass += ' mb-2';

                    firstPlayer = false;
                }
                return (
                    <div className={rowClass} key={player.user.username}>
                        <Avatar avatar={player.user.avatar} />
                        <span className={userClass}>{player.user.username}</span>
                        {deck} {status} {selectLink}
                    </div>
                );
            })}
        </Panel>
    );
};

export default PendingGamePlayers;
