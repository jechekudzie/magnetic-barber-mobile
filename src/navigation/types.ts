import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { CompositeScreenProps } from '@react-navigation/native';

/**
 * The client side is not behind a login.
 *
 * Browsing, prices and booking all work signed out, because the website has
 * never asked for an account and making somebody sign up before they can book
 * is how a barbershop loses the booking. Signing in is a route inside this
 * stack rather than a gate in front of it, and it buys one thing: reading and
 * cancelling your own bookings.
 */
export type ClientStackParamList = {
    Tabs: undefined;
    /** `then` is where to land once the code checks out. */
    ClientLogin: { then?: keyof ClientTabParamList } | undefined;
    StaffLogin: undefined;
};

export type ClientTabParamList = {
    Home: undefined;
    Prices: undefined;
    Book: { serviceId?: string } | undefined;
    Bookings: undefined;
};

/** Staff do sign in, and see a different app entirely. */
export type StaffTabParamList = {
    Diary: undefined;
    Earnings: undefined;
    Team: undefined;
    Account: undefined;
};

export type ClientStackProps<T extends keyof ClientStackParamList> = NativeStackScreenProps<
    ClientStackParamList,
    T
>;

/**
 * Tab screens need to reach the stack above them to push the login route, so
 * their navigation prop is both.
 */
export type ClientTabProps<T extends keyof ClientTabParamList> = CompositeScreenProps<
    BottomTabScreenProps<ClientTabParamList, T>,
    NativeStackScreenProps<ClientStackParamList>
>;

export type StaffTabProps<T extends keyof StaffTabParamList> = BottomTabScreenProps<
    StaffTabParamList,
    T
>;
