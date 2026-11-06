import { Image, View } from 'react-native';

import { Eyebrow } from '@shared/components/Text';

const MARK = require('@assets/brand/mark.png');
const LOCKUP = require('@assets/brand/lockup.png');

/**
 * The supplied artwork is gold on solid black. The black has been knocked out
 * to transparency in the asset itself rather than blended at runtime: the
 * website uses mix-blend-mode for this, which React Native cannot be relied on
 * to reproduce, and a transparent PNG sits correctly on ink and on panel alike.
 */
export function LogoMark({ size = 44 }: { size?: number }) {
    return (
        <Image
            source={MARK}
            accessibilityIgnoresInvertColors
            style={{ width: size, height: size }}
            resizeMode="contain"
        />
    );
}

/** The mark above the full wordmark, for the welcome screen and the splash. */
export function LogoLockup({ width = 220 }: { width?: number }) {
    return (
        <Image
            source={LOCKUP}
            accessibilityIgnoresInvertColors
            // The artwork is 770x732, so the height follows at that ratio.
            style={{ width, height: width * (732 / 770) }}
            resizeMode="contain"
        />
    );
}

/**
 * Mark plus the stacked wordmark, matching the site header: MAGNETIC in the
 * slab, BARBERSHOP underneath in small gold letterspaced caps.
 */
export function LogoHeader({ markSize = 36 }: { markSize?: number }) {
    return (
        <View className="flex-row items-center">
            <LogoMark size={markSize} />

            <View className="ml-2.5">
                <Eyebrow className="text-bone text-base tracking-[1.5px]">MAGNETIC</Eyebrow>
                <Eyebrow className="mt-0.5 text-[8px]">BARBERSHOP</Eyebrow>
            </View>
        </View>
    );
}
