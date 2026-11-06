import { Pressable, Text, View } from 'react-native';
import { Check, Clock } from 'lucide-react-native';

import type { Service } from '@shared/types';
import { Muted, Strong } from '@shared/components/Text';
import { COLORS } from '@theme/fonts';

/**
 * One line of the price list.
 *
 * is_from_price is the whole reason this is not just a name and a number: the
 * tints are printed "From $20, depending with colour", and showing a flat $20
 * would be quoting a price the shop cannot honour.
 */
export function PriceRow({
    service,
    selected = false,
    onPress,
}: {
    service: Service;
    selected?: boolean;
    onPress?: () => void;
}) {
    const price = service.is_free ? 'Free' : (service.price?.formatted ?? '—');

    return (
        <Pressable
            disabled={!onPress}
            onPress={onPress}
            accessibilityRole={onPress ? 'button' : undefined}
            accessibilityState={onPress ? { selected } : undefined}
            className={`mb-2 flex-row items-center rounded-xl border px-4 py-4 ${
                selected ? 'border-gold bg-panel-alt' : 'border-white/10 bg-panel'
            }`}
        >
            <View className="flex-1 pr-3">
                <Strong>{service.name}</Strong>

                <View className="mt-1 flex-row items-center">
                    <Clock size={12} color={COLORS.smoke} />
                    <Muted className="ml-1">{service.duration_minutes} min</Muted>
                </View>

                {service.description ? (
                    <Muted className="mt-1 leading-5">{service.description}</Muted>
                ) : null}
            </View>

            <View className="items-end">
                {service.is_from_price ? (
                    <Muted className="text-[10px] uppercase tracking-eyebrow">From</Muted>
                ) : null}
                <Text className="font-display text-gold text-lg">{price}</Text>
            </View>

            {selected ? (
                <View className="ml-3 h-6 w-6 items-center justify-center rounded-full bg-gold">
                    <Check size={14} color={COLORS.ink} />
                </View>
            ) : null}
        </Pressable>
    );
}
