import { ReactNode, useState } from 'react';
import {
    Image,
    KeyboardAvoidingView,
    NativeScrollEvent,
    NativeSyntheticEvent,
    Platform,
    RefreshControl,
    ScrollView,
    View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { LogoMark } from '@shared/components/Logo';
import { TopBar } from '@shared/components/TopBar';
import { Display, Eyebrow } from '@shared/components/Text';
import { COLORS } from '@theme/fonts';

const GLOW = require('@assets/brand/glow.png');

/**
 * The warm gold wash the website puts behind every headline.
 *
 * It is a baked PNG rather than a gradient component on purpose. The site's
 * is a radial gradient anchored at the top centre, which no linear gradient
 * reproduces, and every gradient library for React Native is a native module
 * — a new native module means a full rebuild before the app will even start,
 * which is a steep price for decoration. A 14KB image needs nothing.
 *
 * It is drawn outside the safe area, so the colour runs up behind the status
 * bar and the notch. Inside it, the inset left a flat black band across the
 * top of every screen and the brand appeared to start an inch down the phone.
 */
function Glow({ topInset }: { topInset: number }) {
    return (
        <Image
            source={GLOW}
            accessibilityIgnoresInvertColors
            pointerEvents="none"
            resizeMode="stretch"
            style={{
                position: 'absolute',
                left: 0,
                right: 0,
                top: 0,
                height: 300 + topInset,
            }}
        />
    );
}

/**
 * The dark gold room every screen sits in.
 *
 * Keyboard handling lives here rather than in each screen, because every
 * screen that takes typing had the same bug: the keyboard comes up and sits
 * on top of the field being filled, and on the sign in screens that is the
 * password — the one field somebody cannot type blind.
 *
 * Two things fix it together. automaticallyAdjustKeyboardInsets lets iOS add
 * the keyboard's height to the scroll insets, so a focused field can always
 * be scrolled to. KeyboardAvoidingView lifts the footer, which is where the
 * Continue button lives and is otherwise the first thing buried.
 */
export function Screen({
    children,
    scroll = true,
    footer,
    onRefresh,
    refreshing = false,
    glow = true,
    topBar,
}: {
    children: ReactNode;
    scroll?: boolean;
    footer?: ReactNode;
    onRefresh?: () => void;
    refreshing?: boolean;
    glow?: boolean;
    /** The bar across the top: mark or back, the shop's state, and the bell. */
    topBar?: {
        title?: string;
        onBack?: () => void;
        unread?: number;
        onBell?: () => void;
        showStatus?: boolean;
    };
}) {
    const insets = useSafeAreaInsets();

    /*
     * The bar has no border until the content starts sliding under it. A
     * permanent line boxes the screen in; a line that appears on scroll says
     * "there is more above" at the moment that is true.
     */
    const [lifted, setLifted] = useState(false);

    function watchScroll(event: NativeSyntheticEvent<NativeScrollEvent>) {
        const y = event.nativeEvent.contentOffset.y;

        if (y > 4 !== lifted) {
            setLifted(y > 4);
        }
    }

    const body = scroll ? (
        <ScrollView
            className="flex-1"
            contentContainerClassName="px-5 pt-3 pb-12"
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="interactive"
            // iOS adds the keyboard height to the scroll insets, so whatever
            // is focused can always be brought above it.
            automaticallyAdjustKeyboardInsets
            showsVerticalScrollIndicator={false}
            onScroll={topBar ? watchScroll : undefined}
            scrollEventThrottle={32}
            refreshControl={
                onRefresh ? (
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor={COLORS.gold}
                        colors={[COLORS.gold]}
                        progressViewOffset={8}
                    />
                ) : undefined
            }
        >
            {children}
        </ScrollView>
    ) : (
        <View className="flex-1 px-5 pt-3">{children}</View>
    );

    return (
        // The glow sits on this, outside the inset, so it reaches the notch.
        <View className="flex-1 bg-ink">
            {glow ? <Glow topInset={insets.top} /> : null}

            <SafeAreaView className="flex-1" edges={['top', 'left', 'right']}>
                {topBar ? (
                    <View
                        className={
                            lifted ? 'border-b border-white/[0.08] bg-ink/95' : 'border-b border-transparent'
                        }
                    >
                        <TopBar {...topBar} />
                    </View>
                ) : null}

                <KeyboardAvoidingView
                    className="flex-1"
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    // The safe area is already accounted for above; counting
                    // it twice leaves a gap the height of the home indicator.
                    keyboardVerticalOffset={Platform.OS === 'ios' ? insets.top : 0}
                >
                    {body}

                    {footer ? (
                        <View className="border-t border-white/[0.08] bg-panel px-5 pb-7 pt-4">
                            {footer}
                        </View>
                    ) : null}
                </KeyboardAvoidingView>
            </SafeAreaView>
        </View>
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
    withMark = false,
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
