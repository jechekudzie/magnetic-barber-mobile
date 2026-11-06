import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { DarkTheme, NavigationContainer } from '@react-navigation/native';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';

import { asyncStoragePersister, queryClient } from '@api/queryClient';
import { RootNavigator } from '@navigation/RootNavigator';

import './global.css';

/**
 * The shop is black and gold everywhere it appears, so the navigation chrome
 * is themed rather than left on React Navigation's defaults — otherwise the
 * gaps around a screen flash white on every push.
 */
const theme = {
    ...DarkTheme,
    colors: {
        ...DarkTheme.colors,
        primary: '#d9a947',
        background: '#0d0d0d',
        card: '#1b1b1b',
        text: '#ffffff',
        border: 'rgba(255,255,255,0.08)',
    },
};

export default function App() {
    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
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
        </GestureHandlerRootView>
    );
}
