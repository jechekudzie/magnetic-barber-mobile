import { TextInput, View } from 'react-native';

import { Eyebrow, Muted, Strong } from '@shared/components/Text';
import { COLORS } from '@theme/fonts';

/** Zimbabwe. The shop has one branch and it is in Harare. */
export const DIAL_CODE = '+263';

/** A local mobile number is nine digits once the leading zero is gone. */
const LOCAL_DIGITS = 9;

/**
 * Strip a number down to the local part, however it was typed or pasted.
 *
 * People write their own number every way there is: 0774685845,
 * +263 77 468 5845, 263774685845. All three mean the same nine digits, and
 * the field should accept all three rather than making somebody guess the
 * house style.
 */
export function toLocalDigits(input: string): string {
    let digits = input.replace(/\D/g, '');

    if (digits.startsWith('263')) {
        digits = digits.slice(3);
    }

    // A local number carries a trunk zero that the country code replaces.
    if (digits.startsWith('0')) {
        digits = digits.slice(1);
    }

    return digits.slice(0, LOCAL_DIGITS);
}

/** The stored form: E.164, the same shape the server keeps. */
export function toE164(local: string): string {
    return `${DIAL_CODE}${toLocalDigits(local)}`;
}

export function isCompleteNumber(local: string): boolean {
    return toLocalDigits(local).length === LOCAL_DIGITS;
}

/** 77 468 5845 — grouped for reading back, not for storing. */
function forDisplay(local: string): string {
    const digits = toLocalDigits(local);

    return [digits.slice(0, 2), digits.slice(2, 5), digits.slice(5)]
        .filter(Boolean)
        .join(' ');
}

/**
 * A phone field with the country code always on show.
 *
 * The code is a fixed label rather than part of the text, so there is no way
 * to send a number that is missing it or has it twice. Anything pasted in
 * with a code already attached is reduced to the local part instead of
 * being rejected.
 */
export function PhoneField({
    label = 'Mobile number',
    value,
    onChangeText,
    hint,
    error,
    autoFocus = false,
}: {
    label?: string;
    /** The local part, without the country code. */
    value: string;
    onChangeText: (local: string) => void;
    hint?: string;
    error?: string;
    autoFocus?: boolean;
}) {
    const complete = isCompleteNumber(value);
    const started = value.length > 0;

    return (
        <View className="mb-4">
            <Eyebrow className="mb-2.5 text-smoke">{label}</Eyebrow>

            <View
                className={`min-h-[54px] flex-row items-center overflow-hidden rounded-xl border bg-panel ${
                    error ? 'border-stop' : 'border-white/15'
                }`}
            >
                <View className="h-full justify-center border-r border-white/15 bg-panel-alt px-4 py-4">
                    <Strong className="text-smoke">{DIAL_CODE}</Strong>
                </View>

                <TextInput
                    accessibilityLabel={`${label}, country code ${DIAL_CODE}`}
                    value={forDisplay(value)}
                    onChangeText={(text) => onChangeText(toLocalDigits(text))}
                    placeholder="77 468 5845"
                    placeholderTextColor="#5f5a52"
                    keyboardType="phone-pad"
                    autoComplete="tel"
                    textContentType="telephoneNumber"
                    selectionColor={COLORS.gold}
                    autoFocus={autoFocus}
                    className="flex-1 px-4 font-sans text-base text-bone"
                />
            </View>

            {error ? (
                <Muted className="mt-2 text-stop">{error}</Muted>
            ) : started && !complete ? (
                <Muted className="mt-2">
                    {LOCAL_DIGITS - toLocalDigits(value).length} more digit
                    {LOCAL_DIGITS - toLocalDigits(value).length === 1 ? '' : 's'} to go.
                </Muted>
            ) : hint ? (
                <Muted className="mt-2">{hint}</Muted>
            ) : null}
        </View>
    );
}
