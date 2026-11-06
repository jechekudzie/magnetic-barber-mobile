import { useQuery } from '@tanstack/react-query';
import { View } from 'react-native';

import { errorMessage } from '@api/client';
import { fetchBranchEarnings } from '@api/staff';
import { Screen } from '@shared/components/Screen';
import { EmptyState, ErrorState, Loading } from '@shared/components/States';
import { Body, Gold, Muted, Title } from '@shared/components/Text';

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
        <Screen>
            <Gold className="text-xs uppercase tracking-[3px]">{branch.name}</Gold>
            <Title className="mt-2">The floor today</Title>

            <View className="mb-6 mt-4 flex-row rounded-2xl border border-white/10 bg-panel p-5">
                <View className="flex-1">
                    <Muted className="uppercase tracking-wide">Taken</Muted>
                    <Body className="mt-1 text-2xl font-bold">
                        {centsToMoney(total_taken_cents)}
                    </Body>
                </View>
                <View className="flex-1">
                    <Muted className="uppercase tracking-wide">Commission</Muted>
                    <Gold className="mt-1 text-2xl font-bold">
                        {centsToMoney(total_earned_cents)}
                    </Gold>
                </View>
            </View>

            {data.length === 0 ? (
                <EmptyState
                    title="Nothing completed yet"
                    body="Earnings appear as visits are marked done."
                />
            ) : (
                data.map((row, index) => (
                    <View
                        key={row.staff_id}
                        className="mb-2 flex-row items-center rounded-xl border border-white/10 bg-panel px-4 py-4"
                    >
                        <View className="mr-4 h-8 w-8 items-center justify-center rounded-full bg-panel-alt">
                            <Muted>{index + 1}</Muted>
                        </View>

                        <View className="flex-1">
                            <Body className="font-semibold">{row.name}</Body>
                            <Muted className="mt-1">
                                {row.services} service{row.services === 1 ? '' : 's'} ·{' '}
                                {row.clients} client{row.clients === 1 ? '' : 's'} ·{' '}
                                {row.took.formatted} taken
                            </Muted>
                        </View>

                        <Gold className="text-lg font-semibold">{row.earned.formatted}</Gold>
                    </View>
                ))
            )}
        </Screen>
    );
}
