import { ReactNode } from 'react';
import { RefreshControl, ScrollView, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';

import { LogoMark } from '@shared/components/Logo';
import { Display, Eyebrow } from '@shared/components/Text';
import { COLORS } from '@theme/fonts';

/**
 * The dark gold room every screen sits in.
 *
 * The site opens each page with a warm radial glow behind the headline. A
 * radial gradient is awkward on native, so this is the same idea as a soft
 * vertical wash from the top — close enough that the two read as one brand,
 * and cheap enough to put on every screen.
 */
function Glow() {
    return (
        <LinearGradient
            colors={['rgba(217,169,71,0.14)', 'rgba(217,169,71,0.03)', 'transparent']}
            locations={[0, 0.45, 1]}
            pointerEvents="none"
            style={{ position: 'absolute', left: 0, right: 0, top: 0, height: 320 }}
        />
    );
}

export function Screen({
    children,
    scroll = true,
    footer,
    onRefresh,
    refreshing = false,
    glow = true,
}: {
    children: ReactNode;
    scroll?: boolean;
    footer?: ReactNode;
    onRefresh?: () => void;
    refreshing?: boolean;
    glow?: boolean;
}) {
    return (
        <SafeAreaView className="flex-1 bg-ink" edges={['top', 'left', 'right']}>
            {glow ? <Glow /> : null}

            {scroll ? (
                <ScrollView
                    className="flex-1"
                    contentContainerClassName="px-5 pt-3 pb-12"
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        onRefresh ? (
                            <RefreshControl
                                refreshing={refreshing}
                                onRefresh={onRefresh}
                                tintColor={COLORS.gold}
                                colors={[COLORS.gold]}
                            />
                        ) : undefined
                    }
                >
                    {children}
                </ScrollView>
            ) : (
                <View className="flex-1 px-5 pt-3">{children}</View>
            )}

            {footer ? (
                <View className="border-t border-white/[0.08] bg-panel px-5 pb-7 pt-4">
                    {footer}
                </View>
            ) : null}
        </SafeAreaView>
    );
}

/**
 * The opening of a screen: the mark, a gold eyebrow, then the headline. Same
 * three beats as every section of the website.
 */
export function ScreenHeader({
    eyebrow,
    title,
    children,
    withMark = true,
}: {
    eyebrow?: string;
    title: string;
    children?: ReactNode;
    withMark?: boolean;
}) {
    return (
        <View className="mb-7">
            {withMark ? (
                <View className="mb-4 flex-row items-center justify-between">
                    <LogoMark size={34} />
                    {eyebrow ? <Eyebrow>{eyebrow}</Eyebrow> : null}
                </View>
            ) : eyebrow ? (
                <Eyebrow className="mb-3">{eyebrow}</Eyebrow>
            ) : null}

            <Display>{title}</Display>

            {children}
        </View>
    );
}
