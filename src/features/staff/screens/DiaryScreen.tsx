import { Alert, Pressable, View } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { errorMessage } from '@api/client';
import { fetchDiary, updateAppointmentStatus } from '@api/staff';
import { Screen } from '@shared/components/Screen';
import { EmptyState, ErrorState, Loading } from '@shared/components/States';
import { Body, Gold, Heading, Muted, Title } from '@shared/components/Text';
import type { Appointment, AppointmentStatus } from '@shared/types';
import { useAuthStore } from '@stores/auth';

/**
 * What a booking can become next, and which permission that move needs.
 *
 * The server checks all of this again — this only decides what to draw. A
 * barber holds appointment.complete but not appointment.cancel, so they see
 * "Done" and never see "Cancel".
 */
const MOVES: Array<{
    to: AppointmentStatus;
    label: string;
    from: AppointmentStatus[];
    permission: string;
    destructive?: boolean;
}> = [
    { to: 'checked_in', label: 'Checked in', from: ['confirmed', 'pending'], permission: 'appointment.checkin' },
    { to: 'in_progress', label: 'In the chair', from: ['checked_in', 'confirmed'], permission: 'appointment.update' },
    { to: 'completed', label: 'Done', from: ['in_progress', 'checked_in'], permission: 'appointment.complete' },
    { to: 'no_show', label: 'No show', from: ['confirmed', 'checked_in', 'pending'], permission: 'appointment.no-show', destructive: true },
    { to: 'cancelled', label: 'Cancel', from: ['confirmed', 'pending', 'checked_in'], permission: 'appointment.cancel', destructive: true },
];

function DiaryCard({
    appointment,
    permissions,
    onMove,
    busy,
}: {
    appointment: Appointment;
    permissions: string[];
    onMove: (status: AppointmentStatus) => void;
    busy: boolean;
}) {
    const moves = MOVES.filter(
        (move) =>
            move.from.includes(appointment.status) && permissions.includes(move.permission),
    );

    return (
        <View className="mb-3 rounded-2xl border border-white/10 bg-panel p-5">
            <View className="flex-row items-start justify-between">
                <View className="flex-1 pr-3">
                    <Heading>{appointment.when_label}</Heading>
                    <Muted className="mt-1">
                        {appointment.services?.map((s) => s.name).join(', ')}
                    </Muted>
                    {appointment.staff ? (
                        <Muted className="mt-1">{appointment.staff.name}</Muted>
                    ) : null}
                </View>

                <View className="items-end">
                    <Gold className="text-lg font-semibold">{appointment.total.formatted}</Gold>
                    <Muted className="mt-1">{appointment.status_label}</Muted>
                </View>
            </View>

            {appointment.client_note ? (
                <Muted className="mt-3 italic">“{appointment.client_note}”</Muted>
            ) : null}

            {moves.length > 0 ? (
                <View className="mt-4 flex-row flex-wrap">
                    {moves.map((move) => (
                        <Pressable
                            key={move.to}
                            accessibilityRole="button"
                            disabled={busy}
                            onPress={() => onMove(move.to)}
                            className={`mb-2 mr-2 rounded-lg border px-4 py-2 ${
                                move.destructive ? 'border-stop' : 'border-gold'
                            } ${busy ? 'opacity-50' : ''}`}
                        >
                            <Body
                                className={`text-sm ${move.destructive ? 'text-stop' : 'text-gold'}`}
                            >
                                {move.label}
                            </Body>
                        </Pressable>
                    ))}
                </View>
            ) : null}
        </View>
    );
}

export function DiaryScreen() {
    const queryClient = useQueryClient();
    const permissions = useAuthStore((state) => state.user?.permissions ?? []);

    const diary = useQuery({
        queryKey: ['diary'],
        queryFn: () => fetchDiary(),
        // A diary is stale the moment somebody walks in.
        staleTime: 1000 * 30,
        refetchInterval: 1000 * 60,
    });

    const move = useMutation({
        mutationFn: (input: { id: string; status: AppointmentStatus }) =>
            updateAppointmentStatus(input),
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: ['diary'] });
            // Completing a visit is what earns the commission.
            await queryClient.invalidateQueries({ queryKey: ['earnings'] });
        },
        onError: (caught) => Alert.alert('That did not go through', errorMessage(caught)),
    });

    if (diary.isPending) {
        return (
            <Screen>
                <Loading label="Opening the diary" />
            </Screen>
        );
    }

    if (diary.isError) {
        return (
            <Screen>
                <ErrorState
                    message={errorMessage(diary.error)}
                    onRetry={() => void diary.refetch()}
                />
            </Screen>
        );
    }

    const { counts, data, branch } = diary.data;

    return (
        <Screen>
            <Gold className="text-xs uppercase tracking-[3px]">{branch.name}</Gold>
            <Title className="mt-2">Today</Title>

            <View className="mb-6 mt-4 flex-row rounded-2xl border border-white/10 bg-panel p-5">
                {[
                    { label: 'Booked', value: counts.total },
                    { label: 'In chair', value: counts.in_progress },
                    { label: 'Done', value: counts.completed },
                ].map((stat) => (
                    <View key={stat.label} className="flex-1">
                        <Muted className="uppercase tracking-wide">{stat.label}</Muted>
                        <Body className="mt-1 text-2xl font-bold">{stat.value}</Body>
                    </View>
                ))}
            </View>

            {data.length === 0 ? (
                <EmptyState title="Nothing booked today" body="A quiet one, or an early finish." />
            ) : (
                data.map((appointment) => (
                    <DiaryCard
                        key={appointment.id}
                        appointment={appointment}
                        permissions={permissions}
                        busy={move.isPending && move.variables?.id === appointment.id}
                        onMove={(status) => move.mutate({ id: appointment.id, status })}
                    />
                ))
            )}
        </Screen>
    );
}
