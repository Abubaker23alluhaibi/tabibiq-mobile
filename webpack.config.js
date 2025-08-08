const createExpoWebpackConfigAsync = require('@expo/webpack-config');

module.exports = async function (env, argv) {
  const config = await createExpoWebpackConfigAsync(env, argv);
  
  // Customize the config before returning it.
  config.resolve.alias = {
    ...config.resolve.alias,
    'react-native-maps': require.resolve('./src/components/web/MapView.web.tsx'),
    'react-native-image-picker': require.resolve('./src/components/web/ImagePicker.web.tsx'),
    'expo-camera': require.resolve('./src/components/web/Camera.web.tsx'),
    'react-native/Libraries/Utilities/codegenNativeCommands': require.resolve('./src/components/web/CodegenNativeCommands.web.tsx'),
  };

  return config;
};

