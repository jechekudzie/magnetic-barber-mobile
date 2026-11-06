import { TextInput, TextInputProps, View } from 'react-native';

import { Eyebrow, Muted } from '@shared/components/Text';
import { COLORS } from '@theme/fonts';

export function Field({
    label,
    error,
    hint,
    className = '',
    ...props
}: TextInputProps & { label: string; error?: string; hint?: string; className?: string }) {
    return (
        <View className={`mb-4 ${className}`}>
            <Eyebrow className="mb-2.5 text-smoke">{label}</Eyebrow>

            <TextInput
                accessibilityLabel={label}
                placeholderTextColor="#5f5a52"
                selectionColor={COLORS.gold}
                className={`min-h-[54px] rounded-xl border bg-panel px-4 font-sans text-base text-bone ${
                    error ? 'border-stop' : 'border-white/15'
                }`}
                {...props}
            />

            {error ? (
                <Muted className="mt-2 text-stop">{error}</Muted>
            ) : hint ? (
                <Muted className="mt-2">{hint}</Muted>
            ) : null}
        </View>
    );
}
