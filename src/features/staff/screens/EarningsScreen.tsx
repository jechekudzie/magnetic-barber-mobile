import { useQuery } from '@tanstack/react-query';
import { View } from 'react-native';

import { errorMessage } from '@api/client';
import { fetchEarningsRun, fetchEarningsToday } from '@api/staff';
import { Screen } from '@shared/components/Screen';
import { EmptyState, ErrorState, Loading } from '@shared/components/States';
import { Body, Gold, Heading, Muted, Title } from '@shared/components/Text';

function centsToMoney(cents: number): string {
    const whole = cents / 100;

    return `$${whole % 1 === 0 ? whole.toFixed(0) : whole.toFixed(2)}`;
}

/**
 * A barber's own money. Commission is per service line they personally
 * rendered, and only on visits that actually completed, so "took" and
 * "earned" are deliberately both on screen: the first is the shop's, the
 * second is theirs.
 */
export function EarningsScreen() {
    const today = useQuery({
        queryKey: ['earnings', 'today'],
        queryFn: fetchEarningsToday,
        staleTime: 1000 * 60,
    });

    const run = useQuery({
        queryKey: ['earnings', 'run'],
        queryFn: () => fetchEarningsRun(),
        staleTime: 1000 * 60 * 5,
    });

    if (today.isPending) {
        return (
            <Screen>
                <Loading label="Adding it up" />
            </Screen>
        );
    }

    if (today.isError) {
        return (
            <Screen>
                <ErrorState
                    message={errorMessage(today.error)}
                    onRetry={() => void today.refetch()}
                />
            </Screen>
        );
    }

    return (
        <Screen>
            <Title>Your earnings</Title>
            <Muted className="mb-6 mt-2">{today.data.rate}% of every service you render.</Muted>

            <View className="rounded-2xl border border-gold/40 bg-panel p-5">
                <Muted className="uppercase tracking-wide">Today</Muted>
                <Gold className="mt-1 text-4xl font-bold">{today.data.data.earned.formatted}</Gold>

                <View className="mt-5 flex-row">
                    <View className="flex-1">
                        <Muted className="uppercase tracking-wide">Services</Muted>
                        <Body className="mt-1 text-xl font-semibold">
                            {today.data.data.services}
                        </Body>
                    </View>
                    <View className="flex-1">
                        <Muted className="uppercase tracking-wide">Clients</Muted>
                        <Body className="mt-1 text-xl font-semibold">
                            {today.data.data.clients}
                        </Body>
                    </View>
                    <View className="flex-1">
                        <Muted className="uppercase tracking-wide">Shop took</Muted>
                        <Body className="mt-1 text-xl font-semibold">
                            {today.data.data.took.formatted}
                        </Body>
                    </View>
                </View>
            </View>

            <Heading className="mb-3 mt-8">Last fortnight</Heading>

            {run.isPending ? (
                <Loading />
            ) : run.isError ? (
                <ErrorState message={errorMessage(run.error)} onRetry={() => void run.refetch()} />
            ) : run.data.data.length === 0 ? (
                <EmptyState
                    title="Nothing yet"
                    body="Completed visits show up here the moment they are marked done."
                />
            ) : (
                <>
                    <View className="mb-3 flex-row items-baseline justify-between">
                        <Muted>Total</Muted>
                        <Gold className="text-xl font-semibold">
                            {centsToMoney(run.data.total_cents)}
                        </Gold>
                    </View>

                    {run.data.data.map((day) => (
                        <View
                            key={day.date}
                            className="mb-2 flex-row items-center justify-between rounded-xl border border-white/10 bg-panel px-4 py-4"
                        >
                            <View>
                                <Body>{day.date}</Body>
                                <Muted className="mt-1">
                                    {day.services} service{day.services === 1 ? '' : 's'}
                                </Muted>
                            </View>
                            <Gold className="text-lg font-semibold">{day.earned.formatted}</Gold>
                        </View>
                    ))}
                </>
            )}
        </Screen>
    );
}
