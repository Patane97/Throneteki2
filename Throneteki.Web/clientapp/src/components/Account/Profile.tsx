import React, { ReactElement, useState, useRef, useEffect } from 'react';
import { Form, Button, Alert, Col, Row, Spinner } from 'react-bootstrap';
import { Formik, FormikProps } from 'formik';
import { useTranslation } from 'react-i18next';
import * as yup from 'yup';

import { CustomUserProfile } from '../Navigation/Navigation';
import ProfileBackground from './ProfileBackground';
import ProfileMain from './ProfileMain';
import ProfileActionWindows from './ProfileActionWindows';
import ProfileCardSize from './ProfileCardSize';
import ThronetekiGameSettings from './ThronetekiGameSettings';

import BlankBg from '../../assets/img/bgs/blank.png';
import Background1 from '../../assets/img/bgs/background.png';
import Background2 from '../../assets/img/bgs/background2.png';

interface GameSettings {
    chooseOrder: boolean;
    chooseCards: boolean;
    promptDupes: boolean;
    windowTimer: number;
    timerEvents: boolean;
    timerAbilities: boolean;
}

interface SettingsDetails extends GameSettings {
    background?: string;
    cardSize?: string;
    customBackgroundUrl?: string;
    actionWindows: { [key: string]: boolean };
}

interface ProfileDetails {
    userId: string;
    username: string;
    password?: string;
    passwordAgain?: string;
    email?: string;
}

export interface ExistingProfileDetails extends ProfileDetails, GameSettings {
    actionWindows: { [window: string]: boolean };
    avatar?: File;
}

export interface NewProfileDetails extends ProfileDetails {
    avatar?: string | null;
    customBackground?: string;
    settings: SettingsDetails;
}

export interface BackgroundOption {
    name: string;
    label: string;
    imageUrl: string;
}

export interface ProfileCardSizeOption {
    name: string;
    label: string;
}

type ProfileProps = {
    onSubmit: (values: NewProfileDetails) => void;
    user: CustomUserProfile | null | undefined;
};

const toBase64 = (file: File): Promise<string | null | undefined> =>
    new Promise<string | null | undefined>((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (): void => resolve(reader.result?.toString().split(',')[1]);
        reader.onerror = (error): void => reject(error);
    });

const defaultActionWindows = {
    plot: false,
    draw: false,
    challengeBegin: false,
    attackersDeclared: true,
    defendersDeclared: true,
    dominance: false,
    standing: false,
    taxation: false
};

