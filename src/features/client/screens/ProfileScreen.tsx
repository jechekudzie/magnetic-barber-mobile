import { useState } from 'react';
import { Alert, View } from 'react-native';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { changePassword, signOut as signOutRequest, updateProfile } from '@api/auth';
import { errorMessage } from '@api/client';
import type { ClientTabProps } from '@navigation/types';
import { Button } from '@shared/components/Button';
import { Field } from '@shared/components/Field';
import { LogoLockup } from '@shared/components/Logo';
import { Panel, Stat, StatRow } from '@shared/components/Panel';
import { Screen, ScreenHeader } from '@shared/components/Screen';
import { ErrorState } from '@shared/components/States';
import { Body, Eyebrow, Figure, Heading, Muted, Strong } from '@shared/components/Text';
import { useAuthStore } from '@stores/auth';

/**
 * Your account: who the shop has you down as, your points, your password,
 * and the way out.
 *
 * Signed out this is the sign in prompt instead, because there is no profile
 * to show somebody the shop has never met.
 */
export function ProfileScreen({ navigation }: ClientTabProps<'Profile'>) {
    const queryClient = useQueryClient();
    const { user, token, setUser, signOut } = useAuthStore();
    const signedIn = Boolean(token && user && !user.is_staff);

    const [editing, setEditing] = useState(false);
    const [name, setName] = useState(user?.name ?? '');
    const [email, setEmail] = useState(user?.email ?? '');

    const [changing, setChanging] = useState(false);
    const [current, setCurrent] = useState('');
    const [next, setNext] = useState('');
    const [confirm, setConfirm] = useState('');

    const [error, setError] = useState<string | null>(null);

    const saveProfile = useMutation({
        mutationFn: () =>
            updateProfile({ name: name.trim(), email: email.trim() === '' ? null : email.trim() }),
        onSuccess: (updated) => {
            setUser(updated);
            setEditing(false);
            setError(null);
        },
        onError: (caught) => setError(errorMessage(caught, 'We could not save that.')),
    });

    const savePassword = useMutation({
        mutationFn: () =>
            changePassword({
                current_password: current,
                password: next,
                password_confirmation: confirm,
            }),
        onSuccess: (result) => {
            setChanging(false);
            setCurrent('');
            setNext('');
            setConfirm('');
            setError(null);
            Alert.alert('Password changed', result.message);
        },
        onError: (caught) => setError(errorMessage(caught, 'We could not change that.')),
    });

    async function handleSignOut() {
        try {
            // Best effort: revoke server side, but a dead network must not
            // trap somebody signed in on a shared handset.
            await signOutRequest(false);
        } catch {
            // Ignored on purpose.
        }

        await signOut();
        queryClient.clear();
    }

    if (!signedIn) {
        return (
            <Screen>
                <View className="mb-8 items-center pt-6">
                    <LogoLockup width={200} />
                </View>

                <Panel className="px-5 py-6">
                    <Strong>No account yet</Strong>
                    <Muted className="mt-1.5 leading-5">
                        Booking never needs one. Sign in to keep your bookings, your points and
                        your details in one place.
                    </Muted>
                    <Button
                        label="Sign in or create an account"
                        className="mt-6"
                        onPress={() => navigation.navigate('ClientLogin')}
                    />
                </Panel>

                <Button
                    label="I work here"
                    variant="ghost"
                    className="mt-6"
                    onPress={() => navigation.navigate('StaffLogin')}
                />
            </Screen>
        );
    }

    return (
        <Screen>
            <ScreenHeader eyebrow="Your account" title={user!.name} />

            {error ? <ErrorState message={error} /> : null}

            {user?.client ? (
                <Panel className="mb-8 px-5 py-5">
                    <StatRow>
                        <Stat>
                            <Eyebrow className="text-smoke">Points</Eyebrow>
                            <Figure className="mt-1">{user.client.points}</Figure>
                        </Stat>
                        <Stat>
                            <Eyebrow className="text-smoke">Visits</Eyebrow>
                            <Figure className="mt-1 text-bone">{user.client.visit_count}</Figure>
                        </Stat>
                        <Stat>
                            <Eyebrow className="text-smoke">Account</Eyebrow>
                            <Strong className="mt-2">{user.client.account_number}</Strong>
                        </Stat>
                    </StatRow>
                </Panel>
            ) : null}

            <Heading className="mb-3">Your details</Heading>

            {editing ? (
                <>
                    <Field
                        label="Your name"
                        value={name}
                        onChangeText={setName}
                        autoCapitalize="words"
                        textContentType="name"
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

                    <View className="flex-row">
                        <Button
                            label="Save"
                            className="flex-1"
                            loading={saveProfile.isPending}
                            disabled={name.trim().length < 2}
                            onPress={() => saveProfile.mutate()}
                        />
                        <Button
                            label="Cancel"
                            variant="secondary"
                            className="ml-2 flex-1"
                            onPress={() => {
                                setName(user?.name ?? '');
                                setEmail(user?.email ?? '');
                                setEditing(false);
                                setError(null);
                            }}
                        />
                    </View>
                </>
            ) : (
                <Panel className="px-5 py-5">
                    <Eyebrow className="text-smoke">Name</Eyebrow>
                    <Body className="mt-1.5">{user!.name}</Body>

                    <Eyebrow className="mt-4 text-smoke">Mobile</Eyebrow>
                    <Body className="mt-1.5">{user!.phone_display ?? user!.phone}</Body>

                    <Eyebrow className="mt-4 text-smoke">Email</Eyebrow>
                    <Body className="mt-1.5">{user!.email ?? 'Not given'}</Body>

                    <Button
                        label="Edit details"
                        variant="secondary"
                        className="mt-6"
                        onPress={() => setEditing(true)}
                    />
                </Panel>
            )}

            <Heading className="mb-3 mt-9">Password</Heading>

            {changing ? (
                <>
                    <Field
                        label="Current password"
                        value={current}
                        onChangeText={setCurrent}
                        secureTextEntry
                        textContentType="password"
                    />
                    <Field
                        label="New password"
                        value={next}
                        onChangeText={setNext}
                        secureTextEntry
                        textContentType="newPassword"
                        hint="At least eight characters."
                    />
                    <Field
                        label="New password again"
                        value={confirm}
                        onChangeText={setConfirm}
                        secureTextEntry
                        textContentType="newPassword"
                    />

                    <View className="flex-row">
                        <Button
                            label="Change it"
                            className="flex-1"
                            loading={savePassword.isPending}
                            disabled={current === '' || next.length < 8 || confirm !== next}
                            onPress={() => savePassword.mutate()}
                        />
                        <Button
                            label="Cancel"
                            variant="secondary"
                            className="ml-2 flex-1"
                            onPress={() => {
                                setChanging(false);
                                setCurrent('');
                                setNext('');
                                setConfirm('');
                                setError(null);
                            }}
                        />
                    </View>
                </>
            ) : (
                <Panel className="px-5 py-5">
                    <Muted className="leading-5">
                        Changing your password signs out every other device.
                    </Muted>
                    <Button
                        label="Change password"
                        variant="secondary"
                        className="mt-5"
                        onPress={() => setChanging(true)}
                    />
                </Panel>
            )}

            <Button
                label="Sign out"
                variant="danger"
                className="mt-9"
                onPress={() =>
                    Alert.alert('Sign out?', 'Your bookings stay exactly where they are.', [
                        { text: 'Stay', style: 'cancel' },
                        {
                            text: 'Sign out',
                            style: 'destructive',
                            onPress: () => void handleSignOut(),
                        },
                    ])
                }
            />
        </Screen>
    );
}
