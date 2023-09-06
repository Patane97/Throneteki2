import React, { useState, useMemo } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { Alert, Button, Col } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faDownload,
    faCloudArrowUp,
    faCircleCheck,
    faCircleNotch,
    faRightLeft
} from '@fortawesome/free-solid-svg-icons';

import {
    ApiError,
    useGetThronesDbDecksQuery,
    useImportThronesDbDecksMutation,
    useLinkThronesDbAccountMutation,
    useSyncThronesDbDecksMutation
} from '../../redux/api/apiSlice';
import LoadingSpinner from '../../components/LoadingSpinner';
import { ThronesDbDeck } from '../../types/decks';
import { ColumnDef, Row, RowData } from '@tanstack/react-table';
import moment from 'moment';
import IndeterminateCheckbox from '../Table/InterderminateCheckBox';
import FaIconButton from '../Site/FaIconButton';
import ReactTable from '../Table/ReactTable';

declare module '@tanstack/table-core' {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    interface ColumnMeta<TData extends RowData, TValue> {
        colWidth: number;
    }
}

const ThronesDbDecks = () => {
    const { t } = useTranslation();
    const [error, setError] = useState('');
    const [selectedRows, setSelectedRows] = useState<Row<ThronesDbDeck>[]>([]);
    const { data: response, isLoading, isError } = useGetThronesDbDecksQuery({});
    const [importDecks, { isLoading: isImportLoading }] = useImportThronesDbDecksMutation();
    const [linkAccount, { isLoading: isLinkLoading }] = useLinkThronesDbAccountMutation();
    const [syncDecks, { isLoading: isSyncLoading }] = useSyncThronesDbDecksMutation();

    const onImportClick = async (deckIds: number[]) => {
        setError('');

        try {
            const response = await importDecks(deckIds).unwrap();

            if (!response.success) {
                setError(response.message);
            }
        } catch (err) {
            const apiError = err as ApiError;
            setError(
                t(
                    apiError.data.message ||
                        'An error occured importing decks. Please try again later.'
                )
            );
        }
    };

    const onSyncClick = async () => {
        setError('');

        try {
            const response = await syncDecks({}).unwrap();

            if (!response.success) {
                setError(response.message);
            }
        } catch (err) {
            const apiError = err as ApiError;
            setError(
                t(
                    apiError.data.message ||
                        'An error occured syncing decks. Please try again later.'
                )
            );
        }
    };

    let content;

    const columns = useMemo<ColumnDef<ThronesDbDeck>[]>(
        () => [
            {
                id: 'select',
                header: ({ table }) => (
                    <label className='text-center'>
                        <IndeterminateCheckbox
                            {...{
                                className: 'mb-1',
                                checked: table.getIsAllRowsSelected(),
                                indeterminate: table.getIsSomeRowsSelected(),
                                onChange: table.getToggleAllRowsSelectedHandler()
                            }}
                        />
                    </label>
                ),
                cell: ({ row }) => (
                    <label className='text-center'>
                        <IndeterminateCheckbox
                            {...{
                                className: 'mt-1',
                                checked: row.getIsSelected(),
                                indeterminate: row.getIsSomeSelected(),
                                onChange: row.getToggleSelectedHandler()
                            }}
                        />
                    </label>
                ),
                enableSorting: false,
                meta: {
                    colWidth: 1
                }
            },
            {
                accessorKey: 'name',
                header: t('Name') as string,
                meta: {
                    colWidth: 5
                }
            },
            {
                accessorKey: 'factionName',
                header: t('Faction') as string,
                meta: {
                    colWidth: 2
                }
            },
            {
                accessorKey: 'dateCreation',
                cell: (info) =>
                    moment(info.getValue() as Date)
                        .local()
                        .format('YYYY-MM-DD HH:mm'),
                header: t('Created') as string,
                meta: {
                    colWidth: 2
                }
            },
            {
                accessorKey: 'dateUpdate',
                cell: (info) =>
                    moment(info.getValue() as Date)
                        .local()
                        .format('YYYY-MM-DD HH:mm'),
                header: t('Updated') as string,
                meta: {
                    colWidth: 2
                }
            },
            {
                id: 'is_synced',
                accessorKey: 'isSynced',
                cell: (info) =>
                    info.getValue() ? (
                        <div className='text-center text-primary'>
                            <FontAwesomeIcon icon={faCircleCheck} />
                        </div>
                    ) : null,
                enableSorting: false,
                enableColumnFilter: false,
                header: t('Synced') as string,
                meta: {
                    colWidth: 1
                }
            }
        ],
        [t]
    );

    if (isLoading) {
        content = <LoadingSpinner text='Loading ThronesDB decks, please wait...' />;
    } else if (isImportLoading) {
        content = <LoadingSpinner text='Importing decks, please wait...' />;
    } else if (isSyncLoading) {
        content = <LoadingSpinner text='Syncing decks, please wait...' />;
    } else if (isError) {
        content = (
            <Alert variant='danger'>
                {t('An error occured loading ThronesDB decks. Please try again later.')}
            </Alert>
        );
    } else if (!response.success) {
        content = (
            <div>
                <Alert variant='danger'>
                    {t('An error occured loading ThronesDB decks. Please try again later.')}
                </Alert>
                <Button
                    variant='primary'
                    onClick={async () => {
                        try {
                            const response = await linkAccount({}).unwrap();
                            window.location.replace(response.data.location);

                            if (!response.success) {
                                setError(response.message);
                            } else {
                                // setSuccess(t('Settings saved successfully.'));
                            }
                        } catch (err) {
                            const apiError = err as ApiError;
                            setError(
                                t(
                                    apiError.data.message ||
                                        'An error occured linking your account. Please try again later.'
                                )
                            );
                        }
                    }}
                >
                    <Trans>Link account</Trans>
                    {isLinkLoading && <FontAwesomeIcon icon={faCircleNotch} spin />}
                </Button>
            </div>
        );
    } else if (response.data.length === 0) {
        content = (
            <Alert variant='info'>
                {t('There are no decks in your ThronesDB account to import.')}
            </Alert>
        );
    } else {
        content = (
            <div>
                <div className='d-flex justify-content-between mb-3'>
                    <div>
                        <FaIconButton
                            variant='light'
                            disabled={selectedRows.length === 0}
                            icon={faDownload}
                            text='Import Selected'
                            onClick={async () => {
                                await onImportClick(
                                    selectedRows.map((r: Row<ThronesDbDeck>) => r.original.id)
                                );
                            }}
                        />
                        <FaIconButton
                            variant='light'
                            className='ms-2'
                            icon={faCloudArrowUp}
                            text='Import All'
                            onClick={async () => {
                                await onImportClick(response.data.map((d: ThronesDbDeck) => d.id));
                            }}
                        />
                        <FaIconButton
                            variant='light'
                            className='ms-2'
                            icon={faRightLeft}
                            text='Sync'
                            onClick={async () => {
                                await onSyncClick();
                            }}
                        />
                    </div>
                </div>
                <ReactTable
                    dataLoadFn={() => ({ data: response })}
                    columns={columns}
                    onRowSelectionChange={(rows) => setSelectedRows(rows)}
                />
            </div>
        );
    }

    return (
        <Col>
            {error && <Alert variant='danger'>{t(error)}</Alert>}
            {content}
        </Col>
    );
};

export default ThronesDbDecks;
