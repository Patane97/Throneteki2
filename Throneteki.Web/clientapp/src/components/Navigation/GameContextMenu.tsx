import React, { useState } from 'react';
import { Nav } from 'react-bootstrap';
import { Trans, useTranslation } from 'react-i18next';
import { useAppDispatch, useAppSelector } from '../../redux/hooks';
import { ThronetekiUser } from '../../types/user';
import { useAuth } from 'react-oidc-context';
import { toastr } from 'react-redux-toastr';
import { gameNodeActions } from '../../redux/slices/gameNodeSlice';

const GameContextMenu = () => {
    const { t } = useTranslation();
    const [showPopup, setShowPopup] = useState(false);
    const { currentGame: activeGame } = useAppSelector((state) => state.gameNode);
    const auth = useAuth();
    const dispatch = useAppDispatch();

    const user = auth.user?.profile as ThronetekiUser;

    const isGameActive = () => {
        if (!activeGame || !user) {
            return false;
        }

        if (activeGame.winner) {
            return false;
        }

        let thisPlayer = activeGame.players[user.name];
        if (!thisPlayer) {
            thisPlayer = Object.values(activeGame.players)[0];
        }

        const otherPlayer = Object.values(activeGame.players).find((player) => {
            return player.name !== thisPlayer.name;
        });

        if (!otherPlayer) {
            return false;
        }

        if (otherPlayer.disconnected || otherPlayer.left) {
            return false;
        }

        return true;
    };

    const onLeaveClick = () => {
        if (!isSpectating && isGameActive()) {
            toastr.confirm(
                t(
                    'Your game is not finished. If you leave you will concede the game. Are you sure you want to leave?'
                ),
                {
                    okText: t('Ok'),
                    cancelText: t('Cancel'),
                    onOk: () => {
                        dispatch(gameNodeActions.sendConcedeMessage());
                        dispatch(gameNodeActions.sendLeaveGameMessage());
                        //                        dispatch(closeGameSocket());
                    }
                }
            );

            return;
        }

        dispatch(gameNodeActions.sendLeaveGameMessage());
        //dispatch(closeGameSocket());
    };

    if (!activeGame || !activeGame.started) {
        return null;
    }

    const isSpectating = !activeGame.players[user.name as string];
    const spectators = activeGame.spectators.map((spectator) => {
        return <li key={spectator.id}>{spectator.name}</li>;
    });
    const spectatorPopup = <ul className='spectators-popup mt-5 absolute-panel'>{spectators}</ul>;

    return (
        <>
            <li
                onMouseOver={() => setShowPopup(true)}
                onMouseOut={() => setShowPopup(false)}
                className='navbar-item'
            >
                <span>{t('{{users}} spectators', { users: activeGame.spectators.length })}</span>
            </li>
            {showPopup && spectators.length > 0 && spectatorPopup}
            {!isSpectating && (
                <li className='navbar-item'>
                    <Nav.Link
                        onClick={() => dispatch(gameNodeActions.sendConcedeMessage())}
                        className='navbar-item interactable'
                    >
                        <span>
                            <Trans>Concede</Trans>
                        </span>
                    </Nav.Link>
                </li>
            )}
            <li className='navbar-item'>
                <Nav.Link onClick={onLeaveClick} className='navbar-item interactable'>
                    <Trans>Leave Game</Trans>
                </Nav.Link>
            </li>
        </>
    );
};

export default GameContextMenu;
