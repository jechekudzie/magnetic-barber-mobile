import { useEffect, useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ChevronLeft } from 'lucide-react-native';

import { createBooking, createGuestBooking } from '@api/bookings';
import { errorMessage } from '@api/client';
import {
    fetchAvailability,
    fetchBranches,
    fetchFirstBookableDate,
    fetchPriceList,
    fetchTeam,
} from '@api/catalog';
import { PriceRow } from '@features/client/components/PriceRow';
import { WizardBar } from '@features/client/components/WizardBar';
import type { ClientTabProps } from '@navigation/types';
import { Button } from '@shared/components/Button';
import { Field } from '@shared/components/Field';
import { PhoneField, isCompleteNumber, toE164 } from '@shared/components/PhoneField';
import { Panel } from '@shared/components/Panel';
import { Screen } from '@shared/components/Screen';
import { EmptyState, ErrorState, Loading } from '@shared/components/States';
import { Body, Display, Eyebrow, Figure, Muted, Strong } from '@shared/components/Text';
import type { Audience, Service } from '@shared/types';
import { COLORS } from '@theme/fonts';
import { useAuthStore } from '@stores/auth';

/**
 * The two printed price cards, as the shop hands them out.
 *
 * Kids sits on the men's card but is its own choice here, because a parent
 * booking for a child is not choosing between a men's and a ladies' cut.
 */
const CARDS: Array<{ key: Audience; title: string; blurb: string }> = [
    { key: 'men', title: "Men's", blurb: 'Cuts, dye, curls, tint, facials' },
    { key: 'women', title: 'Ladies', blurb: 'Cuts, dye, Xcurl, tint, brows' },
    { key: 'kids', title: 'Kids', blurb: 'Under 12. Patient chair, no rush' },
];

type Step = 'card' | 'service' | 'barber' | 'day' | 'time' | 'details';

