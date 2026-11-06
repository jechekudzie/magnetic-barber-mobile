/**
 * Expo SDK 58.
 *
 * There is deliberately no reanimated or worklets plugin listed here.
 * babel-preset-expo 58 adds react-native-worklets/plugin itself when the
 * package is installed, and listing it again applies it twice. The SDK 54
 * advice to put 'react-native-reanimated/plugin' last is out of date.
 */
module.exports = function (api) {
    api.cache(true);

    return {
        presets: [
            ['babel-preset-expo', { jsxImportSource: 'nativewind' }],
            'nativewind/babel',
        ],
        plugins: [
            [
                'module-resolver',
                {
                    root: ['./'],
                    alias: {
                        '@api': './src/api',
                        '@assets': './src/assets',
                        '@config': './src/config',
                        '@features': './src/features',
                        '@navigation': './src/navigation',
                        '@shared': './src/shared',
                        '@stores': './src/stores',
                        '@theme': './src/theme',
                    },
                },
            ],
        ],
    };
};
