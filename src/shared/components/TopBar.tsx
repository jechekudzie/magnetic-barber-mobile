import { Pressable, View } from 'react-native';
import { Bell, ChevronLeft } from 'lucide-react-native';

import { LogoMark } from '@shared/components/Logo';
import { Eyebrow, Muted } from '@shared/components/Text';
import { useShopStatus } from '@shared/useShopStatus';
import { COLORS } from '@theme/fonts';

/**
 * The bar across the top of every screen.
 *
 * The mark on the left so the shop is present without a headline's worth of
 * room given to a logo, and the bell on the right where a thumb expects it.
 * On a pushed screen the mark gives way to a back chevron: one tap back
 * matters more than branding to somebody passing through.
 *
 * The middle carries whether the shop is open right now. That is the question
 * a client actually has before setting off, and it is the only thing worth
 * putting in a strip of screen this narrow.
 */
export function TopBar({
    title,
    onBack,
    unread = 0,
    onBell,
    showStatus = true,
}: {
    /** A quiet label under the mark. Usually the branch. */
    title?: string;
    onBack?: () => void;
    unread?: number;
    onBell?: () => void;
    showStatus?: boolean;
}) {
    const status = useShopStatus();

    return (
        <View className="flex-row items-center justify-between px-5 pb-3 pt-1.5">
            <View className="min-w-0 flex-1 flex-row items-center">
                {onBack ? (
                    <Pressable
                        accessibilityRole="button"
                        accessibilityLabel="Go back"
                        onPress={onBack}
                        hitSlop={12}
                        className="-ml-2 h-10 w-10 items-center justify-center rounded-full active:bg-panel"
                    >
                        <ChevronLeft size={24} color={COLORS.gold} />
                    </Pressable>
                ) : (
                    <LogoMark size={32} />
                )}

                <View className="ml-2.5 min-w-0 flex-1">
                    {title ? (
                        <Eyebrow numberOfLines={1}>{title}</Eyebrow>
                    ) : (
                        <Eyebrow numberOfLines={1}>Magnetic</Eyebrow>
                    )}

                    {showStatus && status ? (
                        <View className="mt-1 flex-row items-center">
                            {/* A dot reads faster than the word itself. */}
                            <View
                                className={`mr-1.5 h-1.5 w-1.5 rounded-full ${
                                    status.open ? 'bg-go' : 'bg-smoke'
                                }`}
                            />
                            <Muted className="text-[11px]" numberOfLines={1}>
                                {status.label}
                            </Muted>
                        </View>
                    ) : null}
                </View>
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
                    <View className="absolute right-1 top-1 min-w-[17px] items-center justify-center rounded-full border-2 border-ink bg-stop px-1">
                        <Muted className="text-[10px] leading-[14px] text-bone">
                            {unread > 9 ? '9+' : unread}
                        </Muted>
                    </View>
                ) : null}
            </Pressable>
        </View>
    );
}
