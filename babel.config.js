module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        'module-resolver',
        {
          root: ['./'],
          alias: {
            '@': './client',
            '@components': './client/components',
            '@screens': './client/screens',
            '@utils': './client/utils'
          }
        }
      ]
    ]
  };
};
