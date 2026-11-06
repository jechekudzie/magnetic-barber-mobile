import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';

import { errorMessage } from '@api/client';
import { fetchBranches, fetchPriceList } from '@api/catalog';
import { PriceRow } from '@features/client/components/PriceRow';
import { Screen, ScreenHeader } from '@shared/components/Screen';
import { ErrorState, Loading } from '@shared/components/States';
import { Body, Eyebrow, Heading, Muted } from '@shared/components/Text';
import type { Audience } from '@shared/types';

/**
 * The shop's two printed cards, as cards.
 *
 * Showing one merged list would be wrong rather than merely cluttered: the
 * same job is priced differently on each card, so a single list has two
 * entries for a dye at two prices and no way to tell which is yours.
 */
const CARDS: Array<{ key: Audience; label: string }> = [
    { key: 'men', label: "Men's" },
    { key: 'women', label: 'Ladies' },
];

export function PriceListScreen() {
    const [card, setCard] = useState<Audience>('men');

    const branches = useQuery({ queryKey: ['branches'], queryFn: fetchBranches });
    const branch = branches.data?.[0];

    const priceList = useQuery({
        queryKey: ['price-list', branch?.slug],
        queryFn: () => fetchPriceList(branch!.slug),
        enabled: Boolean(branch),
    });

    if (branches.isPending || priceList.isPending) {
        return (
            <Screen>
                <Loading label="Fetching the price list" />
            </Screen>
        );
    }

    if (branches.isError || priceList.isError) {
        return (
            <Screen>
                <ErrorState
                    message={errorMessage(branches.error ?? priceList.error)}
                    onRetry={() => {
                        void branches.refetch();
                        void priceList.refetch();
                    }}
                />
            </Screen>
        );
    }

    // The chosen card, anything priced the same on both, and the kids cut,
    // which the shop prints on the men's card.
    const visible = (audience: Audience): boolean =>
        audience === card || audience === 'unisex' || (audience === 'kids' && card === 'men');

    const categories = (priceList.data ?? [])
        .map((category) => ({
            ...category,
            services: (category.services ?? []).filter((service) => visible(service.audience)),
        }))
        .filter((category) => category.services.length > 0);

    return (
        <Screen onRefresh={() => void priceList.refetch()} refreshing={priceList.isRefetching}>
            <ScreenHeader eyebrow={branch?.name} title="Price list">
                <Muted className="mt-3 leading-6">Clean cuts, fresh looks, confidence.</Muted>
            </ScreenHeader>

            <View className="mb-7 flex-row rounded-xl border border-white/[0.08] bg-panel p-1">
                {CARDS.map((option) => (
                    <Pressable
                        key={option.key}
                        accessibilityRole="button"
                        accessibilityState={{ selected: card === option.key }}
                        onPress={() => setCard(option.key)}
                        className={`flex-1 items-center rounded-lg py-3 ${
                            card === option.key ? 'bg-gold' : ''
                        }`}
                    >
                        <Body
                            className={`text-sm ${
                                card === option.key ? 'font-semibold text-ink' : 'text-smoke'
                            }`}
                        >
                            {option.label}
                        </Body>
                    </Pressable>
                ))}
            </View>

            {categories.map((category) => (
                <View key={category.id} className="mb-9">
                    <Heading>{category.name}</Heading>
                    {category.tagline ? (
                        <Muted className="mb-4 mt-1.5 leading-5">{category.tagline}</Muted>
                    ) : (
                        <View className="mb-4" />
                    )}

                    {category.services.map((service) => (
                        <PriceRow key={service.id} service={service} />
                    ))}
                </View>
            ))}

            <Eyebrow className="mt-2 text-center text-smoke">
                Hair · Skin · Beard · Confidence
            </Eyebrow>
        </Screen>
    );
}
