import { useQuery } from '@tanstack/react-query';
import { View } from 'react-native';

import { errorMessage } from '@api/client';
import { fetchBranchEarnings } from '@api/staff';
import { Panel, Stat, StatRow } from '@shared/components/Panel';
import { Screen, ScreenHeader } from '@shared/components/Screen';
import { EmptyState, ErrorState, Loading } from '@shared/components/States';
import { Eyebrow, Figure, Muted, Strong } from '@shared/components/Text';

function centsToMoney(cents: number): string {
    const whole = cents / 100;

    return `$${whole % 1 === 0 ? whole.toFixed(0) : whole.toFixed(2)}`;
}

/**
 * The owner's view of the floor. Only reachable with staff.commission.view,
 * which a barber does not hold: one barber should not be able to price
 * another's day.
 */
export function TeamEarningsScreen() {
    const earnings = useQuery({
        queryKey: ['earnings', 'branch'],
        queryFn: () => fetchBranchEarnings(),
        staleTime: 1000 * 60,
    });

    if (earnings.isPending) {
        return (
            <Screen>
                <Loading label="Adding up the floor" />
            </Screen>
        );
    }

    if (earnings.isError) {
        return (
            <Screen>
                <ErrorState
                    message={errorMessage(earnings.error)}
                    onRetry={() => void earnings.refetch()}
                />
            </Screen>
        );
    }

    const { data, total_earned_cents, total_taken_cents, branch } = earnings.data;

    return (
        <Screen
            onRefresh={() => void earnings.refetch()}
            refreshing={earnings.isRefetching}
            topBar={{ title: branch.name }}
        >
            <ScreenHeader eyebrow={branch.name} title="The floor today" />

            <Panel className="mb-7 px-5 py-5">
                <StatRow>
                    <Stat>
                        <Eyebrow className="text-smoke">Taken</Eyebrow>
                        <Figure className="mt-1 text-bone">
                            {centsToMoney(total_taken_cents)}
                        </Figure>
                    </Stat>
                    <Stat>
                        <Eyebrow className="text-smoke">Commission</Eyebrow>
                        <Figure className="mt-1">{centsToMoney(total_earned_cents)}</Figure>
                    </Stat>
                </StatRow>
            </Panel>

            {data.length === 0 ? (
                <EmptyState
                    title="Nothing completed yet"
                    body="Earnings appear as visits are marked done."
                />
            ) : (
                data.map((row, index) => (
                    <Panel key={row.staff_id} className="mb-2 px-4 py-4">
                        <View className="flex-row items-center">
                            <View className="mr-4 h-9 w-9 items-center justify-center rounded-full bg-panel-alt">
                                <Muted className="font-display text-bone">{index + 1}</Muted>
                            </View>

                            <View className="flex-1 pr-3">
                                <Strong>{row.name}</Strong>
                                <Muted className="mt-1 leading-5">
                                    {row.services} service{row.services === 1 ? '' : 's'} ·{' '}
                                    {row.clients} client{row.clients === 1 ? '' : 's'} ·{' '}
                                    {row.took.formatted} taken
                                </Muted>
                            </View>

                            <Figure className="text-xl">{row.earned.formatted}</Figure>
                        </View>
                    </Panel>
                ))
            )}
        </Screen>
    );
}
