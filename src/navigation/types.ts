import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { CompositeScreenProps } from '@react-navigation/native';

import type { Appointment } from '@shared/types';

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
    /**
     * The confirmation slip. chosenBarber says whether the client asked for
     * that barber by name or the shop assigned one, which changes how the
     * slip is allowed to word it.
     */
    Booked: { appointment: Appointment; chosenBarber: boolean };
    /** `then` is where to land once the code checks out. */
    ClientLogin: { then?: keyof ClientTabParamList } | undefined;
    StaffLogin: undefined;
    /** One booking in full, reached from the home card or the list. */
    BookingDetail: { id: string };
    /** Sending the shop a payment and its proof. */
    Pay: { id: string };
    /** Where the bell goes. */
    Notifications: undefined;
};

/**
 * Staff tabs sit inside a stack so a barber can open a job from the diary.
 * The job screen is where the cut is actually worked.
 */
export type StaffStackParamList = {
    Tabs: undefined;
    Job: { id: string };
};

export type ClientTabParamList = {
    Home: undefined;
    Prices: undefined;
    Book: { serviceId?: string } | undefined;
    Bookings: undefined;
    Loyalty: undefined;
    Profile: undefined;
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

export type StaffStackProps<T extends keyof StaffStackParamList> = NativeStackScreenProps<
    StaffStackParamList,
    T
>;

export type StaffTabProps<T extends keyof StaffTabParamList> = CompositeScreenProps<
    BottomTabScreenProps<StaffTabParamList, T>,
    NativeStackScreenProps<StaffStackParamList>
>;
