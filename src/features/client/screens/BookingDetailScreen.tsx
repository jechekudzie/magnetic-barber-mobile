import { Alert, Linking, View } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Car, Clock, MapPin, Scissors, User, Wallet } from 'lucide-react-native';

import { cancelBooking, fetchMyBookings } from '@api/bookings';
import { errorMessage } from '@api/client';
import { fetchBranches } from '@api/catalog';
import type { ClientStackProps } from '@navigation/types';
import { Button } from '@shared/components/Button';
import { RateCut } from '@features/client/components/RateCut';
import { Panel } from '@shared/components/Panel';
import { Screen } from '@shared/components/Screen';
import { ErrorState, Loading } from '@shared/components/States';
import { Body, Display, Eyebrow, Figure, Muted, Strong } from '@shared/components/Text';
import { COLORS } from '@theme/fonts';

const STATUS_TONE: Record<string, string> = {
    confirmed: 'text-go',
    checked_in: 'text-go',
    in_progress: 'text-gold',
    completed: 'text-smoke',
    cancelled: 'text-stop',
    no_show: 'text-stop',
    pending: 'text-gold',
};

function Row({
    icon,
    children,
    last = false,
}: {
    icon: React.ReactNode;
    children: React.ReactNode;
    last?: boolean;
}) {
    return (
        <View className={`flex-row px-5 py-5 ${last ? '' : 'border-b border-white/[0.08]'}`}>
            <View className="mt-0.5 mr-4">{icon}</View>
            <View className="min-w-0 flex-1">{children}</View>
        </View>
    );
}

/**
 * One booking, in full.
 *
 * Reached by tapping the next cut on the home screen or any row in the
 * bookings list. It reads from the list query rather than its own endpoint so
 * that cancelling here updates the list behind it without a second round trip
 * — and so the screen cannot show something the list disagrees with.
 */
