import { ActivityIndicator, View } from 'react-native';

import { Button } from '@shared/components/Button';
import { Panel } from '@shared/components/Panel';
import { COLORS } from '@theme/fonts';
import { Body, Heading, Muted } from '@shared/components/Text';

export function Loading({ label = 'Loading' }: { label?: string }) {
    return (
        <View className="flex-1 items-center justify-center py-16">
            <ActivityIndicator color={COLORS.gold} />
            <Muted className="mt-3">{label}</Muted>
        </View>
    );
}

export function EmptyState({ title, body }: { title: string; body?: string }) {
    return (
        <Panel className="items-center justify-center px-6 py-12">
            <Heading className="text-center">{title}</Heading>
            {body ? <Muted className="mt-2.5 text-center leading-5">{body}</Muted> : null}
        </Panel>
    );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
    return (
        <View className="mb-5 rounded-2xl border border-stop/40 bg-panel px-5 py-5">
            <Body className="text-center leading-5">{message}</Body>
            {onRetry ? (
                <Button label="Try again" variant="secondary" onPress={onRetry} className="mt-5" />
            ) : null}
        </View>
    );
}
