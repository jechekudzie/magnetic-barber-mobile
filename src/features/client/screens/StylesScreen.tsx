import { useMemo, useState } from 'react';
import { Image, Pressable, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Clock, Scissors } from 'lucide-react-native';

import { errorMessage } from '@api/client';
import { fetchStyles } from '@api/catalog';
import type { ClientStackProps } from '@navigation/types';
import { Panel } from '@shared/components/Panel';
import { Screen, ScreenHeader } from '@shared/components/Screen';
import { EmptyState, ErrorState, Loading } from '@shared/components/States';
import { Body, Eyebrow, Figure, Muted, Strong } from '@shared/components/Text';
import type { Style } from '@shared/types';
import { COLORS } from '@theme/fonts';

const FILTERS: Array<{ key: string; label: string }> = [
    { key: 'all', label: 'All' },
    { key: 'men', label: "Men's" },
    { key: 'women', label: 'Ladies' },
    { key: 'kids', label: 'Kids' },
];

/**
 * One look, with its number.
 *
 * The number is the point of the whole gallery: a client says "number 03"
 * over WhatsApp or at the desk and every barber cuts the same thing. So it
 * is the loudest thing on the card, not a footnote under the name.
 */
function StyleCard({ style, onPress }: { style: Style; onPress: () => void }) {
    return (
        <Panel className="mb-2.5 overflow-hidden p-0" onPress={onPress}>
            <View className="flex-row">
                {style.image_url ? (
                    <Image
                        source={{ uri: style.image_url }}
                        style={{ width: 92, height: 112 }}
                        resizeMode="cover"
                        accessibilityIgnoresInvertColors
                    />
                ) : (
                    <View className="h-28 w-[92px] items-center justify-center bg-panel-alt">
                        <Scissors size={22} color={COLORS.smoke} />
                    </View>
                )}

                <View className="min-w-0 flex-1 px-4 py-4">
                    <View className="flex-row items-baseline">
                        <Figure className="text-2xl">{style.code}</Figure>
                        <Strong className="ml-2.5 flex-1" numberOfLines={1}>
                            {style.name}
                        </Strong>
                    </View>

                    {style.description ? (
                        <Muted className="mt-1.5 leading-5" numberOfLines={2}>
                            {style.description}
                        </Muted>
                    ) : null}

                    <View className="mt-2 flex-row items-center">
                        <Clock size={11} color={COLORS.smoke} />
                        <Muted className="ml-1.5 text-[11px]">
                            {style.typical_duration_minutes} min · {style.gender_label}
                        </Muted>
                    </View>
                </View>
            </View>
        </Panel>
    );
}

/**
 * The numbered gallery.
 *
 * Tapping a look takes the client into booking with the service it is cut as
 * already chosen, because "I want number 03" and "I want a Standard Haircut"
 * are the same sentence to the shop and should not be two separate decisions
 * for the client.
 */
export function StylesScreen({ navigation }: ClientStackProps<'Styles'>) {
    const [filter, setFilter] = useState('all');

    const styles = useQuery({
        queryKey: ['styles'],
        queryFn: fetchStyles,
        // A gallery changes a few times a year.
        staleTime: 1000 * 60 * 30,
    });

    const shown = useMemo(() => {
        const all = styles.data ?? [];

        if (filter === 'all') {
            return all;
        }

        // Unisex belongs on every card, which is what unisex means.
        return all.filter(
            (style) => style.gender_tag === filter || style.gender_tag === 'unisex',
        );
    }, [styles.data, filter]);

    return (
        <Screen
            topBar={{ title: 'The gallery', onBack: () => navigation.goBack() }}
            onRefresh={() => void styles.refetch()}
            refreshing={styles.isRefetching}
        >
            <ScreenHeader eyebrow="Numbered looks" title="Pick a number">
                <Muted className="mt-3 leading-6">
                    Say the number at the desk or over WhatsApp and every barber cuts the same
                    thing.
                </Muted>
            </ScreenHeader>

            <View className="mb-6 flex-row rounded-xl border border-white/[0.08] bg-panel p-1">
                {FILTERS.map((option) => (
                    <Pressable
                        key={option.key}
                        accessibilityRole="button"
                        accessibilityState={{ selected: filter === option.key }}
                        onPress={() => setFilter(option.key)}
                        className={`flex-1 items-center rounded-lg py-2.5 ${
                            filter === option.key ? 'bg-gold' : ''
                        }`}
                    >
                        <Body
                            className={`text-sm ${
                                filter === option.key ? 'font-semibold text-ink' : 'text-smoke'
                            }`}
                        >
                            {option.label}
                        </Body>
                    </Pressable>
                ))}
            </View>

            {styles.isPending ? (
                <Loading label="Opening the gallery" />
            ) : styles.isError ? (
                <ErrorState
                    message={errorMessage(styles.error)}
                    onRetry={() => void styles.refetch()}
                />
            ) : shown.length === 0 ? (
                <EmptyState
                    title="Nothing here yet"
                    body="The shop has not published looks for this one."
                />
            ) : (
                shown.map((style) => (
                    <StyleCard
                        key={style.id}
                        style={style}
                        onPress={() =>
                            navigation.navigate('Tabs', {
                                screen: 'Book',
                                params: { serviceId: style.service?.id, styleId: style.id },
                            } as never)
                        }
                    />
                ))
            )}

            <Eyebrow className="mt-4 text-center text-smoke">
                Hair · Skin · Beard · Confidence
            </Eyebrow>
        </Screen>
    );
}
