import { useCallback, useEffect } from 'react';
import { View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { DarkTheme, NavigationContainer } from '@react-navigation/native';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';

import { asyncStoragePersister, queryClient } from '@api/queryClient';
import { RootNavigator } from '@navigation/RootNavigator';
import { COLORS, FONTS } from '@theme/fonts';

import './global.css';

/*
 * Hold the splash until the brand faces are in memory. Without this the first
 * frame paints in the system font and then reflows into the slab, which looks
 * like a bug and is the most visible way an app says it was thrown together.
 */
void SplashScreen.preventAutoHideAsync();

/**
 * The shop is black and gold everywhere it appears, so the navigation chrome
 * is themed rather than left on React Navigation's defaults — otherwise the
 * gaps around a screen flash white on every push.
 */
const theme = {
    ...DarkTheme,
    colors: {
        ...DarkTheme.colors,
        primary: COLORS.gold,
        background: COLORS.ink,
        card: COLORS.panel,
        text: COLORS.bone,
        border: COLORS.hairline,
        notification: COLORS.gold,
    },
};

export default function App() {
    const [fontsLoaded, fontError] = useFonts(FONTS);

    // A font that will not load must not leave the app on a splash for ever.
    // System faces are a worse app, not a broken one.
    const ready = fontsLoaded || Boolean(fontError);

    useEffect(() => {
        if (fontError) {
            console.warn('[fonts] falling back to system faces', fontError);
        }
    }, [fontError]);

    const onLayout = useCallback(() => {
        if (ready) {
            void SplashScreen.hideAsync();
        }
    }, [ready]);

    if (!ready) {
        return null;
    }

    return (
        <GestureHandlerRootView style={{ flex: 1 }} onLayout={onLayout}>
            <View className="flex-1 bg-ink">
                <SafeAreaProvider>
                    <PersistQueryClientProvider
                        client={queryClient}
                        persistOptions={{ persister: asyncStoragePersister }}
                    >
                        <NavigationContainer theme={theme}>
                            <StatusBar style="light" />
                            <RootNavigator />
                        </NavigationContainer>
                    </PersistQueryClientProvider>
                </SafeAreaProvider>
            </View>
        </GestureHandlerRootView>
    );
}
