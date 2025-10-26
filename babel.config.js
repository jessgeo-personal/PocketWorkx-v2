module.exports = function(api) {
  api.cache(true);
  return {
    presets: [
      'babel-preset-expo',
      '@babel/preset-typescript'
    ],
    plugins: [
      // other plugins can go here (if you add any later)
      'react-native-reanimated/plugin' // must be last
    ],
  };
};
