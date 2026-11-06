import { Pressable, View } from 'react-native';
import { Bell, ChevronLeft } from 'lucide-react-native';

import { LogoMark } from '@shared/components/Logo';
import { Eyebrow, Muted } from '@shared/components/Text';
import { COLORS } from '@theme/fonts';

/**
 * The bar across the top of every screen.
 *
 * The mark on the left, so the shop is present without the logo taking up a
 * headline's worth of room, and the bell on the right where a thumb expects
 * it. On a pushed screen the mark gives way to a back chevron, because one
 * tap back matters more than branding somebody is passing through.
 */
export function TopBar({
    title,
    onBack,
    unread = 0,
    onBell,
}: {
    /** A quiet label between the mark and the bell. Usually the branch. */
    title?: string;
    onBack?: () => void;
    unread?: number;
    onBell?: () => void;
}) {
    return (
        <View className="flex-row items-center justify-between px-5 pb-3 pt-1">
            <View className="min-w-0 flex-1 flex-row items-center">
                {onBack ? (
                    <Pressable
                        accessibilityRole="button"
                        accessibilityLabel="Go back"
                        onPress={onBack}
                        hitSlop={12}
                        className="-ml-1 flex-row items-center py-1 pr-2"
                    >
                        <ChevronLeft size={24} color={COLORS.gold} />
                    </Pressable>
                ) : (
                    <LogoMark size={30} />
                )}

                {title ? (
                    <Eyebrow className="ml-2.5 flex-1" numberOfLines={1}>
                        {title}
                    </Eyebrow>
                ) : null}
            </View>

            <Pressable
                accessibilityRole="button"
                accessibilityLabel={
                    unread > 0 ? `Notifications, ${unread} unread` : 'Notifications'
                }
                onPress={onBell}
                hitSlop={12}
                className="h-10 w-10 items-center justify-center rounded-full border border-white/[0.08] bg-panel active:bg-panel-alt"
            >
                <Bell size={18} color={COLORS.gold} />

                {unread > 0 ? (
                    <View className="absolute right-1.5 top-1.5 min-w-[16px] items-center justify-center rounded-full bg-stop px-1">
                        <Muted className="text-[10px] leading-4 text-bone">
                            {unread > 9 ? '9+' : unread}
                        </Muted>
                    </View>
                ) : null}
            </Pressable>
        </View>
    );
}
