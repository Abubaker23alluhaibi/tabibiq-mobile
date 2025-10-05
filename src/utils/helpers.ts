import { Dimensions, Platform } from 'react-native';

const safeFormatTime = (time: any): string => {
  if (!time || typeof time !== 'string') {
    return '';
  }
  
  try {
    const parts = time.split(':');
    if (parts.length < 2) {
      return time;
    }
    
    const hours = parseInt(parts[0]);
    const minutes = parts[1];
    
    if (isNaN(hours)) {
      return time;
    }
    
    const ampm = hours >= 12 ? 'م' : 'ص';
    const displayHour = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours;
    return `${displayHour}:${minutes} ${ampm}`;
  } catch (error) {
    return time || '';
  }
};

const safeGetInitials = (name: any): string => {
  if (!name || typeof name !== 'string') {
    return '';
  }
  
  try {
    return name
      .split(' ')
      .map((word: string) => word.charAt(0))
      .join('')
      .toUpperCase()
      .substring(0, 2);
  } catch (error) {
    return '';
  }
};

export const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export const isIOS = Platform.OS === 'ios';
export const isAndroid = Platform.OS === 'android';

export const formatDate = (date: Date | string): string => {
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch (error) {
    return '';
  }
};

export const formatTime = (time: string): string => {
  return safeFormatTime(time);
};

export const formatDuration = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  
  if (hours > 0) {
    return `${hours} ساعة ${remainingMinutes > 0 ? `و ${remainingMinutes} دقيقة` : ''}`;
  }
  return `${remainingMinutes} دقيقة`;
};

export const formatNumber = (num: number): string => {
  return num.toLocaleString('ar-EG');
};

export const formatPrice = (price: number): string => {
  return `${price.toLocaleString('ar-EG')} دينار عراقي`;
};

export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const isValidPhone = (phone: string): boolean => {
  const phoneRegex = /^(\+964|964|0)?7[0-9]{8}$/;
  return phoneRegex.test(phone);
};

export const formatPhone = (phone: string): string => {
  if (phone.startsWith('+964')) {
    return phone;
  } else if (phone.startsWith('964')) {
    return `+${phone}`;
  } else if (phone.startsWith('0')) {
    return `+964${phone.substring(1)}`;
  } else if (phone.startsWith('7')) {
    return `+964${phone}`;
  }
  return phone;
};

export const getInitials = (name: string): string => {
  return safeGetInitials(name);
};

export const getStatusColor = (status: string): string => {
  switch (status.toLowerCase()) {
    case 'pending':
      return '#FF9800';
    case 'confirmed':
      return '#4CAF50';
    case 'cancelled':
      return '#F44336';
    case 'completed':
      return '#2196F3';
    default:
      return '#757575';
  }
};

export const getStatusText = (status: string): string => {
  switch (status.toLowerCase()) {
    case 'pending':
      return 'في الانتظار';
    case 'confirmed':
      return 'مؤكد';
    case 'cancelled':
      return 'ملغي';
    case 'completed':
      return 'مكتمل';
    default:
      return 'غير محدد';
  }
};

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

export const isDoctorAvailable = (schedule: any, date: string, time: string): boolean => {
  return true;
};

export const getStarRating = (rating: number): string => {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 !== 0;
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
  
  return '★'.repeat(fullStars) + (hasHalfStar ? '☆' : '') + '☆'.repeat(emptyStars);
};

export const roundToNearest = (num: number, nearest: number): number => {
  return Math.round(num / nearest) * nearest;
};

export const getMonthName = (month: number): string => {
  const months = [
    'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
    'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
  ];
  return months[month - 1];
};

export const getDayName = (day: number): string => {
  const days = [
    'الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'
  ];
  return days[day];
};

export const isStrongPassword = (password: string): boolean => {
  return password.length >= 6;
};

export const getPasswordStrength = (password: string): {
  score: number;
  text: string;
  color: string;
} => {
  const length = password.length;
  
  if (length < 6) {
    return { score: 1, text: 'قصيرة جداً', color: '#F44336' };
  } else if (length >= 6 && length < 8) {
    return { score: 2, text: 'مقبولة', color: '#FF9800' };
  } else if (length >= 8 && length < 12) {
    return { score: 3, text: 'جيدة', color: '#4CAF50' };
  } else {
    return { score: 4, text: 'ممتازة', color: '#2E7D32' };
  }
}; 
