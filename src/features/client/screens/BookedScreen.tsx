import { Linking, Share, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Car, Check, Clock, MapPin, Scissors, User } from 'lucide-react-native';

import { fetchBranches } from '@api/catalog';
import type { ClientStackProps } from '@navigation/types';
import { Button } from '@shared/components/Button';
import { Panel } from '@shared/components/Panel';
import { Screen } from '@shared/components/Screen';
import { Body, Display, Eyebrow, Figure, Muted, Strong } from '@shared/components/Text';
import { COLORS } from '@theme/fonts';
import { useAuthStore } from '@stores/auth';

/**
 * One row of the booking slip: an icon in the gold, then the detail.
 */
function Row({
    icon,
    children,
    last = false,
}: {
    icon: React.ReactNode;
    children: React.ReactNode;
    last?: boolean;
}) {
    return (
        <View
            className={`flex-row px-5 py-5 ${last ? '' : 'border-b border-white/[0.08]'}`}
        >
            <View className="mt-0.5 mr-4">{icon}</View>
            <View className="min-w-0 flex-1">{children}</View>
        </View>
    );
}

/**
 * The confirmation.
 *
 * A screen rather than the alert this used to be. The reference is what a
 * client reads out at the desk or quotes over WhatsApp, and an alert throws
 * it away the moment they tap Done — which is exactly what they will tap.
 *
 * Laid out to match the website's confirmation page, so a booking made on a
 * phone and one made on a laptop produce the same slip.
 */
