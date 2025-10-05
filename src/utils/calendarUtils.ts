import { MonthCalendar, CalendarWeek, CalendarDay } from '../types';

/**
 * التحقق من أن التاريخ هو يوم إجازة
 * ✅ إصلاح: يتطابق مع الباك إند بالضبط
 */
export const isVacationDay = (date: Date, vacationDays: any[]): boolean => {
  if (!vacationDays || !Array.isArray(vacationDays)) {
    return false;
  }

  const year = date.getFullYear();
  const month = date.getMonth() + 1; // 1-12
  const day = date.getDate();

  for (const vacation of vacationDays) {
    if (vacation) {
      let vacationDate;

      // ✅ إصلاح: التعامل مع البيانات مثل الباك إند بالضبط
      if (typeof vacation === 'string') {
        // البيانات الجديدة - تاريخ كسلسلة نصية
        vacationDate = new Date(vacation);
      } else if (vacation && typeof vacation === 'object' && vacation.date) {
        // البيانات القديمة - كائن مع حقل date
        vacationDate = new Date(vacation.date);
      }

      if (vacationDate && !isNaN(vacationDate.getTime())) {
        if (
          vacationDate.getFullYear() === year &&
          vacationDate.getMonth() + 1 === month &&
          vacationDate.getDate() === day
        ) {
          return true;
        }
      }
    }
  }

  return false;
};

/**
 * إنشاء تقويم شهري
 */
export const generateMonthCalendar = (
  year: number,
  month: number,
  unavailableDays: any[] = [],
  selectedDates: string[] = []
): MonthCalendar => {
  // ✅ تأكيد: month يجب أن يكون 0-based (يناير = 0)
  if (month < 0 || month > 11) {
    month = Math.max(0, Math.min(11, month));
  }
  
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startDate = new Date(firstDay);

  // بداية الأسبوع (السبت = 6)
  const startDayOfWeek = 6; // السبت
  const daysToSubtract = (firstDay.getDay() - startDayOfWeek + 7) % 7;
  startDate.setDate(startDate.getDate() - daysToSubtract);

  const weeks: CalendarWeek[] = [];
  let currentWeek: CalendarDay[] = [];
  let weekNumber = 1;

  const currentDate = new Date(startDate);
  const today = new Date();

  while (currentDate <= lastDay || currentWeek.length < 7) {
    if (currentWeek.length === 7) {
      weeks.push({ weekNumber, days: currentWeek });
      currentWeek = [];
      weekNumber++;
    }

    const isCurrentMonth = currentDate.getMonth() === month;
    const isToday = currentDate.toDateString() === today.toDateString();
    const isPast = currentDate < today && !isToday;
    
    // ✅ إصلاح: إنشاء dateString بدون مشاكل المنطقة الزمنية
    const year = currentDate.getFullYear();
    const monthStr = String(currentDate.getMonth() + 1).padStart(2, '0');
    const dayStr = String(currentDate.getDate()).padStart(2, '0');
    const dateString = `${year}-${monthStr}-${dayStr}`;
    // ✅ تبسيط: التعامل مع التواريخ كسلاسل نصية مباشرة
    const isUnavailable = unavailableDays.some(day => {
      if (typeof day === 'string') {
        return day === dateString;
      } else if (day && typeof day === 'object' && day.date) {
        return day.date === dateString;
      }
      return false;
    });
    const unavailableDay = unavailableDays.find(day => {
      if (typeof day === 'string') {
        return day === dateString;
      } else if (day && typeof day === 'object' && day.date) {
        return day.date === dateString;
      }
      return false;
    });
    const isSelected = selectedDates.includes(dateString);
    
    // حساب رقم اليوم من الشهر الحالي
    let displayDayOfMonth: number;
    if (isCurrentMonth) {
      displayDayOfMonth = currentDate.getDate();
    } else {
      // للأيام خارج الشهر الحالي، اعرض رقم اليوم من الشهر الخاص به
      displayDayOfMonth = currentDate.getDate();
    }

    currentWeek.push({
      date: dateString,
      dayOfMonth: displayDayOfMonth, // استخدام الرقم المحسوب
      dayOfWeek: currentDate.getDay(),
      isCurrentMonth,
      isToday,
      isSelected,
      isPast,
      isUnavailable,
      unavailableType: typeof unavailableDay === 'object' && unavailableDay?.type ? unavailableDay.type : 'full_day',
      unavailableTimes:
        typeof unavailableDay === 'object' && unavailableDay?.start_time && unavailableDay?.end_time
          ? {
              start: unavailableDay.start_time,
              end: unavailableDay.end_time,
            }
          : undefined,
    });

    currentDate.setDate(currentDate.getDate() + 1);
  }

  if (currentWeek.length > 0) {
    weeks.push({ weekNumber, days: currentWeek });
  }

  return { year, month, weeks };
};

/**
 * الحصول على اسم الشهر بالعربية
 */
export const getMonthName = (month: number): string => {
  const monthNames = [
    'يناير',
    'فبراير',
    'مارس',
    'أبريل',
    'مايو',
    'يونيو',
    'يوليو',
    'أغسطس',
    'سبتمبر',
    'أكتوبر',
    'نوفمبر',
    'ديسمبر',
  ];
  return monthNames[month] || '';
};

/**
 * الحصول على اسم اليوم المختصر بالعربية
 */
export const getShortDayName = (dayOfWeek: number): string => {
  const dayNames = ['أحد', 'اثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت'];
  return dayNames[dayOfWeek] || '';
};

/**
 * التحقق من صحة التاريخ
 */
export const isValidDate = (dateString: string): boolean => {
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date.getTime());
};

/**
 * تنسيق التاريخ للعرض
 */
export const formatDate = (
  dateString: string,
  format: 'short' | 'long' = 'short'
): string => {
  if (!isValidDate(dateString)) return '';

  const date = new Date(dateString);

  if (format === 'short') {
    return date.toLocaleDateString('ar-IQ', {
      day: 'numeric',
      month: 'short',
    });
  } else {
    return date.toLocaleDateString('ar-IQ', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }
};



