import apiClient from '@api/client';
import type { Me } from '@shared/types';

export type StartResponse = {
    message: string;
    expires_in_minutes: number;
    /**
     * Present only while no channel actually delivers the code, so the flow
     * works before the shop has an SMS account. Null in production.
     */
    code: string | null;
    is_registered: boolean;
};

export async function startClientLogin(phone: string): Promise<StartResponse> {
    const { data } = await apiClient.post<StartResponse>('/auth/client/start', { phone });

    return data;
}

export async function verifyClientLogin(input: {
    phone: string;
    code: string;
    name?: string;
}): Promise<{ token: string; user: Me }> {
    const { data } = await apiClient.post<{ token: string; user: Me }>(
        '/auth/client/verify',
        input,
    );

    return data;
}

export async function registerClient(input: {
    name: string;
    phone: string;
    email?: string;
    password: string;
}): Promise<{ token: string; user: Me }> {
    const { data } = await apiClient.post<{ token: string; user: Me }>(
        '/auth/client/register',
        input,
    );

    return data;
}

/** An email or a phone number, plus a password. */
export async function clientLogin(input: {
    identifier: string;
    password: string;
}): Promise<{ token: string; user: Me }> {
    const { data } = await apiClient.post<{ token: string; user: Me }>(
        '/auth/client/login',
        input,
    );

    return data;
}

export async function staffLogin(input: {
    identifier: string;
    password: string;
}): Promise<{ token: string; user: Me }> {
    const { data } = await apiClient.post<{ token: string; user: Me }>('/auth/staff/login', {
        ...input,
        device_name: 'magnetic-app',
    });

    return data;
}

export async function signOut(isStaff: boolean): Promise<void> {
    await apiClient.post(isStaff ? '/auth/staff/logout' : '/auth/client/logout');
}

export async function fetchMe(): Promise<Me> {
    const { data } = await apiClient.get<{ data: Me }>('/me');

    return data.data;
}

export async function updateProfile(input: {
    name?: string;
    email?: string | null;
    phone?: string;
}): Promise<Me> {
    const { data } = await apiClient.put<{ data: Me }>('/me', input);

    return data.data;
}

/**
 * The current password is required even though we already hold a token: a
 * handset left unlocked on the counter should not be enough to lock its owner
 * out. Every other device is signed out as a result.
 */
export async function changePassword(input: {
    current_password: string;
    password: string;
    password_confirmation: string;
}): Promise<{ message: string }> {
    const { data } = await apiClient.put<{ message: string }>('/me/password', input);

    return data;
}
