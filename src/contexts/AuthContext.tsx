import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_CONFIG } from '../config/api';
import { User, Doctor } from '../types';
import { doctorsAPI } from '../services/api';
import { getToken as getSecureToken, saveToken as saveSecureToken, deleteToken as deleteSecureToken } from '../utils/secureStorage';
// Remove circular dependency - we'll handle notifications differently
// import { useNotifications } from './NotificationContext';

interface AuthContextType {
  user: User | null;
  profile: any | null; // البيانات الشخصية الكاملة
  loading: boolean;
  signIn: (
    email: string,
    password: string,
    loginType?: 'user' | 'doctor' | 'admin' | 'center'
  ) => Promise<{ error?: string }>;
  login: (
    email: string,
    password: string,
    loginType?: 'user' | 'doctor' | 'admin' | 'center'
  ) => Promise<{ error?: string }>;
  signUp: (userData: any) => Promise<any>;
  signOut: () => Promise<void>;
  updateUser: (updates: Partial<User>) => Promise<void>;
  updateProfile: (updates: any) => Promise<{ data?: any; error?: string }>;
  refreshUser: () => Promise<void>;
  setProfile: (profile: any) => void; // إضافة setProfile
  reloadFromStorage: () => Promise<void>; // دالة جديدة
  checkStorageStatus: () => Promise<{ userData: boolean; profileData: boolean; token: boolean }>; // دالة جديدة
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: React.ReactNode;
}

// دالة للتحقق من صحة البريد الإلكتروني
const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// دالة للتحقق من صحة كلمة المرور
const validatePassword = (password: string): boolean => {
  return Boolean(password && password.length >= 6);
};

// دالة للتحقق من صحة رقم الهاتف
const validatePhone = (phone: string): boolean => {
  const phoneRegex = /^[\+]?[0-9\s\-\(\)]{8,}$/;
  return Boolean(phone && phoneRegex.test(phone));
};

