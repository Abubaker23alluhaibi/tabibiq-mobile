/**
 * Secure Storage Utility
 * استخدام SecureStore لتخزين البيانات الحساسة بشكل آمن
 */
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';

// مفاتيح التخزين
export const STORAGE_KEYS = {
  TOKEN: 'token',
  // يمكن إضافة مفاتيح أخرى للبيانات الحساسة هنا
} as const;

/**
 * حفظ token بشكل آمن
 */
export const saveToken = async (token: string): Promise<boolean> => {
  try {
    await SecureStore.setItemAsync(STORAGE_KEYS.TOKEN, token);
    return true;
  } catch (error) {
    console.error('خطأ في حفظ التوكن:', error);
    return false;
  }
};

/**
 * قراءة token بشكل آمن
 */
export const getToken = async (): Promise<string | null> => {
  try {
    const token = await SecureStore.getItemAsync(STORAGE_KEYS.TOKEN);
    return token;
  } catch (error) {
    console.error('خطأ في قراءة التوكن:', error);
    return null;
  }
};

/**
 * حذف token
 */
export const deleteToken = async (): Promise<boolean> => {
  try {
    await SecureStore.deleteItemAsync(STORAGE_KEYS.TOKEN);
    return true;
  } catch (error) {
    console.error('خطأ في حذف التوكن:', error);
    return false;
  }
};

/**
 * التحقق من وجود token
 */
export const hasToken = async (): Promise<boolean> => {
  try {
    const token = await getToken();
    return token !== null && token.length > 0;
  } catch (error) {
    return false;
  }
};

/**
 * Migration: نقل token من AsyncStorage إلى SecureStore
 * يجب استدعاء هذه الدالة مرة واحدة عند التحديث
 */
export const migrateTokenToSecureStore = async (): Promise<boolean> => {
  try {
    // محاولة قراءة من AsyncStorage
    const oldToken = await AsyncStorage.getItem('token');
    
    if (oldToken) {
      // حفظ في SecureStore
      await SecureStore.setItemAsync(STORAGE_KEYS.TOKEN, oldToken);
      
      // حذف من AsyncStorage بعد النقل الناجح
      await AsyncStorage.removeItem('token');
      
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('خطأ في نقل التوكن:', error);
    return false;
  }
};
