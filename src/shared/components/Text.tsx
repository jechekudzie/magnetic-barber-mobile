import { Text as RNText, TextProps } from 'react-native';

/**
 * Four sizes, so screens do not each invent their own. Anything that needs a
 * fifth probably wants one of these with a className instead.
 */
export function Title({ className = '', ...props }: TextProps & { className?: string }) {
    return <RNText className={`text-bone text-3xl font-bold ${className}`} {...props} />;
}

export function Heading({ className = '', ...props }: TextProps & { className?: string }) {
    return <RNText className={`text-bone text-lg font-semibold ${className}`} {...props} />;
}

export function Body({ className = '', ...props }: TextProps & { className?: string }) {
    return <RNText className={`text-bone text-base ${className}`} {...props} />;
}

export function Muted({ className = '', ...props }: TextProps & { className?: string }) {
    return <RNText className={`text-smoke text-sm ${className}`} {...props} />;
}

export function Gold({ className = '', ...props }: TextProps & { className?: string }) {
    return <RNText className={`text-gold ${className}`} {...props} />;
}