// دالة للتحقق من صحة الاسم
const validateName = (name: string): boolean => {
  return Boolean(name && name.trim().length >= 2 && /^[a-zA-Z\u0600-\u06FF\s]+$/.test(name));
};

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  // Remove notifications context usage to avoid circular dependency
  // We'll handle notifications through a different approach

  useEffect(() => {
    loadUserFromStorage();
  }, []);

  const loadUserFromStorage = async () => {
    try {
      const userData = await AsyncStorage.getItem('user');
      const profileData = await AsyncStorage.getItem('profile');

      if (userData) {
        let parsedUser;
        try {
          parsedUser = JSON.parse(userData);
        } catch (parseError) {
          parsedUser = null;
        }

        if (parsedUser && typeof parsedUser === 'object') {
          // تحويل البيانات إلى التنسيق الصحيح إذا كانت تحتوي على _id
          if (parsedUser._id && !parsedUser.id) {
            const convertedUser: User = {
              id: parsedUser._id,
              name: parsedUser.first_name || parsedUser.name || '',
              email: parsedUser.email || '',
              phone: parsedUser.phone || '',
              user_type: parsedUser.user_type || 'user',
              image: parsedUser.profile_image || parsedUser.image || '',
              created_at: parsedUser.created_at || parsedUser.createdAt || '',
              updated_at: parsedUser.updated_at || parsedUser.updatedAt || '',
            };
            setUser(convertedUser);
          } else {
            setUser(parsedUser);
          }
        }
      }

      if (profileData) {
        let parsedProfile;
        try {
          parsedProfile = JSON.parse(profileData);
        } catch (parseError) {
          parsedProfile = null;
        }

        if (parsedProfile && typeof parsedProfile === 'object') {
          setProfile(parsedProfile);
        }
      }
    } catch (error) {
      // معالجة الأخطاء بهدوء
    } finally {
      setLoading(false);
    }
  };

  const saveUserToStorage = async (userData: User, profileData: any) => {
    try {
      await AsyncStorage.setItem('user', JSON.stringify(userData));
      await AsyncStorage.setItem('profile', JSON.stringify(profileData));
    } catch (error) {
      // معالجة الأخطاء بهدوء
    }
  };

  const signIn = async (
    email: string,
    password: string,
    loginType: 'user' | 'doctor' | 'admin' | 'center' = 'user'
  ): Promise<{ error?: string }> => {
    try {
      setLoading(true);

      // التحقق من صحة المدخلات
      if (!validateEmail(email)) {
        return { error: 'البريد الإلكتروني غير صحيح' };
      }

      if (!validatePassword(password)) {
        return { error: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل' };
      }

      // تنظيف المدخلات
      const cleanEmail = email.trim().toLowerCase();
      const cleanPassword = password.trim();

      const response = await fetch(API_CONFIG.AUTH_LOGIN, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: cleanEmail,
          password: cleanPassword,
          loginType,
        }),
      });

      if (!response.ok) {
        const responseText = await response.text();
        let errorMessage = 'فشل تسجيل الدخول';
        
        try {
          const errorData = JSON.parse(responseText);
          errorMessage =
            errorData.message ||
            errorData.error ||
            `خطأ في الخادم (${response.status})`;
        } catch (parseError) {
          if (response.status === 404) {
            errorMessage = 'نقطة الاتصال غير موجودة. تحقق من إعدادات الخادم.';
          } else if (response.status >= 500) {
            errorMessage = 'خطأ في الخادم. يرجى المحاولة لاحقاً.';
          } else {
            errorMessage = `خطأ في الخادم (${response.status})`;
          }
        }

        return { error: errorMessage };
      }

      let data;
      try {
        const responseText = await response.text();
        
        if (!responseText || responseText.trim() === '') {
          return { error: 'استجابة الخادم فارغة' };
        }

        data = JSON.parse(responseText);
      } catch (parseError) {
        return { error: 'استجابة الخادم غير صحيحة' };
      }

      // التحقق من صحة البيانات المستلمة
      const userDataFromResponse = data.user || data.doctor;
      if (!userDataFromResponse || typeof userDataFromResponse !== 'object') {
        return { error: 'بيانات المستخدم غير صحيحة' };
      }

      const userData: User = {
        id: userDataFromResponse._id || userDataFromResponse.id || '',
        name: userDataFromResponse.name || '',
        email: userDataFromResponse.email || '',
        phone: userDataFromResponse.phone || '',
        user_type:
          data.userType ||
          userDataFromResponse.user_type ||
          (data.doctor ? 'doctor' : 'user'),
        image:
          userDataFromResponse.profile_image ||
          userDataFromResponse.image ||
          '',
        created_at:
          userDataFromResponse.created_at ||
          userDataFromResponse.createdAt ||
          '',
        updated_at:
          userDataFromResponse.updated_at ||
          userDataFromResponse.updatedAt ||
          '',
      };

      setUser(userData);

      // حفظ البيانات الشخصية الكاملة
      const fullProfileData = userDataFromResponse;
      setProfile(fullProfileData);
      await saveUserToStorage(userData, fullProfileData);

      // حفظ التوكن إذا كان موجوداً في SecureStore
      if (data.token) {
        await saveSecureToken(data.token);
      }

      return {};
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'حدث خطأ أثناء تسجيل الدخول';
      return { error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (userData: any) => {
    try {
      setLoading(true);

      // التحقق من صحة البيانات
      if (!validateEmail(userData.email)) {
        throw new Error('البريد الإلكتروني غير صحيح');
      }

      if (!validatePassword(userData.password)) {
        throw new Error('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
      }

      if (userData.password !== userData.confirmPassword) {
        throw new Error('كلمة المرور غير متطابقة');
      }

      if (!validateName(userData.name)) {
        throw new Error('الاسم غير صحيح');
      }

      if (!validatePhone(userData.phone)) {
        throw new Error('رقم الهاتف غير صحيح');
      }

      // تسجيل المستخدم العادي فقط
      const endpoint = API_CONFIG.AUTH_REGISTER;

      // إعداد البيانات للمستخدم العادي
      const requestData = {
        email: userData.email.trim().toLowerCase(),
        password: userData.password,
        first_name: userData.name.trim(),
        phone: userData.phone.trim(),
      };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || data.error || 'فشل التسجيل');
      }

      // تسجيل المستخدم العادي
      if (data.user || data.token) {
        const newUser: User = {
          id: data.user?._id || data.user?.id || '',
          name: data.user?.first_name || data.user?.name || '',
          email: data.user?.email || '',
          phone: data.user?.phone || '',
          user_type: 'user',
          image: data.user?.profile_image || data.user?.image || '',
          created_at: data.user?.created_at || data.user?.createdAt || '',
          updated_at: data.user?.updated_at || data.user?.updatedAt || '',
        };

        // لا نقوم بتسجيل الدخول التلقائي - نطلب من المستخدم تسجيل الدخول يدوياً

        return {
          success: true,
          message: 'تم التسجيل بنجاح، يرجى تسجيل الدخول الآن',
          requiresManualLogin: true,
        };
      } else {
        // إذا لم يتم إرجاع بيانات المستخدم، نطلب من المستخدم تسجيل الدخول يدوياً
        
        return {
          success: true,
          message: 'تم التسجيل بنجاح، يرجى تسجيل الدخول الآن',
          requiresManualLogin: true,
        };
      }

      return {
        success: true,
        message: 'تم التسجيل بنجاح',
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'حدث خطأ أثناء التسجيل';
      return { error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);

      // إرسال طلب تسجيل الخروج إلى الخادم
      if (user) {
        try {
          const token = await getSecureToken();


          const response = await fetch(API_CONFIG.AUTH_LOGOUT, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: token ? `Bearer ${token}` : '',
            },
          });

          // User profile data processed
          //   '📥 استجابة تسجيل الخروج:',
          //   response.status,
          //   response.statusText
          // );

          if (response.ok) {

          } else {

          }
        } catch (error) {
          // خطأ في تسجيل الخروج من الخادم
        }
      }

      // تنظيف البيانات المحلية


      // تنظيف الإشعارات
      // We'll handle this through a different approach to avoid circular dependency
      try {
        // Clear notifications from AsyncStorage directly
        const keys = await AsyncStorage.getAllKeys();
        const notificationKeys = keys.filter(key =>
          key.startsWith('notifications_')
        );
        await AsyncStorage.multiRemove(notificationKeys);

      } catch (error) {
        // خطأ في تنظيف الإشعارات
      }

      // إعادة تعيين حالة المستخدم أولاً
      setUser(null);
      setProfile(null);

      // حذف التوكن من SecureStore
      await deleteSecureToken();

      // تنظيف جميع البيانات من التخزين المحلي
      try {
        await AsyncStorage.multiRemove([
          'user',
          'profile',
          'appointments',
          'reminders',
          'notifications',
          'settings',
          'lastLogin',
          'userPreferences',
        ]);
        // تم تنظيف جميع البيانات من التخزين المحلي
      } catch (error) {
        // معالجة الأخطاء بهدوء
      }

      // التأكد من حفظ حالة المستخدم كـ null
      await AsyncStorage.removeItem('user');
      await AsyncStorage.removeItem('profile');

      // تم تسجيل الخروج بنجاح
    } catch (error) {
      // معالجة الأخطاء بهدوء
    } finally {
      setLoading(false);
    }
  };

  const updateUser = async (updates: Partial<User>) => {
    try {
      if (!user) return;
      
      const updatedUser = { ...user, ...updates };
      setUser(updatedUser);
      await saveUserToStorage(updatedUser, profile || {});

      // إرسال طلب تحديث البيانات إلى الخادم
      if (profile?._id) {
        const response = await fetch(
          `${API_CONFIG.USERS_PROFILE}/${profile._id}`,
          {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(updates),
          }
        );

        if (response.ok) {
          const data = await response.json();
          const updatedUser = { ...user, ...data };
          setUser(updatedUser);
          await saveUserToStorage(updatedUser, profile || {});
        }
      }
    } catch (error) {
      // معالجة الأخطاء بهدوء
    }
  };

  const updateProfile = async (updates: any) => {
    try {
      const currentUser = profile || user;

      if (!currentUser?._id) {
        return { error: 'لا يمكن العثور على معرف المستخدم' };
      }

      let result;

      // ✅ استخدام API مخصص للأطباء إذا كان المستخدم طبيب
      if (currentUser.user_type === 'doctor') {
        result = await doctorsAPI.updateDoctor(currentUser._id, updates);
      } else {
        // استخدام الطريقة القديمة للمستخدمين العاديين
        const url = `${API_CONFIG.BASE_URL}/user/${currentUser._id}`;
        const token = await getSecureToken();
        
        const response = await fetch(url, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            ...(token && { Authorization: `Bearer ${token}` }),
          },
          body: JSON.stringify(updates),
        });

        if (!response.ok) {
          const data = await response.json();
          return { error: data.error || `فشل في تحديث البيانات (${response.status})` };
        }

        const data = await response.json();
        result = { success: true, data: data.user || data };
      }

      if (result && result.success) {
        const updated = result.data;
        
        // ✅ إصلاح: معالجة البيانات التي تأتي من الخادم
        let updatedWithTimestamp;
        if (updated.doctor) {
          // البيانات تأتي في شكل { doctor: {...} }
          updatedWithTimestamp = {
            ...updated.doctor,
            lastProfileUpdate: new Date().toISOString(),
          };
        } else if (updated.user) {
          // البيانات تأتي في شكل { user: {...} }
          updatedWithTimestamp = {
            ...updated.user,
            lastProfileUpdate: new Date().toISOString(),
          };
        } else {
          // البيانات تأتي مباشرة
          updatedWithTimestamp = {
            ...updated,
            lastProfileUpdate: new Date().toISOString(),
          };
        }
        


        
        // تحويل البيانات إلى التنسيق الصحيح
        const userData: User = {
          id: updatedWithTimestamp._id || updatedWithTimestamp.id || '',
          name: updatedWithTimestamp.first_name || updatedWithTimestamp.name || updatedWithTimestamp.doctor?.name || '',
          email: updatedWithTimestamp.email || updatedWithTimestamp.doctor?.email || '',
          phone: updatedWithTimestamp.phone || updatedWithTimestamp.doctor?.phone || '',
          user_type: updatedWithTimestamp.user_type || updatedWithTimestamp.doctor?.user_type || 'user',
          image: updatedWithTimestamp.profile_image || updatedWithTimestamp.image || updatedWithTimestamp.doctor?.profileImage || updatedWithTimestamp.doctor?.image || '',
          created_at: updatedWithTimestamp.created_at || updatedWithTimestamp.createdAt || updatedWithTimestamp.doctor?.createdAt || '',
          updated_at: updatedWithTimestamp.updated_at || updatedWithTimestamp.updatedAt || updatedWithTimestamp.doctor?.updatedAt || '',
        };
        
        // تحديث الحالة
        setProfile(updatedWithTimestamp);
        setUser(userData);
        
        // حفظ في التخزين المحلي - دمج البيانات المحدثة مع البيانات الأصلية
        const mergedProfileData = {
          ...updatedWithTimestamp,
        };
        
        await saveUserToStorage(userData, mergedProfileData);
        





        return { data: updated, error: undefined };
      } else {
        return { error: result?.error || 'فشل في تحديث البيانات' };
      }
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'حدث خطأ غير متوقع',
      };
    }
  };

  const refreshUser = async () => {
    try {
      if (!user) return;

      const token = await getSecureToken();
      const response = await fetch(
        `${API_CONFIG.BASE_URL}/users/${user.id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        const updatedUser: User = {
          id: data.user._id,
          name: data.user.name,
          email: data.user.email,
          phone: data.user.phone,
          user_type: data.user.user_type,

          image: data.user.profile_image,
          created_at: data.user.created_at,
          updated_at: data.user.updated_at,
        };

        setUser(updatedUser);
        await saveUserToStorage(updatedUser, profile || {}); // Assuming profile is available here
      }
    } catch (error) {
      // خطأ في تحديث المستخدم
    }
  };

  // دالة جديدة لإعادة تحميل البيانات من التخزين المحلي
  const reloadFromStorage = async () => {

    await loadUserFromStorage();
  };

  // دالة جديدة للتحقق من حالة التخزين المحلي
  const checkStorageStatus = async () => {
    try {
      const userData = await AsyncStorage.getItem('user');
      const profileData = await AsyncStorage.getItem('profile');
      const token = await getSecureToken();
      




      
      if (userData) {
        const parsed = JSON.parse(userData);

      }
      
      if (profileData) {
        const parsed = JSON.parse(profileData);

      }
      
      return { userData: !!userData, profileData: !!profileData, token: !!token };
    } catch (error) {
      return { userData: false, profileData: false, token: false };
    }
  };

  const value: AuthContextType = {
    user,
    profile,
    loading,
    signIn,
    login: signIn, // إضافة alias للدالة
    signUp,
    signOut,
    updateUser,
    updateProfile,
    refreshUser,
    setProfile, // إضافة setProfile
    reloadFromStorage, // إضافة reloadFromStorage
    checkStorageStatus, // إضافة checkStorageStatus
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
