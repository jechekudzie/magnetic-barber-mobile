import { useQuery } from '@tanstack/react-query';
import { View } from 'react-native';

import { errorMessage } from '@api/client';
import { fetchBranches, fetchPriceList } from '@api/catalog';
import { PriceRow } from '@features/client/components/PriceRow';
import { Screen, ScreenHeader } from '@shared/components/Screen';
import { ErrorState, Loading } from '@shared/components/States';
import { Heading, Muted } from '@shared/components/Text';

export function PriceListScreen() {
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

    return (
        <Screen>
            <ScreenHeader eyebrow={branch?.name} title="Price list">
                <Muted className="mt-3 leading-6">
                    Clean cuts, fresh looks, confidence.
                </Muted>
            </ScreenHeader>

            {priceList.data?.map((category) => (
                <View key={category.id} className="mb-9">
                    <Heading>{category.name}</Heading>
                    {category.tagline ? (
                        <Muted className="mb-4 mt-1.5 leading-5">{category.tagline}</Muted>
                    ) : (
                        <View className="mb-4" />
                    )}

                    {category.services?.map((service) => (
                        <PriceRow key={service.id} service={service} />
                    ))}
                </View>
            ))}
        </Screen>
    );
}
