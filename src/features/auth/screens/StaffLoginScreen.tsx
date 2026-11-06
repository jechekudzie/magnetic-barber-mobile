import { useState } from 'react';
import { View } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';

import { staffLogin } from '@api/auth';
import { errorMessage } from '@api/client';
import type { ClientStackProps } from '@navigation/types';
import { Button } from '@shared/components/Button';
import { Field } from '@shared/components/Field';
import { LogoLockup } from '@shared/components/Logo';
import { Screen } from '@shared/components/Screen';
import { ErrorState } from '@shared/components/States';
import { Display, Eyebrow, Muted } from '@shared/components/Text';
import { useAuthStore } from '@stores/auth';

/**
 * The staff door.
 *
 * Staff hold passwords, so this is one step. The identifier is an email or a
 * phone number, because not every barber has a work email: the shop creates
 * several with a number and no address at all.
 *
 * Signing in here swaps the whole app — the navigator reads is_staff and
 * builds the diary instead of the booking tabs.
 */
export function StaffLoginScreen({ navigation }: ClientStackProps<'StaffLogin'>) {
    const signIn = useAuthStore((state) => state.signIn);
    const queryClient = useQueryClient();

    const [identifier, setIdentifier] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [busy, setBusy] = useState(false);

    async function submit() {
        setBusy(true);
        setError(null);

        try {
            const { token, user } = await staffLogin({ identifier, password });

            await signIn(token, user);
            queryClient.clear();
            // No navigation: the root navigator swaps to the staff app the
            // moment the store says this is a staff member.
        } catch (caught) {
            setError(errorMessage(caught, 'Those details did not work.'));
        } finally {
            setBusy(false);
        }
    }

    return (
        <Screen>
            <View className="mb-7 items-center pt-4">
                <LogoLockup width={190} />
            </View>

            <Eyebrow className="mb-3">Staff</Eyebrow>
            <Display>Sign in to work</Display>

            <Muted className="mb-7 mt-3 leading-6">
                Use your email, or the phone number the shop has for you.
            </Muted>

            {error ? <ErrorState message={error} /> : null}

            <View className="mt-2">
                <Field
                    label="Email or phone"
                    value={identifier}
                    onChangeText={setIdentifier}
                    placeholder="you@magneticbarber.co.zw"
                    autoCapitalize="none"
                    autoCorrect={false}
                    keyboardType="email-address"
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
            </View>

            <Button
                label="Sign in"
                onPress={submit}
                loading={busy}
                disabled={identifier.trim() === '' || password === ''}
            />

            <Button
                label="Back"
                variant="ghost"
                onPress={() => navigation.goBack()}
                className="mt-4"
            />
        </Screen>
    );
}
