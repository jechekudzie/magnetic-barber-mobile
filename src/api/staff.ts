import apiClient from '@api/client';
import type {
    Appointment,
    AppointmentStatus,
    BranchEarnings,
    Diary,
    EarningsDay,
    EarningsRun,
} from '@shared/types';

export async function fetchDiary(date?: string): Promise<Diary> {
    const { data } = await apiClient.get<Diary>('/staff/diary', { params: { date } });

    return data;
}

export async function updateAppointmentStatus(input: {
    id: string;
    status: AppointmentStatus;
    reason?: string;
}): Promise<Appointment> {
    const { data } = await apiClient.put<{ data: Appointment }>(
        `/staff/appointments/${input.id}/status`,
        { status: input.status, reason: input.reason },
    );

    return data.data;
}

export async function fetchEarningsToday(): Promise<{ data: EarningsDay; rate: number }> {
    const { data } = await apiClient.get<{ data: EarningsDay; rate: number }>(
        '/staff/earnings/today',
    );

    return data;
}

export async function fetchEarningsRun(params?: {
    from?: string;
    to?: string;
}): Promise<EarningsRun> {
    const { data } = await apiClient.get<EarningsRun>('/staff/earnings', { params });

    return data;
}

export async function fetchBranchEarnings(date?: string): Promise<BranchEarnings> {
    const { data } = await apiClient.get<BranchEarnings>('/staff/earnings/branch', {
        params: { date },
    });

    return data;
}

export async function fetchAppointment(id: string): Promise<Appointment> {
    const { data } = await apiClient.get<{ data: Appointment }>(`/staff/appointments/${id}`);

    return data.data;
}

/** One tap. The clock it starts is what blocks the chair if the cut runs on. */
export async function startCut(id: string): Promise<Appointment> {
    const { data } = await apiClient.put<{ data: Appointment }>(
        `/staff/appointments/${id}/start`,
    );

    return data.data;
}

export async function finishCut(id: string): Promise<Appointment> {
    const { data } = await apiClient.put<{ data: Appointment }>(
        `/staff/appointments/${id}/finish`,
    );

    return data.data;
}

export async function saveStaffNote(id: string, staffNote: string): Promise<Appointment> {
    const { data } = await apiClient.put<{ data: Appointment }>(
        `/staff/appointments/${id}/note`,
        { staff_note: staffNote },
    );

    return data.data;
}

/** The till. Cash and card confirm on the spot; mobile money waits a check. */
export async function takePayment(input: {
    id: string;
    method: string;
    amount_cents: number;
    reference?: string;
}): Promise<{ outstanding: { cents: number; formatted: string } }> {
    const { data } = await apiClient.post<{
        outstanding: { cents: number; formatted: string };
    }>(`/staff/appointments/${input.id}/payments`, {
        method: input.method,
        amount_cents: input.amount_cents,
        reference: input.reference,
    });

    return data;
}
