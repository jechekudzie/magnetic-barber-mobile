import { useState } from 'react';
import { View } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';

import { startClientLogin, verifyClientLogin } from '@api/auth';
import { errorMessage } from '@api/client';
import type { ClientStackProps } from '@navigation/types';
import { Button } from '@shared/components/Button';
import { Field } from '@shared/components/Field';
import { LogoLockup } from '@shared/components/Logo';
import { Panel } from '@shared/components/Panel';
import { Screen } from '@shared/components/Screen';
import { ErrorState } from '@shared/components/States';
import { Display, Eyebrow, Figure, Muted } from '@shared/components/Text';
import { useAuthStore } from '@stores/auth';

/**
 * Signing in on a phone number.
 *
 * Not a door anyone has to walk through: booking works without it. This buys
 * a returning client their history, their points and the ability to cancel.
 *
 * Both steps live on one screen rather than two. The second step is six
 * digits, and pushing a route for it loses the number they just typed the
 * moment they go back.
 */
export function ClientLoginScreen({ navigation, route }: ClientStackProps<'ClientLogin'>) {
    const signIn = useAuthStore((state) => state.signIn);
    const queryClient = useQueryClient();

    const [step, setStep] = useState<'phone' | 'code'>('phone');
    const [phone, setPhone] = useState('');
    const [code, setCode] = useState('');
    const [name, setName] = useState('');
    const [needsName, setNeedsName] = useState(false);
    const [devCode, setDevCode] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [busy, setBusy] = useState(false);

    async function requestCode() {
        setBusy(true);
        setError(null);

        try {
            const response = await startClientLogin(phone);

            setNeedsName(!response.is_registered);
            // Only ever present while no SMS channel is configured.
            setDevCode(response.code);
            setStep('code');
        } catch (caught) {
            setError(errorMessage(caught, 'We could not send that code.'));
        } finally {
            setBusy(false);
        }
    }

    async function submitCode() {
        setBusy(true);
        setError(null);

        try {
            const { token, user } = await verifyClientLogin({
                phone,
                code,
                name: needsName ? name : undefined,
            });

            await signIn(token, user);
            // Anything cached was fetched as somebody else, or as nobody.
            queryClient.clear();

            const landing = route.params?.then;

            if (landing) {
                navigation.replace('Tabs', { screen: landing } as never);
            } else {
                navigation.goBack();
            }
        } catch (caught) {
            setError(errorMessage(caught, 'That code did not work.'));
        } finally {
            setBusy(false);
        }
    }

    return (
        <Screen>
            <View className="mb-7 items-center pt-4">
                <LogoLockup width={190} />
            </View>

            <Eyebrow className="mb-3">{step === 'phone' ? 'Sign in' : 'Almost there'}</Eyebrow>
            <Display>{step === 'phone' ? 'Your number' : 'Check your phone'}</Display>

            <Muted className="mb-7 mt-3 leading-6">
                {step === 'phone'
                    ? 'We will text you a six digit code. There is no password to remember.'
                    : `We sent a code to ${phone}.`}
            </Muted>

            {error ? <ErrorState message={error} /> : null}

            <View className="mt-2">
                {step === 'phone' ? (
                    <Field
                        label="Mobile number"
                        value={phone}
                        onChangeText={setPhone}
                        placeholder="078 187 9820"
                        keyboardType="phone-pad"
                        autoComplete="tel"
                        textContentType="telephoneNumber"
                        returnKeyType="go"
                        onSubmitEditing={requestCode}
                        autoFocus
                    />
                ) : (
                    <>
                        <Field
                            label="Six digit code"
                            value={code}
                            onChangeText={setCode}
                            placeholder="000000"
                            keyboardType="number-pad"
                            maxLength={6}
                            autoComplete="one-time-code"
                            textContentType="oneTimeCode"
                            autoFocus
                        />

                        {needsName ? (
                            <Field
                                label="Your name"
                                value={name}
                                onChangeText={setName}
                                placeholder="Tendai Moyo"
                                autoCapitalize="words"
                                hint="We have not met this number before."
                            />
                        ) : null}

                        {devCode ? (
                            <Panel accent className="mb-5 px-4 py-4">
                                <Muted>No SMS channel is configured yet, so here it is:</Muted>
                                <Figure className="mt-1 tracking-[8px]">{devCode}</Figure>
                            </Panel>
                        ) : null}
                    </>
                )}
            </View>

            {step === 'phone' ? (
                <Button
                    label="Send me a code"
                    onPress={requestCode}
                    loading={busy}
                    disabled={phone.trim().length < 9}
                />
            ) : (
                <>
                    <Button
                        label="Sign in"
                        onPress={submitCode}
                        loading={busy}
                        disabled={code.trim().length !== 6 || (needsName && name.trim().length < 2)}
                    />
                    <Button
                        label="Use a different number"
                        variant="ghost"
                        onPress={() => {
                            setStep('phone');
                            setCode('');
                            setDevCode(null);
                            setError(null);
                        }}
                        className="mt-1"
                    />
                </>
            )}

            <Button
                label="Not now"
                variant="ghost"
                onPress={() => navigation.goBack()}
                className="mt-4"
            />
        </Screen>
    );
}
