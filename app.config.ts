import { ExpoConfig, ConfigContext } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'TabibiQ - منصة طبيب العراق',
  slug: 'tabibiq-mobile',
  version: '1.0.2',
  owner: 'abubakeriq',
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
    bundleIdentifier: 'com.tabibiq.platform',
    buildNumber: '1.0.2',
    infoPlist: {
      NSLocationWhenInUseUsageDescription: 'يستخدم التطبيق الموقع لعرض مواقع الأطباء والعيادات',
      NSLocationAlwaysAndWhenInUseUsageDescription: 'يستخدم التطبيق الموقع لعرض مواقع الأطباء والعيادات',
      NSUserNotificationsUsageDescription: 'يستخدم التطبيق الإشعارات لإرسال تذكيرات المواعيد والتحديثات المهمة',
      NSCameraUsageDescription: 'يستخدم التطبيق الكاميرا لالتقاط صور الملف الشخصي',
      NSPhotoLibraryUsageDescription: 'يستخدم التطبيق معرض الصور لاختيار صور الملف الشخصي',
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
    package: 'com.tabibiq.platform',
    versionCode: 15,
    permissions: [
      'android.permission.ACCESS_FINE_LOCATION',
      'android.permission.ACCESS_COARSE_LOCATION',
      'android.permission.POST_NOTIFICATIONS',
      'android.permission.VIBRATE',
      'android.permission.WAKE_LOCK',
      'android.permission.SCHEDULE_EXACT_ALARM',
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
    url: 'https://u.expo.dev/be4c2514-ccbb-47d6-bcee-23b74a2ec333'
  },
  runtimeVersion: '1.0.2',
  extra: {
    eas: {
      projectId: 'be4c2514-ccbb-47d6-bcee-23b74a2ec333',
    },
    apiUrl: 'https://web-production-78766.up.railway.app',
    environment: 'production',
  },
  plugins: [
    "expo-font",
    "expo-secure-store",
    [
      "expo-build-properties",
      {
        "android": {
          "compileSdkVersion": 35,
          "targetSdkVersion": 35,
          "minSdkVersion": 24, 
          "buildToolsVersion": "35.0.0",
          "kotlinVersion": "1.9.24"
        }
      }
    ]
  ],
  scheme: 'tabibiq',
});