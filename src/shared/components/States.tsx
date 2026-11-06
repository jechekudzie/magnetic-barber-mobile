import { ActivityIndicator, View } from 'react-native';

import { Button } from '@shared/components/Button';
import { Body, Heading, Muted } from '@shared/components/Text';

export function Loading({ label = 'Loading' }: { label?: string }) {
    return (
        <View className="flex-1 items-center justify-center py-16">
            <ActivityIndicator color="#d9a947" />
            <Muted className="mt-3">{label}</Muted>
        </View>
    );
}

export function EmptyState({ title, body }: { title: string; body?: string }) {
    return (
        <View className="items-center justify-center rounded-2xl border border-white/10 bg-panel px-6 py-12">
            <Heading className="text-center">{title}</Heading>
            {body ? <Muted className="mt-2 text-center">{body}</Muted> : null}
        </View>
    );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
    return (
        <View className="rounded-2xl border border-stop/40 bg-panel px-5 py-6">
            <Body className="text-center">{message}</Body>
            {onRetry ? (
                <Button label="Try again" variant="secondary" onPress={onRetry} className="mt-4" />
            ) : null}
        </View>
    );
}
