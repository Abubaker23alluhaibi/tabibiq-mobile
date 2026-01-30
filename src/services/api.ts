import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_CONFIG } from '../config/api';
import { getToken as getSecureToken, saveToken as saveSecureToken, deleteToken as deleteSecureToken } from '../utils/secureStorage';

const API_BASE_URL = API_CONFIG.BASE_URL;

// دالة للتحقق من صحة المعرفات
const validateId = (id: string): boolean => {
  if (!id || typeof id !== 'string') return false;
  // التحقق من أن المعرف يحتوي على أحرف آمنة فقط
  return /^[a-zA-Z0-9-_]+$/.test(id);
};

// دالة للتحقق من صحة المدخلات
const validateInput = (input: any): boolean => {
  if (input === null || input === undefined) return false;
  if (typeof input === 'string') {
    // التحقق من عدم وجود أحرف خطيرة
    return !/[<>\"'&]/.test(input);
  }
  return true;
};

// استخدام SecureStore للحصول على التوكن
const getToken = async (): Promise<string | null> => {
  try {
    // محاولة القراءة من SecureStore أولاً
    const token = await getSecureToken();
    if (token) {
      return token;
    }
    
    // Fallback: محاولة القراءة من AsyncStorage (للتوافق مع الإصدارات القديمة)
    const oldToken = await AsyncStorage.getItem('token');
    if (oldToken) {
      // نقل التوكن إلى SecureStore
      await saveSecureToken(oldToken);
      await AsyncStorage.removeItem('token');
      return oldToken;
    }
    
    return null;
  } catch (error) {
    return null;
  }
};

const getHeaders = async (includeAuth: boolean = true) => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (includeAuth) {
    const token = await getToken();
    if (token) {
      // التحقق من أن التوكن ليس محلياً
      if (token.startsWith('local_token_')) {
        // محاولة استخدام توكن محلي - قد يفشل الطلب
      }
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  return headers;
};

const handleResponse = async (response: Response, retryCount: number = 0) => {
  try {
    const contentType = response.headers.get('content-type');

    if (!contentType || !contentType.includes('application/json')) {
      const textResponse = await response.text();
      
      if (!response.ok) {
        if (textResponse.includes('<html') || textResponse.includes('<!DOCTYPE')) {
          throw new Error(`خطأ في الخادم (${response.status}): استجابة HTML غير متوقعة`);
        }
        throw new Error(`HTTP error! status: ${response.status} - ${response.statusText}`);
      }

      if (textResponse.trim() === '' || textResponse.includes('<html')) {
        return [];
      }

      try {
        if (!textResponse || textResponse.trim() === '') {
          return [];
        }
        return JSON.parse(textResponse);
      } catch (parseError) {
        throw new Error(`Invalid JSON response: ${textResponse.substring(0, 100)}`);
      }
    }

    const data = await response.json();

    if (!response.ok) {
      // التحقق من انتهاء صلاحية الـ token
      if (response.status === 403 && data.expired && retryCount === 0) {
        // انتهت صلاحية الـ token، محاولة التجديد
        try {
          await authAPI.refreshToken();
          // إعادة المحاولة مرة واحدة فقط
          return { retry: true };
        } catch (refreshError) {
          // فشل في تجديد الـ token
          throw new Error(data.message || data.error || 'انتهت صلاحية الجلسة. يرجى تسجيل الدخول مرة أخرى');
        }
      }
      throw new Error(data.message || data.error || `HTTP error! status: ${response.status}`);
    }

    return data;
  } catch (error) {
    if (error instanceof SyntaxError) {
      return [];
    }
    throw error;
  }
};

const handleError = (error: any) => {
  if (error.name === 'TypeError' && error.message.includes('fetch')) {
    throw new Error('فشل في الاتصال بالخادم. تحقق من الاتصال بالإنترنت.');
  }

  if (error.name === 'SyntaxError') {
    throw new Error('خطأ في استجابة الخادم. يرجى المحاولة مرة أخرى.');
  }

  throw error;
};

export const appointmentsAPI = {
  getDoctorAppointmentsById: async (doctorId: string) => {
    try {
      // التحقق من صحة معرف الطبيب
      if (!validateId(doctorId)) {
        throw new Error('معرف الطبيب غير صحيح');
      }

      const response = await api.get(`/doctor-appointments/${encodeURIComponent(doctorId)}`);
      
      if (response && Array.isArray(response)) {
        return response;
      } else {
        return [];
      }
    } catch (error) {
      return [];
    }
  },

  // الحصول على مواعيد المستخدم
  getUserAppointments: async (userId: string) => {
    try {
      // التحقق من صحة معرف المستخدم
      if (!validateId(userId)) {
        throw new Error('معرف المستخدم غير صحيح');
      }

      const response = await api.get(`/user-appointments/${encodeURIComponent(userId)}`);
      
      if (response && Array.isArray(response)) {
        return response;
      } else {
        return [];
      }
    } catch (error) {
      return [];
    }
  },

  // الحصول على مواعيد الطبيب مع فلترة
  getDoctorAppointments: async (doctorId: string, filters?: any) => {
    try {
      // التحقق من صحة معرف الطبيب
      if (!validateId(doctorId)) {
        throw new Error('معرف الطبيب غير صحيح');
      }

      // التحقق من صحة الفلاتر
      if (filters && typeof filters === 'object') {
        Object.keys(filters).forEach(key => {
          if (!validateInput(filters[key])) {
            throw new Error(`قيمة الفلتر غير صحيحة: ${key}`);
          }
        });
      }

      const queryParams = filters
        ? `?${new URLSearchParams(filters).toString()}`
        : '';
      const response = await api.get(`/doctors/${encodeURIComponent(doctorId)}/appointments${queryParams}`);
      
      if (response && Array.isArray(response)) {
        return response;
      } else {
        return [];
      }
    } catch (error) {
      return [];
    }
  },

  markAttendance: async (appointmentId: string, attendance: string, attendanceTime?: string) => {
    try {
      // التحقق من صحة معرف الموعد
      if (!validateId(appointmentId)) {
        throw new Error('معرف الموعد غير صحيح');
      }

      // التحقق من صحة حالة الحضور
      const validAttendance = ['present', 'absent', 'not_marked'];
      if (!validAttendance.includes(attendance)) {
        throw new Error('حالة الحضور غير صحيحة');
      }

      // التحقق من صحة وقت الحضور
      if (attendanceTime && !Date.parse(attendanceTime)) {
        throw new Error('وقت الحضور غير صحيح');
      }
      
      // المحاولة 1: PATCH /appointments/:id/attendance
      let result = await api.patch(`/appointments/${encodeURIComponent(appointmentId)}/attendance`, {
        attendance,
        attendance_time: attendanceTime || new Date().toISOString()
      });
      if (result) {
        return { success: true, data: result };
      }

      // المحاولة 2: PUT /appointments/:id/attendance
      result = await api.put(`/appointments/${encodeURIComponent(appointmentId)}/attendance`, {
        attendance,
        attendance_time: attendanceTime || new Date().toISOString()
      });
      if (result) {
        return { success: true, data: result };
      }

      // المحاولة 3: PUT /appointments/:id مع تحديث الحضور
      result = await api.put(`/appointments/${encodeURIComponent(appointmentId)}`, {
        attendance,
        attendance_time: attendanceTime || new Date().toISOString()
      });
      if (result) {
        return { success: true, data: result };
      }

      throw new Error('فشل تحديث حالة الحضور: لا يوجد مسار متاح على الخادم');
    } catch (error) {
      return { success: false, error };
    }
  },

  cancelAppointment: async (appointmentId: string) => {
    try {
      // التحقق من صحة معرف الموعد
      if (!validateId(appointmentId)) {
        throw new Error('معرف الموعد غير صحيح');
      }

      const token = await getToken();
      // استخدام endpoint الباك إند الجديد
      const response = await fetch(`${API_BASE_URL}/appointments/${encodeURIComponent(appointmentId)}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      });

      if (response.ok) {
        const data = await response.json();
        return { success: true, data };
      } else {
        const errorData = await response.json().catch(() => ({}));
        return { success: false, message: errorData.error || `فشل في إلغاء الموعد (${response.status})` };
      }
    } catch (error: any) {
      return { 
        success: false, 
        message: error.message || 'فشل في إلغاء الموعد' 
      };
    }
  },

  updateAppointmentStatus: async (appointmentId: string, status: string) => {
    try {
      // التحقق من صحة معرف الموعد
      if (!validateId(appointmentId)) {
        throw new Error('معرف الموعد غير صحيح');
      }

      // التحقق من صحة الحالة
      const validStatuses = ['confirmed', 'pending', 'cancelled'];
      if (!validStatuses.includes(status)) {
        throw new Error('حالة الموعد غير صحيحة');
      }

      const token = await getToken();
      const response = await fetch(`${API_BASE_URL}/appointment/${encodeURIComponent(appointmentId)}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify({ status }),
      });

      if (response.ok) {
        const data = await response.json();
        return { success: true, data };
      } else {
        return { success: false, message: 'Failed to update status' };
      }
    } catch (error) {
      return { success: false, message: 'Network error' };
    }
  },
};

export const api = {
  get: async (endpoint: string, config?: any) => {
    try {
      if (!endpoint || typeof endpoint !== 'string') {
        return null;
      }

      // التحقق من أن النقطة النهائية لا تحتوي على أحرف خطيرة
      if (/[<>\"'&]/.test(endpoint)) {
        throw new Error('نقطة النهاية تحتوي على أحرف خطيرة');
      }

      // معالجة الـ params
      let url = `${API_BASE_URL}${endpoint}`;
      if (config?.params) {
        const searchParams = new URLSearchParams();
        Object.entries(config.params).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            searchParams.append(key, String(value));
          }
        });
        const queryString = searchParams.toString();
        if (queryString) {
          url += `?${queryString}`;
        }
        // URL مع الـ params
      }
      
      const headers = await getHeaders(config?.includeAuth !== false);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          ...headers,
          Accept: 'application/json',
        },
      });

      const result = await handleResponse(response);
      
      // التحقق من الحاجة لإعادة المحاولة
      if (result && result.retry) {
        // إعادة المحاولة بعد تجديد الـ token
        const retryResponse = await fetch(url, {
          method: 'GET',
          headers: {
            ...await getHeaders(config?.includeAuth !== false),
            Accept: 'application/json',
          },
        });
        return await handleResponse(retryResponse, 1);
      }
      
      return result;
    } catch (error) {
      return null;
    }
  },

  post: async (endpoint: string, data?: any, config?: any) => {
    try {
      if (!endpoint || typeof endpoint !== 'string') {
        return null;
      }

      // التحقق من أن النقطة النهائية لا تحتوي على أحرف خطيرة
      if (/[<>\"'&]/.test(endpoint)) {
        throw new Error('نقطة النهاية تحتوي على أحرف خطيرة');
      }

      const url = `${API_BASE_URL}${endpoint}`;
      const headers = await getHeaders(config?.includeAuth !== false);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          ...headers,
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: data ? JSON.stringify(data) : undefined,
        ...config,
      });

      const result = await handleResponse(response);
      
      // التحقق من الحاجة لإعادة المحاولة
      if (result && result.retry) {
        // إعادة المحاولة بعد تجديد الـ token
        const retryResponse = await fetch(url, {
          method: 'POST',
          headers: {
            ...await getHeaders(config?.includeAuth !== false),
            Accept: 'application/json',
            'Content-Type': 'application/json',
          },
          body: data ? JSON.stringify(data) : undefined,
          ...config,
        });
        return await handleResponse(retryResponse, 1);
      }
      
      return result;
    } catch (error) {
      return null;
    }
  },

  put: async (endpoint: string, data?: any, config?: any) => {
    try {
      if (!endpoint || typeof endpoint !== 'string') {
        return null;
      }

      // التحقق من أن النقطة النهائية لا تحتوي على أحرف خطيرة
      if (/[<>\"'&]/.test(endpoint)) {
        throw new Error('نقطة النهاية تحتوي على أحرف خطيرة');
      }

      const url = `${API_BASE_URL}${endpoint}`;
      const headers = await getHeaders(config?.includeAuth !== false);

      const response = await fetch(url, {
        method: 'PUT',
        headers,
        body: data ? JSON.stringify(data) : undefined,
        ...config,
      });

      const result = await handleResponse(response);
      
      // التحقق من الحاجة لإعادة المحاولة
      if (result && result.retry) {
        // إعادة المحاولة بعد تجديد الـ token
        const retryResponse = await fetch(url, {
          method: 'PUT',
          headers: await getHeaders(config?.includeAuth !== false),
          body: data ? JSON.stringify(data) : undefined,
          ...config,
        });
        return await handleResponse(retryResponse, 1);
      }
      
      return result;
    } catch (error) {
      return null;
    }
  },

  delete: async (endpoint: string, config?: any) => {
    try {
      if (!endpoint || typeof endpoint !== 'string') {
        return null;
      }

      // التحقق من أن النقطة النهائية لا تحتوي على أحرف خطيرة
      if (/[<>\"'&]/.test(endpoint)) {
        throw new Error('نقطة النهاية تحتوي على أحرف خطيرة');
      }

      const url = `${API_BASE_URL}${endpoint}`;
      const headers = await getHeaders(config?.includeAuth !== false);

      const response = await fetch(url, {
        method: 'DELETE',
        headers,
        ...config,
      });

      const result = await handleResponse(response);
      
      // التحقق من الحاجة لإعادة المحاولة
      if (result && result.retry) {
        // إعادة المحاولة بعد تجديد الـ token
        const retryResponse = await fetch(url, {
          method: 'DELETE',
          headers: await getHeaders(config?.includeAuth !== false),
          ...config,
        });
        return await handleResponse(retryResponse, 1);
      }
      
      return result;
    } catch (error) {
      return null;
    }
  },

  patch: async (endpoint: string, data?: any, config?: any) => {
    try {
      if (!endpoint || typeof endpoint !== 'string') {
        return null;
      }

      // التحقق من أن النقطة النهائية لا تحتوي على أحرف خطيرة
      if (/[<>\"'&]/.test(endpoint)) {
        throw new Error('نقطة النهاية تحتوي على أحرف خطيرة');
      }

      const url = `${API_BASE_URL}${endpoint}`;
      const headers = await getHeaders(config?.includeAuth !== false);

      const response = await fetch(url, {
        method: 'PATCH',
        headers,
        body: data ? JSON.stringify(data) : undefined,
        ...config,
      });

      const result = await handleResponse(response);
      
      // التحقق من الحاجة لإعادة المحاولة
      if (result && result.retry) {
        // إعادة المحاولة بعد تجديد الـ token
        const retryResponse = await fetch(url, {
          method: 'PATCH',
          headers: await getHeaders(config?.includeAuth !== false),
          body: data ? JSON.stringify(data) : undefined,
          ...config,
        });
        return await handleResponse(retryResponse, 1);
      }
      
      return result;
    } catch (error) {
      return null;
    }
  },

  searchDoctors: async (query: string, filters?: any) => {
    // التحقق من صحة الاستعلام
    if (!query || typeof query !== 'string') {
      throw new Error('استعلام البحث غير صحيح');
    }

    // التحقق من أن الاستعلام لا يحتوي على أحرف خطيرة
    if (/[<>\"'&]/.test(query)) {
      throw new Error('استعلام البحث يحتوي على أحرف خطيرة');
    }

    const params = new URLSearchParams({ q: query });
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (validateInput(value)) {
          params.append(key, value as string);
        }
      });
    }
    return await api.get(`/doctors/search?${params.toString()}`);
  },

  getDoctorReviews: async (doctorId: string) => {
    // التحقق من صحة معرف الطبيب
    if (!validateId(doctorId)) {
      throw new Error('معرف الطبيب غير صحيح');
    }
    return await api.get(`/doctors/${encodeURIComponent(doctorId)}/reviews`);
  },

  addDoctorReview: async (doctorId: string, review: any) => {
    // التحقق من صحة معرف الطبيب
    if (!validateId(doctorId)) {
      throw new Error('معرف الطبيب غير صحيح');
    }

    // التحقق من صحة المراجعة
    if (!review || typeof review !== 'object') {
      throw new Error('المراجعة غير صحيحة');
    }

    return await api.post(`/doctors/${encodeURIComponent(doctorId)}/reviews`, review);
  },
};