export function BookedScreen({ navigation, route }: ClientStackProps<'Booked'>) {
    const { appointment, chosenBarber } = route.params;

    const user = useAuthStore((state) => state.user);
    const token = useAuthStore((state) => state.token);
    const signedIn = Boolean(token && user && !user.is_staff);

    const branches = useQuery({ queryKey: ['branches'], queryFn: fetchBranches });
    const branch = branches.data?.[0];

    const summary = `Magnetic Barbershop — booking ${appointment.reference}, ${appointment.when_label}.`;

    function shareIt() {
        void Share.share({ message: summary });
    }

    function messageTheShop() {
        if (!branch?.whatsapp_link) {
            return;
        }

        const text = encodeURIComponent(
            `Hi Magnetic, this is about booking ${appointment.reference} on ${appointment.when_label}.`,
        );

        void Linking.openURL(`${branch.whatsapp_link}?text=${text}`);
    }

    return (
        <Screen
            topBar={{ title: 'Booked' }}
            footer={
                <Button
                    label="Done"
                    onPress={() =>
                        navigation.replace('Tabs', {
                            screen: signedIn ? 'Bookings' : 'Home',
                        } as never)
                    }
                />
            }
        >
            <View className="items-center pt-6">
                <View className="mb-6 h-16 w-16 items-center justify-center rounded-full bg-go/15">
                    <Check size={32} color={COLORS.go} />
                </View>

                <Display className="text-center">You are in the book.</Display>

                <Muted className="mt-4 text-center leading-6">
                    {appointment.when_label}
                    {chosenBarber && appointment.staff?.name
                        ? ` with ${appointment.staff.name}`
                        : ''}
                    . Save your reference — it is all we need at the desk.
                </Muted>
            </View>

            <Panel className="mt-8 items-center px-8 py-5" accent>
                <Eyebrow className="text-smoke">Your reference</Eyebrow>
                <Figure className="mt-1.5 text-3xl tracking-[3px]">
                    {appointment.reference}
                </Figure>
            </Panel>

            <View className="mt-6 overflow-hidden rounded-2xl border border-white/[0.08] bg-panel">
                <Row icon={<Clock size={18} color={COLORS.gold} />}>
                    <Strong>{appointment.when_label}</Strong>
                    <Muted className="mt-1">
                        About {appointment.duration_minutes} minutes in the chair
                    </Muted>
                </Row>

                {appointment.staff ? (
                    <Row icon={<User size={18} color={COLORS.gold} />}>
                        <Strong>{appointment.staff.name}</Strong>
                        {appointment.staff.title ? (
                            <Muted className="mt-1">{appointment.staff.title}</Muted>
                        ) : null}
                        {/*
                          * Say so when the shop picked. Reading "with Tapiwa"
                          * back to somebody who never chose Tapiwa makes the
                          * app look like it decided something on their behalf
                          * and hid it.
                          */}
                        {chosenBarber ? null : (
                            <Muted className="mt-1.5 leading-5">
                                Assigned by the shop. Ask at the desk if you would rather see
                                somebody else.
                            </Muted>
                        )}
                    </Row>
                ) : null}

                {appointment.services && appointment.services.length > 0 ? (
                    <Row icon={<Scissors size={18} color={COLORS.gold} />}>
                        {appointment.services.map((line) => (
                            <View
                                key={line.name}
                                className="mb-1.5 flex-row items-baseline justify-between"
                            >
                                <Body className="flex-1 pr-3 text-sm">{line.name}</Body>
                                <Muted>{line.price.formatted}</Muted>
                            </View>
                        ))}

                        {appointment.travel_fee.cents > 0 ? (
                            <View className="mb-1.5 flex-row items-baseline justify-between">
                                <Muted className="flex-1 pr-3">Travel fee</Muted>
                                <Muted>{appointment.travel_fee.formatted}</Muted>
                            </View>
                        ) : null}

                        <View className="mt-3 flex-row items-baseline justify-between border-t border-white/[0.08] pt-3">
                            <Strong className="flex-1 pr-3 text-sm">
                                {appointment.type === 'house_call'
                                    ? 'Total to pay your barber'
                                    : 'Total to pay at the counter'}
                            </Strong>
                            <Figure className="text-xl">{appointment.total.formatted}</Figure>
                        </View>
                    </Row>
                ) : null}

                {appointment.type === 'house_call' ? (
                    <Row icon={<Car size={18} color={COLORS.gold} />} last>
                        <Strong>We are coming to you</Strong>
                        <Muted className="mt-1 leading-5">
                            The barber will call when they are on the way.
                        </Muted>
                    </Row>
                ) : appointment.branch ? (
                    <Row icon={<MapPin size={18} color={COLORS.gold} />} last>
                        <Strong>{appointment.branch.name}</Strong>
                        <Muted className="mt-1 leading-5">
                            {appointment.branch.address_line}
                            {'\n'}
                            {appointment.branch.area}
                        </Muted>
                        {appointment.branch.map_url ? (
                            <Button
                                label="Get directions"
                                variant="secondary"
                                className="mt-4 self-start px-4"
                                onPress={() => void Linking.openURL(appointment.branch!.map_url!)}
                            />
                        ) : null}
                    </Row>
                ) : null}
            </View>

            <View className="mt-5 flex-row">
                {branch?.whatsapp_link ? (
                    <Button
                        label="Message the shop"
                        variant="secondary"
                        className="flex-1"
                        onPress={messageTheShop}
                    />
                ) : null}
                <Button
                    label="Share"
                    variant="secondary"
                    className={branch?.whatsapp_link ? 'ml-2 flex-1' : 'flex-1'}
                    onPress={shareIt}
                />
            </View>

            {!signedIn ? (
                <Panel className="mt-6 px-5 py-5">
                    <Strong>Keep track of it</Strong>
                    <Muted className="mt-1.5 leading-5">
                        We made you an account from this booking. Add a password and you can see
                        and cancel it from here any time.
                    </Muted>
                    <Button
                        label="Create a password"
                        variant="secondary"
                        className="mt-5"
                        onPress={() => navigation.replace('ClientLogin', { then: 'Bookings' })}
                    />
                </Panel>
            ) : null}

            <Muted className="mt-7 text-center text-xs leading-5">
                Need to change it? Message the shop with your reference.
            </Muted>
        </Screen>
    );
}
