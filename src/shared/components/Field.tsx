import { TextInput, TextInputProps, View } from 'react-native';

import { Muted } from '@shared/components/Text';

export function Field({
    label,
    error,
    hint,
    className = '',
    ...props
}: TextInputProps & { label: string; error?: string; hint?: string; className?: string }) {
    return (
        <View className={`mb-4 ${className}`}>
            <Muted className="mb-2 uppercase tracking-wide">{label}</Muted>

            <TextInput
                accessibilityLabel={label}
                placeholderTextColor="#6b655c"
                className={`min-h-[52px] rounded-xl border bg-panel px-4 text-base text-bone ${
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
