import i18n from '../locales';

/**
 * دالة توحيد الرقم - تحول الرقم إلى تنسيق موحد
 * @param number - الرقم المراد توحيده
 * @param locale - اللغة (ar, en, ku)
 * @returns الرقم بالتنسيق الموحد
 */
export const formatNumber = (number: number | string, locale?: string): string => {
  try {
    const currentLocale = locale || i18n.language || 'ar';
    const num = typeof number === 'string' ? parseFloat(number) : number;
    
    if (isNaN(num)) return '0';
    
    // تنسيق عربي
    if (currentLocale === 'ar') {
      return num.toLocaleString('ar-EG', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
      });
    }
    
    // تنسيق إنجليزي
    if (currentLocale === 'en') {
      return num.toLocaleString('en-US', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
      });
    }
    
    // تنسيق كردي
    if (currentLocale === 'ku') {
      return num.toLocaleString('ku-IQ', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
      });
    }
    
    return num.toString();
  } catch (error) {
    return number.toString();
  }
};

/**
 * دالة تنسيق السعر - تضيف العملة
 * @param price - السعر
 * @param currency - العملة (IQD, USD, EUR)
 * @param locale - اللغة
 * @returns السعر مع العملة
 */
export const formatPrice = (price: number | string, currency: 'IQD' | 'USD' | 'EUR' = 'IQD', locale?: string): string => {
  try {
    const currentLocale = locale || i18n.language || 'ar';
    const num = typeof price === 'string' ? parseFloat(price) : price;
    
    if (isNaN(num)) return '0';
    
    const formattedNumber = formatNumber(num, currentLocale);
    
    // تنسيق العملة
    if (currency === 'IQD') {
      return currentLocale === 'ar' ? `${formattedNumber} دينار` : `${formattedNumber} IQD`;
    }
    
    if (currency === 'USD') {
      return currentLocale === 'ar' ? `${formattedNumber} دولار` : `$${formattedNumber}`;
    }
    
    if (currency === 'EUR') {
      return currentLocale === 'ar' ? `${formattedNumber} يورو` : `€${formattedNumber}`;
    }
    
    return formattedNumber;
  } catch (error) {
    return price.toString();
  }
};

/**
 * دالة تنسيق النسبة المئوية
 * @param percentage - النسبة
 * @param locale - اللغة
 * @returns النسبة مع الرمز %
 */
export const formatPercentage = (percentage: number | string, locale?: string): string => {
  try {
    const currentLocale = locale || i18n.language || 'ar';
    const num = typeof percentage === 'string' ? parseFloat(percentage) : percentage;
    
    if (isNaN(num)) return '0%';
    
    const formattedNumber = formatNumber(num, currentLocale);
    
    if (currentLocale === 'ar') {
      return `${formattedNumber}%`;
    }
    
    return `${formattedNumber}%`;
  } catch (error) {
    return `${percentage}%`;
  }
};

/**
 * دالة تنسيق التاريخ مع الوقت
 * @param date - التاريخ
 * @param locale - اللغة
 * @returns التاريخ بالتنسيق الموحد
 */
export const formatDateTime = (date: Date | string, locale?: string): string => {
  try {
    const currentLocale = locale || i18n.language || 'ar';
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    if (isNaN(dateObj.getTime())) return 'تاريخ غير صحيح';
    
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    
    if (currentLocale === 'ar') {
      return dateObj.toLocaleDateString('ar-SA', options);
    }
    
    if (currentLocale === 'en') {
      return dateObj.toLocaleDateString('en-US', options);
    }
    
    if (currentLocale === 'ku') {
      return dateObj.toLocaleDateString('ku-IQ', options);
    }
    
    return dateObj.toLocaleDateString();
  } catch (error) {
    return 'تاريخ غير صحيح';
  }
};

/**
 * دالة تنسيق التاريخ فقط (بدون وقت)
 * @param date - التاريخ
 * @param locale - اللغة
 * @returns التاريخ بالتنسيق الموحد
 */
export const formatDate = (date: Date | string, locale?: string): string => {
  try {
    const currentLocale = locale || i18n.language || 'ar';
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    if (isNaN(dateObj.getTime())) return 'تاريخ غير صحيح';
    
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    };
    
    if (currentLocale === 'ar') {
      return dateObj.toLocaleDateString('ar-SA', options);
    }
    
    if (currentLocale === 'en') {
      return dateObj.toLocaleDateString('en-US', options);
    }
    
    if (currentLocale === 'ku') {
      return dateObj.toLocaleDateString('ku-IQ', options);
    }
    
    return dateObj.toLocaleDateString();
  } catch (error) {
    return 'تاريخ غير صحيح';
  }
};

/**
 * دالة تنسيق الوقت فقط
 * @param date - التاريخ
 * @param locale - اللغة
 * @returns الوقت بالتنسيق الموحد
 */
export const formatTime = (date: Date | string, locale?: string): string => {
  try {
    const currentLocale = locale || i18n.language || 'ar';
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    if (isNaN(dateObj.getTime())) return 'وقت غير صحيح';
    
    const options: Intl.DateTimeFormatOptions = {
      hour: '2-digit',
      minute: '2-digit'
    };
    
    if (currentLocale === 'ar') {
      return dateObj.toLocaleTimeString('ar-SA', options);
    }
    
    if (currentLocale === 'en') {
      return dateObj.toLocaleTimeString('en-US', options);
    }
    
    if (currentLocale === 'ku') {
      return dateObj.toLocaleTimeString('ku-IQ', options);
    }
    
    return dateObj.toLocaleTimeString();
  } catch (error) {
    return 'وقت غير صحيح';
  }
};

/**
 * دالة تنسيق المسافة
 * @param distance - المسافة بالمتر
 * @param locale - اللغة
 * @returns المسافة بالتنسيق المناسب
 */
export const formatDistance = (distance: number | string, locale?: string): string => {
  try {
    const currentLocale = locale || i18n.language || 'ar';
    const dist = typeof distance === 'string' ? parseFloat(distance) : distance;
    
    if (isNaN(dist)) return '0 م';
    
    if (dist < 1000) {
      const meters = formatNumber(dist, currentLocale);
      return currentLocale === 'ar' ? `${meters} متر` : `${meters}m`;
    }
    
    const kilometers = formatNumber(dist / 1000, currentLocale);
    return currentLocale === 'ar' ? `${kilometers} كم` : `${kilometers}km`;
  } catch (error) {
    return distance.toString();
  }
};

/**
 * دالة تنسيق التقييم
 * @param rating - التقييم (1-5)
 * @param locale - اللغة
 * @returns التقييم مع النجوم
 */
export const formatRating = (rating: number | string, locale?: string): string => {
  try {
    const currentLocale = locale || i18n.language || 'ar';
    const rate = typeof rating === 'string' ? parseFloat(rating) : rating;
    
    if (isNaN(rate) || rate < 0 || rate > 5) return '0';
    
    const formattedRating = formatNumber(rate, currentLocale);
    const stars = '⭐'.repeat(Math.round(rate));
    
    if (currentLocale === 'ar') {
      return `${formattedRating} ${stars}`;
    }
    
    return `${stars} ${formattedRating}`;
  } catch (error) {
    return rating.toString();
  }
};

export default {
  formatNumber,
  formatPrice,
  formatPercentage,
  formatDateTime,
  formatDate,
  formatTime,
  formatDistance,
  formatRating
};



