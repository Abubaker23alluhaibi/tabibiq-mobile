import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_CONFIG } from '../config/api';

// إعدادات API
const API_BASE_URL = API_CONFIG.BASE_URL;

// دالة للحصول على التوكن
const getToken = async (): Promise<string | null> => {
  try {
    const token = await AsyncStorage.getItem('token');
    return token || null;
  } catch (error) {
    console.error('Error getting token:', error);
    return null;
  }
};

// دالة لإعداد الرؤوس
const getHeaders = async (includeAuth: boolean = true) => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (includeAuth) {
    const token = await getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  return headers;
};

// دالة للتعامل مع الاستجابة
const handleResponse = async (response: Response) => {
  try {
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || `HTTP error! status: ${response.status}`);
    }

    return data;
  } catch (error) {
    console.error('Error parsing response:', error);
    throw new Error('Failed to parse response');
  }
};

// دالة للتعامل مع الأخطاء
const handleError = (error: any) => {
  console.error('API Error:', error);
  throw error;
};

// API مبسط للاستخدام
export const api = {
  // GET request
  get: async (endpoint: string, config?: any) => {
    try {
      if (!endpoint || typeof endpoint !== 'string') {
        throw new Error('Invalid endpoint provided');
      }
      
      const url = `${API_BASE_URL}${endpoint}`;
      const headers = await getHeaders(config?.includeAuth !== false);
      
      const response = await fetch(url, {
        method: 'GET',
        headers,
        ...config,
      });

      return await handleResponse(response);
    } catch (error) {
      handleError(error);
    }
  },

  // POST request
  post: async (endpoint: string, data?: any, config?: any) => {
    try {
      if (!endpoint || typeof endpoint !== 'string') {
        throw new Error('Invalid endpoint provided');
      }
      
      const url = `${API_BASE_URL}${endpoint}`;
      const headers = await getHeaders(config?.includeAuth !== false);
      
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: data ? JSON.stringify(data) : undefined,
        ...config,
      });

      return await handleResponse(response);
    } catch (error) {
      handleError(error);
    }
  },

  // PUT request
  put: async (endpoint: string, data?: any, config?: any) => {
    try {
      if (!endpoint || typeof endpoint !== 'string') {
        throw new Error('Invalid endpoint provided');
      }
      
      const url = `${API_BASE_URL}${endpoint}`;
      const headers = await getHeaders(config?.includeAuth !== false);
      
      const response = await fetch(url, {
        method: 'PUT',
        headers,
        body: data ? JSON.stringify(data) : undefined,
        ...config,
      });

      return await handleResponse(response);
    } catch (error) {
      handleError(error);
    }
  },

  // DELETE request
  delete: async (endpoint: string, config?: any) => {
    try {
      if (!endpoint || typeof endpoint !== 'string') {
        throw new Error('Invalid endpoint provided');
      }
      
      const url = `${API_BASE_URL}${endpoint}`;
      const headers = await getHeaders(config?.includeAuth !== false);
      
      const response = await fetch(url, {
        method: 'DELETE',
        headers,
        ...config,
      });

      return await handleResponse(response);
    } catch (error) {
      handleError(error);
    }
  },

  // PATCH request
  patch: async (endpoint: string, data?: any, config?: any) => {
    try {
      if (!endpoint || typeof endpoint !== 'string') {
        throw new Error('Invalid endpoint provided');
      }
      
      const url = `${API_BASE_URL}${endpoint}`;
      const headers = await getHeaders(config?.includeAuth !== false);
      
      const response = await fetch(url, {
        method: 'PATCH',
        headers,
        body: data ? JSON.stringify(data) : undefined,
        ...config,
      });

      return await handleResponse(response);
    } catch (error) {
      handleError(error);
    }
  },
};

// API للمصادقة
export const authAPI = {
  // تسجيل الدخول
  login: async (email: string, password: string) => {
    try {
      const data = await api.post('/login', { email, password }, { includeAuth: false });
      
      // حفظ التوكن
      if (data.token) {
        await AsyncStorage.setItem('token', data.token);
      }

      return data;
    } catch (error) {
      handleError(error);
    }
  },

  // التسجيل
  register: async (userData: any) => {
    try {
      const data = await api.post('/register', userData, { includeAuth: false });
      
      // حفظ التوكن
      if (data.token) {
        await AsyncStorage.setItem('token', data.token);
      }

      return data;
    } catch (error) {
      handleError(error);
    }
  },

  // تسجيل الخروج
  logout: async () => {
    try {
      const data = await api.post('/logout');
      await AsyncStorage.removeItem('token');
      return data;
    } catch (error) {
      handleError(error);
    }
  },
};

