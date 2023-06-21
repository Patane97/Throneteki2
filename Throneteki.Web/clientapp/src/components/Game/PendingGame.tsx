import React, { useEffect, useRef, useState } from 'react';
import { Button, Form } from 'react-bootstrap';
import { useTranslation, Trans } from 'react-i18next';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import { useAuth } from 'react-oidc-context';

import { useAppDispatch, useAppSelector } from '../../redux/hooks';
import Panel from '../Site/Panel';
import GameTypeInfo from './GameTypeInfo';
import PendingGamePlayers from './PendingGamePlayers';
import { LobbyGamePlayer } from '../../types/lobby';
import { ThronetekiUser } from '../../types/user';
import SelectDeckModal from './SelectDeckModal';
import { lobbyActions } from '../../redux/slices/lobbySlice';
import { Deck } from '../../types/decks';

import ChargeMp3 from '../../assets/sound/charge.mp3';
import ChargeOgg from '../../assets/sound/charge.ogg';

function showNotification(notification: NotificationOptions) {
    try {
        if (window.Notification && Notification.permission === 'granted') {
            const windowNotification = new Notification('The Iron Throne', notification);

            setTimeout(() => windowNotification.close(), 5000);
        }
    } catch (err) {}
}

const PendingGame = () => {
    const { t } = useTranslation();
    const dispatch = useAppDispatch();

    const { currentGame, gameError } = useAppSelector((state) => state.lobby);
    const { isEstablishingConnection: connecting, gameHost } = useAppSelector(
        (state) => state.gameNode
    );
    const auth = useAuth();
    const user = auth.user?.profile as ThronetekiUser;
    const notificationRef = useRef<HTMLAudioElement | null>(null);
    const messageRef = useRef<HTMLDivElement | null>(null);
    const [waiting, setWaiting] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [message, setMessage] = useState('');
    const [canScroll, setCanScroll] = useState(true);
    const [playerCount, setPlayerCount] = useState(0);

    useEffect(() => {
        if (!user || !currentGame) {
            return;
        }

        const players = Object.values(currentGame.players).length;

        if (
            notificationRef.current &&
            playerCount === 1 &&
            players === 2 &&
            currentGame.owner === user.username
        ) {
            const promise = notificationRef.current?.play();

            if (promise !== undefined) {
                promise
                    .catch(() => {
                        console.info('catch');
                    })
                    .then(() => {
                        console.info('then');
                    });
            }

            const otherPlayer = Object.values(currentGame.players).find(
                (p: LobbyGamePlayer) => p.user.username !== user.username
            );

            if (!otherPlayer) {
                return;
            }

            showNotification({
                body: `${otherPlayer.user.username} has joined your game`,
                icon: `/img/avatar/${otherPlayer.user.username}.png`
            });
        }

        setPlayerCount(players);

        if (canScroll && messageRef.current) {
            messageRef.current.scrollTop = 999999;
        }

        if (connecting) {
            setWaiting(false);
        }
    }, [
        currentGame?.owner,
        currentGame?.players,
        user,
        playerCount,
        currentGame,
        canScroll,
        connecting
    ]);

    if (!currentGame || !user) {
        return null;
    }

    const canStartGame = () => {
        if (!user || !currentGame || currentGame.owner.username !== user.name || connecting) {
            return false;
        }

        if (
            !Object.values(currentGame.players).every((player) => {
                return !!player.deckSelected;
            })
        ) {
            return false;
        }

        if (waiting && !gameError) {
            return false;
        }

        return true;
    };

    const getGameStatus = () => {
        if (gameError) {
            return t(gameError);
        }

        if (connecting) {
            return t('Connecting to game server {{host}}', { host: gameHost });
        }

        if (waiting) {
            return t('Waiting for lobby server...');
        }

        if (Object.values(currentGame.players).length < 2) {
            return t('Waiting for players...');
        }

        if (
            !Object.values(currentGame.players).every((player) => {
                return !!player.deckSelected;
            })
        ) {
            return t('Waiting for players to select decks');
        }

        if (currentGame.owner === user?.username) {
            return t('Ready to begin, click start to begin the game');
        }

        return t('Ready to begin, waiting for opponent to start the game');
    };

    const sendMessage = () => {
        if (message === '') {
            return;
        }

        // dispatch(sendSocketMessage('chat', message));

        setMessage('');
    };

    return (
        <>
            <audio ref={notificationRef}>
                <source src={ChargeMp3} type='audio/mpeg' />
                <source src={ChargeOgg} type='audio/ogg' />
            </audio>
            <Panel title={currentGame.name}>
                <div className='d-flex justify-content-between'>
                    <div>
                        <Button
                            className='me-2'
                            variant='success'
                            disabled={!canStartGame()}
                            onClick={() => {
                                setWaiting(true);
                                dispatch(lobbyActions.sendStartGame());
                            }}
                        >
                            <Trans>Start</Trans>
                        </Button>
                        <Button
                            variant='primary'
                            onClick={() => {
                                dispatch(lobbyActions.leaveGame());
                            }}
                        >
                            <Trans>Leave</Trans>
                        </Button>
                    </div>
                    <div>
                        <CopyToClipboard
                            text={`${window.location.protocol}//${window.location.host}/play?gameId=${currentGame.id}`}
                        >
                            <Button variant='primary'>
                                <Trans>Copy Game Link</Trans>
                            </Button>
                        </CopyToClipboard>
                    </div>
                </div>
                <div className='mt-3'>
                    <GameTypeInfo gameType={currentGame.gameType} />
                </div>
                <div className='game-status'>{getGameStatus()}</div>
            </Panel>
            <PendingGamePlayers
                currentGame={currentGame}
                user={user}
                onSelectDeck={() => setShowModal(true)}
            />
            <Panel
                title={t('Spectators({{users}})', {
                    users: currentGame.spectators.length
                })}
            >
                {currentGame.spectators.map((spectator) => {
                    return <div key={spectator.name}>{spectator.name}</div>;
                })}
            </Panel>
            <Panel title={t('Chat')}>
                <div
                    className='message-list'
                    ref={messageRef}
                    onScroll={() => {
                        setTimeout(() => {
                            if (
                                messageRef.current &&
                                messageRef.current.scrollTop >=
                                    messageRef.current.scrollHeight -
                                        messageRef.current.offsetHeight -
                                        20
                            ) {
                                setCanScroll(true);
                            } else {
                                setCanScroll(false);
                            }
                        }, 500);
                    }}
                >
                    {/* <Messages messages={currentGame.messages} /> */}
                </div>
                <Form>
                    <Form.Group>
                        <Form.Control
                            type='text'
                            placeholder={t('Enter a message...')}
                            value={message}
                            onKeyPress={(event) => {
                                if (event.key === 'Enter') {
                                    sendMessage();
                                    event.preventDefault();
                                }
                            }}
                            onChange={(event) => setMessage(event.target.value)}
                        ></Form.Control>
                    </Form.Group>
                </Form>
            </Panel>
            {showModal && (
                <SelectDeckModal
                    onClose={() => setShowModal(false)}
                    onDeckSelected={(deck: Deck) => {
                        setShowModal(false);
                        dispatch(lobbyActions.sendSelectDeck(deck.id));
                    }}
                    restrictedList={currentGame.restrictedListId}
                />
            )}
        </>
    );
};

export default PendingGame;
