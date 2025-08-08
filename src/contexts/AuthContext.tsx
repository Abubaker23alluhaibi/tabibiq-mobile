import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User } from '../types';
import { API_CONFIG, buildApiUrl, testServerConnection } from '../config/api';

interface AuthContextType {
  user: User | null;
  profile: any | null; // البيانات الشخصية الكاملة
  loading: boolean;
  signIn: (email: string, password: string, loginType?: 'user' | 'doctor') => Promise<{ error?: string }>;
  signUp: (userData: any) => Promise<any>;
  signOut: () => Promise<void>;
  updateUser: (updates: Partial<User>) => Promise<void>;
  updateProfile: (updates: any) => Promise<{ data?: any; error?: string }>;
  refreshUser: () => Promise<void>;
  testConnection: () => Promise<{ success: boolean; error?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUserFromStorage();
  }, []);

  const loadUserFromStorage = async () => {
    try {
      const userData = await AsyncStorage.getItem('user');
      const profileData = await AsyncStorage.getItem('profile');
      
      if (userData) {
        const parsedUser = JSON.parse(userData);
        if (parsedUser && typeof parsedUser === 'object') {
          setUser(parsedUser);
        }
      }
      
      if (profileData) {
        const parsedProfile = JSON.parse(profileData);
        if (parsedProfile && typeof parsedProfile === 'object') {
          setProfile(parsedProfile);
        }
      }
    } catch (error) {
      console.error('Error loading user from storage:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveUserToStorage = async (userData: User | null, profileData?: any) => {
    try {
      if (userData && typeof userData === 'object') {
        await AsyncStorage.setItem('user', JSON.stringify(userData));
      } else {
        await AsyncStorage.removeItem('user');
      }
      
      if (profileData && typeof profileData === 'object') {
        await AsyncStorage.setItem('profile', JSON.stringify(profileData));
      } else {
        await AsyncStorage.removeItem('profile');
      }
    } catch (error) {
      console.error('Error saving user to storage:', error);
    }
  };

  const testConnection = async (): Promise<{ success: boolean; error?: string }> => {
    return await testServerConnection();
  };

  const signIn = async (email: string, password: string, loginType?: 'user' | 'doctor') => {
    try {
      setLoading(true);
      
      // التحقق من صحة البيانات
      if (!email || !password) {
        return { error: 'البريد الإلكتروني وكلمة المرور مطلوبان' };
      }
      
      console.log('🔄 محاولة تسجيل الدخول...');
      console.log('📡 عنوان الخادم:', API_CONFIG.AUTH_LOGIN);
      console.log('👤 نوع المستخدم:', loginType || 'user');
      
      // اختبار الاتصال بالخادم أولاً
      const connectionTest = await testServerConnection();
      if (!connectionTest.success) {
        console.error('❌ فشل في الاتصال بالخادم:', connectionTest.error);
        return { 
          error: `لا يمكن الاتصال بالخادم. تأكد من أن الخادم يعمل على العنوان: ${API_CONFIG.BASE_URL}` 
        };
      }
      
      // إرسال طلب تسجيل الدخول
      const response = await fetch(API_CONFIG.AUTH_LOGIN, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          email: email.trim(), 
          password, 
          loginType: loginType || 'user' 
        }),
      });

      console.log('📥 استجابة الخادم:', response.status, response.statusText);

      // التحقق من نوع المحتوى
      const contentType = response.headers.get('content-type');
      console.log('📄 نوع المحتوى:', contentType);

      if (!response.ok) {
        // محاولة قراءة النص أولاً
        const responseText = await response.text();
        console.log('📄 نص الاستجابة:', responseText.substring(0, 200) + '...');
        
        // محاولة تحليل JSON إذا كان ذلك ممكناً
        let errorMessage = 'فشل تسجيل الدخول';
        try {
          const errorData = JSON.parse(responseText);
          errorMessage = errorData.message || errorData.error || `خطأ في الخادم (${response.status})`;
        } catch (parseError) {
          // إذا لم يكن JSON، استخدم رسالة خطأ عامة
          if (response.status === 404) {
            errorMessage = 'نقطة الاتصال غير موجودة. تحقق من إعدادات الخادم.';
          } else if (response.status >= 500) {
            errorMessage = 'خطأ في الخادم. يرجى المحاولة لاحقاً.';
          } else {
            errorMessage = `خطأ في الخادم (${response.status})`;
          }
        }
        
        console.error('❌ خطأ في تسجيل الدخول:', errorMessage);
        return { error: errorMessage };
      }

      // محاولة قراءة JSON
      let data;
      try {
        const responseText = await response.text();
        console.log('📄 نص الاستجابة:', responseText.substring(0, 200) + '...');
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error('❌ خطأ في تحليل JSON:', parseError);
        return { error: 'استجابة الخادم غير صحيحة' };
      }

      console.log('📄 بيانات الاستجابة:', data);

      // التحقق من صحة البيانات المستلمة
      const userDataFromResponse = data.user || data.doctor;
      if (!userDataFromResponse || typeof userDataFromResponse !== 'object') {
        console.error('❌ بيانات المستخدم غير صحيحة:', data);
        return { error: 'بيانات المستخدم غير صحيحة' };
      }

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

      console.log('✅ تم تسجيل الدخول بنجاح:', userData);
      setUser(userData);
      
      // حفظ البيانات الشخصية الكاملة
      const fullProfileData = userDataFromResponse;
      setProfile(fullProfileData);
      await saveUserToStorage(userData, fullProfileData);
      
      // حفظ التوكن إذا كان موجوداً
      if (data.token) {
        await AsyncStorage.setItem('token', data.token);
      }
      
      return {};
    } catch (error) {
      console.error('❌ خطأ في تسجيل الدخول:', error);
      const errorMessage = error instanceof Error ? error.message : 'حدث خطأ أثناء تسجيل الدخول';
      return { error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (userData: any) => {
    try {
      setLoading(true);
      
      // تحديد نوع التسجيل
      const isDoctor = userData.user_type === 'doctor';
      const endpoint = isDoctor ? API_CONFIG.AUTH_REGISTER_DOCTOR : API_CONFIG.AUTH_REGISTER;
      
      console.log('🔄 محاولة التسجيل...');
      console.log('📡 عنوان التسجيل:', endpoint);
      console.log('👤 نوع المستخدم:', isDoctor ? 'طبيب' : 'مستخدم');
      
      // اختبار الاتصال بالخادم أولاً
      const connectionTest = await testServerConnection();
      if (!connectionTest.success) {
        throw new Error(`لا يمكن الاتصال بالخادم: ${connectionTest.error}`);
      }
      
      // إعداد البيانات حسب نوع التسجيل
      let requestData = { ...userData };
      
      if (isDoctor) {
        // إزالة الحقول غير المطلوبة لتسجيل الطبيب
        delete requestData.user_type;
        delete requestData.confirmPassword;
        
        // إعداد FormData لرفع الصورة
        const formData = new FormData();
        
        // إضافة البيانات النصية
        formData.append('email', userData.email);
        formData.append('password', userData.password);
        formData.append('name', userData.name);
        formData.append('phone', userData.phone);
        formData.append('specialty', userData.specialty);
        formData.append('province', userData.province);
        formData.append('area', userData.area);
        formData.append('clinicLocation', userData.clinicLocation);
        formData.append('mapLocation', userData.mapLocation || '');
        formData.append('about', userData.about || '');
        formData.append('experienceYears', userData.experienceYears || '0');
        formData.append('appointmentDuration', userData.appointmentDuration || '30');
        formData.append('workTimes', JSON.stringify(userData.workTimes || []));
        
        // إضافة الصورة إذا كانت موجودة
        if (userData.image) {
          const imageUri = userData.image;
          const imageName = imageUri.split('/').pop() || 'profile.jpg';
          const imageType = 'image/jpeg';
          
          formData.append('image', {
            uri: imageUri,
            type: imageType,
            name: imageName,
          } as any);
        }
        
        requestData = formData;
      } else {
        // إعداد البيانات للمستخدم العادي
        requestData = {
          email: userData.email,
          password: userData.password,
          first_name: userData.name,
          phone: userData.phone
        };
      }
      
      console.log('📤 البيانات المرسلة:', requestData);
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: isDoctor ? {} : {
          'Content-Type': 'application/json',
        },
        body: isDoctor ? requestData : JSON.stringify(requestData),
      });

      const data = await response.json();
      
      console.log('📥 استجابة التسجيل من الخادم:', data);

      if (!response.ok) {
        throw new Error(data.message || data.error || 'فشل التسجيل');
      }

      // معالجة الاستجابة حسب نوع التسجيل
      if (isDoctor) {
        // تسجيل الطبيب
        const newUser: User = {
          id: data.doctor?._id || data.user?._id,
          name: data.doctor?.name || data.user?.name,
          email: data.doctor?.email || data.user?.email,
          phone: data.doctor?.phone || data.user?.phone,
          user_type: 'doctor',
          image: data.doctor?.image || data.doctor?.profileImage || data.user?.profile_image,
          created_at: data.doctor?.created_at || data.doctor?.createdAt || data.user?.created_at,
          updated_at: data.doctor?.updated_at || data.doctor?.updatedAt || data.user?.updated_at,
        };

        setUser(newUser);
        await saveUserToStorage(newUser);
        
        // حفظ التوكن إذا كان موجوداً
        if (data.token) {
          await AsyncStorage.setItem('token', data.token);
        }
        
        // إرجاع معلومات إضافية للطبيب
        return {
          whatsappLink: data.whatsappLink,
          whatsappNumber: data.whatsappNumber,
          doctorInfo: data.doctorInfo,
          requiredDocuments: data.requiredDocuments
        };
      } else {
        // تسجيل المستخدم العادي
        console.log('🔍 معالجة بيانات المستخدم العادي...');
        
        // البحث عن بيانات المستخدم في الاستجابة
        const userData = data.user || data || {};
        console.log('👤 بيانات المستخدم المستخرجة:', userData);
        
        if (!userData) {
          throw new Error('لم يتم استلام بيانات المستخدم من الخادم');
        }
        
        const newUser: User = {
          id: userData._id || userData.id || `user_${Date.now()}`,
          name: userData.name || userData.first_name || userData.firstName || 'مستخدم جديد',
          email: userData.email || '',
          phone: userData.phone || '',
          user_type: 'user',
          image: userData.profile_image || userData.profileImage || '',
          created_at: userData.created_at || userData.createdAt || new Date().toISOString(),
          updated_at: userData.updated_at || userData.updatedAt || new Date().toISOString(),
        };

        console.log('✅ المستخدم الجديد:', newUser);
        setUser(newUser);
        await saveUserToStorage(newUser);
        
        // حفظ التوكن إذا كان موجوداً
        if (data.token) {
          await AsyncStorage.setItem('token', data.token);
        }
      }
    } catch (error) {
      console.error('Sign up error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      console.log('🔄 بدء عملية تسجيل الخروج...');
      setLoading(true);
      
      // إرسال طلب تسجيل الخروج إلى الخادم
      if (user) {
        try {
          const token = await AsyncStorage.getItem('token');
          console.log('🔑 التوكن الحالي:', token ? 'موجود' : 'غير موجود');
          
          const response = await fetch(API_CONFIG.AUTH_LOGOUT, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': token ? `Bearer ${token}` : '',
            },
          });
          
          console.log('📥 استجابة تسجيل الخروج:', response.status, response.statusText);
          
          if (response.ok) {
            console.log('✅ تم تسجيل الخروج من الخادم بنجاح');
          } else {
            console.log('⚠️ الخادم لم يستجب بشكل صحيح لتسجيل الخروج');
          }
        } catch (error) {
          console.error('❌ خطأ في تسجيل الخروج من الخادم:', error);
        }
      }

      // تنظيف البيانات المحلية
      console.log('🧹 تنظيف البيانات المحلية...');
      setUser(null);
      await saveUserToStorage(null);
      await AsyncStorage.removeItem('token');
      
      // تنظيف أي بيانات إضافية
      try {
        await AsyncStorage.removeItem('user');
        await AsyncStorage.removeItem('profile');
        await AsyncStorage.removeItem('appointments');
        await AsyncStorage.removeItem('reminders');
      } catch (error) {
        console.error('❌ خطأ في تنظيف البيانات الإضافية:', error);
      }
      
      console.log('✅ تم تسجيل الخروج بنجاح');
    } catch (error) {
      console.error('❌ خطأ في تسجيل الخروج:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateUser = async (updates: Partial<User>) => {
    try {
      if (!user) return;

      const updatedUser = { ...user, ...updates };
      setUser(updatedUser);
      await saveUserToStorage(updatedUser);

      // إرسال طلب تحديث البيانات إلى الخادم
      const response = await fetch(buildApiUrl(API_CONFIG.USERS_BY_ID, user.id), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await AsyncStorage.getItem('token')}`,
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        throw new Error('فشل في تحديث البيانات');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Update user error:', error);
      throw error;
    }
  };

  const updateProfile = async (updates: any) => {
    try {
      const currentUser = profile || user;
      
      if (!currentUser?._id) {
        return { error: 'لا يمكن العثور على معرف المستخدم' };
      }
      
      let url = '';
      let key = '';
      
      if (currentUser.user_type === 'doctor') {
        url = `${API_CONFIG.BASE_URL}/doctor/${currentUser._id}`;
        key = 'doctor';
      } else {
        url = `${API_CONFIG.BASE_URL}/user/${currentUser._id}`;
        key = 'user';
      }
      
      console.log('🔍 updateProfile - URL:', url);
      console.log('🔍 updateProfile - Updates:', updates);
      
      const token = await AsyncStorage.getItem('token');
      console.log('🔍 updateProfile - Token:', token ? 'موجود' : 'غير موجود');
      
      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
        body: JSON.stringify(updates),
      });
      
      console.log('🔍 updateProfile - Response status:', response.status);
      
      const data = await response.json();
      console.log('🔍 updateProfile - Response data:', data);
      
      if (!response.ok) {
        console.error('❌ updateProfile - Response not ok:', response.status, data);
        return { error: data.error || `فشل في تحديث البيانات (${response.status})` };
      }
      
      const updated = data[key] || data.user || data.doctor;
      if (updated) {
        setProfile(updated);
        setUser(updated);
        await saveUserToStorage(updated, updated);
      }
      
      return { data: updated, error: undefined };
    } catch (error) {
      console.error('Update profile error:', error);
      return { error: error instanceof Error ? error.message : 'حدث خطأ غير متوقع' };
    }
  };

  const refreshUser = async () => {
    try {
      if (!user) return;

      const response = await fetch(buildApiUrl(API_CONFIG.USERS_BY_ID, user.id), {
        headers: {
          'Authorization': `Bearer ${await AsyncStorage.getItem('token')}`,
        },
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
        await saveUserToStorage(updatedUser);
      }
    } catch (error) {
      console.error('Refresh user error:', error);
    }
  };

  const value: AuthContextType = {
    user,
    profile,
    loading,
    signIn,
    signUp,
    signOut,
    updateUser,
    updateProfile,
    refreshUser,
    testConnection,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 