// API للمستخدمين
export const usersAPI = {
  // الحصول على بيانات المستخدم
  getProfile: async () => {
    return await api.get('/users');
  },

  // تحديث بيانات المستخدم
  updateProfile: async (updates: any) => {
    return await api.put('/user/:id', updates);
  },

  // رفع صورة الملف الشخصي
  uploadProfileImage: async (imageUri: string) => {
    try {
      const formData = new FormData();
      formData.append('image', {
        uri: imageUri,
        type: 'image/jpeg',
        name: 'profile.jpg',
      } as any);

      const token = await getToken();
      const response = await fetch(`${API_BASE_URL}/upload-profile-image`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
        body: formData,
      });

      return await handleResponse(response);
    } catch (error) {
      handleError(error);
    }
  },
};

// API للأطباء
export const doctorsAPI = {
  // الحصول على قائمة الأطباء
  getDoctors: async (filters?: any) => {
    const queryParams = filters ? `?${new URLSearchParams(filters).toString()}` : '';
    return await api.get(`/doctors${queryParams}`);
  },

  // الحصول على طبيب محدد
  getDoctor: async (doctorId: string) => {
    return await api.get(`/doctors/${doctorId}`);
  },

  // البحث عن الأطباء
  searchDoctors: async (query: string, filters?: any) => {
    const params = new URLSearchParams({ q: query });
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        params.append(key, value as string);
      });
    }
    return await api.get(`/doctors/search?${params.toString()}`);
  },

  // الحصول على تقييمات الطبيب
  getDoctorReviews: async (doctorId: string) => {
    return await api.get(`/doctors/${doctorId}/reviews`);
  },

  // إضافة تقييم للطبيب
  addDoctorReview: async (doctorId: string, review: any) => {
    return await api.post(`/doctors/${doctorId}/reviews`, review);
  },
};

// API للمواعيد
export const appointmentsAPI = {
  // الحصول على مواعيد المستخدم
  getUserAppointments: async () => {
    return await api.get('/appointments');
  },

  // الحصول على مواعيد الطبيب
  getDoctorAppointments: async () => {
    return await api.get('/doctors/appointments');
  },

  // حجز موعد
  bookAppointment: async (appointmentData: any) => {
    return await api.post('/appointments', appointmentData);
  },

  // تحديث حالة الموعد
  updateAppointmentStatus: async (appointmentId: string, status: string) => {
    return await api.put(`/appointments/${appointmentId}/status`, { status });
  },

  // إلغاء موعد
  cancelAppointment: async (appointmentId: string) => {
    return await api.delete(`/appointments/${appointmentId}`);
  },
};

// API للتذكيرات
export const remindersAPI = {
  // الحصول على تذكيرات المستخدم
  getUserReminders: async (userId: string) => {
    return await api.get(`/medicine-reminders/${userId}`);
  },

  // إضافة تذكير
  addReminder: async (reminderData: any) => {
    return await api.post('/medicine-reminders', reminderData);
  },

  // تحديث تذكير
  updateReminder: async (reminderId: string, updates: any) => {
    return await api.put(`/medicine-reminders/${reminderId}`, updates);
  },

  // حذف تذكير
  deleteReminder: async (reminderId: string) => {
    return await api.delete(`/medicine-reminders/${reminderId}`);
  },
};

// API للمراكز الصحية
export const healthCentersAPI = {
  // الحصول على المراكز الصحية
  getHealthCenters: async (filters?: any) => {
    const queryParams = filters ? `?${new URLSearchParams(filters).toString()}` : '';
    return await api.get(`/health-centers${queryParams}`);
  },

  // الحصول على مركز صحي محدد
  getHealthCenter: async (centerId: string) => {
    return await api.get(`/health-centers/${centerId}`);
  },
};

// API للإشعارات
export const notificationsAPI = {
  // الحصول على إشعارات المستخدم
  getUserNotifications: async () => {
    return await api.get('/notifications');
  },

  // تحديث حالة الإشعار
  markNotificationAsRead: async (notificationId: string) => {
    return await api.put(`/notifications/${notificationId}/read`);
  },

  // تحديث جميع الإشعارات كمقروءة
  markAllNotificationsAsRead: async () => {
    return await api.put('/notifications/read-all');
  },
};

// API للإعدادات
export const settingsAPI = {
  // الحصول على إعدادات المستخدم
  getUserSettings: async () => {
    return await api.get('/settings');
  },

  // تحديث إعدادات المستخدم
  updateUserSettings: async (settings: any) => {
    return await api.put('/settings', settings);
  },
};

// API عام
export const generalAPI = {
  // الحصول على التخصصات
  getSpecialties: async () => {
    return await api.get('/specialties');
  },

  // الحصول على المحافظات
  getProvinces: async () => {
    return await api.get('/provinces');
  },

  // الحصول على إحصائيات التطبيق
  getAppStats: async () => {
    return await api.get('/stats');
  },
}; 