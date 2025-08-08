import { Dimensions, Platform } from 'react-native';
import { safeFormatTime, safeGetInitials } from './debug';

// الحصول على أبعاد الشاشة
export const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// التحقق من نوع الجهاز
export const isIOS = Platform.OS === 'ios';
export const isAndroid = Platform.OS === 'android';

// دالة لتنسيق التاريخ
export const formatDate = (date: Date | string): string => {
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch (error) {
    console.error('Error formatting date:', error);
    return '';
  }
};

// دالة لتنسيق الوقت - استخدام الدالة الآمنة
export const formatTime = (time: string): string => {
  return safeFormatTime(time);
};

// دالة لتنسيق المدة
export const formatDuration = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  
  if (hours > 0) {
    return `${hours} ساعة ${remainingMinutes > 0 ? `و ${remainingMinutes} دقيقة` : ''}`;
  }
  return `${remainingMinutes} دقيقة`;
};

// دالة لتنسيق الرقم
export const formatNumber = (num: number): string => {
  return num.toLocaleString('ar-EG');
};

// دالة لتنسيق السعر
export const formatPrice = (price: number): string => {
  return `${price.toLocaleString('ar-EG')} دينار عراقي`;
};

// دالة للتحقق من صحة البريد الإلكتروني
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// دالة للتحقق من صحة رقم الهاتف العراقي
export const isValidIraqiPhone = (phone: string): boolean => {
  // رقم هاتف عراقي يبدأ بـ +964 أو 964 أو 07 أو 7
  const phoneRegex = /^(\+964|964|07|7)?[0-9]{9}$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
};

// دالة للتحقق من صحة رقم الهاتف (عامة)
export const isValidPhone = (phone: string): boolean => {
  // رقم هاتف عام يبدأ بـ + أو رقم
  const phoneRegex = /^(\+?[0-9]{1,4})?[0-9]{7,15}$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
};

// دالة لتنسيق رقم الهاتف
export const formatPhoneNumber = (phone: string): string => {
  const cleaned = phone.replace(/\D/g, '');
  
  if (cleaned.startsWith('964')) {
    return `+${cleaned}`;
  } else if (cleaned.startsWith('07') || cleaned.startsWith('7')) {
    return `+964${cleaned.substring(cleaned.startsWith('07') ? 2 : 1)}`;
  }
  
  return phone;
};

// دالة للحصول على الحرف الأول من كل كلمة - استخدام الدالة الآمنة
export const getInitials = (name: string): string => {
  return safeGetInitials(name);
};

// دالة للحصول على لون عشوائي للملف الشخصي
export const getRandomColor = (): string => {
  const colors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
    '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9',
    '#F8C471', '#82E0AA', '#F1948A', '#85C1E9', '#D7BDE2',
  ];
  return colors[Math.floor(Math.random() * colors.length)];
};

// دالة للحصول على عمر من تاريخ الميلاد
export const getAge = (birthDate: Date | string): number => {
  const birth = typeof birthDate === 'string' ? new Date(birthDate) : birthDate;
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  
  return age;
};

// دالة للحصول على المسافة بين نقطتين
export const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371; // نصف قطر الأرض بالكيلومترات
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

// دالة لتنسيق المسافة
export const formatDistance = (distance: number): string => {
  if (distance < 1) {
    return `${Math.round(distance * 1000)} متر`;
  }
  return `${distance.toFixed(1)} كم`;
};

// دالة للحصول على حالة الموعد
export const getAppointmentStatus = (status: string): {
  text: string;
  color: string;
  icon: string;
} => {
  switch (status.toLowerCase()) {
    case 'confirmed':
      return {
        text: 'مؤكد',
        color: '#4CAF50',
        icon: 'checkmark-circle',
      };
    case 'pending':
      return {
        text: 'في الانتظار',
        color: '#FF9800',
        icon: 'time',
      };
    case 'cancelled':
      return {
        text: 'ملغي',
        color: '#F44336',
        icon: 'close-circle',
      };
    case 'completed':
      return {
        text: 'مكتمل',
        color: '#2196F3',
        icon: 'checkmark-done-circle',
      };
    default:
      return {
        text: 'غير محدد',
        color: '#757575',
        icon: 'help-circle',
      };
  }
};

// دالة للحصول على نوع الموعد
export const getAppointmentType = (type: string): {
  text: string;
  color: string;
  icon: string;
} => {
  switch (type.toLowerCase()) {
    case 'consultation':
      return {
        text: 'استشارة',
        color: '#00BCD4',
        icon: 'medical',
      };
    case 'follow_up':
      return {
        text: 'متابعة',
        color: '#4CAF50',
        icon: 'refresh',
      };
    case 'emergency':
      return {
        text: 'طوارئ',
        color: '#F44336',
        icon: 'warning',
      };
    case 'examination':
      return {
        text: 'فحص',
        color: '#FF9800',
        icon: 'search',
      };
    default:
      return {
        text: 'موعد عادي',
        color: '#757575',
        icon: 'calendar',
      };
  }
};

// دالة للتحقق من توفر الطبيب
export const isDoctorAvailable = (schedule: any, date: string, time: string): boolean => {
  // هنا يمكن إضافة منطق للتحقق من توفر الطبيب
  // هذا مثال بسيط
  return true;
};

// دالة للحصول على التقييم بالنجوم
export const getStarRating = (rating: number): string => {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 !== 0;
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
  
  return '★'.repeat(fullStars) + (hasHalfStar ? '☆' : '') + '☆'.repeat(emptyStars);
};

// دالة لتقريب الرقم
export const roundToNearest = (num: number, nearest: number): number => {
  return Math.round(num / nearest) * nearest;
};

// دالة للحصول على اسم الشهر
export const getMonthName = (month: number): string => {
  const months = [
    'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
    'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
  ];
  return months[month - 1];
};

// دالة للحصول على اسم اليوم
export const getDayName = (day: number): string => {
  const days = [
    'الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'
  ];
  return days[day];
};

// دالة للتحقق من صحة كلمة المرور
export const isStrongPassword = (password: string): boolean => {
  // يجب أن تحتوي على 8 أحرف على الأقل
  // حرف كبير، حرف صغير، رقم، رمز خاص
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  return passwordRegex.test(password);
};

// دالة لتقييم قوة كلمة المرور
export const getPasswordStrength = (password: string): {
  score: number;
  text: string;
  color: string;
} => {
  let score = 0;
  
  if (password.length >= 8) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[@$!%*?&]/.test(password)) score++;
  
  switch (score) {
    case 0:
    case 1:
      return { score, text: 'ضعيفة جداً', color: '#F44336' };
    case 2:
      return { score, text: 'ضعيفة', color: '#FF9800' };
    case 3:
      return { score, text: 'متوسطة', color: '#FFC107' };
    case 4:
      return { score, text: 'قوية', color: '#4CAF50' };
    case 5:
      return { score, text: 'قوية جداً', color: '#2E7D32' };
    default:
      return { score, text: 'ضعيفة', color: '#F44336' };
  }
}; 