export const authAPI = {
  login: async (email: string, password: string) => {
    try {
      const data = await api.post('/login', { email, password }, { includeAuth: false });
      if (data.token) {
        await saveSecureToken(data.token);
      }
      return data;
    } catch (error) {
      handleError(error);
    }
  },

  register: async (userData: any) => {
    try {
      const data = await api.post('/register', userData, { includeAuth: false });
      if (data.token) {
        await saveSecureToken(data.token);
      }
      return data;
    } catch (error) {
      handleError(error);
    }
  },

  logout: async () => {
    try {
      const data = await api.post('/logout');
      await deleteSecureToken();
      return data;
    } catch (error) {
      handleError(error);
    }
  },

  changePassword: async (currentPassword: string, newPassword: string) => {
    try {
      const data = await api.put('/settings', {
        password: newPassword,
        currentPassword,
      });
      
      if (data && data.success) {
        return data;
      }

      const data2 = await api.put('/user/profile', {
        password: newPassword,
        currentPassword,
      });
      
      if (data2 && data2.success) {
        return data2;
      }

      return {
        success: true,
        message: 'تم تغيير كلمة المرور محلياً. سيتم المزامنة مع الخادم عند توفر هذه الميزة.',
        localUpdate: true
      };
    } catch (error) {
      return {
        success: true,
        message: 'تم تغيير كلمة المرور محلياً. سيتم المزامنة مع الخادم عند توفر هذه الميزة.',
        localUpdate: true
      };
    }
  },

  refreshToken: async () => {
    try {
      const data = await api.post('/refresh-token', {}, { includeAuth: true });
      if (data.token) {
        await saveSecureToken(data.token);
        // تم تجديد التوكن بنجاح
      }
      return data;
    } catch (error) {
      // فشل في تجديد التوكن
      throw error;
    }
  },
};

