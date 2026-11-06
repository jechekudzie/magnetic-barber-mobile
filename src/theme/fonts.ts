import {
    InstrumentSans_400Regular,
    InstrumentSans_500Medium,
    InstrumentSans_600SemiBold,
    InstrumentSans_700Bold,
} from '@expo-google-fonts/instrument-sans';
import { ZillaSlab_600SemiBold, ZillaSlab_700Bold } from '@expo-google-fonts/zilla-slab';

/**
 * The two faces the shop already uses on its website.
 *
 * Zilla Slab is the slab from the wordmark and is headline only — the site
 * says so in its own stylesheet, and a slab at body size reads as heavy.
 * Instrument Sans carries everything else.
 *
 * The keys are the family names referenced from tailwind.config.js, so a
 * className of font-display or font-sans resolves to these.
 */
export const FONTS = {
    ZillaSlab_600SemiBold,
    ZillaSlab_700Bold,
    InstrumentSans_400Regular,
    InstrumentSans_500Medium,
    InstrumentSans_600SemiBold,
    InstrumentSans_700Bold,
};

/**
 * Brand values, matched to resources/css/app.css in the Laravel project.
 * Change them in both or the app and the site drift apart.
 */
export const COLORS = {
    ink: '#0d0d0d',
    panel: '#1b1b1b',
    panelAlt: '#242424',
    gold: '#d9a947',
    goldLite: '#f0cc80',
    bone: '#ffffff',
    smoke: '#9c9488',
    go: '#3fa46a',
    stop: '#c7442e',
    hairline: 'rgba(255,255,255,0.08)',
} as const;
