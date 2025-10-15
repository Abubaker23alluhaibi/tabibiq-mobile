import { ExpoConfig, ConfigContext } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'TabibiQ - منصة طبيب العراق',
  slug: 'tabibiq-mobile',
  version: '1.0.2',
  owner: 'tabibiq',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'light',
  splash: {
    image: './assets/splash-icon.png',
    resizeMode: 'contain',
    backgroundColor: '#ffffff'
  },
  assetBundlePatterns: [
    'assets/**/*',
    'src/assets/**/*'
  ],
  ios: {
    supportsTablet: false,
    bundleIdentifier: 'com.tabibiq.mobile',
    buildNumber: '1.0.2',
    infoPlist: {
      NSLocationWhenInUseUsageDescription: 'يستخدم التطبيق الموقع لعرض مواقع الأطباء والعيادات',
      NSLocationAlwaysAndWhenInUseUsageDescription: 'يستخدم التطبيق الموقع لعرض مواقع الأطباء والعيادات',
      CFBundleURLTypes: [
        {
          CFBundleURLName: 'tabibiq',
          CFBundleURLSchemes: ['tabibiq']
        }
      ]
    }
  },
  android: {
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundColor: '#ffffff'
    },
    package: 'com.tabibiq.mobile',
    versionCode: 10,
    softwareKeyboardLayoutMode: 'pan',
    permissions: [
      'android.permission.ACCESS_FINE_LOCATION',
      'android.permission.ACCESS_COARSE_LOCATION',
      'android.permission.POST_NOTIFICATIONS',
      'android.permission.VIBRATE',
      'android.permission.WAKE_LOCK',
      'android.permission.SCHEDULE_EXACT_ALARM',
      'android.permission.USE_EXACT_ALARM',
      'android.permission.RECEIVE_BOOT_COMPLETED'
    ],
    intentFilters: [
      {
        action: 'android.intent.action.VIEW',
        data: [
          {
            scheme: 'tabibiq'
          },
          {
            scheme: 'https',
            host: 'tabib-iq.com',
            pathPrefix: '/doctor'
          }
        ],
        category: ['android.intent.category.DEFAULT', 'android.intent.category.BROWSABLE']
      }
    ]
  },
  web: {
    favicon: './assets/favicon.png'
  },
  updates: {
    url: 'https://u.expo.dev/5440459c-c49b-40cc-993c-57e971386b9f'
  },
  runtimeVersion: '1.0.2',
  extra: {
    eas: {
      projectId: '5440459c-c49b-40cc-993c-57e971386b9f',
    },
    apiUrl: 'https://web-production-78766.up.railway.app',
    environment: 'production',
  },
  plugins: [
    "expo-font"
  ],
  scheme: 'tabibiq',
});