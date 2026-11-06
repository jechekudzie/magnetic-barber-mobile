import { useState } from 'react';

import { staffLogin } from '@api/auth';
import { errorMessage } from '@api/client';
import type { AuthScreenProps } from '@navigation/types';
import { Button } from '@shared/components/Button';
import { Field } from '@shared/components/Field';
import { Screen } from '@shared/components/Screen';
import { ErrorState } from '@shared/components/States';
import { Muted, Title } from '@shared/components/Text';
import { useAuthStore } from '@stores/auth';

/**
 * The staff door. An email or a phone number, because not every barber has a
 * work email address.
 */
export function StaffLoginScreen({ navigation }: AuthScreenProps<'StaffLogin'>) {
    const signIn = useAuthStore((state) => state.signIn);

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
        } catch (caught) {
            setError(errorMessage(caught, 'Those details did not work.'));
        } finally {
            setBusy(false);
        }
    }

    return (
        <Screen>
            <Title>Staff sign in</Title>
            <Muted className="mb-6 mt-2 leading-6">
                Use your email or the phone number the shop has for you.
            </Muted>

            {error ? <ErrorState message={error} /> : null}

            <Field
                label="Email or phone"
                value={identifier}
                onChangeText={setIdentifier}
                placeholder="you@magneticbarber.co.zw"
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                className="mt-4"
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
                className="mt-6"
            />
        </Screen>
    );
}
