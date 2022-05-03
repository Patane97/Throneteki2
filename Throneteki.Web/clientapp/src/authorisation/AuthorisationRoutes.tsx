import React from 'react';
import { ApplicationPaths, LoginActions, LogoutActions } from './AuthorisationConstants';
import { Login } from './Login';
import { Logout } from './Logout';

const AuthorisationRoutes = () => {
    const loginAction = (name: string) => {
        return <Login action={name}></Login>;
    };

    const logoutAction = (name: string) => {
        return <Logout action={name}></Logout>;
    };

    return [
        { path: ApplicationPaths.Login, element: loginAction(LoginActions.Login) },
        { path: ApplicationPaths.LoginFailed, element: loginAction(LoginActions.LoginFailed) },
        { path: ApplicationPaths.LoginCallback, element: loginAction(LoginActions.LoginCallback) },
        { path: ApplicationPaths.Profile, element: loginAction(LoginActions.Profile) },
        { path: ApplicationPaths.Register, element: loginAction(LoginActions.Register) },
        { path: ApplicationPaths.LogOut, element: logoutAction(LogoutActions.Logout) },
        {
            path: ApplicationPaths.LogOutCallback,
            element: logoutAction(LogoutActions.LogoutCallback)
        },
        { path: ApplicationPaths.LoggedOut, element: logoutAction(LogoutActions.LoggedOut) }
    ];
};

export default AuthorisationRoutes;
