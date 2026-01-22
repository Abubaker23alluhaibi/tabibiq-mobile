import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_CONFIG } from '../config/api';
import { User } from '../types';
import { doctorsAPI } from '../services/api';
import { getToken as getSecureToken, saveToken as saveSecureToken, deleteToken as deleteSecureToken } from '../utils/secureStorage';
import { formatPhone } from '../utils/helpers';

interface AuthContextType {
  user: User | null;
  profile: any | null; 
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
  setProfile: (profile: any) => void;
  reloadFromStorage: () => Promise<void>;
  checkStorageStatus: () => Promise<{ userData: boolean; profileData: boolean; token: boolean }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: React.ReactNode;
}

// --- دوال التحقق (Validation Helpers) ---
const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const validatePassword = (password: string): boolean => {
  return Boolean(password && password.length >= 6);
};

const validatePhone = (phone: string): boolean => {
  const phoneRegex = /^[\+]?[0-9\s\-\(\)]{8,}$/;
  return Boolean(phone && phoneRegex.test(phone));
};

const validateName = (name: string): boolean => {
  return Boolean(name && name.trim().length >= 2 && /^[a-zA-Z\u0600-\u06FF\s]+$/.test(name));
};

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUserFromStorage();
  }, []);

  // تحميل بيانات المستخدم من الذاكرة عند فتح التطبيق
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
          // تطبيع البيانات للتأكد من وجود الحقول الأساسية
          const convertedUser: User = {
            id: parsedUser._id || parsedUser.id || '',
            name: parsedUser.first_name || parsedUser.name || '',
            email: parsedUser.email || '',
            phone: parsedUser.phone || '',
            user_type: parsedUser.user_type || 'user',
            image: parsedUser.profile_image || parsedUser.image || '',
            created_at: parsedUser.created_at || parsedUser.createdAt || '',
            updated_at: parsedUser.updated_at || parsedUser.updatedAt || '',
          };
          setUser(convertedUser);
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
      console.log('Error loading user from storage:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveUserToStorage = async (userData: User, profileData: any) => {
    try {
      await AsyncStorage.setItem('user', JSON.stringify(userData));
      await AsyncStorage.setItem('profile', JSON.stringify(profileData));
    } catch (error) {
      console.log('Error saving user to storage:', error);
    }
  };

  // --- تسجيل الدخول (SignIn) ---
  const signIn = async (
    email: string,
    password: string,
    loginType: 'user' | 'doctor' | 'admin' | 'center' = 'user'
  ): Promise<{ error?: string }> => {
    try {
      setLoading(true);

      const isValidInput = validateEmail(email) || validatePhone(email);
      if (!isValidInput) {
        return { error: 'البريد الإلكتروني أو رقم الهاتف غير صحيح' };
      }

      if (!validatePassword(password)) {
        return { error: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل' };
      }

      const isEmailInput = validateEmail(email);
      let cleanInput: string;
      const cleanPassword = password.trim();

      if (isEmailInput) {
        cleanInput = email.trim().toLowerCase();
      } else {
        const trimmedPhone = email.trim();
        cleanInput = formatPhone(trimmedPhone);
      }

      let requestBody: any = {
        password: cleanPassword,
        loginType,
      };

      if (isEmailInput) {
        requestBody.email = cleanInput;
      } else {
        requestBody.phone = cleanInput;
      }

      const response = await fetch(API_CONFIG.AUTH_LOGIN, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const responseText = await response.text();
        let errorMessage = 'فشل تسجيل الدخول';
        try {
            const errorData = JSON.parse(responseText);
            errorMessage = errorData.message || errorData.error || `خطأ (${response.status})`;
        } catch (e) {}
        return { error: errorMessage };
      }

      const data = await response.json();
      const userDataFromResponse = data.user || data.doctor;
      
      if (!userDataFromResponse) return { error: 'بيانات المستخدم غير صحيحة' };

      const userData: User = {
        id: userDataFromResponse._id || userDataFromResponse.id || '',
        name: userDataFromResponse.name || '',
        email: userDataFromResponse.email || '',
        phone: userDataFromResponse.phone || '',
        user_type: data.userType || userDataFromResponse.user_type || (data.doctor ? 'doctor' : 'user'),
        image: userDataFromResponse.profile_image || userDataFromResponse.image || '',
        created_at: userDataFromResponse.created_at || userDataFromResponse.createdAt || '',
        updated_at: userDataFromResponse.updated_at || userDataFromResponse.updatedAt || '',
      };

      // 1. تحديث الحالة
      setUser(userData);
      setProfile(userDataFromResponse);
      
      // 2. حفظ البيانات في الذاكرة
      await saveUserToStorage(userData, userDataFromResponse);

      // 3. حفظ التوكن (الأهم)
      if (data.token) {
        await saveSecureToken(data.token);
      }

      return {};
    } catch (error) {
      return { error: error instanceof Error ? error.message : 'حدث خطأ أثناء تسجيل الدخول' };
    } finally {
      setLoading(false);
    }
  };

  // --- إنشاء حساب (SignUp) ---
  // ✅ تم التعديل ليقوم بتسجيل الدخول تلقائياً
  const signUp = async (userData: any) => {
    try {
      setLoading(true);

      // 1. التحقق من صحة البيانات
      if (!validateEmail(userData.email)) throw new Error('البريد الإلكتروني غير صحيح');
      if (!validatePassword(userData.password)) throw new Error('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
      if (userData.password !== userData.confirmPassword) throw new Error('كلمة المرور غير متطابقة');
      if (!validateName(userData.name)) throw new Error('الاسم غير صحيح');
      if (!validatePhone(userData.phone)) throw new Error('رقم الهاتف غير صحيح');

      const endpoint = API_CONFIG.AUTH_REGISTER;
      
      const requestData = {
        email: userData.email.trim().toLowerCase(),
        password: userData.password,
        first_name: userData.name.trim(),
        phone: userData.phone.trim(),
      };

      // 2. إرسال طلب الإنشاء
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || data.error || 'فشل التسجيل');
      }

      // ✅ 3. الحل الجذري: تسجيل الدخول التلقائي فوراً
      // هذا يضمن الحصول على التوكن الصحيح وحفظه
      console.log('تم إنشاء الحساب، جاري تسجيل الدخول التلقائي...');
      
      // نستدعي signIn الموجودة في نفس الملف
      const loginResult = await signIn(
        userData.email, 
        userData.password, 
        'user'
      );

      if (loginResult.error) {
        // نجح الإنشاء لكن فشل الدخول التلقائي
        return {
          success: true,
          message: 'تم التسجيل بنجاح، يرجى تسجيل الدخول يدوياً',
          requiresManualLogin: true,
        };
      }

      // نجح الإنشاء والدخول
      return {
        success: true,
        message: 'تم التسجيل والدخول بنجاح',
        autoLogin: true, 
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'حدث خطأ أثناء التسجيل';
      return { error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // --- تسجيل الخروج (SignOut) ---
  const signOut = async () => {
    try {
      setLoading(true);
      if (user) {
        try {
          const token = await getSecureToken();
          await fetch(API_CONFIG.AUTH_LOGOUT, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: token ? `Bearer ${token}` : '',
            },
          });
        } catch (error) {}
      }

      // تنظيف الذاكرة
      setUser(null);
      setProfile(null);
      await deleteSecureToken();

      try {
        await AsyncStorage.multiRemove([
          'user', 'profile', 'appointments', 'reminders', 'notifications', 
          'settings', 'lastLogin', 'userPreferences'
        ]);
      } catch (error) {}

    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  // --- تحديث المستخدم ---
  const updateUser = async (updates: Partial<User>) => {
    try {
      if (!user) return;
      const updatedUser = { ...user, ...updates };
      setUser(updatedUser);
      await saveUserToStorage(updatedUser, profile || {});

      if (profile?._id) {
        const response = await fetch(
          `${API_CONFIG.USERS_PROFILE}/${profile._id}`,
          {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updates),
          }
        );
        if (response.ok) {
          const data = await response.json();
          const finalUser = { ...user, ...data };
          setUser(finalUser);
          await saveUserToStorage(finalUser, profile || {});
        }
      }
    } catch (error) {}
  };

  // --- تحديث الملف الشخصي ---
  const updateProfile = async (updates: any) => {
    try {
      const currentUser = profile || user;
      if (!currentUser?._id) return { error: 'لا يمكن العثور على معرف المستخدم' };

      let result;
      if (currentUser.user_type === 'doctor') {
        result = await doctorsAPI.updateDoctor(currentUser._id, updates);
      } else {
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
        let updatedWithTimestamp = {
            ...(updated.doctor || updated.user || updated),
            lastProfileUpdate: new Date().toISOString(),
        };

        const userData: User = {
          id: updatedWithTimestamp._id || updatedWithTimestamp.id || '',
          name: updatedWithTimestamp.first_name || updatedWithTimestamp.name || '',
          email: updatedWithTimestamp.email || '',
          phone: updatedWithTimestamp.phone || '',
          user_type: updatedWithTimestamp.user_type || 'user',
          image: updatedWithTimestamp.profile_image || updatedWithTimestamp.image || '',
          created_at: updatedWithTimestamp.created_at || '',
          updated_at: updatedWithTimestamp.updated_at || '',
        };
        
        setProfile(updatedWithTimestamp);
        setUser(userData);
        await saveUserToStorage(userData, updatedWithTimestamp);

        return { data: updated, error: undefined };
      } else {
        return { error: result?.error || 'فشل في تحديث البيانات' };
      }
    } catch (error) {
      return { error: error instanceof Error ? error.message : 'حدث خطأ غير متوقع' };
    }
  };

  const refreshUser = async () => {
    try {
      if (!user) return;
      const token = await getSecureToken();
      const response = await fetch(`${API_CONFIG.BASE_URL}/users/${user.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

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
        await saveUserToStorage(updatedUser, profile || {});
      }
    } catch (error) {}
  };

  const reloadFromStorage = async () => {
    await loadUserFromStorage();
  };

  const checkStorageStatus = async () => {
    try {
      const userData = await AsyncStorage.getItem('user');
      const profileData = await AsyncStorage.getItem('profile');
      const token = await getSecureToken();
      return { userData: !!userData, profileData: !!profileData, token: !!token };
    } catch (error) {
      return { userData: false, profileData: false, token: false };
    }
  };

  const value: AuthContextType = {
    user, profile, loading, signIn, login: signIn, signUp, signOut,
    updateUser, updateProfile, refreshUser, setProfile, reloadFromStorage, checkStorageStatus,
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