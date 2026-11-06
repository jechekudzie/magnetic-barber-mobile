import { useQuery } from '@tanstack/react-query';
import { View } from 'react-native';

import { errorMessage } from '@api/client';
import { fetchBranches, fetchPriceList } from '@api/catalog';
import { PriceRow } from '@features/client/components/PriceRow';
import { Screen } from '@shared/components/Screen';
import { ErrorState, Loading } from '@shared/components/States';
import { Gold, Heading, Muted, Title } from '@shared/components/Text';

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
            <Gold className="text-xs uppercase tracking-[3px]">{branch?.name}</Gold>
            <Title className="mt-2">Price list</Title>
            <Muted className="mb-6 mt-2">Clean cuts, fresh looks, confidence.</Muted>

            {priceList.data?.map((category) => (
                <View key={category.id} className="mb-8">
                    <Heading>{category.name}</Heading>
                    {category.tagline ? <Muted className="mb-3 mt-1">{category.tagline}</Muted> : null}

                    {category.services?.map((service) => (
                        <PriceRow key={service.id} service={service} />
                    ))}
                </View>
            ))}
        </Screen>
    );
}
