import apiClient from '@api/client';
import type { Availability, ServiceCategory } from '@shared/types';

/** Mirrors BranchResource. map_url is nested under address, not top level. */
export type BranchSummary = {
    id: string;
    slug: string;
    code: string;
    name: string;
    tagline: string | null;
    phone: string | null;
    phone_display: string | null;
    whatsapp: string | null;
    whatsapp_link: string | null;
    email: string | null;
    address: {
        line: string | null;
        area: string | null;
        city: string;
        directions_note: string | null;
        latitude: number | null;
        longitude: number | null;
        map_url: string | null;
    };
    hours: {
        timezone: string;
        opens_at: string;
        closes_at: string;
        days_open: number[];
    };
    chair_count: number | null;
    house_call_enabled: boolean;
    house_call_radius_km: number | null;
};

export async function fetchBranches(): Promise<BranchSummary[]> {
    const { data } = await apiClient.get<{ data: BranchSummary[] }>('/branches');

    return data.data;
}

export async function fetchPriceList(branchSlug: string): Promise<ServiceCategory[]> {
    const { data } = await apiClient.get<{ data: ServiceCategory[] }>(
        `/branches/${branchSlug}/services`,
    );

    return data.data;
}

export async function fetchAvailability(input: {
    branch: string;
    date: string;
    serviceIds: string[];
    staff?: string | null;
    type?: 'scheduled' | 'house_call';
}): Promise<Availability> {
    const { data } = await apiClient.get<Availability>('/availability', {
        params: {
            branch: input.branch,
            date: input.date,
            service_ids: input.serviceIds,
            staff: input.staff ?? undefined,
            type: input.type ?? 'scheduled',
        },
    });

    return data;
}
