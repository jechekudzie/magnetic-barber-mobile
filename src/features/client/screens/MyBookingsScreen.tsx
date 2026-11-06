import { useState } from 'react';
import { Alert, Pressable, View } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { cancelBooking, fetchMyBookings } from '@api/bookings';
import { errorMessage } from '@api/client';
import { Screen } from '@shared/components/Screen';
import { EmptyState, ErrorState, Loading } from '@shared/components/States';
import { Body, Gold, Heading, Muted, Title } from '@shared/components/Text';
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
}: {
    appointment: Appointment;
    onCancel: () => void;
    cancelling: boolean;
}) {
    return (
        <View className="mb-3 rounded-2xl border border-white/10 bg-panel p-5">
            <View className="flex-row items-start justify-between">
                <View className="flex-1 pr-3">
                    <Heading>{appointment.when_label}</Heading>
                    <Muted className="mt-1">
                        {appointment.services?.map((s) => s.name).join(', ')}
                    </Muted>
                </View>

                <Gold className="text-lg font-semibold">{appointment.total.formatted}</Gold>
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
                    className="mt-4 self-start rounded-lg border border-stop px-4 py-2"
                >
                    <Body className="text-sm text-stop">
                        {cancelling ? 'Cancelling…' : 'Cancel this booking'}
                    </Body>
                </Pressable>
            ) : null}
        </View>
    );
}

export function MyBookingsScreen() {
    const queryClient = useQueryClient();
    const [scope, setScope] = useState<'upcoming' | 'past'>('upcoming');

    const bookings = useQuery({
        queryKey: ['my-bookings', scope],
        queryFn: () => fetchMyBookings(scope),
        staleTime: 1000 * 60,
    });

    const cancel = useMutation({
        mutationFn: (id: string) => cancelBooking(id),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['my-bookings'] }),
        onError: (caught) => Alert.alert('We could not cancel that', errorMessage(caught)),
    });

    return (
        <Screen>
            <Title>Your bookings</Title>

            <View className="mb-6 mt-4 flex-row rounded-xl border border-white/10 bg-panel p-1">
                {(['upcoming', 'past'] as const).map((option) => (
                    <Pressable
                        key={option}
                        accessibilityRole="button"
                        accessibilityState={{ selected: scope === option }}
                        onPress={() => setScope(option)}
                        className={`flex-1 items-center rounded-lg py-2.5 ${
                            scope === option ? 'bg-gold' : ''
                        }`}
                    >
                        <Body
                            className={`text-sm capitalize ${
                                scope === option ? 'text-ink font-semibold' : 'text-smoke'
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
            ) : bookings.data.length === 0 ? (
                <EmptyState
                    title={scope === 'upcoming' ? 'Nothing booked yet' : 'No past visits'}
                    body={
                        scope === 'upcoming'
                            ? 'Pick a service and a time, and the chair is yours.'
                            : 'Your finished visits will show up here.'
                    }
                />
            ) : (
                bookings.data.map((appointment) => (
                    <BookingCard
                        key={appointment.id}
                        appointment={appointment}
                        cancelling={cancel.isPending && cancel.variables === appointment.id}
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
