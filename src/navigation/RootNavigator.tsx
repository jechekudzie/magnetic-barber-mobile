import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import {
    CalendarDays,
    CircleUser,
    House,
    ReceiptText,
    Scissors,
    Tags,
    TrendingUp,
    Users,
} from 'lucide-react-native';

import { fetchMe } from '@api/auth';
import { ClientLoginScreen } from '@features/auth/screens/ClientLoginScreen';
import { StaffLoginScreen } from '@features/auth/screens/StaffLoginScreen';
import { WelcomeScreen } from '@features/auth/screens/WelcomeScreen';
import { BookScreen } from '@features/client/screens/BookScreen';
import { HomeScreen } from '@features/client/screens/HomeScreen';
import { MyBookingsScreen } from '@features/client/screens/MyBookingsScreen';
import { PriceListScreen } from '@features/client/screens/PriceListScreen';
import { AccountScreen } from '@features/staff/screens/AccountScreen';
import { DiaryScreen } from '@features/staff/screens/DiaryScreen';
import { EarningsScreen } from '@features/staff/screens/EarningsScreen';
import { TeamEarningsScreen } from '@features/staff/screens/TeamEarningsScreen';
import type { AuthStackParamList, ClientTabParamList, StaffTabParamList } from '@navigation/types';
import { useAuthStore } from '@stores/auth';

const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const ClientTabs = createBottomTabNavigator<ClientTabParamList>();
const StaffTabs = createBottomTabNavigator<StaffTabParamList>();

const TAB_STYLE = {
    headerShown: false,
    tabBarActiveTintColor: '#d9a947',
    tabBarInactiveTintColor: '#9c9488',
    tabBarStyle: {
        backgroundColor: '#1b1b1b',
        borderTopColor: 'rgba(255,255,255,0.08)',
    },
} as const;

function AuthNavigator() {
    return (
        <AuthStack.Navigator screenOptions={{ headerShown: false }}>
            <AuthStack.Screen name="Welcome" component={WelcomeScreen} />
            <AuthStack.Screen name="ClientLogin" component={ClientLoginScreen} />
            <AuthStack.Screen name="StaffLogin" component={StaffLoginScreen} />
        </AuthStack.Navigator>
    );
}

function ClientNavigator() {
    return (
        <ClientTabs.Navigator screenOptions={TAB_STYLE}>
            <ClientTabs.Screen
                name="Home"
                component={HomeScreen}
                options={{ tabBarIcon: ({ color, size }) => <House color={color} size={size} /> }}
            />
            <ClientTabs.Screen
                name="Prices"
                component={PriceListScreen}
                options={{ tabBarIcon: ({ color, size }) => <Tags color={color} size={size} /> }}
            />
            <ClientTabs.Screen
                name="Book"
                component={BookScreen}
                options={{ tabBarIcon: ({ color, size }) => <Scissors color={color} size={size} /> }}
            />
            <ClientTabs.Screen
                name="Bookings"
                component={MyBookingsScreen}
                options={{
                    tabBarIcon: ({ color, size }) => <ReceiptText color={color} size={size} />,
                }}
            />
        </ClientTabs.Navigator>
    );
}

/**
 * The staff side is assembled from permissions rather than from role names.
 *
 * A receptionist, a barber and the owner all hold a staff token and all land
 * here; what separates them is what they may do. The Team tab exists only for
 * somebody holding staff.commission.view, so a barber never sees a tab that
 * would 403 if they tapped it. The server checks the same permission again.
 */
function StaffNavigator() {
    const permissions = useAuthStore((state) => state.user?.permissions ?? []);
    const maySeeTeamEarnings = permissions.includes('staff.commission.view');
    const maySeeOwnEarnings = permissions.includes('report.view.own');

    return (
        <StaffTabs.Navigator screenOptions={TAB_STYLE}>
            <StaffTabs.Screen
                name="Diary"
                component={DiaryScreen}
                options={{
                    tabBarIcon: ({ color, size }) => <CalendarDays color={color} size={size} />,
                }}
            />

            {maySeeOwnEarnings ? (
                <StaffTabs.Screen
                    name="Earnings"
                    component={EarningsScreen}
                    options={{
                        tabBarIcon: ({ color, size }) => <TrendingUp color={color} size={size} />,
                    }}
                />
            ) : null}

            {maySeeTeamEarnings ? (
                <StaffTabs.Screen
                    name="Team"
                    component={TeamEarningsScreen}
                    options={{
                        tabBarIcon: ({ color, size }) => <Users color={color} size={size} />,
                    }}
                />
            ) : null}

            <StaffTabs.Screen
                name="Account"
                component={AccountScreen}
                options={{
                    tabBarIcon: ({ color, size }) => <CircleUser color={color} size={size} />,
                }}
            />
        </StaffTabs.Navigator>
    );
}

function Splash() {
    return (
        <View className="flex-1 items-center justify-center bg-ink">
            <ActivityIndicator color="#d9a947" />
        </View>
    );
}

export function RootNavigator() {
    const { token, user, isReady, hydrate, setUser } = useAuthStore();

    useEffect(() => {
        void hydrate();
    }, [hydrate]);

    /*
     * Re-read the profile whenever there is a token. Roles and permissions are
     * the shop's to change, not the app's to remember: a barber promoted to
     * manager this morning should not have to reinstall to get the Team tab.
     */
    const me = useQuery({
        queryKey: ['me'],
        queryFn: fetchMe,
        enabled: isReady && Boolean(token),
        staleTime: 1000 * 60 * 5,
    });

    useEffect(() => {
        if (me.data) {
            setUser(me.data);
        }
    }, [me.data, setUser]);

    // Hydrating, or holding a token whose profile has not arrived and was not
    // cached. Showing the sign in screen here would flash it at somebody who
    // is already signed in.
    if (!isReady || (token && !user)) {
        return <Splash />;
    }

    if (!token || !user) {
        return <AuthNavigator />;
    }

    return user.is_staff ? <StaffNavigator /> : <ClientNavigator />;
}
