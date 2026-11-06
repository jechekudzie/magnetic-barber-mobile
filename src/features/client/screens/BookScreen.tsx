import { useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { errorMessage } from '@api/client';
import { fetchAvailability, fetchBranches, fetchPriceList } from '@api/catalog';
import { createBooking } from '@api/bookings';
import { PriceRow } from '@features/client/components/PriceRow';
import type { ClientTabProps } from '@navigation/types';
import { Button } from '@shared/components/Button';
import { Screen } from '@shared/components/Screen';
import { EmptyState, ErrorState, Loading } from '@shared/components/States';
import { Body, Gold, Heading, Muted, Title } from '@shared/components/Text';

/** The next fourteen days, as the shop's own dates. */
function nextDays(count = 14): Array<{ iso: string; weekday: string; day: string }> {
    return Array.from({ length: count }, (_, offset) => {
        const date = new Date();
        date.setDate(date.getDate() + offset);

        return {
            iso: date.toISOString().slice(0, 10),
            weekday: date.toLocaleDateString('en-GB', { weekday: 'short' }),
            day: String(date.getDate()),
        };
    });
}

export function BookScreen({ navigation }: ClientTabProps<'Book'>) {
    const queryClient = useQueryClient();
    const days = useMemo(() => nextDays(), []);

    const [selectedServices, setSelectedServices] = useState<string[]>([]);
    const [date, setDate] = useState(days[0].iso);
    const [slot, setSlot] = useState<string | null>(null);
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
        // A slot taken by somebody else two minutes ago is worse than a
        // slightly slower screen.
        staleTime: 1000 * 30,
    });

    const booking = useMutation({
        mutationFn: () =>
            createBooking({
                branch: branch!.slug,
                service_ids: selectedServices,
                start: slot!,
                type: 'scheduled',
            }),
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: ['my-bookings'] });

            setSelectedServices([]);
            setSlot(null);
            setError(null);
            navigation.navigate('Bookings');
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

    return (
        <Screen
            footer={
                <Button
                    label={slot ? 'Confirm booking' : 'Pick a time'}
                    onPress={() => booking.mutate()}
                    disabled={!slot}
                    loading={booking.isPending}
                />
            }
        >
            <Title>Book a chair</Title>
            <Muted className="mb-6 mt-2">{branch?.name}</Muted>

            {error ? <ErrorState message={error} /> : null}

            <Heading className="mb-3">What are you having?</Heading>
            {priceList.data?.map((category) => (
                <View key={category.id} className="mb-5">
                    <Muted className="mb-2 uppercase tracking-wide">{category.name}</Muted>
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

            <Heading className="mb-3 mt-2">Which day?</Heading>
            <View className="mb-6 flex-row flex-wrap">
                {days.map((day) => {
                    const active = day.iso === date;

                    return (
                        <Pressable
                            key={day.iso}
                            accessibilityRole="button"
                            accessibilityState={{ selected: active }}
                            onPress={() => {
                                setDate(day.iso);
                                setSlot(null);
                            }}
                            className={`mb-2 mr-2 h-16 w-14 items-center justify-center rounded-xl border ${
                                active ? 'border-gold bg-gold' : 'border-white/10 bg-panel'
                            }`}
                        >
                            <Muted className={active ? 'text-ink' : ''}>{day.weekday}</Muted>
                            <Body className={`font-semibold ${active ? 'text-ink' : ''}`}>
                                {day.day}
                            </Body>
                        </Pressable>
                    );
                })}
            </View>

            <Heading className="mb-3">What time?</Heading>

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
                                    active ? 'border-gold bg-gold' : 'border-white/10 bg-panel'
                                }`}
                            >
                                <Body className={active ? 'text-ink font-semibold' : ''}>
                                    {option.label}
                                </Body>
                            </Pressable>
                        );
                    })}
                </View>
            )}

            {availability.data?.provisional ? (
                <Gold className="mt-4 text-sm">
                    These times are a guide until the shop finishes setting up.
                </Gold>
            ) : null}
        </Screen>
    );
}
