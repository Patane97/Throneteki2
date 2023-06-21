import { User } from 'oidc-client-ts';

export const getUser = () => {
    const oidcStorage = localStorage.getItem(
        `oidc.user:${process.env.REACT_APP_AUTH_URL}:${process.env.REACT_APP_CLIENT_ID}`
    );
    if (!oidcStorage) {
        return null;
    }

    return User.fromStorageString(oidcStorage);
};
