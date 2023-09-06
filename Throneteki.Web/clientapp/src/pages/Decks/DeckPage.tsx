import React, { useEffect, useMemo, useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { Alert, Col, Form, Row } from 'react-bootstrap';
import { useNavigate, useParams } from 'react-router-dom';

import Panel from '../../components/Site/Panel';
import {
    useDeleteDeckMutation,
    useGetCardsQuery,
    useGetDeckQuery,
    useGetRestrictedListQuery
} from '../../redux/api/apiSlice';
import LoadingSpinner from '../../components/LoadingSpinner';
import FactionImage from '../../components/Images/FactionImage';
import CardImage from '../../components/Images/CardImage';
import { DeckCard, RestrictedList } from '../../types/decks';
import { DrawCardType } from '../../types/enums';
import { Card } from '../../types/data';
import DeckSummary from '../../components/Decks/DeckSummary';
import DeckStatus from '../../components/Decks/DeckStatus';
import { LinkContainer } from 'react-router-bootstrap';
import FaIconButton from '../../components/Site/FaIconButton';
import { faPenToSquare, faTrashAlt } from '@fortawesome/free-solid-svg-icons';
import { toastr } from 'react-redux-toastr';
import { Constants } from '../../constants';

const DeckPage = () => {
    const { t } = useTranslation();
    const params = useParams();
    const [restrictedList, setRestrictedList] = useState<string | null>();
    const [deleteDeck] = useDeleteDeckMutation();
    const navigate = useNavigate();
    const [mousePos, setMousePosition] = useState({ x: 0, y: 0 });
    const [zoomCard, setZoomCard] = useState(null);

    const { data, isLoading, isError, isSuccess } = useGetDeckQuery({
        deckId: params.deckId,
        restrictedList: restrictedList
    });
    const {
        data: cardsResponse,
        isLoading: isCardsLoading,
        isError: isCardsError
    } = useGetCardsQuery({});
    const { data: restrictedLists, isLoading: isRestrictedListLoading } = useGetRestrictedListQuery(
        []
    );

    useEffect(() => {
        if (!restrictedList && restrictedLists) {
            setRestrictedList(restrictedLists[0].id);
        }
    }, [restrictedList, restrictedLists]);

    const cardsByCode = useMemo(() => {
        return (
            cardsResponse &&
            Object.assign({}, ...cardsResponse.map((card: Card) => ({ [card.code]: card })))
        );
    }, [cardsResponse]);

    const deck = data?.data;
    let content;

    if (isLoading || isCardsLoading || isRestrictedListLoading) {
        content = <LoadingSpinner text='Loading deck, please wait...' />;
    } else if (isError || isCardsError) {
        content = (
            <Alert variant='danger'>
                {t('An error occured loading your deck. Please try again later.')}
            </Alert>
        );
    } else if (!data.success) {
        content = (
            <div>
                <Alert variant='danger'>
                    {t('An error occured loading your deck. Please try again later.')}
                </Alert>
            </div>
        );
    } else if (isSuccess) {
        const agendas = [];

        if (deck.agenda) {
            agendas.push(deck.agenda.code);
        }

        for (const agenda of deck.deckCards.filter(
            (dc: DeckCard) => dc.type == DrawCardType.Banner
        )) {
            agendas.push(agenda.card.code);
        }

        const agendaContent = agendas.map((agenda: string) => {
            return (
                <span
                    key={agenda}
                    onMouseOver={() => setZoomCard(`/img/cards/${agenda}.png`)}
                    onMouseMove={(event) => {
                        let y = event.clientY;
                        const yPlusHeight = y + 420;

                        if (yPlusHeight >= window.innerHeight) {
                            y -= yPlusHeight - window.innerHeight;
                        }

                        setMousePosition({ x: event.clientX, y: y });
                    }}
                    onMouseOut={() => setZoomCard(null)}
                >
                    <CardImage className='me-1' imageUrl={`/img/cards/${agenda}.png`} size='md' />
                </span>
            );
        });

        content = (
            <>
                <div>
                    <LinkContainer to={`/decks/${deck.id}/edit`}>
                        <FaIconButton variant='light' icon={faPenToSquare} text='Edit' />
                    </LinkContainer>
                    <FaIconButton
                        variant='danger'
                        className='ms-2'
                        icon={faTrashAlt}
                        text='Delete'
                        onClick={() => {
                            toastr.confirm(t('Are you sure you want to delete this deck?'), {
                                okText: t('Yes'),
                                cancelText: t('Cancel'),
                                onOk: async () => {
                                    try {
                                        const response = await deleteDeck(deck.id).unwrap();

                                        navigate('/decks');

                                        if (!response.success) {
                                            //    setError(response.message);
                                        } else {
                                            //   setSuccess(t('Deck added successfully.'));
                                        }
                                    } catch (err) {
                                        //   const apiError = err as ApiError;
                                        /* setError(
                                                t(
                                                    apiError.data.message ||
                                                        'An error occured adding the deck. Please try again later.'
                                                )
                                            );*/
                                    }
                                }
                            });
                        }}
                    />
                </div>
                <div className='d-flex justify-content-center'>
                    <FactionImage
                        className='me-1'
                        faction={deck.faction.code}
                        size='md'
                        onMouseOver={() =>
                            setZoomCard(Constants.FactionsImagePaths[deck.faction.code])
                        }
                        onMouseMove={(event) => {
                            let y = event.clientY;
                            const yPlusHeight = y + 420;

                            if (yPlusHeight >= window.innerHeight) {
                                y -= yPlusHeight - window.innerHeight;
                            }

                            setMousePosition({ x: event.clientX, y: y });
                        }}
                        onMouseOut={() => setZoomCard(null)}
                    />
                    {agendaContent}
                </div>
                <Row className='mb-2 mt-2'>
                    <Form>
                        <Form.Group as={Col} lg='4'>
                            <Form.Label>{t('Game mode')}</Form.Label>
                            <Form.Select
                                value={restrictedList}
                                onChange={(e) => {
                                    setRestrictedList(e.target.value);
                                }}
                            >
                                {restrictedLists?.map((rl: RestrictedList) => (
                                    <option key={rl.name} value={rl.id}>
                                        {rl.name}
                                    </option>
                                ))}
                            </Form.Select>
                        </Form.Group>
                    </Form>
                </Row>
                <Row>
                    <Col md={6}>
                        <Row className='mt-3 mb-0' as='dl'>
                            <Col sm={6} as='dt'>
                                <Trans>Faction</Trans>
                            </Col>
                            <Col sm={6} className='mb-0' as='dd'>
                                {deck.faction.name}
                            </Col>
                        </Row>
                        {agendas.map((agenda, index) => (
                            <Row key={agenda} className='mb-0 mt-1' as='dl'>
                                <Col sm={6} as='dt'>
                                    <Trans>{index == 0 ? 'Agenda' : 'Banner'}</Trans>
                                </Col>
                                <Col sm={6} className='mb-0' as='dd'>
                                    {cardsByCode[agenda].label}
                                </Col>
                            </Row>
                        ))}
                        {deck.externalId && (
                            <Row className='mb-0 mt-1' as='dl'>
                                <Col sm={6} as='dt'>
                                    <Trans>ThronesDB</Trans>
                                </Col>
                                <Col sm={6} className='mb-0' as='dd'>
                                    <a
                                        href={`https://thronesdb.com/deck/view/${deck.externalId}`}
                                        target='_blank'
                                        rel='noreferrer'
                                    >
                                        <Trans>Link</Trans>
                                    </a>
                                </Col>
                            </Row>
                        )}
                        <Row className='mb-0 mt-1' as='dl'>
                            <Col sm={6} as='dt'>
                                <Trans>Validity</Trans>
                            </Col>
                            <Col sm={6} className='mb-0' as='dd'>
                                <DeckStatus status={deck.status} />
                            </Col>
                        </Row>
                    </Col>
                    <Col md={6}>
                        <Row className='mt-3 mb-0' as='dl'>
                            <Col sm={6} as='dt'>
                                <Trans>Wins</Trans>
                            </Col>
                            <Col sm={6} className='mb-0' as='dd'>
                                {deck.wins}
                            </Col>
                        </Row>
                        <Row className='mt-1 mb-0' as='dl'>
                            <Col sm={6} as='dt'>
                                <Trans>Losses</Trans>
                            </Col>
                            <Col sm={6} className='mb-0' as='dd'>
                                {deck.losses}
                            </Col>
                        </Row>
                        <Row className='mt-1 mb-0' as='dl'>
                            <Col sm={6} as='dt'>
                                <Trans>Win Rate</Trans>
                            </Col>
                            <Col sm={6} className='mb-0' as='dd'>
                                {deck.winRate}
                                {deck.winRate && '%'}
                            </Col>
                        </Row>
                    </Col>
                </Row>
                <DeckSummary deck={deck} />
            </>
        );
    }

    return (
        <Col lg={{ span: 8, offset: 2 }}>
            <Panel title={data?.data.name}>{content}</Panel>
            {zoomCard && (
                <div
                    className='decklist-card-zoom'
                    style={{ left: mousePos.x + 5 + 'px', top: mousePos.y + 'px' }}
                >
                    <CardImage imageUrl={zoomCard} size='lg' />
                </div>
            )}
        </Col>
    );
};

export default DeckPage;