/** The fortnight from a given day, as dates the client recognises. */
function daysFrom(startIso: string, count = 14) {
    const start = new Date(`${startIso}T12:00:00`);
    const todayIso = new Date().toISOString().slice(0, 10);

    return Array.from({ length: count }, (_, offset) => {
        const date = new Date(start);
        date.setDate(date.getDate() + offset);

        const iso = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
            date.getDate(),
        ).padStart(2, '0')}`;

        return {
            iso,
            weekday: iso === todayIso ? 'Today' : date.toLocaleDateString('en-GB', { weekday: 'short' }),
            day: String(date.getDate()),
            month: date.toLocaleDateString('en-GB', { month: 'short' }),
        };
    });
}

function money(cents: number): string {
    const whole = cents / 100;

    return `$${whole % 1 === 0 ? whole.toFixed(0) : whole.toFixed(2)}`;
}

/**
 * Booking a chair, one decision at a time.
 *
 * A wizard rather than one long form: the choices depend on each other — you
 * cannot be shown times until the shop knows what you are having and how long
 * it takes — and a single scrolling page asks somebody to hold all of that at
 * once while the price quietly changes underneath them.
 *
 * It works signed out. A client who has not signed in gives a name and a
 * number at the last step, and that booking creates their account.
 */
export function BookScreen({ navigation, route }: ClientTabProps<'Book'>) {
    const queryClient = useQueryClient();

    const user = useAuthStore((state) => state.user);
    const token = useAuthStore((state) => state.token);
    const signedIn = Boolean(token && user && !user.is_staff);

    const [step, setStep] = useState<Step>('card');
    const [card, setCard] = useState<Audience | null>(null);
    const [selectedServices, setSelectedServices] = useState<string[]>([]);
    /** Null means "anyone available", which is its own deliberate choice. */
    const [barberId, setBarberId] = useState<string | null>(null);
    const [date, setDate] = useState<string | null>(null);
    const [slot, setSlot] = useState<string | null>(null);
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [error, setError] = useState<string | null>(null);

    /** Set when somebody arrived here by tapping a look in the gallery. */
    const [styleId, setStyleId] = useState<string | null>(null);

    const branches = useQuery({ queryKey: ['branches'], queryFn: fetchBranches });
    const branch = branches.data?.[0];

    const priceList = useQuery({
        queryKey: ['price-list', branch?.slug],
        queryFn: () => fetchPriceList(branch!.slug),
        enabled: Boolean(branch),
    });

    const team = useQuery({ queryKey: ['team'], queryFn: fetchTeam });

    /*
     * Where the day picker should open. Not today: the shop shuts at 19:00,
     * so from about six o'clock today is an empty grid, which reads as a
     * broken app rather than a closed shop.
     */
    const firstDate = useQuery({
        queryKey: ['first-bookable', branch?.slug, selectedServices],
        queryFn: () =>
            fetchFirstBookableDate({ branch: branch!.slug, serviceIds: selectedServices }),
        enabled: Boolean(branch) && selectedServices.length > 0,
        staleTime: 1000 * 60,
    });

    /*
     * Arriving from the gallery: the look names the service it is cut as, so
     * the first two steps are already answered. Skipping straight to the
     * barber saves asking a client who has just told us what they want.
     */
    useEffect(() => {
        const incoming = route.params;

        if (!incoming?.serviceId) {
            return;
        }

        setSelectedServices([incoming.serviceId]);
        setStyleId(incoming.styleId ?? null);
        setCard(null);
        setStep('barber');

        // Consumed, so coming back to the tab later starts clean.
        navigation.setParams({ serviceId: undefined, styleId: undefined });
    }, [route.params, navigation]);

    useEffect(() => {
        if (firstDate.data?.date && date === null) {
            setDate(firstDate.data.date);
        }
    }, [firstDate.data, date]);

    const availability = useQuery({
        queryKey: ['availability', branch?.slug, date, selectedServices, barberId],
        queryFn: () =>
            fetchAvailability({
                branch: branch!.slug,
                date: date!,
                serviceIds: selectedServices,
                staff: barberId,
            }),
        enabled: Boolean(branch) && Boolean(date) && selectedServices.length > 0,
        // A slot somebody took two minutes ago is worse than a slower screen.
        staleTime: 1000 * 30,
    });

    const allServices = useMemo(
        () => priceList.data?.flatMap((category) => category.services ?? []) ?? [],
        [priceList.data],
    );

    /** The chosen card, plus anything priced the same on both. */
    const cardServices = useMemo(
        () =>
            allServices.filter(
                (service) => service.audience === card || service.audience === 'unisex',
            ),
        [allServices, card],
    );

    const chosen = allServices.filter((service) => selectedServices.includes(service.id));
    const hasFromPrice = chosen.some((service) => service.is_from_price);
    const totalCents = chosen.reduce((sum, service) => sum + (service.price?.cents ?? 0), 0);
    const totalMinutes = chosen.reduce((sum, service) => sum + service.duration_minutes, 0);

    const days = useMemo(
        () => daysFrom(firstDate.data?.date ?? new Date().toISOString().slice(0, 10)),
        [firstDate.data?.date],
    );

    /*
     * Somebody who came from the gallery has already said what they want, so
     * the card and service steps drop out of the path rather than sitting
     * behind them as steps they appear to have skipped.
     */
    const fromGallery = styleId !== null;

    const STEPS: Step[] = [
        ...(fromGallery ? [] : (['card', 'service'] as Step[])),
        'barber',
        'day',
        'time',
        ...(signedIn ? [] : (['details'] as Step[])),
    ];

    const stepIndex = STEPS.indexOf(step);

    function back() {
        setError(null);

        if (stepIndex <= 0) {
            return;
        }

        setStep(STEPS[stepIndex - 1]);
    }

    function restart() {
        setStep('card');
        setCard(null);
        setSelectedServices([]);
        setStyleId(null);
        setBarberId(null);
        setDate(null);
        setSlot(null);
        setError(null);
    }

    const booking = useMutation({
        mutationFn: async () => {
            const common = {
                branch: branch!.slug,
                service_ids: selectedServices,
                // Null asks the shop to pick, which is what "anyone" means.
                staff: barberId,
                // The look they picked, so the barber knows what was meant.
                style: styleId,
                start: slot!,
                type: 'scheduled' as const,
            };

            if (signedIn) {
                return { appointment: await createBooking(common), isReturningClient: true };
            }

            return createGuestBooking({
                ...common,
                name: name.trim(),
                // Always sent with the country code, so there is no way to
                // store a number the shop cannot dial.
                phone: toE164(phone),
            });
        },
        onSuccess: async ({ appointment }) => {
            await queryClient.invalidateQueries({ queryKey: ['my-bookings'] });
            await queryClient.invalidateQueries({ queryKey: ['availability'] });
            restart();

            // A slip, not an alert. The reference is what gets read out at the
            // desk, and an alert throws it away on the tap everyone makes.
            navigation.navigate('Booked', { appointment, chosenBarber: barberId !== null });
        },
        onError: (caught) => setError(errorMessage(caught, 'We could not hold that slot.')),
    });

    if (branches.isPending || priceList.isPending) {
        return (
            <Screen>
                <Loading label="Opening the diary" />
            </Screen>
        );
    }

    const slots = availability.data?.any_staff ?? [];
    const detailsDone = name.trim().length >= 2 && isCompleteNumber(phone);

    const canAdvance =
        step === 'card'
            ? card !== null
            : step === 'service'
              ? selectedServices.length > 0
              : step === 'barber'
                ? true
                : step === 'day'
                ? date !== null
                : step === 'time'
                  ? slot !== null
                  : detailsDone;

    const isLast = stepIndex === STEPS.length - 1;

    return (
        <Screen
            footer={
                <>
                    {chosen.length > 0 ? (
                        <View className="mb-3 flex-row items-baseline justify-between">
                            <Muted>
                                {chosen.length} service{chosen.length === 1 ? '' : 's'} ·{' '}
                                {totalMinutes} min
                            </Muted>
                            <View className="flex-row items-baseline">
                                {hasFromPrice ? (
                                    <Muted className="mr-1.5 text-[10px] uppercase tracking-eyebrow">
                                        From
                                    </Muted>
                                ) : null}
                                <Figure className="text-xl">{money(totalCents)}</Figure>
                            </View>
                        </View>
                    ) : null}

                    <Button
                        label={isLast ? 'Confirm booking' : 'Continue'}
                        onPress={() => {
                            if (isLast) {
                                booking.mutate();

                                return;
                            }

                            setError(null);
                            setStep(STEPS[stepIndex + 1]);
                        }}
                        disabled={!canAdvance}
                        loading={booking.isPending}
                    />
                </>
            }
            topBar={{ title: branch?.name }}
        >
            {stepIndex > 0 ? (
                <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Go back a step"
                    onPress={back}
                    className="mb-3 -ml-1 flex-row items-center self-start py-1 pr-3"
                >
                    <ChevronLeft size={18} color={COLORS.gold} />
                    <Eyebrow className="ml-0.5">Back</Eyebrow>
                </Pressable>
            ) : null}

            <WizardBar
                step={stepIndex + 1}
                total={STEPS.length}
                label={branch?.name ?? 'Magnetic'}
            />

            {error ? <ErrorState message={error} /> : null}

            {step === 'card' ? (
                <>
                    <Display>Who is this for?</Display>
                    <Muted className="mb-7 mt-3 leading-6">
                        The shop prices men's and ladies' work differently, so this decides the
                        card you see.
                    </Muted>

                    {CARDS.map((option) => (
                        <Panel
                            key={option.key}
                            accent={card === option.key}
                            className="mb-2.5 px-5 py-5"
                            onPress={() => {
                                setCard(option.key);
                                // A different card is a different menu.
                                setSelectedServices([]);
                                setDate(null);
                                setSlot(null);
                            }}
                        >
                            <Strong className="text-lg">{option.title}</Strong>
                            <Muted className="mt-1.5">{option.blurb}</Muted>
                        </Panel>
                    ))}
                </>
            ) : null}

            {step === 'service' ? (
                <>
                    <Display>What are you having?</Display>
                    <Muted className="mb-7 mt-3 leading-6">
                        Pick as many as you like. We will add up the time.
                    </Muted>

                    {cardServices.map((service: Service) => (
                        <PriceRow
                            key={service.id}
                            service={service}
                            selected={selectedServices.includes(service.id)}
                            onPress={() => {
                                setSlot(null);
                                setDate(null);
                                setSelectedServices((current) =>
                                    current.includes(service.id)
                                        ? current.filter((id) => id !== service.id)
                                        : [...current, service.id],
                                );
                            }}
                        />
                    ))}

                    {hasFromPrice ? (
                        <Panel accent className="mt-4 px-4 py-4">
                            <Strong>The final price is set in the chair</Strong>
                            <Muted className="mt-1.5 leading-5">
                                Tinting starts at the figure shown and depends on the colour you
                                choose.
                            </Muted>
                        </Panel>
                    ) : null}
                </>
            ) : null}

            {step === 'barber' ? (
                <>
                    <Display>Who with?</Display>
                    <Muted className="mb-7 mt-3 leading-6">
                        Ask for somebody by name, or leave it to the shop and take the first
                        chair that is free.
                    </Muted>

                    <Panel
                        accent={barberId === null}
                        className="mb-2.5 px-5 py-5"
                        onPress={() => {
                            setBarberId(null);
                            setDate(null);
                            setSlot(null);
                        }}
                    >
                        <Strong className="text-lg">Anyone available</Strong>
                        <Muted className="mt-1.5 leading-5">
                            Usually the earliest appointment. The shop assigns a barber and tells
                            you who on the confirmation.
                        </Muted>
                    </Panel>

                    {team.isPending ? (
                        <Loading label="Finding the team" />
                    ) : (
                        (team.data ?? []).map((member) => (
                            <Panel
                                key={member.id}
                                accent={barberId === member.id}
                                className="mb-2.5 px-5 py-5"
                                onPress={() => {
                                    setBarberId(member.id);
                                    // A named barber has their own diary.
                                    setDate(null);
                                    setSlot(null);
                                }}
                            >
                                <Strong className="text-lg">{member.name}</Strong>
                                {member.title ? (
                                    <Muted className="mt-1">{member.title}</Muted>
                                ) : null}
                                {member.specialities.length > 0 ? (
                                    <Muted className="mt-1.5 leading-5">
                                        {member.specialities.join(' · ')}
                                    </Muted>
                                ) : null}
                            </Panel>
                        ))
                    )}
                </>
            ) : null}

            {step === 'day' ? (
                <>
                    <Display>Which day?</Display>
                    <Muted className="mb-7 mt-3 leading-6">
                        {firstDate.data?.has_availability === false
                            ? 'Nothing is free in the next two weeks. Please call the shop.'
                            : 'We have opened on the first day that can take your booking.'}
                    </Muted>

                    <View className="flex-row flex-wrap">
                        {days.map((day) => {
                            const active = day.iso === date;

                            return (
                                <Pressable
                                    key={day.iso}
                                    accessibilityRole="button"
                                    accessibilityLabel={`${day.weekday} ${day.day} ${day.month}`}
                                    accessibilityState={{ selected: active }}
                                    onPress={() => {
                                        setDate(day.iso);
                                        setSlot(null);
                                    }}
                                    className={`mb-2.5 mr-2.5 h-[78px] w-[64px] items-center justify-center rounded-xl border ${
                                        active
                                            ? 'border-gold bg-gold'
                                            : 'border-white/[0.08] bg-panel'
                                    }`}
                                >
                                    <Muted className={`text-[11px] ${active ? 'text-ink' : ''}`}>
                                        {day.weekday}
                                    </Muted>
                                    <Body
                                        className={`font-display mt-0.5 text-xl ${
                                            active ? 'text-ink' : 'text-bone'
                                        }`}
                                    >
                                        {day.day}
                                    </Body>
                                    <Muted className={`text-[10px] ${active ? 'text-ink' : ''}`}>
                                        {day.month}
                                    </Muted>
                                </Pressable>
                            );
                        })}
                    </View>
                </>
            ) : null}

            {step === 'time' ? (
                <>
                    <Display>What time?</Display>
                    <Muted className="mb-7 mt-3 leading-6">
                        {totalMinutes} minutes in the chair.
                    </Muted>

                    {availability.isPending ? (
                        <Loading label="Checking the chairs" />
                    ) : availability.data?.closed ? (
                        <>
                            <EmptyState
                                title="Nothing free that day"
                                body={availability.data.reason ?? 'Try another date.'}
                            />
                            <Button
                                label="Pick another day"
                                variant="secondary"
                                className="mt-4"
                                onPress={() => setStep('day')}
                            />
                        </>
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
                                        className={`mb-2.5 mr-2.5 rounded-xl border px-5 py-3.5 ${
                                            active
                                                ? 'border-gold bg-gold'
                                                : 'border-white/[0.08] bg-panel'
                                        }`}
                                    >
                                        <Body className={active ? 'text-ink' : ''}>
                                            {option.label}
                                        </Body>
                                    </Pressable>
                                );
                            })}
                        </View>
                    )}

                    {availability.data?.provisional ? (
                        <Muted className="mt-5 text-gold">
                            These times are a guide until the shop finishes setting up.
                        </Muted>
                    ) : null}
                </>
            ) : null}

            {step === 'details' ? (
                <>
                    <Display>Who is it for?</Display>
                    <Muted className="mb-7 mt-3 leading-6">
                        No account needed. We set one up from this booking, and your points start
                        from this visit.
                    </Muted>

                    <Field
                        label="Your name"
                        value={name}
                        onChangeText={setName}
                        placeholder="Tendai Moyo"
                        autoCapitalize="words"
                        textContentType="name"
                    />

                    <PhoneField
                        value={phone}
                        onChangeText={setPhone}
                        hint="So the shop can reach you if anything changes."
                    />

                    <Panel className="mt-2 px-5 py-5">
                        <Eyebrow className="text-smoke">Your booking</Eyebrow>
                        {chosen.map((service) => (
                            <View
                                key={service.id}
                                className="mt-3 flex-row items-baseline justify-between"
                            >
                                <Body className="flex-1 pr-3">{service.name}</Body>
                                <Muted>{service.price?.formatted}</Muted>
                            </View>
                        ))}
                        <Muted className="mt-4 leading-5">
                            {availability.data?.any_staff.find((s) => s.start === slot)?.label} ·{' '}
                            {date}
                            {'\n'}
                            {barberId === null
                                ? 'With whoever is free'
                                : `With ${team.data?.find((m) => m.id === barberId)?.name ?? 'your barber'}`}
                        </Muted>
                    </Panel>
                </>
            ) : null}
        </Screen>
    );
}