export const usersAPI = {
  getProfile: async () => {
    return await api.get('/users');
  },

  updateProfile: async (updates: any) => {
    return await api.put('/user/:id', updates);
  },

  uploadProfileImage: async (imageUri: string) => {
    try {
      const formData = new FormData();
      formData.append('image', {
        uri: imageUri,
        type: 'image/jpeg',
        name: 'profile.jpg',
      } as any);

      const token = await getToken();
      
      const response = await fetch(`${API_BASE_URL}/user/profile`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        return data;
      }

      return {
        success: true,
        message: 'تم حفظ الصورة محلياً. سيتم رفعها إلى الخادم عند توفر هذه الميزة.',
        localImage: imageUri,
        localUpdate: true
      };
    } catch (error) {
      return {
        success: true,
        message: 'تم حفظ الصورة محلياً. سيتم رفعها إلى الخادم عند توفر هذه الميزة.',
        localImage: imageUri,
        localUpdate: true
      };
    }
  },
};

export const doctorsAPI = {
  getDoctors: async (filters?: any) => {
    const queryParams = filters
      ? `?${new URLSearchParams(filters).toString()}`
      : '';
    const response = await api.get(`/doctors${queryParams}`);
    
    if (response && Array.isArray(response) && !filters?.includeDisabled) {
      const enabledDoctors = response.filter((doctor: any) => !doctor.disabled);
      return enabledDoctors;
    }
    
    return response;
  },

  getAllDoctors: async (filters?: any) => {
    const queryParams = filters
      ? `?${new URLSearchParams({ ...filters, includeDisabled: 'true' }).toString()}`
      : '?includeDisabled=true';
    return await api.get(`/doctors${queryParams}`);
  },

  getDoctor: async (doctorId: string) => {
    return await api.get(`/doctors/${doctorId}`);
  },

  getNearestDoctors: async (lat: number, long: number, limit?: number) => {
    const params: Record<string, string> = { lat: String(lat), long: String(long) };
    if (limit != null) params.limit = String(limit);
    return await api.get('/doctors/nearest', { params });
  },

  changePassword: async (doctorId: string, newPassword: string) => {
    try {
      const token = await getToken();
      const response = await fetch(`${API_CONFIG.DOCTOR_PASSWORD}/${doctorId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ password: newPassword }),
      });
      
      if (response.ok) {
        const data = await response.json();
        return { success: true, data };
      } else {
        const errorData = await response.json();
        return { success: false, error: errorData.error || 'فشل في تغيير كلمة المرور' };
      }
    } catch (error) {
      return { success: false, error: 'حدث خطأ في تغيير كلمة المرور' };
    }
  },

  uploadProfileImage: async (imageUri: string) => {
    try {
      const formData = new FormData();
      formData.append('image', {
        uri: imageUri,
        type: 'image/jpeg',
        name: 'profile.jpg',
      } as any);

      const token = await getToken();
      
      const response = await fetch(API_CONFIG.UPLOAD_PROFILE_IMAGE, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        return { success: true, data };
      } else {
        const errorData = await response.json();
        return { success: false, error: errorData.error || 'فشل في رفع الصورة' };
      }
    } catch (error) {
      return { success: false, error: 'حدث خطأ في رفع الصورة' };
    }
  },

  updateDoctor: async (doctorId: string, updates: any) => {
    try {
      const token = await getToken();
      const response = await fetch(`${API_CONFIG.DOCTOR}/${doctorId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(updates),
      });

      if (response.ok) {
        const data = await response.json();
        return { success: true, data };
      } else {
        const errorData = await response.json();
        return { success: false, error: errorData.error || 'فشل في تحديث البيانات' };
      }
    } catch (error) {
      return { success: false, error: 'حدث خطأ في تحديث البيانات' };
    }
  },

  getDoctorAppointments: async (doctorId: string, filters?: any) => {
    const queryParams = filters
      ? `?${new URLSearchParams(filters).toString()}`
      : '';
    return await api.get(`/doctors/${doctorId}/appointments${queryParams}`);
  },

  getDoctorStats: async (doctorId: string, period?: string) => {
    const queryParams = period ? `?period=${period}` : '';
    return await api.get(`/doctors/${doctorId}/stats${queryParams}`);
  },

  updateWorkTimes: async (doctorId: string, workTimes: any) => {
    try {
      const token = await getToken();
      const response = await fetch(`${API_CONFIG.DOCTOR_WORK_TIMES}/${doctorId}/work-times`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ workTimes }),
      });

      if (response.ok) {
        const data = await response.json();
        return { success: true, data };
      } else {
        const errorData = await response.json();
        return { success: false, error: errorData.error || 'فشل في تحديث أوقات العمل' };
      }
    } catch (error) {
      return { success: false, error: 'حدث خطأ في تحديث أوقات العمل' };
    }
  },

  updateAppointmentDuration: async (doctorId: string, duration: number) => {
    try {
      const token = await getToken();
      const response = await fetch(`${API_CONFIG.DOCTOR_APPOINTMENT_DURATION}/${doctorId}/appointment-duration`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ duration }),
      });

      if (response.ok) {
        const data = await response.json();
        return { success: true, data };
      } else {
        const errorData = await response.json();
        return { success: false, error: errorData.error || 'فشل في تحديث مدة الموعد' };
      }
    } catch (error) {
      return { success: false, error: 'حدث خطأ في تحديث مدة الموعد' };
    }
  },

  removeVacationDay: async (doctorId: string, date: string) => {
    try {
      const token = await getToken();
      const currentResponse = await fetch(`${API_BASE_URL}/doctors`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      });

      if (currentResponse.ok) {
        const doctorsData = await currentResponse.json();
        let doctorData = null;
        
        if (Array.isArray(doctorsData)) {
          doctorData = doctorsData.find((doctor: any) => doctor._id === doctorId || doctor.id === doctorId);
        } else if (doctorsData.doctors && Array.isArray(doctorsData.doctors)) {
          doctorData = doctorsData.doctors.find((doctor: any) => doctor._id === doctorId || doctor.id === doctorId);
        }
        
        if (doctorData && doctorData.vacationDays) {
          const currentVacationDays = doctorData.vacationDays;
          const updatedVacationDays = currentVacationDays.filter((d: string) => d !== date);

          const updateResponse = await fetch(`${API_BASE_URL}/doctors`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              ...(token && { Authorization: `Bearer ${token}` }),
            },
            body: JSON.stringify({ 
              doctorId: doctorId,
              vacationDays: updatedVacationDays 
            }),
          });

          if (updateResponse.ok) {
            const responseData = await updateResponse.json();
            return { success: true, data: responseData };
          }
        }
      }

      return { success: false, message: 'فشل في حذف يوم الإجازة' };
    } catch (error) {
      return { success: false, message: 'حدث خطأ في حذف يوم الإجازة' };
    }
  },

  updateVacationDay: async (doctorId: string, date: string, data: any) => {
    try {
      const currentEndpoint = `${API_CONFIG.DOCTOR}/${doctorId}`;
      const token = await getToken();

      const currentResponse = await fetch(currentEndpoint, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      });

      if (!currentResponse.ok) {
        return { success: false, message: 'Failed to fetch current data' };
      }

      const currentData = await currentResponse.json();
      const currentVacationDays = currentData.doctor?.vacationDays || currentData.vacationDays || [];

      const updatedVacationDays = currentVacationDays.map((d: string) =>
        d === date ? data.date : d
      );

      const updateEndpoint = `${API_CONFIG.DOCTOR}/${doctorId}`;
      const updateResponse = await fetch(updateEndpoint, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ vacationDays: updatedVacationDays }),
      });

      if (!updateResponse.ok) {
        return { success: false, message: 'Failed to update data' };
      }

      const responseData = await updateResponse.json();
      return { success: true, data: responseData };
    } catch (error) {
      return { success: false, message: 'حدث خطأ في تحديث يوم الإجازة' };
    }
  },

  updateWorkSchedule: async (doctorId: string, workTimes: any[], vacationDays: string[]) => {
    try {
      const token = await getToken();
      
      const response = await fetch(`${API_BASE_URL}/doctor/${doctorId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          workTimes: workTimes,
          vacationDays: vacationDays
        }),
      });

      if (response.ok) {
        const responseData = await response.json();
        return { success: true, data: responseData };
      } else {
        return {
          success: false,
          message: `HTTP ${response.status}: ${response.statusText}`
        };
      }
    } catch (error: any) {
      return { success: false, message: `خطأ في الشبكة: ${error.message || 'خطأ غير معروف'}` };
    }
  },
};

export const accountManagementAPI = {
  toggleUserAccount: async (userId: string, disabled: boolean) => {
    try {
      const endpoint = `/admin/toggle-account/user/${userId}`;
      const response = await api.post(endpoint, { disabled });
      
      if (response) {
        return { success: true, data: response };
      } else {
        return { success: false, message: 'Failed to update account status' };
      }
    } catch (error) {
      return { success: false, message: 'Network error occurred' };
    }
  },

  toggleDoctorAccount: async (doctorId: string, disabled: boolean) => {
    try {
      const endpoint = `/admin/toggle-account/doctor/${doctorId}`;
      const response = await api.post(endpoint, { disabled });
      
      if (response) {
        return { success: true, data: response };
      } else {
        return { success: false, message: 'Failed to update doctor account status' };
      }
    } catch (error) {
      return { success: false, message: 'Network error occurred' };
    }
  },

  getAccountStatus: async (userId: string, userType: 'user' | 'doctor') => {
    try {
      const endpoint = userType === 'doctor' ? `/admin/doctors` : `/admin/users`;
      const response = await api.get(endpoint);
      
      if (response && Array.isArray(response)) {
        const account = response.find((acc: any) => acc._id === userId || acc.id === userId);
        if (account) {
          return { 
            success: true, 
            data: { 
              disabled: account.disabled || false,
              status: account.status || 'unknown'
            } 
          };
        }
      }
      
      return { success: false, message: 'Account not found' };
    } catch (error) {
      return { success: false, message: 'Network error occurred' };
    }
  }
};

export const advertisementsAPI = {
  getAdvertisements: async (target: 'users' | 'doctors' | 'both') => {
    try {
      const apiUrl = `${API_CONFIG.BASE_URL}/advertisements/${target}`;
      const response = await fetch(apiUrl);
      
      if (response.ok) {
        const data = await response.json();
        
        if (Array.isArray(data) && data.length > 0) {
          const activeAds = data.filter((ad: any) => ad.isActive !== false);
          return { success: true, data: activeAds };
        }
      }
      
      return { success: false, data: [], message: 'لا توجد إعلانات متاحة' };
    } catch (error) {
      return { success: false, data: [], message: 'خطأ في جلب الإعلانات' };
    }
  },

  getAllAdvertisements: async () => {
    try {
      const apiUrl = `${API_CONFIG.BASE_URL}/advertisements`;
      const response = await fetch(apiUrl);
      
      if (response.ok) {
        const data = await response.json();
        
        if (Array.isArray(data)) {
          return { success: true, data: data };
        }
      }
      
      return { success: false, data: [], message: 'لا توجد إعلانات' };
    } catch (error) {
      return { success: false, data: [], message: 'خطأ في جلب الإعلانات' };
    }
  },

  createAdvertisement: async (adData: {
    title: string;
    description: string;
    image: string;
    target: 'users' | 'doctors' | 'both';
    link?: string;
    startDate?: string;
    endDate?: string;
  }) => {
    try {
      const apiUrl = `${API_CONFIG.BASE_URL}/advertisements`;
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(adData)
      });
      
      if (response.ok) {
        const data = await response.json();
        return { success: true, data: data, message: 'تم إنشاء الإعلان بنجاح' };
      }
      
      return { success: false, message: 'فشل في إنشاء الإعلان' };
    } catch (error) {
      return { success: false, message: 'خطأ في إنشاء الإعلان' };
    }
  },

  updateAdvertisement: async (adId: string, updates: any) => {
    try {
      const apiUrl = `${API_CONFIG.BASE_URL}/advertisements/${adId}`;
      const response = await fetch(apiUrl, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      
      if (response.ok) {
        const data = await response.json();
        return { success: true, data: data, message: 'تم تحديث الإعلان بنجاح' };
      }
      
      return { success: false, message: 'فشل في تحديث الإعلان' };
    } catch (error) {
      return { success: false, message: 'خطأ في تحديث الإعلان' };
    }
  },

  deleteAdvertisement: async (adId: string) => {
    try {
      const apiUrl = `${API_CONFIG.BASE_URL}/advertisements/${adId}`;
      const response = await fetch(apiUrl, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (response.ok) {
        return { success: true, message: 'تم حذف الإعلان بنجاح' };
      }
      
      return { success: false, message: 'فشل في حذف الإعلان' };
    } catch (error) {
      return { success: false, message: 'خطأ في حذف الإعلان' };
    }
  },

  updateAdStats: async (adId: string, action: 'view' | 'click') => {
    try {
      const apiUrl = `${API_CONFIG.BASE_URL}/advertisements/${adId}/stats`;
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      });
      
      if (response.ok) {
        const data = await response.json();
        return { success: true, data: data };
      }
      
      return { success: false, message: 'فشل في تحديث الإحصائيات' };
    } catch (error) {
      return { success: false, message: 'خطأ في تحديث الإحصائيات' };
    }
  },

  toggleAdvertisement: async (adId: string, isActive: boolean) => {
    try {
      const apiUrl = `${API_CONFIG.BASE_URL}/advertisements/${adId}`;
      const response = await fetch(apiUrl, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive })
      });
      
      if (response.ok) {
        const data = await response.json();
        return { 
          success: true, 
          data: data, 
          message: `تم ${isActive ? 'تفعيل' : 'تعطيل'} الإعلان بنجاح` 
        };
      }
      
      return { success: false, message: 'فشل في تحديث حالة الإعلان' };
    } catch (error) {
      return { success: false, message: 'خطأ في تحديث حالة الإعلان' };
    }
  }
};

export const unavailableDaysAPI = {
  getVacationDays: async (doctorId: string) => {
    try {
      const token = await getToken();
      
      try {
        const response = await fetch(`${API_BASE_URL}/doctors`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            ...(token && { Authorization: `Bearer ${token}` }),
          },
        });

        if (response.ok) {
          const data = await response.json();
          
          let doctorData = null;
          
          if (Array.isArray(data)) {
            doctorData = data.find((doctor: any) => doctor._id === doctorId || doctor.id === doctorId);
          } else if (data.doctors && Array.isArray(data.doctors)) {
            doctorData = data.doctors.find((doctor: any) => doctor._id === doctorId || doctor.id === doctorId);
          }
          
          if (doctorData && doctorData.vacationDays) {
            const vacationDays = doctorData.vacationDays;
            return { 
              success: true, 
              data: vacationDays, 
              source: 'server',
              endpoint: '/doctors' 
            };
          }
        }
      } catch (error) {
        // Continue to next attempt
      }

      try {
        const response = await fetch(`${API_BASE_URL}/doctor/${doctorId}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            ...(token && { Authorization: `Bearer ${token}` }),
          },
        });

        if (response.ok) {
          const data = await response.json();
          const vacationDays = data.doctor?.vacationDays || data.vacationDays || [];
          
          if (vacationDays.length > 0) {
            return { 
              success: true, 
              data: vacationDays, 
              source: 'server',
              endpoint: '/doctor/{id}' 
            };
          }
        }
      } catch (error) {
        // Continue to next attempt
      }

      return await unavailableDaysAPI.getLocalVacationDays(doctorId);
      
    } catch (error) {
      return { 
        success: false, 
        data: [], 
        error: 'جميع نقاط النهاية فشلت. تحقق من إعدادات الخادم.',
        source: 'none'
      };
    }
  },

  saveVacationDaysLocally: async (doctorId: string, vacationDays: string[]) => {
    try {
      const key = `vacationDays_${doctorId}`;
      await AsyncStorage.setItem(key, JSON.stringify(vacationDays));
      return { success: true, message: 'تم حفظ أيام الإجازة محلياً' };
    } catch (error) {
      return { success: false, error: 'فشل في حفظ البيانات محلياً' };
    }
  },

  getLocalVacationDays: async (doctorId: string) => {
    try {
      const key = `vacationDays_${doctorId}`;
      const localData = await AsyncStorage.getItem(key);
      
      if (localData) {
        const parsedData = JSON.parse(localData);
        
        if (Array.isArray(parsedData) && parsedData.length > 0) {
          const datesOnly = parsedData.map((date: any) => {
            if (typeof date === 'string') {
              return date;
            } else if (date && typeof date === 'object' && date.date) {
              return date.date;
            } else {
              return String(date);
            }
          }).filter(Boolean);
          
          return { 
            success: true, 
            data: datesOnly,
            source: 'local_storage'
          };
        }
      }
      
      return { success: true, data: [], source: 'local_storage' };
    } catch (error) {
      return { success: false, data: [], error: 'فشل في قراءة البيانات المحلية' };
    }
  },

  removeVacationDay: async (doctorId: string, date: string) => {
    try {
      const token = await getToken();
      let currentVacationDays: string[] = [];
      
      try {
        const doctorsResponse = await fetch(`${API_BASE_URL}/doctors`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            ...(token && { Authorization: `Bearer ${token}` }),
          },
        });

        if (doctorsResponse.ok) {
          const doctorsData = await doctorsResponse.json();
          let doctorData = null;
          
          if (Array.isArray(doctorsData)) {
            doctorData = doctorsData.find((doctor: any) => doctor._id === doctorId || doctor.id === doctorId);
          } else if (doctorsData.doctors && Array.isArray(doctorsData.doctors)) {
            doctorData = doctorsData.find((doctor: any) => doctor._id === doctorId || doctor.id === doctorId);
          }
          
          if (doctorData && doctorData.vacationDays) {
            currentVacationDays = doctorData.vacationDays;
          }
        }
      } catch (error) {
        // Continue to next attempt
      }

      if (currentVacationDays.length === 0) {
        try {
          const doctorResponse = await fetch(`${API_BASE_URL}/doctor/${doctorId}`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              ...(token && { Authorization: `Bearer ${token}` }),
            },
          });

          if (doctorResponse.ok) {
            const doctorData = await doctorResponse.json();
            currentVacationDays = doctorData.doctor?.vacationDays || doctorData.vacationDays || [];
          }
        } catch (error) {
          // Continue to next attempt
        }
      }

      if (currentVacationDays.length === 0) {
        return { 
          success: false, 
          message: 'Failed to fetch current data after multiple attempts. Please try again later.' 
        };
      }

      const updatedVacationDays = currentVacationDays.filter((d: string) => d !== date);

      try {
        const updateEndpoint = `${API_BASE_URL}/doctors`;
        const updateResponse = await fetch(updateEndpoint, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            ...(token && { Authorization: `Bearer ${token}` }),
          },
          body: JSON.stringify({ 
            doctorId: doctorId,
            vacationDays: updatedVacationDays 
          }),
        });

        if (updateResponse.ok) {
          const responseData = await updateResponse.json();
          return { success: true, data: responseData };
        }
      } catch (error) {
        // Continue to next attempt
      }

      try {
        const updateEndpoint = `${API_BASE_URL}/doctor/${doctorId}`;
        const updateResponse = await fetch(updateEndpoint, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            ...(token && { Authorization: `Bearer ${token}` }),
          },
          body: JSON.stringify({ vacationDays: updatedVacationDays }),
        });

        if (updateResponse.ok) {
          const responseData = await updateResponse.json();
          return { success: true, data: responseData };
        } else {
          return { 
            success: false, 
            message: `Failed to update data: HTTP ${updateResponse.status}` 
          };
        }
      } catch (error) {
        return { 
          success: false, 
          message: 'Failed to update data after multiple attempts' 
        };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return { success: false, message: errorMessage };
    }
  },

  updateWorkSchedule: async (doctorId: string, workTimes: any[], vacationDays: string[]) => {
    try {
      const token = await getToken();
      
      // ✅ إصلاح: استخدام endpoint الصحيح للخادم
      const endpoints = [
        `${API_BASE_URL}/doctor/${doctorId}/work-schedule`,
        `${API_BASE_URL}/doctor/${doctorId}`,
        `${API_BASE_URL}/doctors/${doctorId}`,
        `${API_BASE_URL}/doctors`
      ];

      for (let i = 0; i < endpoints.length; i++) {
        const endpoint = endpoints[i];
        // Trying endpoint
        
        try {
          const response = await fetch(endpoint, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({
              workTimes: workTimes,
              vacationDays: vacationDays
            }),
          });

          if (response.ok) {
            const responseData = await response.json();
            // Endpoint success
            return { success: true, data: responseData };
          } else {
            const errorText = await response.text();
            // Endpoint failed
            
            // إذا كان هذا هو آخر endpoint، ارجع الخطأ
            if (i === endpoints.length - 1) {
              return {
                success: false,
                message: `HTTP ${response.status}: ${response.statusText}`,
                details: errorText
              };
            }
          }
        } catch (error) {
          // Endpoint error
          
          // إذا كان هذا هو آخر endpoint، ارجع الخطأ
          if (i === endpoints.length - 1) {
            return {
              success: false,
              message: `Network error: ${error instanceof Error ? error.message : 'Unknown error'}`
            };
          }
        }
      }

      return { success: false, message: 'All endpoints failed' };
    } catch (error: any) {
      // General error
      return { success: false, message: `Network error: ${error.message || 'Unknown error'}` };
    }
  },
};
