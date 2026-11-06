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
