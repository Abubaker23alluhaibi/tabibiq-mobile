const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// إضافة resolver للتعامل مع الويب
config.resolver.platforms = ['ios', 'android', 'native', 'web'];

// إضافة resolver للتعامل مع الملفات الأصلية على الويب
config.resolver.resolverMainFields = ['react-native', 'browser', 'main'];

// إضافة fallback للمكتبات الأصلية على الويب
config.resolver.alias = {
  ...config.resolver.alias,
  // استبدال react-native-maps بمكون فارغ على الويب
  'react-native-maps': path.resolve(__dirname, 'src/components/web/MapView.web.tsx'),
  // استبدال react-native-image-picker بمكون فارغ على الويب
  'react-native-image-picker': path.resolve(__dirname, 'src/components/web/ImagePicker.web.tsx'),
  // استبدال expo-camera بمكون فارغ على الويب
  'expo-camera': path.resolve(__dirname, 'src/components/web/Camera.web.tsx'),
  // استبدال react-native/Libraries/Utilities/codegenNativeCommands بمكون فارغ
  'react-native/Libraries/Utilities/codegenNativeCommands': path.resolve(__dirname, 'src/components/web/CodegenNativeCommands.web.tsx'),
};

// إضافة transformer للتعامل مع الملفات الأصلية
config.transformer.minifierConfig = {
  ...config.transformer.minifierConfig,
  mangle: {
    keep_fnames: true,
  },
};

// إضافة resolver للتعامل مع الملفات الأصلية
config.resolver.resolverMainFields = ['react-native', 'browser', 'main'];

module.exports = config;
