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
          root: ['./src'],
          extensions: ['.ios.js', '.android.js', '.js', '.ts', '.tsx', '.json'],
          alias: {
            '@': './src',
            '@components': './src/components',
            '@screens': './src/screens',
            '@store': './src/store',
            '@api': './src/api',
            '@hooks': './src/hooks',
            '@theme': './src/theme',
            '@types': './src/types',
            '@constants': './src/constants',
            '@services': './src/services',
            '@navigation': './src/navigation',
          },
        },
      ],
      'react-native-worklets/plugin',
    ],
  };
};
