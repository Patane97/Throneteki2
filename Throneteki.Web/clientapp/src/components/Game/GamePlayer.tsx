import React from 'react';
import classNames from 'classnames';

import { LobbyGamePlayer } from '../../types/lobby';
import Avatar from '../Site/Avatar';

interface GamePlayerProps {
    player: LobbyGamePlayer;
    reverse: boolean;
}

const GamePlayer = ({ player, reverse }: GamePlayerProps) => {
    const classes = classNames('game-player-row', {
        'first-player': reverse,
        'other-player': !reverse
    });

    let playerAndFactionAgenda;

    if (!reverse) {
        playerAndFactionAgenda = (
            <div className='game-faction-row first-player'>
                <div className='game-player-name'>
                    <span className='gamelist-avatar'>
                        <Avatar avatar={player.user.username} />
                    </span>
                    <span className='bold'>{player.user.username}</span>
                </div>
                <div className='agenda-mini'>
                    {/*
                        <img
                            className='img-responsive'
                            src={`/img/cards/${player.agenda || 'cardback'}.png`}
                        />*/}
                </div>
                <div className='faction-mini'>
                    {/*
                        <img
                            className='img-responsive'
                            src={`/img/cards/${player.faction || 'cardback'}.png`}
                        />*/}
                </div>
            </div>
        );
    } else {
        playerAndFactionAgenda = (
            <div className='game-faction-row other-player'>
                <div className='faction-mini'>
                    {/*
                        <img
                            className='img-responsive'
                            src={`/img/cards/${player.faction || 'cardback'}.png`}
                        />*/}
                </div>
                <div className='agenda-mini'>
                    {/*
                        <img
                            className='img-responsive'
                            src={`/img/cards/${player.agenda || 'cardback'}.png`}
                        />
                */}
                </div>
                <div className='game-player-name'>
                    <span className='bold'>{player.user.username}</span>
                    <span className='gamelist-avatar'>
                        <Avatar avatar={player.user.username} />
                    </span>
                </div>
            </div>
        );
    }

    return (
        <div className={classes}>
            <div>{playerAndFactionAgenda}</div>
        </div>
    );
};

export default GamePlayer;
