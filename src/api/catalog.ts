import apiClient from '@api/client';
import type { Availability, ServiceCategory, Style } from '@shared/types';

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

/**
 * The first day the shop can actually take these services.
 *
 * The picker opens here rather than on today, because the shop shuts at 19:00
 * and from about six o'clock there is nowhere left to put a cut — landing a
 * client on an empty grid reads as a broken app rather than a closed shop.
 */
export async function fetchFirstBookableDate(input: {
    branch: string;
    serviceIds: string[];
}): Promise<{ date: string | null; today: string; has_availability: boolean }> {
    const { data } = await apiClient.get<{
        date: string | null;
        today: string;
        has_availability: boolean;
    }>('/availability/first', {
        params: { branch: input.branch, service_ids: input.serviceIds },
    });

    return data;
}

export type TeamMember = {
    id: string;
    slug: string;
    name: string;
    title: string | null;
    specialities: string[];
    photo_url: string | null;
    accepts_house_calls: boolean;
    is_bookable: boolean;
};

/** The barbers a client may ask for by name. */
export async function fetchTeam(): Promise<TeamMember[]> {
    const { data } = await apiClient.get<{ data: TeamMember[] }>('/team');

    return data.data.filter((member) => member.is_bookable);
}

export async function fetchStyles(): Promise<Style[]> {
    const { data } = await apiClient.get<{ data: Style[] }>('/styles');

    return data.data;
}
