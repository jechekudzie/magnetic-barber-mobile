import { Alert, Pressable, View } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';

import { signOut as signOutRequest } from '@api/auth';
import { Button } from '@shared/components/Button';
import { Screen } from '@shared/components/Screen';
import { Body, Gold, Heading, Muted, Title } from '@shared/components/Text';
import { useAuthStore } from '@stores/auth';

/**
 * Who you are, which branch you are acting in, and the way out.
 *
 * The branch switcher matters more than it looks: roles are granted per
 * branch, so switching here changes what the rest of the app will let you do.
 */
export function AccountScreen() {
    const queryClient = useQueryClient();
    const { user, branchId, setBranch, signOut } = useAuthStore();

    async function handleSignOut() {
        try {
            // Best effort: revoke server side, but a dead network must not
            // trap somebody signed in on a shared handset.
            await signOutRequest(user?.is_staff ?? false);
        } catch {
            // Ignored on purpose.
        }

        await signOut();
        queryClient.clear();
    }

    return (
        <Screen>
            <Title>{user?.staff?.display_name ?? user?.name}</Title>
            <Muted className="mt-2">{user?.staff?.title ?? user?.roles.join(', ')}</Muted>

            {user && user.branches.length > 1 ? (
                <>
                    <Heading className="mb-3 mt-8">Working at</Heading>
                    {user.branches.map((branch) => {
                        const active = branch.id === branchId;

                        return (
                            <Pressable
                                key={branch.id}
                                accessibilityRole="button"
                                accessibilityState={{ selected: active }}
                                onPress={() => {
                                    setBranch(branch.id);
                                    // Everything on screen was scoped to the
                                    // branch we just left.
                                    queryClient.clear();
                                }}
                                className={`mb-2 rounded-xl border px-4 py-4 ${
                                    active ? 'border-gold bg-panel-alt' : 'border-white/10 bg-panel'
                                }`}
                            >
                                <Body className="font-semibold">{branch.name}</Body>
                                {active ? <Gold className="mt-1 text-sm">Current</Gold> : null}
                            </Pressable>
                        );
                    })}
                </>
            ) : null}

            <Heading className="mb-3 mt-8">What you can do here</Heading>
            <View className="rounded-2xl border border-white/10 bg-panel p-5">
                {(user?.roles ?? []).map((role) => (
                    <Body key={role} className="capitalize">
                        {role.replace('-', ' ')}
                    </Body>
                ))}
                <Muted className="mt-2">
                    {user?.permissions.length ?? 0} permissions at this branch.
                </Muted>
            </View>

            <Button
                label="Sign out"
                variant="danger"
                className="mt-8"
                onPress={() =>
                    Alert.alert('Sign out?', 'You will need your password to get back in.', [
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
