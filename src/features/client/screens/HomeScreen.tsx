import { useQuery } from '@tanstack/react-query';
import { Linking, View } from 'react-native';
import { MapPin, Phone } from 'lucide-react-native';

import { fetchMyBookings } from '@api/bookings';
import { fetchBranches } from '@api/catalog';
import type { ClientTabProps } from '@navigation/types';
import { Button } from '@shared/components/Button';
import { Screen } from '@shared/components/Screen';
import { Body, Gold, Heading, Muted, Title } from '@shared/components/Text';
import { useAuthStore } from '@stores/auth';

export function HomeScreen({ navigation }: ClientTabProps<'Home'>) {
    const user = useAuthStore((state) => state.user);

    const branches = useQuery({ queryKey: ['branches'], queryFn: fetchBranches });
    const branch = branches.data?.[0];

    const upcoming = useQuery({
        queryKey: ['my-bookings', 'upcoming'],
        queryFn: () => fetchMyBookings('upcoming'),
        staleTime: 1000 * 60,
    });

    const next = upcoming.data?.[0];
    const firstName = user?.name.split(' ')[0] ?? 'there';

    return (
        <Screen>
            <Gold className="text-xs uppercase tracking-[3px]">Magnetic Barbershop</Gold>
            <Title className="mt-2">Welcome back, {firstName}</Title>

            {user?.client ? (
                <View className="mt-6 flex-row rounded-2xl border border-white/10 bg-panel p-5">
                    <View className="flex-1">
                        <Muted className="uppercase tracking-wide">Points</Muted>
                        <Gold className="mt-1 text-2xl font-bold">{user.client.points}</Gold>
                    </View>
                    <View className="flex-1">
                        <Muted className="uppercase tracking-wide">Visits</Muted>
                        <Body className="mt-1 text-2xl font-bold">{user.client.visit_count}</Body>
                    </View>
                    <View className="flex-1">
                        <Muted className="uppercase tracking-wide">Account</Muted>
                        <Body className="mt-1 font-semibold">{user.client.account_number}</Body>
                    </View>
                </View>
            ) : null}

            <Heading className="mb-3 mt-8">Your next cut</Heading>

            {next ? (
                <View className="rounded-2xl border border-gold/40 bg-panel p-5">
                    <Heading>{next.when_label}</Heading>
                    <Muted className="mt-1">{next.services?.map((s) => s.name).join(', ')}</Muted>
                    {next.staff ? <Muted className="mt-1">with {next.staff.name}</Muted> : null}
                    <Gold className="mt-3 text-xl font-semibold">{next.total.formatted}</Gold>
                </View>
            ) : (
                <View className="rounded-2xl border border-white/10 bg-panel p-5">
                    <Body>Nothing booked.</Body>
                    <Muted className="mt-1">The chair is there when you want it.</Muted>
                    <Button
                        label="Book a chair"
                        onPress={() => navigation.navigate('Book')}
                        className="mt-4"
                    />
                </View>
            )}

            {branch ? (
                <>
                    <Heading className="mb-3 mt-8">Finding us</Heading>

                    <View className="rounded-2xl border border-white/10 bg-panel p-5">
                        <View className="flex-row">
                            <MapPin size={16} color="#d9a947" />
                            <View className="ml-3 flex-1">
                                <Body>{branch.address.line}</Body>
                                <Muted className="mt-1">{branch.address.area}</Muted>
                            </View>
                        </View>

                        <View className="mt-4 flex-row">
                            <Phone size={16} color="#d9a947" />
                            <Body className="ml-3">{branch.phone_display}</Body>
                        </View>

                        <Button
                            label="Open in Maps"
                            variant="secondary"
                            onPress={() => {
                                if (branch.address.map_url) {
                                    void Linking.openURL(branch.address.map_url);
                                }
                            }}
                            className="mt-5"
                        />
                    </View>
                </>
            ) : null}
        </Screen>
    );
}
