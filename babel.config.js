module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      'react-native-reanimated/plugin',
      // هذا الجزء يضمن حذف الـ logs تلقائياً عند بناء النسخة النهائية فقط
      ...(process.env.NODE_ENV === 'production' ? ['transform-remove-console'] : []),
    ],
  };
};