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

export type PaymentMethodOption = {
    value: string;
    label: string;
    needs_proof: boolean;
};

export type PaymentState = {
    due: { cents: number; formatted: string };
    total: { cents: number; formatted: string };
    paid: { cents: number; formatted: string };
    is_secured: boolean;
    methods: PaymentMethodOption[];
    data: Array<{
        id: string;
        method_label: string;
        status: string;
        status_label: string;
        amount: { formatted: string };
        reference: string | null;
        proof_url: string | null;
        rejection_reason: string | null;
        created_at: string | null;
    }>;
};

export async function fetchPaymentState(id: string): Promise<PaymentState> {
    const { data } = await apiClient.get<PaymentState>(`/bookings/${id}/payment`);

    return data;
}

/**
 * Tell the shop you have paid. EcoCash and InnBucks settle somewhere else, so
 * this sends the reference and the screenshot rather than taking the money.
 */
export async function submitPayment(input: {
    id: string;
    method: string;
    amount_cents: number;
    reference: string;
    proofUri?: string | null;
}): Promise<void> {
    const form = new FormData();

    form.append('method', input.method);
    form.append('amount_cents', String(input.amount_cents));
    form.append('reference', input.reference);

    if (input.proofUri) {
        form.append('proof', {
            uri: input.proofUri,
            name: 'proof.jpg',
            type: 'image/jpeg',
        } as unknown as Blob);
    }

    await apiClient.post(`/bookings/${input.id}/payment`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
}

export type LoyaltySummary = {
    data: {
        points: number;
        redeemable: boolean;
        threshold: number;
        value: { cents: number; formatted: string };
        reward: { cents: number; formatted: string };
        to_next: number;
    };
    history: Array<{
        id: number;
        points: number;
        balance_after: number;
        type: string;
        description: string | null;
        reference: string | null;
        at: string | null;
    }>;
};

export async function fetchLoyalty(): Promise<LoyaltySummary> {
    const { data } = await apiClient.get<LoyaltySummary>('/loyalty');

    return data;
}

export type MyReview = { rating: number; comment: string | null; at: string | null } | null;

export async function fetchReview(id: string): Promise<MyReview> {
    const { data } = await apiClient.get<{ data: MyReview }>(`/bookings/${id}/review`);

    return data.data;
}

export async function submitReview(input: {
    id: string;
    rating: number;
    comment?: string;
}): Promise<void> {
    await apiClient.post(`/bookings/${input.id}/review`, {
        rating: input.rating,
        comment: input.comment,
    });
}
