import { ReactNode } from 'react';
import { ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

/**
 * The dark gold room every screen sits in. The shop is black and gold on its
 * printed cards and on its website, and the app does not get to be different.
 */
export function Screen({
    children,
    scroll = true,
    footer,
}: {
    children: ReactNode;
    scroll?: boolean;
    footer?: ReactNode;
}) {
    return (
        <SafeAreaView className="flex-1 bg-ink" edges={['top', 'left', 'right']}>
            {scroll ? (
                <ScrollView
                    className="flex-1"
                    contentContainerClassName="px-5 pt-4 pb-10"
                    keyboardShouldPersistTaps="handled"
                >
                    {children}
                </ScrollView>
            ) : (
                <View className="flex-1 px-5 pt-4">{children}</View>
            )}

            {footer ? (
                <View className="border-t border-white/10 bg-panel px-5 pb-6 pt-4">{footer}</View>
            ) : null}
        </SafeAreaView>
    );
}
