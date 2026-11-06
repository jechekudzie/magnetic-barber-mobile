import { useState } from 'react';
import { View } from 'react-native';

import { startClientLogin, verifyClientLogin } from '@api/auth';
import { errorMessage } from '@api/client';
import type { AuthScreenProps } from '@navigation/types';
import { Button } from '@shared/components/Button';
import { Field } from '@shared/components/Field';
import { Screen } from '@shared/components/Screen';
import { ErrorState } from '@shared/components/States';
import { Gold, Muted, Title } from '@shared/components/Text';
import { useAuthStore } from '@stores/auth';

/**
 * Sign in on a phone number.
 *
 * Two steps on one screen rather than two screens, because the second step is
 * six digits and pushing a route for it loses the number they just typed if
 * they go back. A client the shop has never met is asked for a name only at
 * the point it is actually needed.
 */
export function ClientLoginScreen({ navigation }: AuthScreenProps<'ClientLogin'>) {
    const signIn = useAuthStore((state) => state.signIn);

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
        } catch (caught) {
            setError(errorMessage(caught, 'That code did not work.'));
        } finally {
            setBusy(false);
        }
    }

    return (
        <Screen>
            <Title>{step === 'phone' ? 'Your number' : 'Check your phone'}</Title>

            <Muted className="mb-6 mt-2 leading-6">
                {step === 'phone'
                    ? 'We will text you a six digit code. No password to remember.'
                    : `We sent a code to ${phone}.`}
            </Muted>

            {error ? <ErrorState message={error} /> : null}

            <View className="mt-4">
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
                            <View className="mb-4 rounded-xl border border-gold/40 bg-panel px-4 py-3">
                                <Muted>No SMS channel is configured yet, so here is the code:</Muted>
                                <Gold className="mt-1 text-2xl tracking-[6px]">{devCode}</Gold>
                            </View>
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
                        className="mt-2"
                    />
                </>
            )}

            <Button
                label="Back"
                variant="ghost"
                onPress={() => navigation.goBack()}
                className="mt-6"
            />
        </Screen>
    );
}
