const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add resolver configuration to handle i18next modules
config.resolver.alias = {
  ...config.resolver.alias,
  // Force resolution of i18next modules
  'i18next': require.resolve('i18next'),
  'react-i18next': require.resolve('react-i18next'),
};

// Add transformer configuration
config.transformer = {
  ...config.transformer,
  minifierConfig: {
    keep_fnames: false,
    mangle: {
      keep_fnames: false,
    },
    compress: {
      drop_console: true,
      drop_debugger: true,
    },
  },
};

// Add resolver configuration for better module resolution
config.resolver = {
  ...config.resolver,
  sourceExts: [...config.resolver.sourceExts, 'cjs'],
  assetExts: [...config.resolver.assetExts, 'bin'],
};

module.exports = config;
