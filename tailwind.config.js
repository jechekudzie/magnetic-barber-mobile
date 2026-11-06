/**
 * The same palette the website runs on, so the app and the site are visibly
 * one shop rather than two products that share a name. Values are copied from
 * resources/css/app.css in the Laravel project; change them in both.
 *
 * @type {import('tailwindcss').Config}
 */
module.exports = {
    content: ['./App.tsx', './src/**/*.{js,jsx,ts,tsx}'],
    presets: [require('nativewind/preset')],
    theme: {
        extend: {
            colors: {
                ink: '#0d0d0d',
                panel: '#1b1b1b',
                'panel-alt': '#242424',
                gold: '#d9a947',
                'gold-lite': '#f0cc80',
                bone: '#ffffff',
                smoke: '#9c9488',
                go: '#3fa46a',
                stop: '#c7442e',
            },
        },
    },
    plugins: [],
};
