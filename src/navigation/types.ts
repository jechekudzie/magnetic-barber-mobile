import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';

/** Signed out. */
export type AuthStackParamList = {
    Welcome: undefined;
    ClientLogin: undefined;
    StaffLogin: undefined;
};

/** Signed in as a client. */
export type ClientTabParamList = {
    Home: undefined;
    Prices: undefined;
    Book: { serviceId?: string } | undefined;
    Bookings: undefined;
};

/** Signed in as staff. */
export type StaffTabParamList = {
    Diary: undefined;
    Earnings: undefined;
    Team: undefined;
    Account: undefined;
};

export type AuthScreenProps<T extends keyof AuthStackParamList> = NativeStackScreenProps<
    AuthStackParamList,
    T
>;

export type ClientTabProps<T extends keyof ClientTabParamList> = BottomTabScreenProps<
    ClientTabParamList,
    T
>;

export type StaffTabProps<T extends keyof StaffTabParamList> = BottomTabScreenProps<
    StaffTabParamList,
    T
>;
