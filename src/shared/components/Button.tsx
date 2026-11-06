import { ActivityIndicator, Pressable, Text } from 'react-native';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';

const STYLES: Record<Variant, { box: string; label: string }> = {
    primary: { box: 'bg-gold', label: 'text-ink font-semibold' },
    secondary: { box: 'bg-panel-alt border border-white/15', label: 'text-bone font-semibold' },
    ghost: { box: 'bg-transparent', label: 'text-gold font-semibold' },
    danger: { box: 'bg-transparent border border-stop', label: 'text-stop font-semibold' },
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
            className={`min-h-[52px] items-center justify-center rounded-xl px-5 ${style.box} ${
                isBlocked ? 'opacity-50' : 'active:opacity-80'
            } ${className}`}
        >
            {loading ? (
                <ActivityIndicator color={variant === 'primary' ? '#0d0d0d' : '#d9a947'} />
            ) : (
                <Text className={`text-base ${style.label}`}>{label}</Text>
            )}
        </Pressable>
    );
}
