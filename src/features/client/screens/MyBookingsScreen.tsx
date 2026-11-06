import { useState } from 'react';
import { Alert, Pressable, View } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { Button } from '@shared/components/Button';
import type { ClientTabProps } from '@navigation/types';
import { useAuthStore } from '@stores/auth';

import { cancelBooking, fetchMyBookings } from '@api/bookings';
import { errorMessage } from '@api/client';
import { Panel } from '@shared/components/Panel';
import { Screen, ScreenHeader } from '@shared/components/Screen';
import { EmptyState, ErrorState, Loading } from '@shared/components/States';
import { Body, Figure, Heading, Muted, Strong } from '@shared/components/Text';
import type { Appointment } from '@shared/types';

const STATUS_TONE: Record<string, string> = {
    confirmed: 'text-go',
    checked_in: 'text-go',
    in_progress: 'text-gold',
    completed: 'text-smoke',
    cancelled: 'text-stop',
    no_show: 'text-stop',
    pending: 'text-gold',
};

function BookingCard({
    appointment,
    onCancel,
    cancelling,
    onOpen,
}: {
    appointment: Appointment;
    onCancel: () => void;
    cancelling: boolean;
    onOpen: () => void;
}) {
    return (
        <Panel className="mb-3 px-5 py-5" onPress={onOpen}>
            <View className="flex-row items-start justify-between">
                <View className="flex-1 pr-3">
                    <Heading>{appointment.when_label}</Heading>
                    <Muted className="mt-1.5 leading-5">
                        {appointment.services?.map((s) => s.name).join(', ')}
                    </Muted>
                </View>

                <Figure className="text-xl">{appointment.total.formatted}</Figure>
            </View>

            <View className="mt-3 flex-row items-center justify-between">
                <Body className={`text-sm ${STATUS_TONE[appointment.status] ?? 'text-smoke'}`}>
                    {appointment.status_label}
                </Body>
                <Muted>{appointment.reference}</Muted>
            </View>

            {appointment.staff ? (
                <Muted className="mt-2">with {appointment.staff.name}</Muted>
            ) : null}

            {appointment.client_may_cancel ? (
                <Pressable
                    accessibilityRole="button"
                    disabled={cancelling}
                    onPress={onCancel}
                    className="mt-4 self-start rounded-lg border border-stop px-4 py-2.5"
                >
                    <Body className="text-sm text-stop">
                        {cancelling ? 'Cancelling…' : 'Cancel this booking'}
                    </Body>
                </Pressable>
            ) : null}
        </Panel>
    );
}

export function MyBookingsScreen({ navigation }: ClientTabProps<'Bookings'>) {
    const queryClient = useQueryClient();
    const [scope, setScope] = useState<'upcoming' | 'past'>('upcoming');

    const user = useAuthStore((state) => state.user);
    const token = useAuthStore((state) => state.token);
    const signedIn = Boolean(token && user && !user.is_staff);

    const bookings = useQuery({
        queryKey: ['my-bookings', scope],
        queryFn: () => fetchMyBookings(scope),
        enabled: signedIn,
        staleTime: 1000 * 60,
    });

    const cancel = useMutation({
        mutationFn: (id: string) => cancelBooking(id),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['my-bookings'] }),
        onError: (caught) => Alert.alert('We could not cancel that', errorMessage(caught)),
    });

    if (!signedIn) {
        return (
            <Screen>
                <ScreenHeader eyebrow="Your bookings" title="Sign in to see them" />

                <Panel className="px-5 py-6">
                    <Strong>Booking does not need an account</Strong>
                    <Muted className="mt-1.5 leading-5">
                        But reading and cancelling one does, so nobody else can read yours. Sign
                        in with the number you booked on and everything will be here.
                    </Muted>
                    <Button
                        label="Sign in with my number"
                        className="mt-6"
                        onPress={() => navigation.navigate('ClientLogin')}
                    />
                </Panel>
            </Screen>
        );
    }

    return (
        <Screen
            onRefresh={() => void bookings.refetch()}
            refreshing={bookings.isRefetching}
            topBar={{ onBell: () => navigation.navigate('Notifications') }}
        >
            <ScreenHeader eyebrow="Magnetic" title="Your bookings" />

            <View className="mb-6 flex-row rounded-xl border border-white/[0.08] bg-panel p-1">
                {(['upcoming', 'past'] as const).map((option) => (
                    <Pressable
                        key={option}
                        accessibilityRole="button"
                        accessibilityState={{ selected: scope === option }}
                        onPress={() => setScope(option)}
                        className={`flex-1 items-center rounded-lg py-3 ${
                            scope === option ? 'bg-gold' : ''
                        }`}
                    >
                        <Body
                            className={`text-sm capitalize ${
                                scope === option ? 'font-semibold text-ink' : 'text-smoke'
                            }`}
                        >
                            {option}
                        </Body>
                    </Pressable>
                ))}
            </View>

            {bookings.isPending ? (
                <Loading />
            ) : bookings.isError ? (
                <ErrorState
                    message={errorMessage(bookings.error)}
                    onRetry={() => void bookings.refetch()}
                />
            ) : (bookings.data ?? []).length === 0 ? (
                <EmptyState
                    title={scope === 'upcoming' ? 'Nothing booked yet' : 'No past visits'}
                    body={
                        scope === 'upcoming'
                            ? 'Pick a service and a time, and the chair is yours.'
                            : 'Your finished visits will show up here.'
                    }
                />
            ) : (
                (bookings.data ?? []).map((appointment) => (
                    <BookingCard
                        key={appointment.id}
                        appointment={appointment}
                        cancelling={cancel.isPending && cancel.variables === appointment.id}
                        onOpen={() =>
                            navigation.navigate('BookingDetail', { id: appointment.id })
                        }
                        onCancel={() =>
                            Alert.alert(
                                'Cancel this booking?',
                                'The slot goes back to the shop straight away.',
                                [
                                    { text: 'Keep it', style: 'cancel' },
                                    {
                                        text: 'Cancel booking',
                                        style: 'destructive',
                                        onPress: () => cancel.mutate(appointment.id),
                                    },
                                ],
                            )
                        }
                    />
                ))
            )}
        </Screen>
    );
}
