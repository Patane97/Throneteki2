import React, { useEffect, useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { Button, Col, Form, Row, Spinner } from 'react-bootstrap';
import { faFileCirclePlus, faDownload, faTrashAlt } from '@fortawesome/free-solid-svg-icons';
import { LinkContainer } from 'react-router-bootstrap';
import { useNavigate } from 'react-router-dom';

import Panel from '../../components/Site/Panel';
import FaIconButton from '../Site/FaIconButton';

import DeckList from './DeckList';
import { useDeleteDecksMutation, useGetRestrictedListQuery } from '../../redux/api/apiSlice';
import { toastr } from 'react-redux-toastr';
import { RestrictedList } from '../../types/decks';

const Decks = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [selectedIds, setSelectedIds] = useState([]);
    const [deleteDecks, { isLoading: isDeleteLoading }] = useDeleteDecksMutation();
    const { data: restrictedLists } = useGetRestrictedListQuery([]);
    const [restrictedList, setRestrictedList] = useState<string | null>();

    useEffect(() => {
        if (!restrictedList && restrictedLists) {
            setRestrictedList(restrictedLists[0].id);
        }
    }, [restrictedList, restrictedLists]);

    return (
        <Panel title={t('Decks')}>
            <div className='mb-3'>
                <LinkContainer to='/decks/new'>
                    <FaIconButton variant='light' icon={faFileCirclePlus} text='New' />
                </LinkContainer>
                <LinkContainer to='/decks/import'>
                    <FaIconButton
                        variant='light'
                        className='ms-2'
                        icon={faDownload}
                        text='Import'
                    />
                </LinkContainer>
                <FaIconButton
                    variant='danger'
                    className='ms-2'
                    text='Delete'
                    icon={faTrashAlt}
                    disabled={selectedIds.length === 0}
                    onClick={() => {
                        toastr.confirm(t('Are you sure you want to delete these decks?'), {
                            okText: t('Yes'),
                            cancelText: t('Cancel'),
                            onOk: async () => {
                                try {
                                    const response = await deleteDecks(selectedIds).unwrap();

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
                >
                    {isDeleteLoading && <Spinner />}
                </FaIconButton>
                <LinkContainer to='/decks/thronesdb'>
                    <Button variant='light' className='ms-2'>
                        <Trans>
                            <span className='pe-2'>ThronesDB</span>
                        </Trans>
                        <span className='icon icon-power'></span>
                    </Button>
                </LinkContainer>
                <Row className='mb-2 mt-2'>
                    <Form>
                        <Form.Group as={Col} lg='4'>
                            <Form.Label>{t('Game mode')}</Form.Label>
                            <Form.Select
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
            </div>
            <DeckList
                restrictedList={restrictedList}
                onDeckSelected={(deck) => navigate(`/decks/${deck.id}/`)}
                onDeckSelectionChange={(ids) => setSelectedIds(ids)}
            />
        </Panel>
    );
};

export default Decks;
