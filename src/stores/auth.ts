import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { Me } from '@shared/types';

/**
 * Who is signed in, and on which side of the app.
 *
 * The token is the one piece of real value here, so it lives in the device
 * keystore rather than AsyncStorage: SecureStore is the iOS Keychain and the
 * Android Keystore, which survive a device backup being read. The rest —
 * which branch a staff member last picked, the cached profile — is ordinary
 * preference data and lives in AsyncStorage.
 */

const TOKEN_KEY = 'magnetic.token';

type AuthState = {
    token: string | null;
    user: Me | null;
    /** The branch a staff member is acting in. Sent as X-Branch-Id. */
    branchId: string | null;
    /** False until the persisted state and the keystore have both been read. */
    isReady: boolean;

    signIn: (token: string, user: Me) => Promise<void>;
    signOut: () => Promise<void>;
    setUser: (user: Me) => void;
    setBranch: (branchId: string) => void;
    hydrate: () => Promise<void>;
};

export const useAuthStore = create<AuthState>()(
    persist(
        (set, get) => ({
            token: null,
            user: null,
            branchId: null,
            isReady: false,

            signIn: async (token, user) => {
                await SecureStore.setItemAsync(TOKEN_KEY, token);

                set({
                    token,
                    user,
                    // Staff act in a branch; a client does not have one.
                    branchId: user.is_staff
                        ? (user.branches.find((b) => b.is_primary) ?? user.branches[0])?.id ?? null
                        : null,
                });
            },

            signOut: async () => {
                await SecureStore.deleteItemAsync(TOKEN_KEY);

                set({ token: null, user: null, branchId: null });
            },

            setUser: (user) => set({ user }),

            setBranch: (branchId) => set({ branchId }),

            /**
             * The token is not in the persisted slice, so it has to be read
             * back from the keystore on launch. Until that finishes the app
             * cannot tell a signed out user from one it has not looked up yet,
             * which is what isReady guards: showing the sign in screen for a
             * frame to somebody already signed in is the usual bug here.
             */
            hydrate: async () => {
                try {
                    const token = await SecureStore.getItemAsync(TOKEN_KEY);

                    set({ token, isReady: true });
                } catch {
                    // A keystore that cannot be read is a signed out device,
                    // not a crash.
                    set({ token: null, user: null, isReady: true });
                }

                // A cached profile with no token is a half signed out state.
                if (!get().token && get().user) {
                    set({ user: null, branchId: null });
                }
            },
        }),
        {
            name: 'magnetic.auth',
            storage: createJSONStorage(() => AsyncStorage),
            // Deliberately not the token: that belongs in the keystore.
            partialize: (state) => ({ user: state.user, branchId: state.branchId }),
        },
    ),
);

/** Whether the signed in staff member holds a permission at this branch. */
export function useHasPermission(permission: string): boolean {
    return useAuthStore((state) => state.user?.permissions.includes(permission) ?? false);
}
