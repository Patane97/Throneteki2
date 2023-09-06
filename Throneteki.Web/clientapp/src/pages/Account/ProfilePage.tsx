import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

import LoadingSpinner from '../../components/LoadingSpinner';
import { useAuth } from 'react-oidc-context';

const ProfilePage = () => {
    const auth = useAuth();

    const { t } = useTranslation();

    useEffect(() => {
        window.location.replace(
            `${auth.settings.authority}/Account/Profile?redirectUrl=${window.location.origin}`
        );
    }, [auth.settings.authority]);

    return (
        <LoadingSpinner text={t('Redirecting you to the authentication server, please wait...')} />
    );
};

export default ProfilePage;