export function BookingDetailScreen({ navigation, route }: ClientStackProps<'BookingDetail'>) {
    const queryClient = useQueryClient();
    const { id } = route.params;

    const bookings = useQuery({
        queryKey: ['my-bookings', 'all'],
        queryFn: () => fetchMyBookings('all'),
        staleTime: 1000 * 30,
    });

    const branches = useQuery({ queryKey: ['branches'], queryFn: fetchBranches });
    const branch = branches.data?.[0];

    const appointment = bookings.data?.find((row) => row.id === id);

    const cancel = useMutation({
        mutationFn: () => cancelBooking(id),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['my-bookings'] }),
        onError: (caught) => Alert.alert('We could not cancel that', errorMessage(caught)),
    });

    if (bookings.isPending) {
        return (
            <Screen>
                <Loading />
            </Screen>
        );
    }

    if (bookings.isError || !appointment) {
        return (
            <Screen>
                <ErrorState
                    message={
                        bookings.isError
                            ? errorMessage(bookings.error)
                            : 'We cannot find that booking.'
                    }
                    onRetry={() => void bookings.refetch()}
                />
                <Button
                    label="Back"
                    variant="ghost"
                    className="mt-4"
                    onPress={() => navigation.goBack()}
                />
            </Screen>
        );
    }

    const owes = appointment.outstanding?.cents ?? 0;

    return (
        <Screen
            onRefresh={() => void bookings.refetch()}
            refreshing={bookings.isRefetching}
            topBar={{ onBack: () => navigation.goBack() }}
            footer={
                <Button label="Back" variant="secondary" onPress={() => navigation.goBack()} />
            }
        >
            <Eyebrow className="mb-3">Booking</Eyebrow>
            <Display>{appointment.when_label}</Display>

            <View className="mt-4 flex-row items-baseline justify-between">
                <Body className={`${STATUS_TONE[appointment.status] ?? 'text-smoke'}`}>
                    {appointment.status_label}
                </Body>
                <Muted>{appointment.reference}</Muted>
            </View>

            <Panel accent className="mt-6 items-center px-8 py-5">
                <Eyebrow className="text-smoke">Your reference</Eyebrow>
                <Figure className="mt-1.5 text-3xl tracking-[3px]">
                    {appointment.reference}
                </Figure>
            </Panel>

            <View className="mt-6 overflow-hidden rounded-2xl border border-white/[0.08] bg-panel">
                <Row icon={<Clock size={18} color={COLORS.gold} />}>
                    <Strong>{appointment.when_label}</Strong>
                    <Muted className="mt-1">
                        About {appointment.duration_minutes} minutes in the chair
                    </Muted>
                    {appointment.minutes_so_far != null ? (
                        <Muted className="mt-1 text-gold">
                            {appointment.completed_at ? 'Took' : 'Running'}{' '}
                            {appointment.minutes_so_far} minutes
                        </Muted>
                    ) : null}
                </Row>

                {appointment.staff ? (
                    <Row icon={<User size={18} color={COLORS.gold} />}>
                        <Strong>{appointment.staff.name}</Strong>
                        {appointment.staff.title ? (
                            <Muted className="mt-1">{appointment.staff.title}</Muted>
                        ) : null}
                    </Row>
                ) : null}

                <Row icon={<Scissors size={18} color={COLORS.gold} />}>
                    {appointment.services?.map((line) => (
                        <View
                            key={line.name}
                            className="mb-1.5 flex-row items-baseline justify-between"
                        >
                            <Body className="flex-1 pr-3 text-sm">{line.name}</Body>
                            <Muted>{line.price.formatted}</Muted>
                        </View>
                    ))}

                    <View className="mt-3 flex-row items-baseline justify-between border-t border-white/[0.08] pt-3">
                        <Strong className="flex-1 pr-3 text-sm">Total</Strong>
                        <Figure className="text-xl">{appointment.total.formatted}</Figure>
                    </View>
                </Row>

                <Row icon={<Wallet size={18} color={COLORS.gold} />}>
                    <Strong>
                        {appointment.is_paid_in_full
                            ? 'Paid in full'
                            : appointment.is_secured
                              ? 'Payment being checked'
                              : 'Not paid yet'}
                    </Strong>
                    <Muted className="mt-1 leading-5">
                        {appointment.is_paid_in_full
                            ? 'Nothing to settle at the counter.'
                            : appointment.is_secured
                              ? 'Your chair is held while the shop checks it.'
                              : `${appointment.outstanding?.formatted ?? appointment.total.formatted} to pay.`}
                    </Muted>

                    {owes > 0 && appointment.status !== 'cancelled' ? (
                        <Button
                            label="Pay now"
                            variant="secondary"
                            className="mt-4 self-start px-5"
                            onPress={() => navigation.navigate('Pay', { id: appointment.id })}
                        />
                    ) : null}
                </Row>

                {appointment.type === 'house_call' ? (
                    <Row icon={<Car size={18} color={COLORS.gold} />} last>
                        <Strong>We are coming to you</Strong>
                        <Muted className="mt-1 leading-5">
                            The barber will call when they are on the way.
                        </Muted>
                    </Row>
                ) : appointment.branch ? (
                    <Row icon={<MapPin size={18} color={COLORS.gold} />} last>
                        <Strong>{appointment.branch.name}</Strong>
                        <Muted className="mt-1 leading-5">
                            {appointment.branch.address_line}
                            {'\n'}
                            {appointment.branch.area}
                        </Muted>
                        {appointment.branch.map_url ? (
                            <Button
                                label="Get directions"
                                variant="secondary"
                                className="mt-4 self-start px-4"
                                onPress={() => void Linking.openURL(appointment.branch!.map_url!)}
                            />
                        ) : null}
                    </Row>
                ) : null}
            </View>

            {appointment.status === 'completed' ? (
                <RateCut appointmentId={appointment.id} />
            ) : null}

            {appointment.client_note ? (
                <Panel className="mt-4 px-5 py-5">
                    <Eyebrow className="text-smoke">Your note</Eyebrow>
                    <Muted className="mt-2 italic leading-5">{appointment.client_note}</Muted>
                </Panel>
            ) : null}

            {branch?.whatsapp_link ? (
                <Button
                    label="Message the shop"
                    variant="secondary"
                    className="mt-5"
                    onPress={() =>
                        void Linking.openURL(
                            `${branch.whatsapp_link}?text=${encodeURIComponent(
                                `Hi Magnetic, this is about booking ${appointment.reference} on ${appointment.when_label}.`,
                            )}`,
                        )
                    }
                />
            ) : null}

            {appointment.client_may_cancel ? (
                <Button
                    label={cancel.isPending ? 'Cancelling…' : 'Cancel this booking'}
                    variant="danger"
                    className="mt-3"
                    disabled={cancel.isPending}
                    onPress={() =>
                        Alert.alert(
                            'Cancel this booking?',
                            'The slot goes back to the shop straight away.',
                            [
                                { text: 'Keep it', style: 'cancel' },
                                {
                                    text: 'Cancel booking',
                                    style: 'destructive',
                                    onPress: () => cancel.mutate(),
                                },
                            ],
                        )
                    }
                />
            ) : null}
        </Screen>
    );
}
