import React, { useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { Alert, Button, Col } from 'react-bootstrap';

import Panel from '../../components/Site/Panel';
import {
    ApiError,
    useGetThronesDbStatusQuery,
    useLinkThronesDbAccountMutation
} from '../../redux/api/apiSlice';
import LoadingSpinner from '../../components/LoadingSpinner';
import ThronesDbDecks from '../../components/Decks/ThronesDbDecks';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCircleNotch } from '@fortawesome/free-solid-svg-icons';

const ThronesDbDecksPage = () => {
    const { t } = useTranslation();

    const { data: response, isLoading, isError } = useGetThronesDbStatusQuery({});
    const [linkAccount, { isLoading: isLinkLoading }] = useLinkThronesDbAccountMutation();
    const [errorMessage, setErrorMessage] = useState(null);

    let content;

    if (isLoading) {
        content = <LoadingSpinner text='Checking ThronesDB link status, please wait...' />;
    } else if (isError || !response.success || errorMessage) {
        content = (
            <Alert variant='danger'>
                {errorMessage ||
                    t('An error occured checking ThronesDB data. Please try again later.')}
            </Alert>
        );
    } else if (response.linked) {
        content = <ThronesDbDecks />;
    } else {
        content = (
            <>
                <div>
                    <Trans>
                        You can link your account to ThronesDB and import decks from there. Click
                        the button below to get started
                    </Trans>
                </div>
                <Button
                    type='button'
                    onClick={async () => {
                        try {
                            const response = await linkAccount({}).unwrap();
                            if (!response.success) {
                                setErrorMessage(response.message);
                            } else {
                                window.location.replace(response.data.location);
                            }
                        } catch (err) {
                            const apiError = err as ApiError;
                            setErrorMessage(
                                apiError.data.message ||
                                    'An error occured linking your account. Please try again later.'
                            );
                        }
                    }}
                >
                    <Trans>Link Account</Trans>
                    {isLinkLoading && <FontAwesomeIcon icon={faCircleNotch} spin />}
                </Button>
            </>
        );
    }

    return (
        <Col lg={{ span: 12, offset: 0 }}>
            <Panel title={t('Import ThronesDB decks')}>{content}</Panel>
        </Col>
    );
};

export default ThronesDbDecksPage;
