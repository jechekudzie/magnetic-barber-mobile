import { Text as RNText, TextProps } from 'react-native';

type Props = TextProps & { className?: string };

/**
 * The site's type system, carried across.
 *
 * Display is the slab from the wordmark, used for headlines only — tight
 * tracking, leading just under 1. Everything that is read rather than
 * announced is Instrument Sans. The two are never swapped: a slab at body
 * size reads as heavy, which is why the site's stylesheet says headlines only.
 */

/** The big one. One per screen. */
export function Display({ className = '', ...props }: Props) {
    return (
        <RNText
            className={`font-display text-bone text-[34px] leading-[34px] ${className}`}
            {...props}
        />
    );
}

/** Section headings, still in the slab but quieter. */
export function Heading({ className = '', ...props }: Props) {
    return (
        <RNText
            className={`font-display-semi text-bone text-xl leading-6 ${className}`}
            {...props}
        />
    );
}

/** The small gold all caps label that opens most sections on the site. */
export function Eyebrow({ className = '', ...props }: Props) {
    return (
        <RNText
            className={`font-semibold text-gold text-xs tracking-eyebrow uppercase ${className}`}
            {...props}
        />
    );
}

export function Body({ className = '', ...props }: Props) {
    return <RNText className={`font-sans text-bone text-base ${className}`} {...props} />;
}

export function Strong({ className = '', ...props }: Props) {
    return <RNText className={`font-semibold text-bone text-base ${className}`} {...props} />;
}

export function Muted({ className = '', ...props }: Props) {
    return <RNText className={`font-sans text-smoke text-sm ${className}`} {...props} />;
}

/** A figure worth reading at a glance: a price, a total, a balance. */
export function Figure({ className = '', ...props }: Props) {
    return <RNText className={`font-display text-gold text-2xl ${className}`} {...props} />;
}
