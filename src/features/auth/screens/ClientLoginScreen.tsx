import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';

import { clientLogin, registerClient } from '@api/auth';
import { errorMessage } from '@api/client';
import type { ClientStackProps } from '@navigation/types';
import { Button } from '@shared/components/Button';
import { Field } from '@shared/components/Field';
import { PhoneField, isCompleteNumber, toE164 } from '@shared/components/PhoneField';
import { LogoLockup } from '@shared/components/Logo';
import { Screen } from '@shared/components/Screen';
import { ErrorState } from '@shared/components/States';
import { Body, Display, Eyebrow, Muted } from '@shared/components/Text';
import { useAuthStore } from '@stores/auth';

type Mode = 'login' | 'register';

/**
 * Client sign in: an email or a phone number, and a password.
 *
 * Not a door anyone has to walk through — booking works without it. This buys
 * a returning client their history, their points, and the ability to cancel.
 *
 * Registering with a number the shop has already seen attaches a password to
 * that existing account rather than starting a second file, so somebody who
 * has been booking as a guest keeps their visits and their points.
 */
export function ClientLoginScreen({ navigation, route }: ClientStackProps<'ClientLogin'>) {
    const signIn = useAuthStore((state) => state.signIn);
    const queryClient = useQueryClient();

    const [mode, setMode] = useState<Mode>('login');
    const [identifier, setIdentifier] = useState('');
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [busy, setBusy] = useState(false);

    async function submit() {
        setBusy(true);
        setError(null);

        try {
            const { token, user } =
                mode === 'login'
                    ? await clientLogin({ identifier: identifier.trim(), password })
                    : await registerClient({
                          name: name.trim(),
                          phone: toE164(phone),
                          email: email.trim() === '' ? undefined : email.trim(),
                          password,
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
            setError(
                errorMessage(
                    caught,
                    mode === 'login'
                        ? 'Those details did not work.'
                        : 'We could not create that account.',
                ),
            );
        } finally {
            setBusy(false);
        }
    }

    const canSubmit =
        mode === 'login'
            ? identifier.trim().length > 2 && password.length > 0
            : name.trim().length >= 2 && isCompleteNumber(phone) && password.length >= 8;

    return (
        <Screen>
            <View className="mb-7 items-center pt-4">
                <LogoLockup width={185} />
            </View>

            <View className="mb-7 flex-row rounded-xl border border-white/[0.08] bg-panel p-1">
                {(
                    [
                        ['login', 'Sign in'],
                        ['register', 'Create account'],
                    ] as const
                ).map(([value, label]) => (
                    <Pressable
                        key={value}
                        accessibilityRole="button"
                        accessibilityState={{ selected: mode === value }}
                        onPress={() => {
                            setMode(value);
                            setError(null);
                        }}
                        className={`flex-1 items-center rounded-lg py-3 ${
                            mode === value ? 'bg-gold' : ''
                        }`}
                    >
                        <Body
                            className={`text-sm ${
                                mode === value ? 'font-semibold text-ink' : 'text-smoke'
                            }`}
                        >
                            {label}
                        </Body>
                    </Pressable>
                ))}
            </View>

            <Eyebrow className="mb-3">{mode === 'login' ? 'Welcome back' : 'New here'}</Eyebrow>
            <Display>{mode === 'login' ? 'Sign in' : 'Create your account'}</Display>

            <Muted className="mb-7 mt-3 leading-6">
                {mode === 'login'
                    ? 'Use the email or the mobile number on your account. The number works however you write it — 0774685845 or +263774685845.'
                    : 'Booked with us before on this number? Your visits and points come with you.'}
            </Muted>

            {error ? <ErrorState message={error} /> : null}

            {mode === 'login' ? (
                <>
                    <Field
                        label="Email or mobile"
                        value={identifier}
                        onChangeText={setIdentifier}
                        placeholder="078 187 9820"
                        autoCapitalize="none"
                        autoCorrect={false}
                        keyboardType="email-address"
                        textContentType="username"
                        autoFocus
                    />

                    <Field
                        label="Password"
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry
                        textContentType="password"
                        returnKeyType="go"
                        onSubmitEditing={submit}
                    />
                </>
            ) : (
                <>
                    <Field
                        label="Your name"
                        value={name}
                        onChangeText={setName}
                        placeholder="Tendai Moyo"
                        autoCapitalize="words"
                        textContentType="name"
                        autoFocus
                    />

                    <PhoneField
                        value={phone}
                        onChangeText={setPhone}
                        hint="This is how the shop knows you, and how a booking you already made finds you."
                    />

                    <Field
                        label="Email (optional)"
                        value={email}
                        onChangeText={setEmail}
                        placeholder="you@example.com"
                        autoCapitalize="none"
                        autoCorrect={false}
                        keyboardType="email-address"
                        textContentType="emailAddress"
                    />

                    <Field
                        label="Password"
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry
                        textContentType="newPassword"
                        hint="At least eight characters."
                        returnKeyType="go"
                        onSubmitEditing={submit}
                    />
                </>
            )}

            <Button
                label={mode === 'login' ? 'Sign in' : 'Create account'}
                onPress={submit}
                loading={busy}
                disabled={!canSubmit}
            />

            <Button
                label="Not now"
                variant="ghost"
                onPress={() => navigation.goBack()}
                className="mt-3"
            />
        </Screen>
    );
}
