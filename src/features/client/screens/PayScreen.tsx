import { useEffect, useState } from 'react';
import { Alert, Image, Pressable, View } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Camera, Check } from 'lucide-react-native';

import { fetchPaymentState, submitPayment } from '@api/bookings';
import { errorMessage } from '@api/client';
import type { ClientStackProps } from '@navigation/types';
import { Button } from '@shared/components/Button';
import { isPickerAvailable, pickPhoto } from '@shared/imagePicker';
import { Field } from '@shared/components/Field';
import { Panel } from '@shared/components/Panel';
import { Screen } from '@shared/components/Screen';
import { ErrorState, Loading } from '@shared/components/States';
import { Body, Display, Eyebrow, Figure, Muted, Strong } from '@shared/components/Text';
import { COLORS } from '@theme/fonts';

/**
 * Paying for a booking.
 *
 * EcoCash and InnBucks settle outside this system entirely, so nothing here
 * takes money. The client pays on their own phone and then tells the shop the
 * reference and sends the screenshot; the chair is theirs from that moment,
 * and the desk checks the proof afterwards.
 *
 * Saying that plainly matters. A screen that looks like a checkout and then
 * does not take payment is worse than one that admits what it is.
 */
export function PayScreen({ navigation, route }: ClientStackProps<'Pay'>) {
    const queryClient = useQueryClient();
    const { id } = route.params;

    const [method, setMethod] = useState<string | null>(null);
    const [reference, setReference] = useState('');
    const [proofUri, setProofUri] = useState<string | null>(null);

    const state = useQuery({
        queryKey: ['payment', id],
        queryFn: () => fetchPaymentState(id),
    });

    useEffect(() => {
        if (method === null && state.data?.methods.length) {
            setMethod(state.data.methods[0].value);
        }
    }, [state.data, method]);

    const send = useMutation({
        mutationFn: () =>
            submitPayment({
                id,
                method: method!,
                amount_cents: state.data!.due.cents,
                reference: reference.trim(),
                proofUri,
            }),
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: ['payment', id] });
            await queryClient.invalidateQueries({ queryKey: ['my-bookings'] });

            Alert.alert(
                'Thank you',
                'Your chair is held while the shop checks it.',
                [{ text: 'Done', onPress: () => navigation.goBack() }],
            );
        },
        onError: (caught) => Alert.alert('We could not record that', errorMessage(caught)),
    });

    async function attachProof() {
        const picked = await pickPhoto();

        if (picked) {
            setProofUri(picked.uri);
        }
    }

    if (state.isPending) {
        return (
            <Screen>
                <Loading label="Checking what is owed" />
            </Screen>
        );
    }

    if (state.isError || !state.data) {
        return (
            <Screen>
                <ErrorState
                    message={errorMessage(state.error)}
                    onRetry={() => void state.refetch()}
                />
                <Button
                    label="Back"
                    variant="ghost"
                    className="mt-4"
                    onPress={() => navigation.goBack()}
                />
            </Screen>
        );
    }

    const chosen = state.data.methods.find((m) => m.value === method);
    const settled = state.data.due.cents === 0;

    return (
        <Screen
            topBar={{ onBack: () => navigation.goBack() }}
            footer={
                settled ? (
                    <Button label="Back" variant="secondary" onPress={() => navigation.goBack()} />
                ) : (
                    <Button
                        label="I have paid"
                        loading={send.isPending}
                        disabled={method === null || reference.trim().length < 4}
                        onPress={() => send.mutate()}
                    />
                )
            }
        >
            <Eyebrow className="mb-3">Payment</Eyebrow>
            <Display>{settled ? 'All settled' : 'Secure your chair'}</Display>

            <Panel accent className="mt-6 items-center px-8 py-6">
                <Eyebrow className="text-smoke">{settled ? 'Paid' : 'To send'}</Eyebrow>
                <Figure className="mt-1.5 text-4xl">
                    {settled ? state.data.paid.formatted : state.data.due.formatted}
                </Figure>
            </Panel>

            {settled ? (
                <Muted className="mt-6 text-center leading-6">
                    Nothing left to pay. See you in the chair.
                </Muted>
            ) : (
                <>
                    <Panel className="mt-6 px-5 py-5">
                        <Strong>Pay on your own phone first</Strong>
                        <Muted className="mt-1.5 leading-5">
                            Send {state.data.due.formatted} the usual way, then put the
                            transaction reference below. We hold your chair as soon as you do,
                            and the shop checks it after.
                        </Muted>
                    </Panel>

                    {/*
                      * Paying ahead is not compulsory. Somebody who turns up
                      * with cash is a normal client, and a screen that only
                      * offers to take money now reads as though they are not.
                      */}
                    <Panel className="mt-3 px-5 py-5">
                        <Strong>Or just pay at the shop</Strong>
                        <Muted className="mt-1.5 leading-5">
                            Cash or card at the counter is fine. Give the desk your reference and
                            they will find you and take it then. Paying ahead only means your
                            chair is held before you get here.
                        </Muted>
                    </Panel>

                    <Eyebrow className="mb-3 mt-8 text-smoke">How did you send it?</Eyebrow>

                    <View className="mb-5 flex-row flex-wrap">
                        {state.data.methods.map((option) => (
                            <Pressable
                                key={option.value}
                                accessibilityRole="button"
                                accessibilityState={{ selected: method === option.value }}
                                onPress={() => setMethod(option.value)}
                                className={`mb-2 mr-2 flex-row items-center rounded-xl border px-5 py-3.5 ${
                                    method === option.value
                                        ? 'border-gold bg-gold'
                                        : 'border-white/[0.08] bg-panel'
                                }`}
                            >
                                <Body className={method === option.value ? 'text-ink' : ''}>
                                    {option.label}
                                </Body>
                            </Pressable>
                        ))}
                    </View>

                    <Field
                        label="Transaction reference"
                        value={reference}
                        onChangeText={setReference}
                        autoCapitalize="characters"
                        autoCorrect={false}
                        placeholder="MP260101.1234.A56789"
                        hint={`The code ${chosen?.label ?? 'your provider'} sent you.`}
                    />

                    <Eyebrow className="mb-3 text-smoke">
                        {isPickerAvailable()
                            ? 'Screenshot (optional)'
                            : 'Screenshot (next build)'}
                    </Eyebrow>

                    {proofUri ? (
                        <Panel className="mb-5 overflow-hidden p-0">
                            <Image
                                source={{ uri: proofUri }}
                                style={{ width: '100%', height: 220 }}
                                resizeMode="cover"
                                accessibilityIgnoresInvertColors
                            />
                            <View className="flex-row items-center px-5 py-4">
                                <Check size={16} color={COLORS.go} />
                                <Muted className="ml-2 flex-1">Attached</Muted>
                                <Pressable
                                    accessibilityRole="button"
                                    onPress={() => setProofUri(null)}
                                >
                                    <Body className="text-sm text-stop">Remove</Body>
                                </Pressable>
                            </View>
                        </Panel>
                    ) : (
                        <Pressable
                            accessibilityRole="button"
                            onPress={attachProof}
                            className="mb-5 items-center rounded-2xl border border-dashed border-white/20 bg-panel px-5 py-8"
                        >
                            <Camera size={22} color={COLORS.gold} />
                            <Muted className="mt-2.5 text-center leading-5">
                                {isPickerAvailable()
                                    ? 'Add the confirmation screenshot.\nIt helps the desk check it faster.'
                                    : 'Photos are not in this build yet.\nThe reference on its own is enough.'}
                            </Muted>
                        </Pressable>
                    )}
                </>
            )}

            {state.data.data.length > 0 ? (
                <>
                    <Eyebrow className="mb-3 mt-4 text-smoke">Already sent</Eyebrow>

                    {state.data.data.map((payment) => (
                        <Panel key={payment.id} className="mb-2 px-5 py-4">
                            <View className="flex-row items-baseline justify-between">
                                <Strong className="text-sm">{payment.method_label}</Strong>
                                <Muted>{payment.amount.formatted}</Muted>
                            </View>
                            <Muted
                                className={`mt-1.5 ${
                                    payment.status === 'confirmed'
                                        ? 'text-go'
                                        : payment.status === 'rejected'
                                          ? 'text-stop'
                                          : ''
                                }`}
                            >
                                {payment.status_label}
                                {payment.reference ? ` · ${payment.reference}` : ''}
                            </Muted>
                            {payment.rejection_reason ? (
                                <Muted className="mt-1 text-stop leading-5">
                                    {payment.rejection_reason}
                                </Muted>
                            ) : null}
                        </Panel>
                    ))}
                </>
            ) : null}
        </Screen>
    );
}
