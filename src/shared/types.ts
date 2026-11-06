/**
 * The shapes the API actually returns. Kept deliberately close to the Laravel
 * resources: MeResource, AppointmentResource, ServiceResource.
 */

export type Money = {
    cents: number;
    currency: string;
    amount: number;
    formatted: string;
};

export type Branch = {
    id: string;
    slug: string;
    name: string;
    timezone: string;
    is_primary: boolean;
};

export type Me = {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
    phone_display: string | null;
    avatar_url: string | null;
    locale: string;
    is_staff: boolean;
    roles: string[];
    permissions: string[];
    branches: Branch[];
    staff?: {
        display_name: string;
        title: string | null;
        is_bookable: boolean;
        accepts_house_calls: boolean;
        photo_url: string | null;
    } | null;
    client?: {
        account_number: string;
        visit_count: number;
        last_visit_at: string | null;
        referral_code: string;
        points: number;
    } | null;
};

/** Which printed price card a service appears on. */
export type Audience = 'men' | 'women' | 'unisex' | 'kids';

export type Service = {
    id: string;
    slug: string;
    name: string;
    description: string | null;
    audience: Audience;
    duration_minutes: number;
    price: Money | null;
    is_free: boolean;
    /** "From $20, depending with colour" — the price is a starting figure. */
    is_from_price: boolean;
    requires_patch_test: boolean;
    patch_test_lead_hours: number | null;
    is_skin_service: boolean;
    is_house_call_eligible: boolean;
    is_featured: boolean;
};

export type ServiceCategory = {
    id: string;
    slug: string;
    name: string;
    tagline: string | null;
    description: string | null;
    icon: string | null;
    services?: Service[];
};

export type AppointmentStatus =
    | 'pending'
    | 'confirmed'
    | 'checked_in'
    | 'in_progress'
    | 'completed'
    | 'cancelled'
    | 'no_show';

export type Appointment = {
    id: string;
    reference: string;
    status: AppointmentStatus;
    status_label: string;
    type: 'walkin' | 'scheduled' | 'house_call';
    scheduled_start_at: string | null;
    scheduled_end_at: string | null;
    when_label: string;
    duration_minutes: number;
    total: Money;
    travel_fee: Money;
    amount_paid: Money;
    outstanding: Money;
    /** The chair is spoken for: money claimed, maybe not yet checked. */
    is_secured: boolean;
    /** The shop actually has the money. */
    is_paid_in_full: boolean;
    /** What the barber's own clock says. Live while a cut is running. */
    minutes_so_far: number | null;
    is_overrunning: boolean;
    started_at: string | null;
    completed_at: string | null;
    client_note: string | null;
    staff_note: string | null;
    client_may_cancel?: boolean;
    client?: {
        name: string;
        /** Null unless the reader may see client contact details. */
        phone: string | null;
        visit_count: number | null;
    } | null;
    branch?: {
        slug: string;
        name: string;
        address_line: string | null;
        area: string | null;
        map_url: string | null;
    };
    staff?: { name: string; title: string | null } | null;
    services?: Array<{ name: string; duration_minutes: number; price: Money }>;
};

export type AvailabilitySlot = {
    start: string;
    label: string;
};

export type Availability = {
    date: string;
    duration_minutes: number;
    /** True when the branch prices nothing yet, so the grid is a guess. */
    provisional: boolean;
    /** Nothing bookable that day. `reason` says why, in words to show. */
    closed: boolean;
    reason: string | null;
    any_staff: AvailabilitySlot[];
    staff: Array<{
        /** Null when the branch has no bookable staff configured. */
        id: string | null;
        name: string;
        slots: AvailabilitySlot[];
    }>;
};

export type EarningsDay = {
    date: string;
    services: number;
    clients: number;
    earned: Money;
    took: Money;
};

export type EarningsRun = {
    from: string;
    to: string;
    rate: number;
    total_cents: number;
    data: Array<{ date: string; services: number; earned: Money }>;
};

export type BranchEarnings = {
    date: string;
    branch: { slug: string; name: string };
    total_earned_cents: number;
    total_taken_cents: number;
    data: Array<{
        staff_id: string;
        name: string;
        services: number;
        clients: number;
        earned: Money;
        took: Money;
    }>;
};

export type Diary = {
    date: string;
    branch: { slug: string; name: string };
    counts: {
        total: number;
        confirmed: number;
        in_progress: number;
        completed: number;
        cancelled: number;
    };
    data: Appointment[];
};

/**
 * A numbered look from the gallery.
 *
 * The code is the point: a client says "number 03" and every barber cuts the
 * same thing. It is carried as a string because "01" is not 1.
 */
export type Style = {
    id: string;
    slug: string;
    code: string;
    name: string;
    description: string | null;
    gender_tag: Audience;
    gender_label: string;
    hair_type_tag: string[];
    typical_duration_minutes: number;
    image_url: string | null;
    is_featured: boolean;
    service: Service | null;
};
