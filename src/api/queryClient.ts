import AsyncStorage from '@react-native-async-storage/async-storage';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            // A price list changes a few times a year; a diary changes all
            // day. Screens that need fresher data set their own staleTime.
            staleTime: 1000 * 60 * 5,
            gcTime: 1000 * 60 * 60 * 24,
            retry: 2,
            refetchOnWindowFocus: false,
        },
    },
});

/**
 * The cache survives a restart, so the app opens on the price list and the
 * client's next booking rather than on a spinner. A barber standing in a shop
 * with bad signal still sees today's diary.
 */
export const asyncStoragePersister = createAsyncStoragePersister({
    storage: AsyncStorage,
    key: 'magnetic.query-cache',
});
