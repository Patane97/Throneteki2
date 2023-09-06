import { BaseQueryFn, createApi, FetchArgs, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

import { getUser } from '../../helpers/UserHelper';
import { TagTypes } from '../../types/enums';
import { Deck } from '../../types/decks';
export interface ApiError {
    data: {
        message: string;
        success: boolean;
    };
    status: number;
}

export const apiSlice = createApi({
    baseQuery: fetchBaseQuery({
        baseUrl: '/api',
        prepareHeaders: (headers, {}) => {
            const user = getUser();
            const token = user?.access_token;
            if (token) {
                headers.set('authorization', `Bearer ${token}`);
            }

            return headers;
        },
        paramsSerializer: (params: Record<string, unknown>) => {
            const queryStr = new URLSearchParams();

            for (const param in params) {
                if (!Array.isArray(params[param])) {
                    if (params[param]) {
                        queryStr.append(param, params[param] as string);
                    }
                } else {
                    let index = 0;
                    for (const arrayVal of params[param] as Array<Record<string, unknown>>) {
                        for (const arrayParam in arrayVal) {
                            if (arrayVal[arrayParam]) {
                                queryStr.append(
                                    `${param}[${index}].${arrayParam}`,
                                    arrayVal[arrayParam] as string
                                );
                            }
                        }

                        index++;
                    }
                }
            }
            return queryStr.toString();
        }
    }) as BaseQueryFn<string | FetchArgs, unknown, ApiError, unknown>,
    tagTypes: Object.values(TagTypes),
    endpoints: (builder) => ({
        addBlockListEntry: builder.mutation({
            query: (entry) => ({
                url: `/user/${entry.userId}/blocklist`,
                method: 'POST',
                body: { userName: entry.blockee }
            })
        }),
        addDeck: builder.mutation({
            query: (deck) => ({
                url: '/decks/',
                method: 'POST',
                body: deck
            }),
            invalidatesTags: [TagTypes.Deck]
        }),
        deleteDeck: builder.mutation({
            query: (deckId) => ({
                url: `/decks/${deckId}`,
                method: 'DELETE'
            }),
            invalidatesTags: [TagTypes.Deck]
        }),
        deleteDecks: builder.mutation({
            query: (deckIds) => ({
                url: '/decks',
                method: 'DELETE',
                body: {
                    deckIds: deckIds
                }
            }),
            invalidatesTags: [TagTypes.Deck]
        }),
        getBlockList: builder.query({
            query: (userId) => `/user/${userId}/blocklist`
        }),
        getCards: builder.query({
            query: () => '/data/cards'
        }),
        getDeck: builder.query({
            query: (options) => {
                return {
                    url: `/decks/${options.deckId}`,
                    params: { restrictedList: options.restrictedList }
                };
            },
            providesTags: (result, error, arg) => [{ type: TagTypes.Deck, id: arg }]
        }),
        getDecks: builder.query({
            query: (loadOptions) => {
                return {
                    url: '/decks',
                    params: {
                        pageSize: loadOptions.pageSize,
                        pageNumber: loadOptions.pageIndex,
                        sorting: loadOptions.sorting,
                        filters: loadOptions.columnFilters,
                        restrictedList: loadOptions.restrictedList
                    }
                };
            },
            providesTags: (result = { data: [] }) => [
                TagTypes.Deck,
                ...result.data.map(({ id }: Deck) => ({ type: TagTypes.Deck, id }))
            ]
        }),
        getFactions: builder.query({
            query: () => '/data/factions'
        }),
        getFilterOptionsForDecks: builder.query({
            query: ({ column, columnFilters }) => ({
                url: `/decks/groupFilter`,
                params: {
                    column: column,
                    filters: columnFilters
                }
            })
        }),
        getPacks: builder.query({
            query: () => '/data/packs'
        }),
        getRestrictedList: builder.query({
            query: () => '/data/restricted-list'
        }),
        getThronesDbDecks: builder.query({
            query: () => '/decks/thronesdb'
        }),
        getThronesDbStatus: builder.query({
            query: () => '/decks/thronesdb/status'
        }),
        getUserDetails: builder.query({
            query: (username) => `/admin/user/${username}`
        }),
        importThronesDbDecks: builder.mutation({
            query: (deckIds) => ({
                url: '/decks/thronesdb',
                method: 'POST',
                body: deckIds
            })
        }),
        linkThronesDbAccount: builder.mutation({
            query: () => ({ url: '/user/link-tdb', method: 'POST' })
        }),
        toggleDeckFavourite: builder.mutation({
            query: (deckId) => ({
                url: `/decks/${deckId}/toggleFavourite`,
                method: 'POST'
            })
        }),
        saveDeck: builder.mutation({
            query: (deck) => ({
                url: `/decks/${deck.id}`,
                method: 'PUT',
                body: deck
            }),
            invalidatesTags: (result, error, arg) => [{ type: TagTypes.Deck, id: arg.id }]
        }),
        saveUser: builder.mutation({
            query: ({ userId, userDetails }) => ({
                url: `/user/${userId}`,
                method: 'PATCH',
                body: userDetails
            })
        }),
        saveUserAdmin: builder.mutation({
            query: ({ userId, userDetails }) => ({
                url: `/admin/user/${userId}`,
                method: 'PATCH',
                body: userDetails
            })
        }),
        syncThronesDbDecks: builder.mutation({
            query: () => ({
                url: '/decks/thronesdb/sync',
                method: 'POST'
            })
        })
    })
});

export const {
    useAddBlockListEntryMutation,
    useAddDeckMutation,
    useDeleteDeckMutation,
    useDeleteDecksMutation,
    useGetBlockListQuery,
    useGetCardsQuery,
    useGetDeckQuery,
    useGetDecksQuery,
    useGetFactionsQuery,
    useGetFilterOptionsForDecksQuery,
    useGetPacksQuery,
    useGetRestrictedListQuery,
    useGetThronesDbDecksQuery,
    useGetThronesDbStatusQuery,
    useGetUserDetailsQuery,
    useImportThronesDbDecksMutation,
    useLazyGetUserDetailsQuery,
    useLinkThronesDbAccountMutation,
    useToggleDeckFavouriteMutation,
    useSaveDeckMutation,
    useSaveUserAdminMutation,
    useSaveUserMutation,
    useSyncThronesDbDecksMutation
} = apiSlice;
