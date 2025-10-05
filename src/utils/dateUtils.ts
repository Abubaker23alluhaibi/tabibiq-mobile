/**
 * Date utilities for handling local time correctly
 * Fixes timezone issues with UTC vs local time
 */

/**
 * Get current local date in YYYY-MM-DD format
 * Uses local timezone instead of UTC
 */
export const getLocalDateString = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Get current local time in HH:MM format
 */
export const getLocalTimeString = (): string => {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
};

/**
 * Check if a date string (YYYY-MM-DD) is today in local timezone
 */
export const isToday = (dateString: string): boolean => {
  const today = getLocalDateString();
  return dateString === today;
};

/**
 * Check if a date string is in the past
 */
export const isPastDate = (dateString: string): boolean => {
  const date = new Date(dateString);
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Reset time to start of day
  return date < today;
};

/**
 * Check if a date string is in the future
 */
export const isFutureDate = (dateString: string): boolean => {
  const date = new Date(dateString);
  const today = new Date();
  today.setHours(23, 59, 59, 999); // Set time to end of day
  return date > today;
};



/**
 * Format date for display in Arabic
 */
export const formatDateArabic = (dateString: string): string => {
  const date = new Date(dateString);
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long'
  };
  return date.toLocaleDateString('ar-IQ', options);
};

/**
 * Get timezone information for debugging
 */
export const getTimezoneInfo = () => {
  const now = new Date();
  return {
    localTime: now.toString(),
    utcTime: now.toISOString(),
    localDate: getLocalDateString(),
    utcDate: now.toISOString().split('T')[0],
    timezoneOffset: now.getTimezoneOffset(),
    timezoneName: Intl.DateTimeFormat().resolvedOptions().timeZone
  };
};

/**
 * Get Arabic day name for a date
 */
export const getArabicDayName = (dateString: string): string => {
  const date = new Date(dateString);
  const dayNames = [
    'الأحد',
    'الاثنين', 
    'الثلاثاء',
    'الأربعاء',
    'الخميس',
    'الجمعة',
    'السبت'
  ];
  return dayNames[date.getDay()];
};

/**
 * Get today's Arabic day name
 */
export const getTodayArabicDayName = (): string => {
  return getArabicDayName(getLocalDateString());
};

/**
 * Get localized day name for a date
 * This function should be used with the translation hook
 */
export const getLocalizedDayName = (dateString: string, t: any): string => {
  const date = new Date(dateString);
  const dayIndex = date.getDay();
  
  const dayKeys = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const dayKey = dayKeys[dayIndex];
  
  return t(`day_names.${dayKey}`);
};

/**
 * Get today's localized day name
 * This function should be used with the translation hook
 */
export const getTodayLocalizedDayName = (t: any): string => {
  return getLocalizedDayName(getLocalDateString(), t);
};
