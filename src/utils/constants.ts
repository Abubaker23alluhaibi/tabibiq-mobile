export const PROVINCES = [
  'بغداد',
  'البصرة',
  'نينوى',
  'الأنبار',
  'ذي قار',
  'صلاح الدين',
  'ديالى',
  'كربلاء',
  'النجف',
  'بابل',
  'واسط',
  'ميسان',
  'القادسية',
  'المثنى',
  'كركوك',
  'أربيل',
  'دهوك',
  'السليمانية',
  'حلبجة'
];

// استيراد التخصصات الجديدة
import { getArabicSpecialties, getSpecialtiesByCategory as getSpecialtiesByCategoryFromMedical, SPECIALTY_CATEGORIES as NEW_SPECIALTY_CATEGORIES } from './medicalSpecialties';

export const SPECIALTIES = getArabicSpecialties();

// إنشاء فئات التخصصات الجديدة
export const SPECIALTY_CATEGORIES = NEW_SPECIALTY_CATEGORIES.map(categoryName => ({
  category: categoryName,
  specialties: getSpecialtiesByCategoryFromMedical(categoryName).map(specialty => specialty.ar)
}));

export const getSpecialtiesByCategory = (category: string): string[] => {
  const foundCategory = SPECIALTY_CATEGORIES.find(cat => cat.category === category);
  return foundCategory ? foundCategory.specialties : [];
};

export const getAllSubSpecialties = (): string[] => {
  return SPECIALTY_CATEGORIES.flatMap(cat => cat.specialties);
};

export const getAllCategories = (): string[] => {
  return SPECIALTY_CATEGORIES.map(cat => cat.category);
};

export const formatNumber = (number: number | string, locale: 'ar' | 'en' | 'ku' = 'ar'): string => {
  try {
    const num = typeof number === 'string' ? parseFloat(number) : number;
    
    if (isNaN(num)) return '0';
    
    if (locale === 'ar') {
      return num.toLocaleString('ar-EG', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
      });
    }
    
    if (locale === 'en') {
      return num.toLocaleString('en-US', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
      });
    }
    
    if (locale === 'ku') {
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

export const formatPrice = (price: number | string, currency: 'IQD' | 'USD' | 'EUR' = 'IQD', locale: 'ar' | 'en' | 'ku' = 'ar'): string => {
  try {
    const num = typeof price === 'string' ? parseFloat(price) : price;
    
    if (isNaN(num)) return '0';
    
    const formattedNumber = formatNumber(num, locale);
    
    if (currency === 'IQD') {
      return locale === 'ar' ? `${formattedNumber} دينار` : `${formattedNumber} IQD`;
    }
    
    if (currency === 'USD') {
      return locale === 'ar' ? `${formattedNumber} دولار` : `$${formattedNumber}`;
    }
    
    if (currency === 'EUR') {
      return locale === 'ar' ? `${formattedNumber} يورو` : `€${formattedNumber}`;
    }
    
    return formattedNumber;
  } catch (error) {
    return price.toString();
  }
};

export const formatPercentage = (percentage: number | string, locale: 'ar' | 'en' | 'ku' = 'ar'): string => {
  try {
    const num = typeof percentage === 'string' ? parseFloat(percentage) : percentage;
    
    if (isNaN(num)) return '0%';
    
    const formattedNumber = formatNumber(num, locale);
    
    if (locale === 'ar') {
      return `${formattedNumber}%`;
    }
    
    return `${formattedNumber}%`;
  } catch (error) {
    return `${percentage}%`;
  }
};

export const formatDateTime = (date: Date | string, locale: 'ar' | 'en' | 'ku' = 'ar'): string => {
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    if (isNaN(dateObj.getTime())) return 'تاريخ غير صحيح';
    
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    
    if (locale === 'ar') {
      return dateObj.toLocaleDateString('ar-SA', options);
    }
    
    if (locale === 'en') {
      return dateObj.toLocaleDateString('en-US', options);
    }
    
    if (locale === 'ku') {
      return dateObj.toLocaleDateString('ku-IQ', options);
    }
    
    return dateObj.toLocaleDateString();
  } catch (error) {
    return 'تاريخ غير صحيح';
  }
};

export default {
  PROVINCES,
  SPECIALTIES,
  formatNumber,
  formatPrice,
  formatPercentage,
  formatDateTime
};
