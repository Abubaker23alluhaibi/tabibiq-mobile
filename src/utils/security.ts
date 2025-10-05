// ملف الأمان - إصدار مبسط بدون مكتبات خارجية
// يمكن إضافة expo-crypto لاحقاً عند الحاجة

// دالة للتحقق من صحة المعرفات
export const validateId = (id: string): boolean => {
  if (!id || typeof id !== 'string') return false;
  // التحقق من أن المعرف يحتوي على أحرف آمنة فقط
  return /^[a-zA-Z0-9-_]+$/.test(id);
};

// دالة للتحقق من صحة المدخلات
export const validateInput = (input: any): boolean => {
  if (input === null || input === undefined) return false;
  if (typeof input === 'string') {
    // التحقق من عدم وجود أحرف خطيرة
    return !/[<>\"'&]/.test(input);
  }
  return true;
};

// دالة للتحقق من صحة البريد الإلكتروني
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// دالة للتحقق من صحة كلمة المرور
export const validatePassword = (password: string): boolean => {
  return Boolean(password && password.length >= 8);
};

// دالة للتحقق من صحة رقم الهاتف
export const validatePhone = (phone: string): boolean => {
  const phoneRegex = /^[\+]?[0-9\s\-\(\)]{8,}$/;
  return Boolean(phone && phoneRegex.test(phone));
};

// دالة للتحقق من صحة الاسم
export const validateName = (name: string): boolean => {
  return Boolean(name && name.trim().length >= 2 && /^[a-zA-Z\u0600-\u06FF\s]+$/.test(name));
};

// دالة لتنظيف المدخلات
export const sanitizeInput = (input: string): string => {
  if (!input || typeof input !== 'string') return '';
  
  // إزالة الأحرف الخطيرة
  return input
    .replace(/[<>\"'&]/g, '')
    .trim();
};

// دالة للتحقق من صحة URL
export const validateUrl = (url: string): boolean => {
  try {
    const urlObj = new URL(url);
    return urlObj.protocol === 'https:';
  } catch {
    return false;
  }
};

// دالة للتحقق من صحة نوع الملف
export const validateFileType = (fileName: string, allowedTypes: string[]): boolean => {
  const extension = fileName.split('.').pop()?.toLowerCase();
  return extension ? allowedTypes.includes(extension) : false;
};

// دالة للتحقق من حجم الملف
export const validateFileSize = (fileSize: number, maxSizeMB: number): boolean => {
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  return fileSize <= maxSizeBytes;
};

// دالة لإنشاء رمز عشوائي آمن باستخدام crypto.getRandomValues
export const generateSecureToken = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  
  // استخدام crypto.getRandomValues إذا كان متاحاً، وإلا استخدام Math.random مع تحسينات
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    // استخدام crypto.getRandomValues للأمان العالي
    const array = new Uint32Array(32);
    crypto.getRandomValues(array);
    
    for (let i = 0; i < 32; i++) {
      const randomIndex = array[i] % chars.length;
      result += chars.charAt(randomIndex);
    }
  } else {
    // استخدام Math.random مع تحسينات للأمان
    const timestamp = Date.now().toString(36);
    const randomPart = Math.random().toString(36).substring(2);
    const combined = timestamp + randomPart + Math.random().toString(36).substring(2);
    
    for (let i = 0; i < 32; i++) {
      const charIndex = (combined.charCodeAt(i % combined.length) + Math.random() * 1000) % chars.length;
      result += chars.charAt(Math.floor(charIndex));
    }
  }
  
  return result;
};

// دالة للتحقق من صحة التوكن
export const validateToken = (token: string): boolean => {
  if (!token || typeof token !== 'string') return false;
  // التحقق من أن التوكن يحتوي على أحرف صحيحة
  return /^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]*$/.test(token);
};

// دالة للتحقق من صحة التاريخ
export const validateDate = (dateString: string): boolean => {
  const date = new Date(dateString);
  return !isNaN(date.getTime());
};

// دالة للتحقق من صحة الرقم
export const validateNumber = (value: any): boolean => {
  return !isNaN(Number(value)) && isFinite(Number(value));
};

// دالة للتحقق من صحة المصفوفة
export const validateArray = (value: any): boolean => {
  return Array.isArray(value);
};

// دالة للتحقق من صحة الكائن
export const validateObject = (value: any): boolean => {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
};

// دالة للتحقق من صحة النص
export const validateText = (text: string, minLength: number = 1, maxLength: number = 1000): boolean => {
  if (!text || typeof text !== 'string') return false;
  const length = text.trim().length;
  return length >= minLength && length <= maxLength;
};

// دالة للتحقق من صحة العنوان
export const validateAddress = (address: string): boolean => {
  if (!address || typeof address !== 'string') return false;
  // التحقق من أن العنوان لا يحتوي على أحرف خطيرة
  return !/[<>\"'&]/.test(address) && address.trim().length >= 5;
};

// دالة للتحقق من صحة الوصف
export const validateDescription = (description: string): boolean => {
  if (!description || typeof description !== 'string') return false;
  // التحقق من أن الوصف لا يحتوي على أحرف خطيرة
  return !/[<>\"'&]/.test(description) && description.trim().length <= 2000;
};

// دالة بسيطة لتشفير البيانات (بدون expo-crypto)
export const simpleHash = (data: string): string => {
  let hash = 0;
  if (data.length === 0) return hash.toString();
  
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  
  return Math.abs(hash).toString(36);
};

// دالة للتحقق من صحة كلمة المرور القوية
export const validateStrongPassword = (password: string): boolean => {
  if (!password || password.length < 8) return false;
  
  // التحقق من وجود حرف كبير
  const hasUpperCase = /[A-Z]/.test(password);
  // التحقق من وجود حرف صغير
  const hasLowerCase = /[a-z]/.test(password);
  // التحقق من وجود رقم
  const hasNumbers = /\d/.test(password);
  // التحقق من وجود رمز خاص
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  
  return hasUpperCase && hasLowerCase && hasNumbers && hasSpecialChar;
};

// دالة للتحقق من صحة اسم المستخدم
export const validateUsername = (username: string): boolean => {
  if (!username || username.length < 3 || username.length > 20) return false;
  // التحقق من أن اسم المستخدم يحتوي على أحرف وأرقام فقط
  return /^[a-zA-Z0-9_]+$/.test(username);
};

// دالة لتنظيف HTML
export const sanitizeHtml = (html: string): string => {
  if (!html || typeof html !== 'string') return '';
  
  // إزالة جميع علامات HTML
  return html
    .replace(/<[^>]*>/g, '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
};

// دالة للتحقق من صحة رقم الهاتف العراقي
export const validateIraqiPhone = (phone: string): boolean => {
  if (!phone || typeof phone !== 'string') return false;
  
  // تنظيف الرقم من المسافات والرموز
  const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');
  
  // التحقق من أن الرقم يبدأ بـ 964 أو 07 أو 7
  const iraqiPhoneRegex = /^(964|07|7)\d{9}$/;
  return iraqiPhoneRegex.test(cleanPhone);
};

// دالة للتحقق من صحة الرمز البريدي العراقي
export const validateIraqiPostalCode = (postalCode: string): boolean => {
  if (!postalCode || typeof postalCode !== 'string') return false;
  
  // الرمز البريدي العراقي يتكون من 5 أرقام
  const postalCodeRegex = /^\d{5}$/;
  return postalCodeRegex.test(postalCode);
};


