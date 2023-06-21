import React from 'react';
import { Button } from 'react-bootstrap';
import { LobbyGame } from '../../types/lobby';
import GamePlayer from './GamePlayer';

interface GamePlayerRow {
    allowJoin: boolean;
    game: LobbyGame;
    onJoinGame: () => void;
}

const GamePlayerRow = ({ allowJoin, game, onJoinGame }: GamePlayerRow) => {
    let reversePlayer = false;
    const players = Object.values(game.players).map((player) => {
        const row = (
            <GamePlayer key={player.user.username} player={player} reverse={reversePlayer} />
        );

        reversePlayer = !reversePlayer;

        return row;
    });

    if (players.length === 1 && allowJoin) {
        players.push(
            <div key='join' className={'game-player-row other-player'}>
                <div className='game-faction-row other-player'>
                    <Button variant='primary' className='gamelist-button' onClick={onJoinGame}>
                        Join
                    </Button>
                </div>
            </div>
        );
    } else {
        players.push(<div key='empty' className='game-faction-row other-player' />);
    }

    return <div>{players}</div>;
};

export default GamePlayerRow;
