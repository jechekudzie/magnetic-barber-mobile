import { useMemo } from 'react';
import { View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { CalendarClock, CircleAlert, CircleCheck, Wallet } from 'lucide-react-native';

import { fetchMyBookings } from '@api/bookings';
import { errorMessage } from '@api/client';
import type { ClientStackProps } from '@navigation/types';
import { Panel } from '@shared/components/Panel';
import { Screen } from '@shared/components/Screen';
import { EmptyState, ErrorState, Loading } from '@shared/components/States';
import { Display, Eyebrow, Muted, Strong } from '@shared/components/Text';
import type { Appointment } from '@shared/types';
import { COLORS } from '@theme/fonts';

type Item = {
    id: string;
    icon: React.ReactNode;
    title: string;
    body: string;
    when: string;
    bookingId: string;
};

/**
 * What the shop would tell this client if it could reach them.
 *
 * Derived from their own bookings rather than read from a notifications
 * table, because there is no such table and inventing one that nothing writes
 * to would be a convincing empty screen rather than a feature.
 *
 * Everything here is real: a cut that is coming up, money the shop is still
 * checking, a payment that did not hold up. When push notifications are
 * wired up, this is the screen they land in.
 */
function buildItems(bookings: Appointment[]): Item[] {
    const items: Item[] = [];

    for (const booking of bookings) {
        if (booking.status === 'cancelled' || booking.status === 'no_show') {
            continue;
        }

        const upcoming = booking.scheduled_start_at
            ? new Date(booking.scheduled_start_at) > new Date()
            : false;

        if (upcoming && booking.status !== 'completed') {
            items.push({
                id: `${booking.id}-when`,
                icon: <CalendarClock size={18} color={COLORS.gold} />,
                title: 'Your next cut',
                body: `${booking.when_label}${
                    booking.staff?.name ? ` with ${booking.staff.name}` : ''
                }. Reference ${booking.reference}.`,
                when: booking.when_label,
                bookingId: booking.id,
            });
        }

        if (upcoming && !booking.is_paid_in_full && !booking.is_secured) {
            items.push({
                id: `${booking.id}-owing`,
                icon: <Wallet size={18} color={COLORS.gold} />,
                title: 'Not paid yet',
                body: `${booking.outstanding.formatted} outstanding on ${booking.reference}. Pay now to hold your chair.`,
                when: booking.when_label,
                bookingId: booking.id,
            });
        }

        if (booking.is_secured && !booking.is_paid_in_full) {
            items.push({
                id: `${booking.id}-checking`,
                icon: <CircleAlert size={18} color={COLORS.gold} />,
                title: 'Payment being checked',
                body: `The shop has your proof for ${booking.reference}. Your chair is held in the meantime.`,
                when: booking.when_label,
                bookingId: booking.id,
            });
        }

        if (booking.is_paid_in_full && booking.status !== 'completed') {
            items.push({
                id: `${booking.id}-paid`,
                icon: <CircleCheck size={18} color={COLORS.go} />,
                title: 'Payment confirmed',
                body: `${booking.reference} is paid in full. Nothing to settle at the counter.`,
                when: booking.when_label,
                bookingId: booking.id,
            });
        }
    }

    return items;
}

export function NotificationsScreen({ navigation }: ClientStackProps<'Notifications'>) {
    const bookings = useQuery({
        queryKey: ['my-bookings', 'all'],
        queryFn: () => fetchMyBookings('all'),
        staleTime: 1000 * 60,
    });

    const items = useMemo(() => buildItems(bookings.data ?? []), [bookings.data]);

    return (
        <Screen
            onRefresh={() => void bookings.refetch()}
            refreshing={bookings.isRefetching}
            topBar={{ onBack: () => navigation.goBack() }}
        >
            <Eyebrow className="mb-3">Magnetic</Eyebrow>
            <Display>Notifications</Display>

            <Muted className="mb-7 mt-3 leading-6">
                What the shop is doing about your bookings.
            </Muted>

            {bookings.isPending ? (
                <Loading />
            ) : bookings.isError ? (
                <ErrorState
                    message={errorMessage(bookings.error)}
                    onRetry={() => void bookings.refetch()}
                />
            ) : items.length === 0 ? (
                <EmptyState
                    title="Nothing needs you"
                    body="Booking reminders and payment updates show up here."
                />
            ) : (
                items.map((item) => (
                    <Panel
                        key={item.id}
                        className="mb-2.5 px-5 py-5"
                        onPress={() =>
                            navigation.navigate('BookingDetail', { id: item.bookingId })
                        }
                    >
                        <View className="flex-row">
                            <View className="mt-0.5 mr-4">{item.icon}</View>
                            <View className="min-w-0 flex-1">
                                <Strong>{item.title}</Strong>
                                <Muted className="mt-1.5 leading-5">{item.body}</Muted>
                            </View>
                        </View>
                    </Panel>
                ))
            )}

            <Muted className="mt-6 text-center text-xs leading-5">
                These only appear while the app is open. Push notifications to your phone are
                not switched on yet.
            </Muted>
        </Screen>
    );
}
