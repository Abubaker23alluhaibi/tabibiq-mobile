import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';

import ar from './ar';
import en from './en';
import ku from './ku';

// إضافة polyfill لـ Intl.PluralRules إذا لم يكن متوفراً
if (!Intl.PluralRules) {
  // @ts-ignore
  Intl.PluralRules = {
    supportedLocalesOf: () => [],
    polyfilled: true,
  };
}

const resources = {
  ar: {
    translation: ar,
  },
  en: {
    translation: en,
  },
  ku: {
    translation: ku,
  },
};

// تهيئة i18n مع معالجة أفضل للأخطاء
const initI18n = async () => {
  try {
    await i18n
      .use(initReactI18next)
      .init({
        resources,
        lng: 'ar', // استخدام العربية كلغة افتراضية
        fallbackLng: 'ar', // اللغة الافتراضية
        interpolation: {
          escapeValue: false, // لا نحتاج إلى escape للقيم
        },
        react: {
          useSuspense: false, // تعطيل Suspense لتجنب المشاكل
        },
        // إعدادات إضافية لتحسين الاستقرار
        debug: false, // Debug disabled for production
        keySeparator: '.',
        nsSeparator: ':',
        returnNull: false,
        returnEmptyString: false,
        returnObjects: true, // تمكين إرجاع المصفوفات
        compatibilityJSON: 'v3', // إضافة توافق مع React Native
      });
    
    // محاولة تطبيق اللغة المخزّنة إن وجدت
    try {
      const saved = await AsyncStorage.getItem('app_language');
      if (saved && ['ar','en','ku'].includes(saved)) {
        await i18n.changeLanguage(saved);
      }
    } catch (error) {
      // Language loading error handled silently
    }
  } catch (error) {
    // i18n initialization error handled silently
    // تهيئة بسيطة في حالة الخطأ
    try {
      await i18n.init({
        resources,
        lng: 'ar',
        fallbackLng: 'ar',
        interpolation: {
          escapeValue: false,
        },
        react: {
          useSuspense: false,
        },
        compatibilityJSON: 'v3',
      });
    } catch (fallbackError) {
      // Fallback i18n initialization failed
    }
  }
};

// تهيئة i18n عند استيراد الملف
initI18n();

export default i18n;

// دالة للتحقق من اتجاه النص (RTL/LTR)
export const isRTL = (locale?: string) => {
  try {
    const currentLocale = locale || i18n.language;
    return ['ar', 'ku'].includes(currentLocale);
  } catch (error) {
    // RTL check error handled silently
    return true; // افتراضي للعربية
  }
};

// دالة لتغيير اللغة
export const changeLanguage = (language: string) => {
  try {
    i18n.changeLanguage(language);
    // حفظ الاختيار
    AsyncStorage.setItem('app_language', language).catch(() => {});
  } catch (error) {
    // Language change error handled silently
  }
};

// دالة للحصول على اللغة الحالية
export const getCurrentLanguage = () => {
  try {
    return i18n.language;
  } catch (error) {
    // Current language retrieval error handled silently
    return 'ar';
  }
};

// دالة للحصول على اتجاه النص الحالي
export const getCurrentTextDirection = () => {
  try {
    return isRTL() ? 'rtl' : 'ltr';
  } catch (error) {
    // Text direction retrieval error handled silently
    return 'rtl';
  }
}; 
