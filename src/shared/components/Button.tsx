import { ActivityIndicator, Pressable, Text } from 'react-native';

import { COLORS } from '@theme/fonts';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';

const STYLES: Record<Variant, { box: string; label: string }> = {
    primary: { box: 'bg-gold', label: 'font-semibold text-ink' },
    secondary: {
        box: 'border border-white/15 bg-panel-alt',
        label: 'font-semibold text-bone',
    },
    ghost: { box: 'bg-transparent', label: 'font-semibold text-gold' },
    danger: { box: 'border border-stop bg-transparent', label: 'font-semibold text-stop' },
};

export function Button({
    label,
    onPress,
    variant = 'primary',
    disabled = false,
    loading = false,
    className = '',
}: {
    label: string;
    onPress: () => void;
    variant?: Variant;
    disabled?: boolean;
    loading?: boolean;
    className?: string;
}) {
    const isBlocked = disabled || loading;
    const style = STYLES[variant];

    return (
        <Pressable
            accessibilityRole="button"
            accessibilityState={{ disabled: isBlocked, busy: loading }}
            disabled={isBlocked}
            onPress={onPress}
            className={`min-h-[54px] items-center justify-center rounded-xl px-5 ${style.box} ${
                isBlocked ? 'opacity-50' : 'active:opacity-80'
            } ${className}`}
        >
            {loading ? (
                <ActivityIndicator color={variant === 'primary' ? COLORS.ink : COLORS.gold} />
            ) : (
                <Text className={`text-base ${style.label}`}>{label}</Text>
            )}
        </Pressable>
    );
}
