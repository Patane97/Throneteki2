import React from 'react';
import { NavDropdown } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { ThronetekiUser } from '../../types/user';

import Avatar from '../Site/Avatar';
import { MenuItem } from './menus';

type ProfileMenuProps = {
    menu: MenuItem[];
    user: ThronetekiUser | null | undefined;
};

const ProfileMenu: React.FC<ProfileMenuProps> = (props) => {
    const { t } = useTranslation('navigation');

    if (!props.user) {
        return null;
    }

    const title = (
        <span>
            <Avatar avatar={props.user.picture}></Avatar>
            {props.user.name}
        </span>
    );

    return (
        <NavDropdown title={title} id='nav-dropdown' className='d-flex align-items-center'>
            {props.menu.map((menuItem: MenuItem) => {
                if (!menuItem.path) {
                    return null;
                }

                return (
                    <NavDropdown.Item
                        key={menuItem.path}
                        className='navbar-item interactable dropdown-child'
                        as={Link}
                        to={menuItem.path}
                        state={menuItem.state}
                    >
                        {t(menuItem.title)}
                    </NavDropdown.Item>
                );
            })}
        </NavDropdown>
    );
};

export default ProfileMenu;
