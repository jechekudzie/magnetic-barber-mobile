import apiClient from '@api/client';
import type { Appointment } from '@shared/types';

export type BookingInput = {
    branch: string;
    service_ids: string[];
    staff?: string | null;
    start: string;
    style?: string | null;
    note?: string | null;
    type: 'scheduled' | 'house_call';
    redeem_points?: boolean;
    address_line?: string;
    area?: string | null;
    directions_note?: string | null;
};

export async function fetchMyBookings(
    scope: 'upcoming' | 'past' | 'all' = 'upcoming',
): Promise<Appointment[]> {
    const { data } = await apiClient.get<{ data: Appointment[] }>('/bookings', {
        params: { scope },
    });

    return data.data;
}

/**
 * Book without an account, as the website does. The account is created by
 * this first booking, and a number we have seen before lands on its existing
 * record rather than starting a second file.
 */
export async function createGuestBooking(
    input: BookingInput & { name: string; phone: string },
): Promise<{ appointment: Appointment; isReturningClient: boolean }> {
    const { data } = await apiClient.post<{
        data: Appointment;
        meta: { is_returning_client: boolean };
    }>('/bookings/guest', input);

    return { appointment: data.data, isReturningClient: data.meta.is_returning_client };
}

export async function createBooking(input: BookingInput): Promise<Appointment> {
    const { data } = await apiClient.post<{ data: Appointment }>('/bookings', input);

    return data.data;
}

export async function cancelBooking(id: string, reason?: string): Promise<Appointment> {
    const { data } = await apiClient.post<{ data: Appointment }>(`/bookings/${id}/cancel`, {
        reason,
    });

    return data.data;
}
