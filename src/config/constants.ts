// ملف التكوين للقيم الثابتة
// يمكن تغيير هذه القيم حسب البيئة (تطوير، اختبار، إنتاج)

export const APP_CONFIG = {
  // معرف مشروع Expo - يجب تغييره حسب مشروعك
  EXPO_PROJECT_ID: 'be4c2514-ccbb-47d6-bcee-23b74a2ec333',
  
  // رقم واتساب للتواصل مع الأطباء
  WHATSAPP_NUMBER: '+9647701234567',
  
  // رابط Deep Link للتطبيق
  DEEP_LINK_URL: 'tabibiq://app',
  
  // إعدادات الإشعارات
  NOTIFICATION: {
    // معرف المشروع للإشعارات
    PROJECT_ID: 'be4c2514-ccbb-47d6-bcee-23b74a2ec333',
    // مدة انتهاء صلاحية التوكن (بالساعات)
    TOKEN_EXPIRY_HOURS: 24,
  },
  
  // إعدادات الأمان
  SECURITY: {
    // طول الرمز المميز
    TOKEN_LENGTH: 32,
    // مدة انتهاء صلاحية الجلسة (بالدقائق)
    SESSION_TIMEOUT_MINUTES: 30,
  },
  
  // إعدادات التطبيق
  APP: {
    // اسم التطبيق
    NAME: 'TabibiQ',
    // إصدار التطبيق
    VERSION: '1.0.0',
    // رابط الموقع الرسمي
    WEBSITE_URL: 'https://tabibiq.com',
  },
} as const;

// دالة للحصول على القيم حسب البيئة
export const getConfigValue = (key: string, defaultValue?: any) => {
  // يمكن إضافة منطق للتحقق من البيئة هنا
  // const environment = process.env.NODE_ENV || 'development';
  
  const keys = key.split('.');
  let value = APP_CONFIG;
  
  for (const k of keys) {
    value = (value as any)?.[k];
    if (value === undefined) {
      return defaultValue;
    }
  }
  
  return value;
};
