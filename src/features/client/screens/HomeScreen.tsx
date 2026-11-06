import { useQuery } from '@tanstack/react-query';
import { Linking, View } from 'react-native';
import { ChevronRight, MapPin, Phone } from 'lucide-react-native';

import { fetchMyBookings } from '@api/bookings';
import { fetchBranches } from '@api/catalog';
import type { ClientTabProps } from '@navigation/types';
import { Button } from '@shared/components/Button';
import { LogoLockup } from '@shared/components/Logo';
import { Panel, Stat, StatRow } from '@shared/components/Panel';
import { Screen, ScreenHeader } from '@shared/components/Screen';
import { Body, Eyebrow, Figure, Heading, Muted, Strong } from '@shared/components/Text';
import { COLORS } from '@theme/fonts';
import { useAuthStore } from '@stores/auth';

export function HomeScreen({ navigation }: ClientTabProps<'Home'>) {
    const user = useAuthStore((state) => state.user);
    const token = useAuthStore((state) => state.token);
    const signedIn = Boolean(token && user && !user.is_staff);

    const branches = useQuery({ queryKey: ['branches'], queryFn: fetchBranches });
    const branch = branches.data?.[0];

    const upcoming = useQuery({
        queryKey: ['my-bookings', 'upcoming'],
        queryFn: () => fetchMyBookings('upcoming'),
        enabled: signedIn,
        staleTime: 1000 * 60,
    });

    const next = upcoming.data?.[0];
    const firstName = user?.name.split(' ')[0];

    return (
        <Screen
            onRefresh={() => void branches.refetch()}
            refreshing={branches.isRefetching}
            topBar={{ title: branch?.name, onBell: () => navigation.navigate('Notifications') }}
        >
            {signedIn ? (
                <ScreenHeader eyebrow="Magnetic" title={`Welcome back,\n${firstName}`} />
            ) : (
                <View className="mb-8 items-center pt-6">
                    <LogoLockup width={210} />
                    <Eyebrow className="mt-6">Look good · Feel good · Be you</Eyebrow>
                </View>
            )}

            {signedIn && user?.client ? (
                <Panel className="mb-8 px-5 py-5">
                    <StatRow>
                        <Stat>
                            <Eyebrow className="text-smoke">Points</Eyebrow>
                            <Figure className="mt-1">{user.client.points}</Figure>
                        </Stat>
                        <Stat>
                            <Eyebrow className="text-smoke">Visits</Eyebrow>
                            <Figure className="mt-1 text-bone">{user.client.visit_count}</Figure>
                        </Stat>
                        <Stat>
                            <Eyebrow className="text-smoke">Account</Eyebrow>
                            <Strong className="mt-2">{user.client.account_number}</Strong>
                        </Stat>
                    </StatRow>
                </Panel>
            ) : null}

            <Heading className="mb-3">{signedIn ? 'Your next cut' : 'Book a chair'}</Heading>

            {next ? (
                <Panel
                    accent
                    className="px-5 py-5"
                    onPress={() => navigation.navigate('BookingDetail', { id: next.id })}
                >
                    <View className="flex-row items-start justify-between">
                        <View className="flex-1 pr-3">
                            <Heading>{next.when_label}</Heading>
                            <Muted className="mt-1.5 leading-5">
                                {next.services?.map((s) => s.name).join(', ')}
                            </Muted>
                            {next.staff ? (
                                <Muted className="mt-1">with {next.staff.name}</Muted>
                            ) : null}
                        </View>
                        <ChevronRight size={18} color={COLORS.smoke} />
                    </View>

                    <View className="mt-4 flex-row items-end justify-between border-t border-white/[0.08] pt-4">
                        <View>
                            <Eyebrow className="text-smoke">Reference</Eyebrow>
                            <Strong className="mt-1 tracking-wider">{next.reference}</Strong>
                        </View>
                        <View className="items-end">
                            <Figure>{next.total.formatted}</Figure>
                            <Muted className="mt-0.5">
                                {next.is_paid_in_full
                                    ? 'Paid'
                                    : next.is_secured
                                      ? 'Being checked'
                                      : 'Not paid'}
                            </Muted>
                        </View>
                    </View>
                </Panel>
            ) : (
                <Panel className="px-5 py-5">
                    <Body>
                        {signedIn
                            ? 'Nothing booked. The chair is there when you want it.'
                            : 'Pick a service and a time. No account needed — we make one for you on your first booking.'}
                    </Body>
                    <Button
                        label="Book a chair"
                        onPress={() => navigation.navigate('Book')}
                        className="mt-5"
                    />
                </Panel>
            )}

            {!signedIn ? (
                <Panel className="mt-3 px-5 py-5">
                    <Strong>Been here before?</Strong>
                    <Muted className="mt-1.5 leading-5">
                        Sign in with your number to see your bookings and your points.
                    </Muted>
                    <Button
                        label="Sign in"
                        variant="secondary"
                        onPress={() => navigation.navigate('ClientLogin', { then: 'Bookings' })}
                        className="mt-5"
                    />
                </Panel>
            ) : null}

            {branch ? (
                <>
                    <Heading className="mb-3 mt-9">Finding us</Heading>

                    <Panel className="px-5 py-5">
                        <View className="flex-row">
                            <MapPin size={16} color={COLORS.gold} />
                            <View className="ml-3 flex-1">
                                <Body>{branch.address.line}</Body>
                                <Muted className="mt-1 leading-5">{branch.address.area}</Muted>
                            </View>
                        </View>

                        <View className="mt-4 flex-row items-center">
                            <Phone size={16} color={COLORS.gold} />
                            <Body className="ml-3">{branch.phone_display}</Body>
                        </View>

                        <View className="mt-5 flex-row">
                            <Button
                                label="Open in Maps"
                                variant="secondary"
                                className="flex-1"
                                onPress={() => {
                                    if (branch.address.map_url) {
                                        void Linking.openURL(branch.address.map_url);
                                    }
                                }}
                            />
                            {branch.whatsapp_link ? (
                                <Button
                                    label="WhatsApp"
                                    variant="secondary"
                                    className="ml-2 flex-1"
                                    onPress={() => void Linking.openURL(branch.whatsapp_link!)}
                                />
                            ) : null}
                        </View>
                    </Panel>

                    <Muted className="mt-5 text-center leading-5">
                        Open {branch.hours.opens_at}–{branch.hours.closes_at}, Monday to Saturday.
                    </Muted>
                </>
            ) : null}


        </Screen>
    );
}
