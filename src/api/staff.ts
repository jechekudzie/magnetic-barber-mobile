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
