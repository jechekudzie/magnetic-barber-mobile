import { View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Gift, Minus, Plus } from 'lucide-react-native';

import { fetchLoyalty } from '@api/bookings';
import { errorMessage } from '@api/client';
import type { ClientStackProps } from '@navigation/types';
import { Button } from '@shared/components/Button';
import { Panel } from '@shared/components/Panel';
import { Screen, ScreenHeader } from '@shared/components/Screen';
import { EmptyState, ErrorState, Loading } from '@shared/components/States';
import { Body, Eyebrow, Figure, Heading, Muted, Strong } from '@shared/components/Text';
import { COLORS } from '@theme/fonts';
import { useAuthStore } from '@stores/auth';

/**
 * Points, and what earned them.
 *
 * The balance alone invites the question "from what?", and a client asking
 * that at the desk is a receptionist's problem rather than an answer. So the
 * ledger is on the same screen, in the shop's own words, with the booking
 * reference against each line.
 *
 * Nothing here spends points. They come off a bill during booking, where
 * there is a bill to take them off.
 */
export function LoyaltyScreen({ navigation }: ClientStackProps<'Loyalty'>) {
    const user = useAuthStore((state) => state.user);
    const token = useAuthStore((state) => state.token);
    const signedIn = Boolean(token && user && !user.is_staff);

    const loyalty = useQuery({
        queryKey: ['loyalty'],
        queryFn: fetchLoyalty,
        enabled: signedIn,
        staleTime: 1000 * 60,
    });

    if (!signedIn) {
        return (
            <Screen topBar={{ title: 'Points', onBack: () => navigation.goBack() }}>
                <ScreenHeader eyebrow="Loyalty" title="Every cut counts" />

                <Panel className="px-5 py-6">
                    <Strong>Points build with each visit</Strong>
                    <Muted className="mt-1.5 leading-5">
                        Sign in and they start adding up from your next cut. Enough of them come
                        off the bill.
                    </Muted>
                    <Button
                        label="Sign in"
                        className="mt-6"
                        onPress={() => navigation.navigate('ClientLogin')}
                    />
                </Panel>
            </Screen>
        );
    }

    if (loyalty.isPending) {
        return (
            <Screen topBar={{ title: 'Points' }}>
                <Loading label="Counting them up" />
            </Screen>
        );
    }

    if (loyalty.isError) {
        return (
            <Screen topBar={{ title: 'Points' }}>
                <ErrorState
                    message={errorMessage(loyalty.error)}
                    onRetry={() => void loyalty.refetch()}
                />
            </Screen>
        );
    }

    const { data, history } = loyalty.data;
    const progress = data.threshold > 0 ? Math.min(1, data.points / data.threshold) : 0;

    return (
        <Screen
            topBar={{ title: 'Points', onBack: () => navigation.goBack() }}
            onRefresh={() => void loyalty.refetch()}
            refreshing={loyalty.isRefetching}
        >
            <ScreenHeader eyebrow="Loyalty" title="Your points" />

            <Panel accent className="items-center px-6 py-7">
                <Figure className="text-[56px] leading-[58px]">{data.points}</Figure>
                <Muted className="mt-1.5">worth {data.value.formatted} off a bill</Muted>

                {data.redeemable ? (
                    <View className="mt-6 w-full items-center rounded-xl border border-go/40 bg-panel-alt px-5 py-4">
                        <View className="flex-row items-center">
                            <Gift size={16} color={COLORS.go} />
                            <Strong className="ml-2 text-go">Ready to spend</Strong>
                        </View>
                        <Muted className="mt-1.5 text-center leading-5">
                            Take {data.reward.formatted} off your next cut. Choose it when you
                            book.
                        </Muted>
                    </View>
                ) : (
                    <View className="mt-6 w-full">
                        <View className="h-1.5 overflow-hidden rounded-full bg-panel-alt">
                            <View
                                className="h-full rounded-full bg-gold"
                                style={{ width: `${Math.round(progress * 100)}%` }}
                            />
                        </View>
                        <Muted className="mt-3 text-center leading-5">
                            {data.to_next} more point{data.to_next === 1 ? '' : 's'} and{' '}
                            {data.reward.formatted} comes off a bill.
                        </Muted>
                    </View>
                )}
            </Panel>

            <Button
                label="Book a cut"
                className="mt-5"
                onPress={() => navigation.navigate('Tabs', { screen: 'Book' } as never)}
            />

            <Heading className="mb-3 mt-9">How you got here</Heading>

            {history.length === 0 ? (
                <EmptyState
                    title="Nothing yet"
                    body="Points land when a visit is finished, not when it is booked."
                />
            ) : (
                history.map((line) => {
                    const earned = line.points >= 0;

                    return (
                        <Panel key={line.id} className="mb-2 px-5 py-4">
                            <View className="flex-row items-center">
                                <View
                                    className={`mr-4 h-9 w-9 items-center justify-center rounded-full ${
                                        earned ? 'bg-go/15' : 'bg-gold/15'
                                    }`}
                                >
                                    {earned ? (
                                        <Plus size={16} color={COLORS.go} />
                                    ) : (
                                        <Minus size={16} color={COLORS.gold} />
                                    )}
                                </View>

                                <View className="flex-1 pr-3">
                                    <Body className="text-sm">
                                        {line.description ??
                                            (earned ? 'Points earned' : 'Points spent')}
                                    </Body>
                                    {line.reference ? (
                                        <Muted className="mt-1">{line.reference}</Muted>
                                    ) : null}
                                </View>

                                <Strong className={earned ? 'text-go' : 'text-gold'}>
                                    {earned ? '+' : ''}
                                    {line.points}
                                </Strong>
                            </View>
                        </Panel>
                    );
                })
            )}

            <Muted className="mt-6 text-center text-xs leading-5">
                Points are added when the shop marks your visit finished.
            </Muted>
        </Screen>
    );
}
