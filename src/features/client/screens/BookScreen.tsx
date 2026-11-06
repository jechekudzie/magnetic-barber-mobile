import { useMemo, useState } from 'react';
import { Alert, Pressable, View } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { createBooking, createGuestBooking } from '@api/bookings';
import { errorMessage } from '@api/client';
import { fetchAvailability, fetchBranches, fetchPriceList } from '@api/catalog';
import { PriceRow } from '@features/client/components/PriceRow';
import type { ClientTabProps } from '@navigation/types';
import { Button } from '@shared/components/Button';
import { Field } from '@shared/components/Field';
import { Panel } from '@shared/components/Panel';
import { Screen, ScreenHeader } from '@shared/components/Screen';
import { EmptyState, ErrorState, Loading } from '@shared/components/States';
import { Body, Eyebrow, Heading, Muted, Strong } from '@shared/components/Text';
import { useAuthStore } from '@stores/auth';

/** The next fortnight, as dates the client recognises. */
function nextDays(count = 14): Array<{ iso: string; weekday: string; day: string }> {
    return Array.from({ length: count }, (_, offset) => {
        const date = new Date();
        date.setDate(date.getDate() + offset);

        return {
            iso: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
                date.getDate(),
            ).padStart(2, '0')}`,
            weekday: date.toLocaleDateString('en-GB', { weekday: 'short' }),
            day: String(date.getDate()),
        };
    });
}

/**
 * Booking a chair.
 *
 * Works signed out. A client who has not signed in types a name and a number
 * at the end, and the booking itself creates their account — the same deal
 * the website has always offered. Signed in, those two fields disappear
 * because the account already answers them.
 */
export function BookScreen({ navigation }: ClientTabProps<'Book'>) {
    const queryClient = useQueryClient();
    const days = useMemo(() => nextDays(), []);

    const user = useAuthStore((state) => state.user);
    const token = useAuthStore((state) => state.token);
    const signedIn = Boolean(token && user && !user.is_staff);

    const [selectedServices, setSelectedServices] = useState<string[]>([]);
    const [date, setDate] = useState(days[0].iso);
    const [slot, setSlot] = useState<string | null>(null);
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [error, setError] = useState<string | null>(null);

    const branches = useQuery({ queryKey: ['branches'], queryFn: fetchBranches });
    const branch = branches.data?.[0];

    const priceList = useQuery({
        queryKey: ['price-list', branch?.slug],
        queryFn: () => fetchPriceList(branch!.slug),
        enabled: Boolean(branch),
    });

    const availability = useQuery({
        queryKey: ['availability', branch?.slug, date, selectedServices],
        queryFn: () =>
            fetchAvailability({ branch: branch!.slug, date, serviceIds: selectedServices }),
        enabled: Boolean(branch) && selectedServices.length > 0,
        // A slot somebody took two minutes ago is worse than a slower screen.
        staleTime: 1000 * 30,
    });

    const chosen =
        priceList.data
            ?.flatMap((category) => category.services ?? [])
            .filter((service) => selectedServices.includes(service.id)) ?? [];

    const hasFromPrice = chosen.some((service) => service.is_from_price);
    const totalCents = chosen.reduce((sum, service) => sum + (service.price?.cents ?? 0), 0);

    function reset() {
        setSelectedServices([]);
        setSlot(null);
        setError(null);
    }

    const booking = useMutation({
        mutationFn: async () => {
            const common = {
                branch: branch!.slug,
                service_ids: selectedServices,
                start: slot!,
                type: 'scheduled' as const,
            };

            if (signedIn) {
                return { appointment: await createBooking(common), isReturningClient: true };
            }

            return createGuestBooking({ ...common, name: name.trim(), phone: phone.trim() });
        },
        onSuccess: async ({ appointment }) => {
            await queryClient.invalidateQueries({ queryKey: ['my-bookings'] });
            await queryClient.invalidateQueries({ queryKey: ['availability'] });
            reset();

            if (signedIn) {
                navigation.navigate('Bookings');

                return;
            }

            Alert.alert(
                'You are booked',
                `${appointment.when_label}. Your reference is ${appointment.reference}.\n\nSign in with your number any time to see or cancel it.`,
                [
                    { text: 'Done', style: 'cancel' },
                    {
                        text: 'Sign in',
                        onPress: () => navigation.navigate('ClientLogin', { then: 'Bookings' }),
                    },
                ],
            );
        },
        onError: (caught) => setError(errorMessage(caught, 'We could not hold that slot.')),
    });

    function toggleService(id: string) {
        setSlot(null);
        setSelectedServices((current) =>
            current.includes(id) ? current.filter((s) => s !== id) : [...current, id],
        );
    }

    if (branches.isPending || priceList.isPending) {
        return (
            <Screen>
                <Loading label="Opening the diary" />
            </Screen>
        );
    }

    const slots = availability.data?.any_staff ?? [];
    const detailsDone = signedIn || (name.trim().length >= 2 && phone.trim().length >= 9);
    const ready = Boolean(slot) && detailsDone;

    return (
        <Screen
            footer={
                <>
                    {chosen.length > 0 ? (
                        <View className="mb-3 flex-row items-baseline justify-between">
                            <Muted>
                                {chosen.length} service{chosen.length === 1 ? '' : 's'}
                            </Muted>
                            <View className="flex-row items-baseline">
                                {hasFromPrice ? (
                                    <Muted className="mr-1.5 uppercase tracking-eyebrow text-[10px]">
                                        From
                                    </Muted>
                                ) : null}
                                <Body className="font-display text-gold text-xl">
                                    ${(totalCents / 100) % 1 === 0
                                        ? (totalCents / 100).toFixed(0)
                                        : (totalCents / 100).toFixed(2)}
                                </Body>
                            </View>
                        </View>
                    ) : null}

                    <Button
                        label={
                            !slot
                                ? 'Pick a time'
                                : !detailsDone
                                  ? 'Add your details'
                                  : 'Confirm booking'
                        }
                        onPress={() => booking.mutate()}
                        disabled={!ready}
                        loading={booking.isPending}
                    />
                </>
            }
        >
            <ScreenHeader eyebrow={branch?.name} title="Book a chair" />

            {error ? <ErrorState message={error} /> : null}

            <Heading className="mb-4">What are you having?</Heading>
            {priceList.data?.map((category) => (
                <View key={category.id} className="mb-6">
                    <Eyebrow className="mb-2.5 text-smoke">{category.name}</Eyebrow>
                    {category.services?.map((service) => (
                        <PriceRow
                            key={service.id}
                            service={service}
                            selected={selectedServices.includes(service.id)}
                            onPress={() => toggleService(service.id)}
                        />
                    ))}
                </View>
            ))}

            {hasFromPrice ? (
                <Panel accent className="mb-6 px-4 py-4">
                    <Strong>The final price is set in the chair</Strong>
                    <Muted className="mt-1.5 leading-5">
                        Tinting is priced from the figure shown, depending on the colour you
                        choose.
                    </Muted>
                </Panel>
            ) : null}

            <Heading className="mb-4">Which day?</Heading>
            <View className="mb-7 flex-row flex-wrap">
                {days.map((day) => {
                    const active = day.iso === date;

                    return (
                        <Pressable
                            key={day.iso}
                            accessibilityRole="button"
                            accessibilityLabel={`${day.weekday} ${day.day}`}
                            accessibilityState={{ selected: active }}
                            onPress={() => {
                                setDate(day.iso);
                                setSlot(null);
                            }}
                            className={`mb-2 mr-2 h-[66px] w-[52px] items-center justify-center rounded-xl border ${
                                active ? 'border-gold bg-gold' : 'border-white/[0.08] bg-panel'
                            }`}
                        >
                            <Muted className={active ? 'text-ink' : ''}>{day.weekday}</Muted>
                            <Body
                                className={`font-display mt-0.5 text-lg ${
                                    active ? 'text-ink' : 'text-bone'
                                }`}
                            >
                                {day.day}
                            </Body>
                        </Pressable>
                    );
                })}
            </View>

            <Heading className="mb-4">What time?</Heading>

            {selectedServices.length === 0 ? (
                <EmptyState title="Pick a service first" body="Then we can show you what is free." />
            ) : availability.isPending ? (
                <Loading label="Checking the chairs" />
            ) : availability.data?.closed ? (
                <EmptyState
                    title="Nothing free that day"
                    body={availability.data.reason ?? 'Try another date.'}
                />
            ) : (
                <View className="flex-row flex-wrap">
                    {slots.map((option) => {
                        const active = option.start === slot;

                        return (
                            <Pressable
                                key={option.start}
                                accessibilityRole="button"
                                accessibilityState={{ selected: active }}
                                onPress={() => setSlot(option.start)}
                                className={`mb-2 mr-2 rounded-xl border px-4 py-3 ${
                                    active ? 'border-gold bg-gold' : 'border-white/[0.08] bg-panel'
                                }`}
                            >
                                <Body className={active ? 'text-ink' : ''}>{option.label}</Body>
                            </Pressable>
                        );
                    })}
                </View>
            )}

            {!signedIn && slot ? (
                <>
                    <Heading className="mb-2 mt-9">Who is this for?</Heading>
                    <Muted className="mb-5 leading-5">
                        No account needed. We set one up from your first booking, and your points
                        start from this visit.
                    </Muted>

                    <Field
                        label="Your name"
                        value={name}
                        onChangeText={setName}
                        placeholder="Tendai Moyo"
                        autoCapitalize="words"
                        textContentType="name"
                    />

                    <Field
                        label="Mobile number"
                        value={phone}
                        onChangeText={setPhone}
                        placeholder="078 187 9820"
                        keyboardType="phone-pad"
                        autoComplete="tel"
                        textContentType="telephoneNumber"
                        hint="So the shop can reach you if anything changes."
                    />
                </>
            ) : null}

            {availability.data?.provisional ? (
                <Muted className="mt-5 text-gold">
                    These times are a guide until the shop finishes setting up.
                </Muted>
            ) : null}
        </Screen>
    );
}
