import { useQuery } from '@tanstack/react-query';

import { fetchBranches } from '@api/catalog';

/** "19:00" to "7pm", "08:30" to "8:30am". */
function spoken(time: string): string {
    const [rawHour, rawMinute] = time.split(':').map(Number);

    if (Number.isNaN(rawHour)) {
        return time;
    }

    const suffix = rawHour < 12 ? 'am' : 'pm';
    const hour = rawHour % 12 === 0 ? 12 : rawHour % 12;

    return rawMinute === 0 ? `${hour}${suffix}` : `${hour}:${String(rawMinute).padStart(2, '0')}${suffix}`;
}

/**
 * Whether the shop is open right now, in the words someone would use.
 *
 * Worth the space at the top of a screen because it is the question a client
 * actually has before they set off, and the alternative is reading opening
 * hours and doing the arithmetic themselves.
 *
 * Computed on the device rather than fetched: the branch already carries its
 * hours and timezone, and asking the server what time it is would be a round
 * trip for something the phone knows.
 */
export function useShopStatus(): { open: boolean; label: string } | null {
    const branches = useQuery({ queryKey: ['branches'], queryFn: fetchBranches });
    const branch = branches.data?.[0];

    if (!branch) {
        return null;
    }

    const { opens_at: opens, closes_at: closes, days_open: days, timezone } = branch.hours;

    /*
     * The shop's clock, not the phone's. Somebody checking from another
     * timezone should still be told whether the Avenues shop is open.
     */
    const now = new Date(
        new Date().toLocaleString('en-US', { timeZone: timezone || 'Africa/Harare' }),
    );

    const minutesNow = now.getHours() * 60 + now.getMinutes();
    const [openHour, openMinute] = opens.split(':').map(Number);
    const [closeHour, closeMinute] = closes.split(':').map(Number);

    const opensAt = openHour * 60 + openMinute;
    const closesAt = closeHour * 60 + closeMinute;

    const tradesToday = days.includes(now.getDay());

    if (tradesToday && minutesNow >= opensAt && minutesNow < closesAt) {
        return { open: true, label: `Open until ${spoken(closes)}` };
    }

    if (tradesToday && minutesNow < opensAt) {
        return { open: false, label: `Opens ${spoken(opens)}` };
    }

    // Closed for the day, or closed today entirely. Say when it is worth
    // coming back rather than just "closed".
    const nextDay = days.includes((now.getDay() + 1) % 7);

    return {
        open: false,
        label: nextDay ? `Opens ${spoken(opens)} tomorrow` : 'Closed',
    };
}
