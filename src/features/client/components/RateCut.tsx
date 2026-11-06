import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Star } from 'lucide-react-native';

import { fetchReview, submitReview } from '@api/bookings';
import { errorMessage } from '@api/client';
import { Button } from '@shared/components/Button';
import { Field } from '@shared/components/Field';
import { Panel } from '@shared/components/Panel';
import { ErrorState } from '@shared/components/States';
import { Eyebrow, Muted, Strong } from '@shared/components/Text';
import { COLORS } from '@theme/fonts';

const WORDS: Record<number, string> = {
    1: 'Not good',
    2: 'Could be better',
    3: 'Fine',
    4: 'Good',
    5: 'Sharp',
};

function Stars({
    value,
    onChange,
    size = 34,
}: {
    value: number;
    onChange?: (rating: number) => void;
    size?: number;
}) {
    return (
        <View className="flex-row">
            {[1, 2, 3, 4, 5].map((star) => (
                <Pressable
                    key={star}
                    disabled={!onChange}
                    accessibilityRole={onChange ? 'button' : undefined}
                    accessibilityLabel={`${star} star${star === 1 ? '' : 's'}`}
                    accessibilityState={{ selected: value === star }}
                    hitSlop={6}
                    onPress={() => onChange?.(star)}
                    className="pr-2"
                >
                    <Star
                        size={size}
                        color={COLORS.gold}
                        fill={star <= value ? COLORS.gold : 'transparent'}
                    />
                </Pressable>
            ))}
        </View>
    );
}

/**
 * Rating a cut that has happened.
 *
 * Shown on a finished booking rather than thrown up the moment somebody
 * leaves the chair: a client who is still paying has better things to do, and
 * a prompt in that moment gets a tap to dismiss rather than an opinion.
 *
 * A rating already given is shown back instead of asked for again, with the
 * option to change it — people reconsider, and two reviews of one cut would
 * tell the shop nothing.
 */
export function RateCut({ appointmentId }: { appointmentId: string }) {
    const queryClient = useQueryClient();

    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState('');
    const [editing, setEditing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const existing = useQuery({
        queryKey: ['review', appointmentId],
        queryFn: () => fetchReview(appointmentId),
        staleTime: 1000 * 60 * 5,
    });

    const send = useMutation({
        mutationFn: () =>
            submitReview({
                id: appointmentId,
                rating,
                comment: comment.trim() === '' ? undefined : comment.trim(),
            }),
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: ['review', appointmentId] });
            setEditing(false);
            setError(null);
        },
        onError: (caught) => setError(errorMessage(caught, 'We could not send that.')),
    });

    if (existing.isPending) {
        return null;
    }

    const given = existing.data;

    if (given && !editing) {
        return (
            <Panel className="mt-4 px-5 py-5">
                <Eyebrow className="text-smoke">You rated this</Eyebrow>

                <View className="mt-3">
                    <Stars value={given.rating} size={24} />
                </View>

                {given.comment ? (
                    <Muted className="mt-3 italic leading-5">{given.comment}</Muted>
                ) : null}

                <Button
                    label="Change it"
                    variant="ghost"
                    className="mt-3 self-start px-0"
                    onPress={() => {
                        setRating(given.rating);
                        setComment(given.comment ?? '');
                        setEditing(true);
                    }}
                />
            </Panel>
        );
    }

    return (
        <Panel accent className="mt-4 px-5 py-5">
            <Strong>How was it?</Strong>
            <Muted className="mt-1.5 leading-5">
                The shop reads every one of these. It is not published anywhere without them
                deciding to.
            </Muted>

            {error ? <ErrorState message={error} /> : null}

            <View className="mt-5 items-center">
                <Stars value={rating} onChange={setRating} />
                {rating > 0 ? <Muted className="mt-2.5">{WORDS[rating]}</Muted> : null}
            </View>

            {rating > 0 ? (
                <View className="mt-5">
                    <Field
                        label="Anything to add? (optional)"
                        value={comment}
                        onChangeText={setComment}
                        multiline
                        numberOfLines={3}
                        placeholder="Sharpest fade in the Avenues."
                    />

                    <Button
                        label={given ? 'Update my rating' : 'Send it'}
                        loading={send.isPending}
                        onPress={() => send.mutate()}
                    />

                    {given ? (
                        <Button
                            label="Leave it as it was"
                            variant="ghost"
                            className="mt-1"
                            onPress={() => setEditing(false)}
                        />
                    ) : null}
                </View>
            ) : null}
        </Panel>
    );
}
