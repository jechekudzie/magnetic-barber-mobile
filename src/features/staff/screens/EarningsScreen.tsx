import { useQuery } from '@tanstack/react-query';
import { View } from 'react-native';

import { errorMessage } from '@api/client';
import { fetchEarningsRun, fetchEarningsToday } from '@api/staff';
import { Panel, Stat, StatRow } from '@shared/components/Panel';
import { Screen, ScreenHeader } from '@shared/components/Screen';
import { EmptyState, ErrorState, Loading } from '@shared/components/States';
import { Body, Eyebrow, Figure, Heading, Muted } from '@shared/components/Text';

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
        <Screen
            onRefresh={() => void today.refetch()}
            refreshing={today.isRefetching}
            topBar={{ title: 'Your pay' }}
        >
            <ScreenHeader eyebrow="Your pay" title="Earnings">
                <Muted className="mt-3 leading-6">
                    {today.data.rate}% of every service you render, once the visit is done.
                </Muted>
            </ScreenHeader>

            <Panel accent className="px-5 py-6">
                <Eyebrow className="text-smoke">Today</Eyebrow>
                <Figure className="mt-1.5 text-[40px] leading-[42px]">
                    {today.data.data.earned.formatted}
                </Figure>

                <View className="mt-6">
                    <StatRow>
                        <Stat>
                            <Eyebrow className="text-smoke">Services</Eyebrow>
                            <Body className="mt-1.5 font-semibold text-lg">
                                {today.data.data.services}
                            </Body>
                        </Stat>
                        <Stat>
                            <Eyebrow className="text-smoke">Clients</Eyebrow>
                            <Body className="mt-1.5 font-semibold text-lg">
                                {today.data.data.clients}
                            </Body>
                        </Stat>
                        <Stat>
                            <Eyebrow className="text-smoke">Shop took</Eyebrow>
                            <Body className="mt-1.5 font-semibold text-lg">
                                {today.data.data.took.formatted}
                            </Body>
                        </Stat>
                    </StatRow>
                </View>
            </Panel>

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
                    <View className="mb-4 flex-row items-baseline justify-between">
                        <Muted>Total</Muted>
                        <Figure>{centsToMoney(run.data.total_cents)}</Figure>
                    </View>

                    {run.data.data.map((day) => (
                        <Panel key={day.date} className="mb-2 px-4 py-4">
                            <View className="flex-row items-center justify-between">
                                <View>
                                    <Body>{day.date}</Body>
                                    <Muted className="mt-1">
                                        {day.services} service{day.services === 1 ? '' : 's'}
                                    </Muted>
                                </View>
                                <Figure className="text-xl">{day.earned.formatted}</Figure>
                            </View>
                        </Panel>
                    ))}
                </>
            )}
        </Screen>
    );
}
