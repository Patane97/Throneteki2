import React from 'react';
import { Navbar, Nav, NavDropdown } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { useAuth } from 'react-oidc-context';

import { useAppSelector } from '../../redux/hooks';
import { RightMenu, LeftMenu, MenuItem, ProfileMenu } from './menus';
// import LanguageSelector from './LanguageSelector';
import ProfileDropdown from './ProfileMenu';
import ServerStatus from './ServerStatus';
import { ThronetekiUser } from '../../types/user';
import GameContextMenu from './GameContextMenu';

import SmallHeaderIcon from '../../assets/img/header_icon.png';
import HeaderIcon from '../../assets/img/main_header_logo.png';
export interface UserSettings {
    customBackground: string | undefined;
    background: string;
}

const Navigation = () => {
    const { t } = useTranslation();
    const auth = useAuth();
    const {
        isConnected: lobbyConnected,
        isEstablishingConnection: lobbyConnecting,
        responseTime: lobbyResponseTime,
        games
    } = useAppSelector((state) => state.lobby);
    const {
        isConnected: gameConnected,
        isEstablishingConnection: gameConnecting,
        responseTime: gameResponseTime,
        currentGame: activeGame
    } = useAppSelector((state) => state.gameNode);

    const user = auth.user?.profile as ThronetekiUser;

    const userCanSeeMenu = (menuItem: MenuItem, user: ThronetekiUser | null | undefined) => {
        return !menuItem.permission || user?.role?.includes(menuItem.permission);
    };

    const filterMenuItems = (menuItems: MenuItem[], user: ThronetekiUser | null | undefined) => {
        const returnedItems = [];

        for (const menuItem of menuItems) {
            if (user && menuItem.showOnlyWhenLoggedOut) {
                continue;
            }

            if (!user && menuItem.showOnlyWhenLoggedIn) {
                continue;
            }

            if (!userCanSeeMenu(menuItem, user)) {
                continue;
            }

            returnedItems.push(menuItem);
        }

        return returnedItems;
    };

    /**
     * Render a list of menu items to react components
     * @param {MenuItem[]} menuItems The menu items
     * @returns {JSX.Element[]} The list of rendered menu items
     */
    const renderMenuItems = (menuItems: MenuItem[]) => {
        return filterMenuItems(menuItems, user).map((menuItem) => {
            const children = menuItem.childItems && filterMenuItems(menuItem.childItems, user);

            if (children && children.length > 0) {
                return (
                    <NavDropdown
                        key={menuItem.title}
                        id={`nav-${menuItem.title}`}
                        title={t(menuItem.title)}
                    >
                        {children.map((childItem) =>
                            childItem.path ? (
                                <NavDropdown.Item
                                    as={Link}
                                    to={childItem.path}
                                    className='navbar-item interactable dropdown-child'
                                >
                                    {t(childItem.title)}
                                </NavDropdown.Item>
                            ) : null
                        )}
                    </NavDropdown>
                );
            }

            if (!menuItem.path) {
                return <></>;
            }
            return (
                <Nav.Link
                    key={menuItem.path}
                    className='navbar-item interactable'
                    as={Link}
                    to={menuItem.path}
                >
                    {t(menuItem.title)}
                </Nav.Link>
            );
        });
    };

    const numGames = (
        <li className='navbar-item'>
            <span>{t('{{gameLength}} Games', { gameLength: games?.length })}</span>
        </li>
    );

    return (
        <Navbar bg='dark' variant='dark' className='navbar-sm' fixed='top' expand='lg'>
            <div className='d-flex justify-content-between flex-grow-1 d-lg-none'>
                <div className='flex-basis-0 flex-grow-1'></div>
                <Navbar.Brand className='navbar-brand bg-dark mr-0' as={Link} to='/'>
                    <img
                        src={SmallHeaderIcon}
                        width='32'
                        height='32'
                        className='d-inline-block align-top'
                        alt='The Iron Throne Logo'
                    />
                </Navbar.Brand>
                <div className='flex-grow-1 flex-basis-0 d-flex justify-content-end'>
                    <Navbar.Toggle aria-controls='navbar' />
                </div>
            </div>
            <Navbar.Collapse id='navbar' className='flex-grow-1 justify-content-between'>
                <Nav className='mb-2 mb-lg-0 bg-dark flex-grow-1 flex-basis-0'>
                    {renderMenuItems(LeftMenu)}
                </Nav>
                <Navbar.Brand
                    className='navbar-brand bg-dark d-none d-lg-block mr-0'
                    as={Link}
                    to='/'
                >
                    <img
                        src={activeGame?.started ? SmallHeaderIcon : HeaderIcon}
                        height='32'
                        className='d-inline-block align-top'
                        alt='TCO Logo'
                    />
                </Navbar.Brand>
                <Nav className='bg-dark flex-grow-1 flex-basis-0 d-flex justify-content-end text-nowrap'>
                    <GameContextMenu />
                    {!activeGame?.started && numGames}
                    {activeGame?.started ? (
                        <ServerStatus
                            connected={gameConnected}
                            connecting={gameConnecting}
                            serverType='Game server'
                            responseTime={gameResponseTime}
                        />
                    ) : (
                        <ServerStatus
                            connected={lobbyConnected}
                            connecting={lobbyConnecting}
                            serverType='Lobby'
                            responseTime={lobbyResponseTime}
                        />
                    )}
                    {renderMenuItems(RightMenu)}
                    <ProfileDropdown menu={ProfileMenu} user={user} />
                    {/* <LanguageSelector /> */}
                </Nav>
            </Navbar.Collapse>
        </Navbar>
    );
};

export default Navigation;
