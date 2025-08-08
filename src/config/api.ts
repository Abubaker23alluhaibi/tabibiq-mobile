// إعدادات API المركزية
export const API_CONFIG = {
  // عنوان IP للتطوير المحلي - تحديث هذا العنوان حسب جهازك
  LOCAL_IP: '192.168.1.100', // غيّر هذا العنوان حسب عنوان IP الخاص بك
  LOCAL_PORT: '5000',
  
  // عنوان الإنتاج
  PRODUCTION_URL: 'https://web-production-78766.up.railway.app',
  
  // خيار للتبديل بين الخادم المحلي والإنتاجي
  // تم تغيير هذا إلى false لاستخدام الخادم الإنتاجي مؤقتاً
  USE_LOCAL_SERVER: false, // استخدم الخادم الإنتاجي مؤقتاً
  
  // عنوان API الأساسي
  get BASE_URL() {
    if (this.USE_LOCAL_SERVER) {
      return `http://${this.LOCAL_IP}:${this.LOCAL_PORT}`;
    } else {
      return `${this.PRODUCTION_URL}`;
    }
  },
  
  // عناوين API المختلفة - محدثة لتتطابق مع الخادم الفعلي
  get AUTH_LOGIN() {
    return `${this.BASE_URL}/login`;
  },
  
  get AUTH_REGISTER() {
    return `${this.BASE_URL}/register`;
  },
  
  get AUTH_REGISTER_DOCTOR() {
    return `${this.BASE_URL}/register-doctor`;
  },
  
  get AUTH_LOGOUT() {
    return `${this.BASE_URL}/logout`;
  },
  
  get USERS_PROFILE() {
    return `${this.BASE_URL}/users`;
  },
  
  get USERS_BY_ID() {
    return `${this.BASE_URL}/users`;
  },
  
  get DOCTORS() {
    return `${this.BASE_URL}/doctors`;
  },
  
  get APPOINTMENTS() {
    return `${this.BASE_URL}/appointments`;
  },
  
  get REMINDERS() {
    return `${this.BASE_URL}/medicine-reminders`;
  },
  
  get HEALTH_CENTERS() {
    return `${this.BASE_URL}/health-centers`;
  },
  
  get NOTIFICATIONS() {
    return `${this.BASE_URL}/notifications`;
  },
  
  get SETTINGS() {
    return `${this.BASE_URL}/settings`;
  },
  
  get SPECIALTIES() {
    return `${this.BASE_URL}/specialties`;
  },
  
  get PROVINCES() {
    return `${this.BASE_URL}/provinces`;
  },
  
  get STATS() {
    return `${this.BASE_URL}/api/analytics`;
  },
};

// دالة مساعدة لبناء عنوان API مع معرف
export const buildApiUrl = (endpoint: string, id?: string) => {
  if (id) {
    return `${endpoint}/${id}`;
  }
  return endpoint;
};

// دالة مساعدة لبناء عنوان API مع معاملات
export const buildApiUrlWithParams = (endpoint: string, params?: Record<string, any>) => {
  if (!params || Object.keys(params).length === 0) {
    return endpoint;
  }
  
  const queryString = new URLSearchParams(params).toString();
  return `${endpoint}?${queryString}`;
};

// دالة مساعدة لاختبار الاتصال بالخادم
export const testServerConnection = async (): Promise<{ success: boolean; error?: string }> => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 ثواني timeout
    
    console.log('🔍 اختبار الاتصال بـ:', `${API_CONFIG.BASE_URL}/api/health`);
    console.log('📍 نوع الخادم:', API_CONFIG.USE_LOCAL_SERVER ? 'محلي' : 'إنتاجي');
    
    const response = await fetch(`${API_CONFIG.BASE_URL}/api/health`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    
    if (response.ok) {
      console.log('✅ نجح الاتصال بالخادم');
      return { success: true };
    } else {
      console.log('❌ الخادم استجاب لكن بحالة خطأ:', response.status);
      
      // محاولة قراءة النص لمعرفة نوع الخطأ
      try {
        const responseText = await response.text();
        console.log('📄 نص الاستجابة:', responseText.substring(0, 200) + '...');
        
        if (response.status === 404) {
          return { success: false, error: 'نقطة الاتصال /api/health غير موجودة' };
        }
      } catch (textError) {
        console.log('❌ لا يمكن قراءة نص الاستجابة');
      }
      
      return { success: false, error: `Server responded with status: ${response.status}` };
    }
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        console.log('⏰ انتهت مهلة الاتصال');
        return { success: false, error: 'Connection timeout' };
      }
      console.log('❌ خطأ في الاتصال:', error.message);
      return { success: false, error: error.message };
    }
    return { success: false, error: 'Unknown error occurred' };
  }
};

// دالة لاختبار endpoints مختلفة
export const testEndpoints = async () => {
  const endpoints = [
    '/api/health',
    '/login',
    '/register',
    '/doctors',
    '/health-centers'
  ];
  
  console.log('🔍 اختبار نقاط الاتصال المختلفة...');
  
  for (const endpoint of endpoints) {
    try {
      const url = `${API_CONFIG.BASE_URL}${endpoint}`;
      console.log(`🔍 اختبار: ${url}`);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      console.log(`📥 ${endpoint}: ${response.status} ${response.statusText}`);
      
      if (response.ok) {
        console.log(`✅ ${endpoint} يعمل`);
      }
    } catch (error) {
      console.log(`❌ ${endpoint}: خطأ في الاتصال`);
    }
  }
};

// دالة للحصول على معلومات الخادم الحالي
export const getCurrentServerInfo = () => {
  return {
    isLocal: API_CONFIG.USE_LOCAL_SERVER,
    baseUrl: API_CONFIG.BASE_URL,
    serverType: API_CONFIG.USE_LOCAL_SERVER ? 'محلي' : 'إنتاجي',
  };
};

// دالة للتبديل السريع بين الخوادم (للتطوير فقط)
export const switchToProductionServer = () => {
  if (__DEV__) {
    console.log('🔄 التبديل إلى الخادم الإنتاجي...');
    // يمكن إضافة منطق للتبديل هنا
    return true;
  }
  return false;
}; 