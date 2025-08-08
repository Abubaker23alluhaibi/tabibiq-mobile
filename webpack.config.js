const createExpoWebpackConfigAsync = require('@expo/webpack-config');
const path = require('path');

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

  // Ensure proper web platform support
  config.resolve.extensions = ['.web.js', '.web.ts', '.web.tsx', '.js', '.ts', '.tsx', '.json'];
  
  // Add web-specific entry point
  if (env.platform === 'web') {
    config.entry = {
      main: path.resolve(__dirname, 'index.ts'),
    };
  }

  return config;
};


