import Constants from 'expo-constants';
import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

import { DEV_API_PORT, FALLBACK_API_URL, PRODUCTION_API_URL } from '@config/api';
import { useAuthStore } from '@stores/auth';

/**
 * In development, reuse the machine Metro is already serving from. That is the
 * same laptop running Laravel, and it works on a simulator, an emulator and a
 * physical handset without anyone editing a LAN address.
 */
function resolveBaseUrl(): string {
    if (!__DEV__) {
        return PRODUCTION_API_URL;
    }

    const metroHost = Constants.expoConfig?.hostUri;

    if (metroHost) {
        const [host] = metroHost.split(':');

        return `http://${host}:${DEV_API_PORT}/api/v1`;
    }

    return FALLBACK_API_URL;
}

export const apiClient = axios.create({
    baseURL: resolveBaseUrl(),
    timeout: 20000,
    headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
    },
});

/**
 * Every call carries the token, and staff calls carry the branch they are
 * acting in. The branch header is what makes the server resolve a staff
 * member's roles: Spatie roles are assigned per branch, so without it a
 * barber reads as having no permissions at all.
 */
apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
    const { token, branchId } = useAuthStore.getState();

    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    if (branchId) {
        config.headers['X-Branch-Id'] = branchId;
    }

    return config;
});

/**
 * A 401 means the token is gone — revoked, expired, or signed out on another
 * device. Clearing the store swaps the navigator back to the sign in screen,
 * so there is no separate "session expired" plumbing.
 */
apiClient.interceptors.response.use(
    (response) => response,
    (error: AxiosError) => {
        if (error.response?.status === 401) {
            void useAuthStore.getState().signOut();
        }

        return Promise.reject(error);
    },
);

/**
 * Laravel reports validation failures as 422 with a field keyed bag, and
 * everything else as a message. This turns either into one line worth showing.
 */
export function errorMessage(error: unknown, fallback = 'Something went wrong.'): string {
    if (!axios.isAxiosError(error)) {
        return fallback;
    }

    const data = error.response?.data as
        | { message?: string; errors?: Record<string, string[]> }
        | undefined;

    const firstFieldError = data?.errors
        ? Object.values(data.errors)[0]?.[0]
        : undefined;

    if (firstFieldError) {
        return firstFieldError;
    }

    if (data?.message) {
        return data.message;
    }

    if (error.code === 'ECONNABORTED' || error.message === 'Network Error') {
        return 'We cannot reach the shop right now. Check your connection.';
    }

    return fallback;
}

export default apiClient;
