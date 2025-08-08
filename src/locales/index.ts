import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

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
try {
  i18n
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
      debug: __DEV__, // تفعيل التصحيح في وضع التطوير فقط
      keySeparator: '.',
      nsSeparator: ':',
      returnNull: false,
      returnEmptyString: false,
      returnObjects: false,
    });
} catch (error) {
  console.error('Error initializing i18n:', error);
  // تهيئة بسيطة في حالة الخطأ
  i18n.init({
    resources,
    lng: 'ar',
    fallbackLng: 'ar',
    interpolation: {
      escapeValue: false,
    },
    react: {
      useSuspense: false,
    },
  });
}

export default i18n;

// دالة للتحقق من اتجاه النص (RTL/LTR)
export const isRTL = (locale?: string) => {
  try {
    const currentLocale = locale || i18n.language;
    return ['ar', 'ku'].includes(currentLocale);
  } catch (error) {
    console.error('Error in isRTL:', error);
    return true; // افتراضي للعربية
  }
};

// دالة لتغيير اللغة
export const changeLanguage = (language: string) => {
  try {
    i18n.changeLanguage(language);
  } catch (error) {
    console.error('Error changing language:', error);
  }
};

// دالة للحصول على اللغة الحالية
export const getCurrentLanguage = () => {
  try {
    return i18n.language;
  } catch (error) {
    console.error('Error getting current language:', error);
    return 'ar';
  }
};

// دالة للحصول على اتجاه النص الحالي
export const getCurrentTextDirection = () => {
  try {
    return isRTL() ? 'rtl' : 'ltr';
  } catch (error) {
    console.error('Error getting text direction:', error);
    return 'rtl';
  }
}; 