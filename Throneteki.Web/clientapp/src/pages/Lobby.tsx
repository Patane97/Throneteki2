import React, { useState } from 'react';
// import { toastr } from 'react-redux-toastr';
import { useTranslation } from 'react-i18next';
import { Col, Form } from 'react-bootstrap';
// import { Carousel } from 'react-responsive-carousel';
import { useAppDispatch, useAppSelector } from '../redux/hooks';

// import NewsComponent from '../Components/News/News';
// import AlertPanel from '../Components/Site/AlertPanel';
import Panel from '../components/Site/Panel';
// import Typeahead from '../Components/Form/Typeahead';
import SideBar from '../components/Lobby/SideBar';
import UserList from '../components/Lobby/UserList';
import { lobbyActions } from '../redux/slices/lobbySlice';
import { useAuth } from 'react-oidc-context';
import LobbyChat from '../components/Lobby/LobbyChat';
import { Permission } from '../components/Navigation/menus';
import { ThronetekiUser } from '../types/user';
// import UserList from '../Components/Lobby/UserList';
// import LobbyChat from '../Components/Lobby/LobbyChat';
// import { clearChatStatus, loadNews, removeLobbyMessage, sendSocketMessage } from '../redux/actions';
// import { News } from '../redux/types';

// import 'react-responsive-carousel/lib/styles/carousel.min.css';

const Lobby = () => {
    const dispatch = useAppDispatch();
    const { users, lobbyMessages } = useAppSelector((state) => state.lobby);

    // const { bannerNotice, lobbyError, messages, motd, users } = useSelector((state) => ({
    //     bannerNotice: state.lobby.bannerNotice,
    //     lobbyError: state.lobby.lobbyError,
    //     messages: state.lobby.messages,
    //     motd: state.lobby.motd,
    //     users: state.lobby.users
    // }));
    // const user = useSelector((state) => state.account.user);
    // const news = useSelector((state) => state.news.news);
    // const apiState = useSelector((state) => {
    //     const retState = state.api[News.RequestNews];

    //     return retState;
    // });
    // const [popupError, setPopupError] = useState(false);
    const [message, setMessage] = useState<string>('');
    const { t } = useTranslation();
    const auth = useAuth();

    //     // useEffect(() => {
    //     //     dispatch(loadNews({ limit: 3 }));
    //     // }, [dispatch]);

    //     // if (!popupError && lobbyError) {
    //     //     setPopupError(true);

    //     //     toastr.error('Error', 'New users are limited from chatting in the lobby, try again later');

    //     //     setTimeout(() => {
    //     //         dispatch(clearChatStatus());
    //     //         setPopupError(false);
    //     //     }, 5000);
    //     // }

    const sendMessage = () => {
        if (message === '') {
            return;
        }

        dispatch(lobbyActions.sendLobbyChat(message));

        setMessage('');
    };

    const onKeyPress = (event: React.KeyboardEvent<HTMLElement>) => {
        if (event.key === 'Enter') {
            event.preventDefault();

            sendMessage();
        }
    };

    const user = auth.user?.profile as ThronetekiUser;

    const isLoggedIn = !!user;
    const placeholder = isLoggedIn
        ? 'Enter a message...'
        : 'You must be logged in to send lobby chat messages';

    //     // const banners = [
    //     //     {
    //     //         img: '/banner/swindle-ste3.png',
    //     //         link: 'https://forms.gle/SQSbcxEDATbYkSU8A'
    //     //     }
    //     // ];

    return (
        <div className='flex-container'>
            <SideBar>
                <UserList users={users} />
            </SideBar>
            <div>
                <Col sm={{ span: 10, offset: 1 }}>
                    {/* <Carousel
                            autoPlay={true}
                            infiniteLoop={true}
                            showArrows={false}
                            showThumbs={false}
                            showIndicators={false}
                            showStatus={false}
                            interval={7500}
                        >
                            {banners.map((banner) => {
                                return (
                                    <a
                                        key={banner.img}
                                        target='_blank'
                                        rel='noreferrer'
                                        href={banner.link}
                                    >
                                        <div className='banner'>
                                            <img src={banner.img} />
                                        </div>
                                    </a>
                                );
                            })}
                        </Carousel> */}
                </Col>
            </div>

            {/* {motd?.message && (
                    <div>
                        <Col sm={{ span: 10, offset: 1 }} className='banner'>
                            <AlertPanel type={motd.motdType} message={motd.message}></AlertPanel>
                        </Col>
                    </div>
                )} */}
            {/* {bannerNotice && (
                    <div>
                        <Col sm={{ span: 10, offset: 1 }} className='annoucement'>
                            <AlertPanel message={bannerNotice} type='error' />
                        </Col>
                    </div>
                )} */}
            <div>
                <Col sm={{ span: 10, offset: 1 }}>
                    <Panel title={t('Latest site news')}>
                        {/* {apiState?.loading ? (
                                <div>
                                    <Trans>News loading, please wait...</Trans>
                                </div>
                            ) : null}
                            <NewsComponent news={news} /> */}
                    </Panel>
                </Col>
            </div>
            <Col sm={{ span: 10, offset: 1 }} className='chat-container'>
                <Panel
                    title={t('Lobby Chat ({{users}}) online', {
                        users: users.length
                    })}
                >
                    <LobbyChat
                        messages={lobbyMessages}
                        isModerator={user?.role?.includes(Permission.CanModerateChat)}
                        onRemoveMessageClick={() => {
                            //   dispatch(removeLobbyMessage(messageId))
                        }}
                    />
                </Panel>
                <Form
                    className='chat-box-container'
                    onSubmit={(event) => {
                        event.preventDefault();
                        sendMessage();
                    }}
                >
                    <Form.Group>
                        <Form.Control
                            className='bg-light text-dark'
                            onKeyDown={onKeyPress}
                            onChange={(event) =>
                                setMessage(
                                    event.target.value.substring(
                                        0,
                                        Math.min(512, event.target.value.length)
                                    )
                                )
                            }
                            placeholder={t(placeholder)}
                            value={message}
                        ></Form.Control>
                    </Form.Group>
                </Form>
            </Col>
        </div>
    );
};

Lobby.displayName = 'Lobby';

export default Lobby;
