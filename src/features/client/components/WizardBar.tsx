import { View } from 'react-native';

import { Eyebrow, Muted } from '@shared/components/Text';

/**
 * Where you are in the booking, and how much is left.
 *
 * A progress bar rather than numbered dots: the steps are not all the same
 * size, and somebody three taps in wants to know they are nearly done, not
 * which numeral they are standing on.
 */
export function WizardBar({
    step,
    total,
    label,
}: {
    step: number;
    total: number;
    label: string;
}) {
    return (
        <View className="mb-6">
            <View className="mb-3 flex-row items-baseline justify-between">
                <Eyebrow>{label}</Eyebrow>
                <Muted>
                    Step {step} of {total}
                </Muted>
            </View>

            <View
                accessibilityRole="progressbar"
                accessibilityValue={{ min: 0, max: total, now: step }}
                className="h-1 flex-row overflow-hidden rounded-full bg-panel-alt"
            >
                {Array.from({ length: total }, (_, index) => (
                    <View
                        key={index}
                        className={`flex-1 ${index < step ? 'bg-gold' : 'bg-transparent'} ${
                            index > 0 ? 'ml-1' : ''
                        }`}
                    />
                ))}
            </View>
        </View>
    );
}
