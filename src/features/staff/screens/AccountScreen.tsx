import { Alert, View } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';

import { signOut as signOutRequest } from '@api/auth';
import { Button } from '@shared/components/Button';
import { Panel } from '@shared/components/Panel';
import { Screen, ScreenHeader } from '@shared/components/Screen';
import { Body, Eyebrow, Heading, Muted, Strong } from '@shared/components/Text';
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
        <Screen topBar={{ title: 'Account' }}>
            <ScreenHeader
                eyebrow="Account"
                title={user?.staff?.display_name ?? user?.name ?? 'You'}
            >
                <Muted className="mt-3">
                    {user?.staff?.title ?? user?.roles.join(', ')}
                </Muted>
            </ScreenHeader>

            {user && user.branches.length > 1 ? (
                <>
                    <Heading className="mb-3 mt-8">Working at</Heading>
                    {user.branches.map((branch) => {
                        const active = branch.id === branchId;

                        return (
                            <Panel
                                key={branch.id}
                                accent={active}
                                className="mb-2 px-4 py-4"
                                onPress={() => {
                                    setBranch(branch.id);
                                    // Everything on screen was scoped to the
                                    // branch we just left.
                                    queryClient.clear();
                                }}
                            >
                                <Strong>{branch.name}</Strong>
                                {active ? <Eyebrow className="mt-1.5">Current</Eyebrow> : null}
                            </Panel>
                        );
                    })}
                </>
            ) : null}

            <Heading className="mb-3 mt-8">What you can do here</Heading>
            <Panel className="px-5 py-5">
                {(user?.roles ?? []).map((role) => (
                    <Body key={role} className="capitalize">
                        {role.replace('-', ' ')}
                    </Body>
                ))}
                <Muted className="mt-2.5 leading-5">
                    {user?.permissions.length ?? 0} permissions at this branch. What you can see
                    and do is set by the shop, not by this app.
                </Muted>
            </Panel>

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