const ProfileComponent = (props: ProfileProps) => {
    const { user, onSubmit } = props;
    const { t } = useTranslation('profile');

    const cardSizes = [
        { name: 'small', label: t('Small') },
        { name: 'normal', label: t('Normal') },
        { name: 'large', label: t('Large') },
        { name: 'x-large', label: t('Extra-Large') }
    ];

    const backgrounds = [
        { name: 'none', label: t('None'), imageUrl: BlankBg },
        { name: 'standard', label: t('Standard'), imageUrl: Background1 },
        { name: 'winter', label: t('Winter'), imageUrl: Background2 }
    ];

    const settings: SettingsDetails = JSON.parse(user?.throneteki_settings || '{}');
    const [localBackground, setBackground] = useState(settings.background || 'standard');
    const [localCardSize, setCardSize] = useState(settings.cardSize || 'normal');
    const [customBg, setCustomBg] = useState<string | null | undefined>(null);
    const topRowRef = useRef<HTMLElement>(null);

    useEffect(() => {
        setBackground(settings.background || 'none');
        setCardSize(settings.cardSize || 'normal');
    }, [settings.background, settings.cardSize]);

    if (!user) {
        return <Alert variant='danger'>You need to be logged in to view your profile.</Alert>;
    }

    const initialValues: ExistingProfileDetails = {
        userId: user.sub,
        avatar: undefined,
        password: '',
        passwordAgain: '',
        username: user.name || '',
        email: user.email,
        actionWindows: settings.actionWindows || defaultActionWindows,
        chooseOrder: !!settings.chooseOrder,
        chooseCards: !!settings.chooseCards,
        promptDupes: !!settings.promptDupes,
        windowTimer: settings.windowTimer || 10,
        timerAbilities: !!settings.timerAbilities,
        timerEvents: settings.timerEvents || true
    };

    const schema = yup.object({
        avatar: yup
            .mixed()
            .test(
                'fileSize',
                t('Image must be less than 100KB in size'),
                (value) => !value || value.size <= 100 * 1024
            )
            .test(
                'fileType',
                t('Unsupported image format'),
                (value) =>
                    !value ||
                    ['image/jpg', 'image/jpeg', 'image/gif', 'image/png'].includes(value.type)
            ),
        email: yup
            .string()
            .email(t('Please enter a valid email address'))
            .required(t('You must specify an email address'))
    });

    return (
        <Formik
            validationSchema={schema}
            onSubmit={async (values: ExistingProfileDetails): Promise<void> => {
                const submitValues: NewProfileDetails = {
                    userId: user.sub,
                    avatar: values.avatar ? await toBase64(values.avatar) : null,
                    email: values.email,
                    username: values.username,
                    settings: {
                        actionWindows: values.actionWindows,
                        chooseOrder: values.chooseOrder,
                        chooseCards: values.chooseCards,
                        promptDupes: values.promptDupes,
                        windowTimer: values.windowTimer,
                        timerAbilities: values.timerAbilities,
                        timerEvents: values.timerEvents
                    }
                };

                if (localBackground) {
                    submitValues.settings.background = localBackground;
                }

                if (localCardSize) {
                    submitValues.settings.cardSize = localCardSize;
                }

                if (customBg) {
                    submitValues.customBackground = customBg;
                }

                if (submitValues.settings.windowTimer > 10) {
                    submitValues.settings.windowTimer = 10;
                }

                onSubmit(submitValues);

                if (!topRowRef || !topRowRef.current) {
                    return;
                }

                topRowRef.current.scrollIntoView(false);
            }}
            initialValues={initialValues}
        >
            {(formProps: FormikProps<ExistingProfileDetails>): ReactElement => (
                <Form
                    className='profile-form'
                    onSubmit={(event: React.FormEvent<HTMLFormElement>): void => {
                        event.preventDefault();
                        formProps.handleSubmit(event);
                    }}
                >
                    <Row ref={topRowRef}>
                        <Col sm='12'>
                            <ProfileMain formProps={formProps} user={user} />
                        </Col>
                    </Row>
                    <Row>
                        <Col sm='12'>
                            <ProfileBackground
                                backgrounds={backgrounds}
                                selectedBackground={localBackground}
                                customBackground={settings?.customBackgroundUrl}
                                onBackgroundSelected={async (name, file) => {
                                    if (name === 'custom') {
                                        if (!file) {
                                            return;
                                        }

                                        const base64File = await toBase64(file);

                                        setCustomBg(base64File);
                                    }

                                    setBackground(name);
                                }}
                            />
                        </Col>
                    </Row>
                    <Row>
                        <Col>
                            <ThronetekiGameSettings formProps={formProps} user={user} />
                        </Col>
                    </Row>
                    <Row>
                        <Col sm='6'>
                            <ProfileCardSize
                                cardSizes={cardSizes}
                                selectedCardSize={localCardSize}
                                onCardSizeSelected={(name): void => setCardSize(name)}
                            />
                        </Col>
                        <Col sm='6'>
                            <ProfileActionWindows formProps={formProps} user={user} />
                        </Col>
                    </Row>
                    <div className='text-center profile-submit'>
                        <Button variant='success' type='submit'>
                            {t('Save')}
                        </Button>
                    </div>
                </Form>
            )}
        </Formik>
    );
};

export default ProfileComponent;
