import { useEffect, useState } from 'react';
import { Alert, View } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Clock, Scissors, User, Wallet } from 'lucide-react-native';

import { errorMessage } from '@api/client';
import {
    fetchAppointment,
    finishCut,
    saveStaffNote,
    startCut,
    takePayment,
    updateAppointmentStatus,
} from '@api/staff';
import type { StaffStackProps } from '@navigation/types';
import { Button } from '@shared/components/Button';
import { Field } from '@shared/components/Field';
import { Panel } from '@shared/components/Panel';
import { Screen } from '@shared/components/Screen';
import { ErrorState, Loading } from '@shared/components/States';
import { Body, Display, Eyebrow, Figure, Muted, Strong } from '@shared/components/Text';
import type { AppointmentStatus } from '@shared/types';
import { COLORS } from '@theme/fonts';
import { useAuthStore } from '@stores/auth';

const METHODS: Array<{ value: string; label: string; needsReference: boolean }> = [
    { value: 'cash', label: 'Cash', needsReference: false },
    { value: 'ecocash', label: 'EcoCash', needsReference: true },
    { value: 'innbucks', label: 'InnBucks', needsReference: true },
    { value: 'card', label: 'Card', needsReference: false },
];

function Row({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
    return (
        <View className="flex-row border-b border-white/[0.08] px-5 py-5">
            <View className="mt-0.5 mr-4">{icon}</View>
            <View className="min-w-0 flex-1">{children}</View>
        </View>
    );
}

/**
 * The job a barber works from while somebody is in the chair.
 *
 * Start and Finish are the whole point and are the biggest thing on screen.
 * The clock between them is what the shop learns from — how long a fade
 * actually takes, as opposed to what the catalog guessed — and it is what
 * keeps the chair blocked in the booking grid when a cut runs over.
 */
export function JobScreen({ navigation, route }: StaffStackProps<'Job'>) {
    const queryClient = useQueryClient();
    const permissions = useAuthStore((state) => state.user?.permissions ?? []);
    const { id } = route.params;

    const [note, setNote] = useState('');
    const [noteOpen, setNoteOpen] = useState(false);
    const [payOpen, setPayOpen] = useState(false);
    const [method, setMethod] = useState('cash');
    const [reference, setReference] = useState('');
    const [amount, setAmount] = useState('');
    const [tick, setTick] = useState(0);

    const job = useQuery({
        queryKey: ['appointment', id],
        queryFn: () => fetchAppointment(id),
        staleTime: 1000 * 15,
    });

    const appointment = job.data;
    const running = appointment?.status === 'in_progress';

    // A running cut needs a clock that moves. Once a minute is enough, and
    // costs nothing when nothing is running.
    useEffect(() => {
        if (!running) {
            return;
        }

        const timer = setInterval(() => setTick((value) => value + 1), 30000);

        return () => clearInterval(timer);
    }, [running]);

    useEffect(() => {
        if (appointment?.staff_note && note === '') {
            setNote(appointment.staff_note);
        }
    }, [appointment?.staff_note, note]);

    function refresh() {
        void queryClient.invalidateQueries({ queryKey: ['appointment', id] });
        void queryClient.invalidateQueries({ queryKey: ['diary'] });
        void queryClient.invalidateQueries({ queryKey: ['earnings'] });
    }

    const start = useMutation({
        mutationFn: () => startCut(id),
        onSuccess: refresh,
        onError: (caught) => Alert.alert('Could not start', errorMessage(caught)),
    });

    const finish = useMutation({
        mutationFn: () => finishCut(id),
        onSuccess: () => {
            refresh();
            Alert.alert('Done', 'Logged, and your commission is on it.');
        },
        onError: (caught) => Alert.alert('Could not finish', errorMessage(caught)),
    });

    const setStatus = useMutation({
        mutationFn: (status: AppointmentStatus) => updateAppointmentStatus({ id, status }),
        onSuccess: refresh,
        onError: (caught) => Alert.alert('Could not update', errorMessage(caught)),
    });

    const saveNote = useMutation({
        mutationFn: () => saveStaffNote(id, note),
        onSuccess: () => {
            refresh();
            setNoteOpen(false);
        },
        onError: (caught) => Alert.alert('Could not save', errorMessage(caught)),
    });

    const pay = useMutation({
        mutationFn: () =>
            takePayment({
                id,
                method,
                amount_cents: Math.round(Number(amount) * 100),
                reference: reference.trim() === '' ? undefined : reference.trim(),
            }),
        onSuccess: () => {
            refresh();
            setPayOpen(false);
            setReference('');
            setAmount('');
        },
        onError: (caught) => Alert.alert('Could not record that', errorMessage(caught)),
    });

    if (job.isPending) {
        return (
            <Screen>
                <Loading label="Opening the job" />
            </Screen>
        );
    }

    if (job.isError || !appointment) {
        return (
            <Screen>
                <ErrorState
                    message={errorMessage(job.error, 'We cannot find that job.')}
                    onRetry={() => void job.refetch()}
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

    const finished = appointment.status === 'completed';
    const dead = ['cancelled', 'no_show'].includes(appointment.status);
    const owes = appointment.outstanding?.cents ?? 0;
    const selectedMethod = METHODS.find((m) => m.value === method);

    return (
        <Screen
            onRefresh={() => void job.refetch()}
            refreshing={job.isRefetching}
            topBar={{ onBack: () => navigation.goBack() }}
            footer={
                dead ? (
                    <Button label="Back" variant="secondary" onPress={() => navigation.goBack()} />
                ) : !appointment.started_at ? (
                    <Button
                        label="Start the cut"
                        loading={start.isPending}
                        onPress={() => start.mutate()}
                    />
                ) : !finished ? (
                    <Button
                        label="Finish"
                        loading={finish.isPending}
                        disabled={!permissions.includes('appointment.complete')}
                        onPress={() => finish.mutate()}
                    />
                ) : (
                    <Button label="Back" variant="secondary" onPress={() => navigation.goBack()} />
                )
            }
        >
            <Eyebrow className="mb-3">{appointment.reference}</Eyebrow>
            <Display>{appointment.client?.name ?? 'Walk in'}</Display>
            <Muted className="mt-3">
                {appointment.when_label} · {appointment.status_label}
            </Muted>

            {appointment.started_at && !finished ? (
                <Panel accent className="mt-6 items-center px-5 py-6">
                    <Eyebrow className="text-smoke">
                        {appointment.is_overrunning ? 'Over the slot' : 'In the chair'}
                    </Eyebrow>
                    <Figure
                        className={`mt-1.5 text-[44px] leading-[46px] ${
                            appointment.is_overrunning ? 'text-stop' : ''
                        }`}
                    >
                        {appointment.minutes_so_far ?? 0} min
                    </Figure>
                    <Muted className="mt-1.5">
                        {appointment.duration_minutes} minutes were booked
                    </Muted>
                </Panel>
            ) : null}

            {finished && appointment.minutes_so_far != null ? (
                <Panel className="mt-6 items-center px-5 py-5">
                    <Eyebrow className="text-smoke">Took</Eyebrow>
                    <Figure className="mt-1.5">{appointment.minutes_so_far} min</Figure>
                    <Muted className="mt-1.5">
                        {appointment.duration_minutes} minutes were booked
                    </Muted>
                </Panel>
            ) : null}

            <View className="mt-6 overflow-hidden rounded-2xl border border-white/[0.08] bg-panel">
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

                {appointment.client ? (
                    <Row icon={<User size={18} color={COLORS.gold} />}>
                        <Strong>{appointment.client.name}</Strong>
                        {appointment.client.visit_count != null ? (
                            <Muted className="mt-1">
                                {appointment.client.visit_count} visit
                                {appointment.client.visit_count === 1 ? '' : 's'}
                            </Muted>
                        ) : null}
                        {appointment.client.phone ? (
                            <Muted className="mt-1">{appointment.client.phone}</Muted>
                        ) : null}
                    </Row>
                ) : null}

                <Row icon={<Clock size={18} color={COLORS.gold} />}>
                    <Strong>{appointment.when_label}</Strong>
                    <Muted className="mt-1">{appointment.duration_minutes} minutes booked</Muted>
                </Row>

                <Row icon={<Wallet size={18} color={COLORS.gold} />}>
                    <Strong>
                        {appointment.is_paid_in_full
                            ? 'Paid in full'
                            : appointment.is_secured
                              ? 'Payment awaiting a check'
                              : 'Not paid'}
                    </Strong>
                    {owes > 0 ? (
                        <Muted className="mt-1">
                            {appointment.outstanding?.formatted} outstanding
                        </Muted>
                    ) : null}

                    {owes > 0 && permissions.includes('payment.take') ? (
                        <Button
                            label={payOpen ? 'Close' : 'Take payment'}
                            variant="secondary"
                            className="mt-4 self-start px-5"
                            onPress={() => {
                                setPayOpen((open) => !open);
                                setAmount(((appointment.outstanding?.cents ?? 0) / 100).toFixed(2));
                            }}
                        />
                    ) : null}
                </Row>
            </View>

            {payOpen ? (
                <Panel className="mt-4 px-5 py-5">
                    <Eyebrow className="mb-3 text-smoke">How did they pay?</Eyebrow>

                    <View className="mb-4 flex-row flex-wrap">
                        {METHODS.map((option) => (
                            <Button
                                key={option.value}
                                label={option.label}
                                variant={method === option.value ? 'primary' : 'secondary'}
                                className="mb-2 mr-2 px-4"
                                onPress={() => setMethod(option.value)}
                            />
                        ))}
                    </View>

                    <Field
                        label="Amount"
                        value={amount}
                        onChangeText={setAmount}
                        keyboardType="decimal-pad"
                        placeholder="10.00"
                    />

                    {selectedMethod?.needsReference ? (
                        <Field
                            label="Transaction reference"
                            value={reference}
                            onChangeText={setReference}
                            autoCapitalize="characters"
                            placeholder="MP260101.1234.A56789"
                            hint="Off the client's phone. The desk checks it later."
                        />
                    ) : null}

                    <Button
                        label="Record payment"
                        loading={pay.isPending}
                        disabled={
                            Number(amount) <= 0 ||
                            (selectedMethod?.needsReference === true && reference.trim() === '')
                        }
                        onPress={() => pay.mutate()}
                    />
                </Panel>
            ) : null}

            {appointment.client_note ? (
                <Panel className="mt-4 px-5 py-5">
                    <Eyebrow className="text-smoke">What the client asked for</Eyebrow>
                    <Muted className="mt-2 italic leading-5">{appointment.client_note}</Muted>
                </Panel>
            ) : null}

            {permissions.includes('client.note.write') ? (
                <Panel className="mt-4 px-5 py-5">
                    <Eyebrow className="text-smoke">Your note</Eyebrow>

                    {noteOpen ? (
                        <>
                            <Field
                                label="What should the next barber know?"
                                value={note}
                                onChangeText={setNote}
                                multiline
                                numberOfLines={4}
                                className="mt-3"
                                placeholder="Left side sits lower, took it shorter."
                            />
                            <View className="flex-row">
                                <Button
                                    label="Save"
                                    className="flex-1"
                                    loading={saveNote.isPending}
                                    onPress={() => saveNote.mutate()}
                                />
                                <Button
                                    label="Cancel"
                                    variant="secondary"
                                    className="ml-2 flex-1"
                                    onPress={() => setNoteOpen(false)}
                                />
                            </View>
                        </>
                    ) : (
                        <>
                            <Muted className="mt-2 leading-5">
                                {appointment.staff_note ?? 'Nothing noted yet.'}
                            </Muted>
                            <Button
                                label={appointment.staff_note ? 'Edit note' : 'Add a note'}
                                variant="secondary"
                                className="mt-4 self-start px-5"
                                onPress={() => setNoteOpen(true)}
                            />
                        </>
                    )}
                </Panel>
            ) : null}

            {!finished && !dead && permissions.includes('appointment.no-show') ? (
                <Button
                    label="Mark as no show"
                    variant="danger"
                    className="mt-6"
                    onPress={() =>
                        Alert.alert('No show?', 'The slot goes back to the shop.', [
                            { text: 'Wait', style: 'cancel' },
                            {
                                text: 'No show',
                                style: 'destructive',
                                onPress: () => setStatus.mutate('no_show'),
                            },
                        ])
                    }
                />
            ) : null}
        </Screen>
    );
}
