import { ReactNode } from 'react';
import { Pressable, View } from 'react-native';

/**
 * The card surface every section of the website sits on: panel fill, a
 * hairline border at 8% white, generous corner radius. Accent raises the
 * border to gold for the one thing on screen that matters most.
 */
export function Panel({
    children,
    accent = false,
    className = '',
    onPress,
}: {
    children: ReactNode;
    accent?: boolean;
    className?: string;
    onPress?: () => void;
}) {
    const surface = `rounded-2xl border bg-panel ${
        accent ? 'border-gold/40' : 'border-white/[0.08]'
    } ${className}`;

    if (onPress) {
        return (
            <Pressable
                accessibilityRole="button"
                onPress={onPress}
                className={`${surface} active:bg-panel-alt`}
            >
                {children}
            </Pressable>
        );
    }

    return <View className={surface}>{children}</View>;
}

/**
 * A row of figures across one panel — points, visits, takings. Three is the
 * most that stays readable at phone width.
 */
export function StatRow({ children }: { children: ReactNode }) {
    return <View className="flex-row">{children}</View>;
}

export function Stat({ children }: { children: ReactNode }) {
    return <View className="flex-1 pr-3">{children}</View>;
}
