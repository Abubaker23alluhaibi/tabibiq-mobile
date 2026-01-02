import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  TextInput,
  Modal,
  Dimensions,
  Linking,
  Clipboard,
  Platform,
  SafeAreaView,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { Calendar } from 'react-native-calendars';
// import MapView, { Marker } from 'react-native-maps';
import { theme } from '../utils/theme';
import { api } from '../services/api';
import { API_CONFIG } from '../config/api';
import { APP_CONFIG } from '../config/constants';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../contexts/NotificationContext';
import { mapSpecialtyToLocalized, mapProvinceToLocalized } from '../utils/specialtyMapper';
import StarRating from '../components/StarRating';
import NotificationService from '../services/NotificationService';
import * as Notifications from 'expo-notifications';
import Toast from '../components/Toast';
import CustomModal from '../components/CustomModal';
import { useToast } from '../hooks/useToast';
import { useModal } from '../hooks/useModal';

interface DoctorDetailsScreenProps {
  route: {
    params: {
      doctorId: string;
    };
  };
}

const { width, height } = Dimensions.get('window');

const DoctorDetailsScreen: React.FC<DoctorDetailsScreenProps> = ({ route }) => {
  const { doctorId } = route.params;
  const navigation = useNavigation();
  const { t } = useTranslation();
  const { user, profile } = useAuth();
  const {
    sendAppointmentNotificationToDoctor,
    refreshDoctorNotifications,
    scheduleAppointmentReminder,
  } = useNotifications();
  const { toast, showToast, hideToast, showSuccess: showToastSuccess, showError: showToastError } = useToast();
  const { modal, showModal, hideModal, showAlert, showConfirm, showError, showSuccess } = useModal();
  const [doctor, setDoctor] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [reason, setReason] = useState('');
  const [age, setAge] = useState('');
  const [availableTimes, setAvailableTimes] = useState<string[]>([]);
  const [bookedTimes, setBookedTimes] = useState<string[]>([]);
  const [showCalendar, setShowCalendar] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showBookingForOtherModal, setShowBookingForOtherModal] = useState(false);
  const [isBookingForOther, setIsBookingForOther] = useState(false);
  const [patientName, setPatientName] = useState('');
  const [patientPhone, setPatientPhone] = useState('');
  const [patientAge, setPatientAge] = useState('');
  const [visibleMonthDate, setVisibleMonthDate] = useState<Date>(new Date());
  const [unavailableDays, setUnavailableDays] = useState<any[]>([]);
  
  // متغيرات التقييم
  const [userRating, setUserRating] = useState(0);
  const [userComment, setUserComment] = useState('');
  const [ratingLoading, setRatingLoading] = useState(false);
  const [userExistingRating, setUserExistingRating] = useState<any>(null);
  const [isEditingRating, setIsEditingRating] = useState(false);

  // دوال مساعدة: تحويل أرقام عربية إلى غربية وتحليل الوقت بأمان
  const toWesternDigits = (input: string) => {
    if (!input) return '';
    const map: Record<string, string> = {
      '٠': '0',
      '١': '1',
      '٢': '2',
      '٣': '3',
      '٤': '4',
      '٥': '5',
      '٦': '6',
      '٧': '7',
      '٨': '8',
      '٩': '9',
    };
    return input.replace(/[٠-٩]/g, d => map[d] ?? d);
  };

  const parseTimeSafe = (
    input: string
  ): { hour: number; minute: number } | null => {
    if (!input || typeof input !== 'string') return null;
    let s = toWesternDigits(input).trim();
    // إزالة مؤشرات AM/PM العربية والإنجليزية والمسافات/رموز RTL
    s = s.replace(/[\s\u202A\u202B\u202C\u200F\u200E]/g, '');
    s = s.replace(/(ص|صباحاً|م|مساءً|AM|PM|am|pm)/g, '');
    const match = /^(\d{1,2}):(\d{2})/.exec(s);
    if (!match) return null;
    let h = parseInt(match[1], 10);
    let m = parseInt(match[2], 10);
    if (isNaN(h) || isNaN(m)) return null;
    h = Math.max(0, Math.min(23, h));
    m = Math.max(0, Math.min(59, m));
    return { hour: h, minute: m };
  };

  // دالة جلب أيام عدم التواجد
  const fetchUnavailableDays = async () => {
    try {


      // محاولة جلب أيام عدم التواجد من API منفصل أولاً
      try {

        // const data = await api.getUnavailableDays(doctorId);
        // const data = { success: false, data: null };
        // if (data.success && data.data) {
        //   setUnavailableDays(data.data || []);
        //     'يوم'
        //   );
        //   return;
        // }
      } catch (apiError) {
        // Silent error handling
      }

      // إذا فشل API المنفصل، جلب بيانات الطبيب المحدثة من الخادم
      try {

        const response = await fetch(`${API_CONFIG.BASE_URL}/doctor/${doctorId}`);
        
        if (response.ok) {
          const updatedDoctorData = await response.json();
          const doctorInfo = updatedDoctorData.doctor || updatedDoctorData;
          
          if (doctorInfo?.vacationDays && Array.isArray(doctorInfo.vacationDays)) {

            // تحويل vacationDays إلى unavailableDays
            const convertedUnavailableDays = doctorInfo.vacationDays.map(
              (date: string) => ({
                doctor_id: doctorId,
                date: date,
                type: 'full_day',
                start_time: undefined,
                end_time: undefined,
                reason: 'إجازة',
              })
            );

            setUnavailableDays(convertedUnavailableDays);
            return;
          }
        }
      } catch (serverError) {
        // Silent error handling
      }

      // 🔑 النقطة الأساسية: كحل أخير، استخدام vacationDays من بيانات الطبيب المحلية
      if (doctor?.vacationDays && Array.isArray(doctor.vacationDays)) {

        // تحويل vacationDays إلى unavailableDays
        const convertedUnavailableDays = doctor.vacationDays.map(
          (date: string) => ({
            doctor_id: doctorId,
            date: date,
            type: 'full_day',
            start_time: undefined,
            end_time: undefined,
            reason: 'إجازة',
          })
        );

        setUnavailableDays(convertedUnavailableDays);
      } else {
        setUnavailableDays([]);
      }
    } catch (error) {
      setUnavailableDays([]);
    }
  };

  useEffect(() => {
    fetchDoctorDetails();
    if (user && user.id) {
      fetchUserRating();
    }
  }, [doctorId, user]);

  // تحديث البيانات عند تغيير الطبيب أو أيام الإجازات
  useEffect(() => {
    if (doctor) {
      fetchUnavailableDays();
    }
  }, [doctor, doctor?.vacationDays]); // 🔑 إضافة vacationDays للتأكد من التحديث

  // دالة جلب تقييم المستخدم الحالي للطبيب
  const fetchUserRating = async () => {
    if (!user?.id || !doctorId) return;
    
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/ratings/user/${user.id}/doctor/${doctorId}`);
      if (response.ok) {
        const data = await response.json();
        if (data.rating) {
          setUserExistingRating(data.rating);
          setUserRating(data.rating.rating);
          setUserComment(data.rating.comment || '');
          setIsEditingRating(true);
        }
      }
    } catch (error) {
      // Silent error handling
    }
  };

  const fetchDoctorDetails = async () => {
    try {
      setLoading(true);

      // محاولة جلب الطبيب من نقطة API محددة
      const response = await fetch(
        `${API_CONFIG.BASE_URL}/doctors/${doctorId}`
      );

      if (response.ok) {
        const doctorData = await response.json();

        // تحسين معالجة بيانات التخصص باستخدام الدالة الجديدة
        const specialty = mapSpecialtyToLocalized(
          doctorData.specialty || doctorData.category_ar || doctorData.category
        );


        // تحديث بيانات الطبيب مع التخصص المحسن
        const enhancedDoctor = {
          ...doctorData,
          specialty: specialty,
        };

        setDoctor(enhancedDoctor);
      } else {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (error) {

      // محاولة جلب جميع الأطباء والبحث عن الطبيب المطلوب
      try {
        const allDoctorsResponse = await fetch(
          `${API_CONFIG.BASE_URL}/doctors`
        );
        if (allDoctorsResponse.ok) {
          const allDoctors = await allDoctorsResponse.json();
          const foundDoctor = allDoctors.find(
            (d: any) => d._id === doctorId || d.id === doctorId
          );

          if (foundDoctor) {

            // تحسين معالجة بيانات التخصص باستخدام الدالة الجديدة
            const specialty = mapSpecialtyToLocalized(
              foundDoctor.specialty ||
                foundDoctor.category_ar ||
                foundDoctor.category
            );

            const enhancedDoctor = {
              ...foundDoctor,
              specialty: specialty,
            };

            setDoctor(enhancedDoctor);
          } else {
            showError(t('error.title'), t('error.doctor_not_found'));
          }
        } else {
          throw new Error(`HTTP error! status: ${allDoctorsResponse.status}`);
        }
      } catch (fallbackError) {
        showError(t('error.title'), t('error.fetch_doctor'));
      }
    } finally {
      setLoading(false);
    }
  };

  // دالة لتوليد الأوقات المتاحة
  const generateTimeSlots = (from: string, to: string) => {
    const slots: string[] = [];
    if (typeof from !== 'string' || typeof to !== 'string') {
      return slots;
    }

    try {
      const start = new Date(`2000-01-01 ${from}`);
      const end = new Date(`2000-01-01 ${to}`);
      const duration = doctor?.appointmentDuration
        ? Number(doctor.appointmentDuration)
        : 30;

      while (start < end) {
        const timeString = start.toTimeString().slice(0, 5);
        slots.push(timeString);
        start.setMinutes(start.getMinutes() + duration);
      }
    } catch (error) {
      // Silent error handling
    }

    return slots;
  };

  // دالة لجلب المواعيد المحجوزة
  const fetchBookedAppointments = async (date: string) => {
    try {
      const response = await api.get(`/appointments/${doctorId}/${date}`);
      const appointments = response || [];
      const bookedTimeSlots = appointments.map((apt: any) => apt.time);
      setBookedTimes(bookedTimeSlots);
    } catch (error) {
      setBookedTimes([]);
    }
  };

  // دالة لتحديد الأيام المتاحة
  const weekdayKeys = [
    'sunday',
    'monday',
    'tuesday',
    'wednesday',
    'thursday',
    'friday',
    'saturday',
  ];
  const arWeekdays = [
    'الأحد',
    'الاثنين',
    'الثلاثاء',
    'الأربعاء',
    'الخميس',
    'الجمعة',
    'السبت',
  ];
  const enWeekdays = [
    'Sunday',
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
  ];
  const kuWeekdays = [
    'یەکشەممە',
    'دووشەممە',
    'سێشەممە',
    'چوارشەممە',
    'پێنجشەممە',
    'هەینی',
    'شەممە',
  ];

  const normalizeDayToKey = (value: any): string | null => {
    if (value === null || value === undefined) return null;
    const raw = String(value).trim();
    if (!raw) return null;
    const lower = raw.toLowerCase();
    // direct key
    if (weekdayKeys.includes(lower)) return lower;
    // numeric index
    const num = Number(lower);
    if (!isNaN(num) && num >= 0 && num <= 6) return weekdayKeys[num];
    // Arabic match
    const arIdx = arWeekdays.indexOf(raw);
    if (arIdx >= 0) return weekdayKeys[arIdx];
    // English match (case-insensitive)
    const enIdx = enWeekdays.map(w => w.toLowerCase()).indexOf(lower);
    if (enIdx >= 0) return weekdayKeys[enIdx];
    // Kurdish match
    const kuIdx = kuWeekdays.indexOf(raw);
    if (kuIdx >= 0) return weekdayKeys[kuIdx];
    // Try current i18n weekdays
    try {
      const localized =
        (t('weekdays', { returnObjects: true }) as string[]) || [];
      const locIdx = localized.map(w => String(w).toLowerCase()).indexOf(lower);
      if (locIdx >= 0) return weekdayKeys[locIdx];
    } catch {}
    return null;
  };

  const getAvailableDays = () => {
    if (!doctor?.workTimes) return [] as string[];
    const keys = doctor.workTimes
      .map((wt: any) => normalizeDayToKey(wt.day))
      .filter(Boolean) as string[];
    return Array.from(new Set(keys));
  };

  // دالة مساعدة لإرجاع اسم اليوم مترجماً حسب اللغة الحالية
  const getWeekdayName = (index: number) => {
    const list = (t('weekdays', { returnObjects: true }) as string[]) || [];
    return (
      list[index] ||
      ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'][
        index
      ]
    );
  };

  const getLocalizedDayByKey = (key: string) => {
    const idx = weekdayKeys.indexOf(key);
    return getWeekdayName(idx);
  };

  // دالة للتحقق من توفر اليوم
  const isDayAvailable = (date: any) => {
    // 🔑 النقطة الأساسية: التحقق من أيام عدم التواجد أولاً
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateString = `${year}-${month}-${day}`;

    // إذا كان اليوم في قائمة أيام عدم التواجد، فهو غير متاح
    const isUnavailable = unavailableDays.some(
      (unavailableDay: any) => unavailableDay.date === dateString
    );
    if (isUnavailable) {

      return false;
    }

    // التحقق من أيام الأسبوع العادية
    const dayKey = weekdayKeys[date.getDay()];
    const isWeekdayAvailable = getAvailableDays().includes(dayKey);

    // Weekday availability check completed

    return isWeekdayAvailable;
  };

  // دالة لإنشاء markedDates للتقويم عبر الشهر الظاهر - إصلاح مشكلة المنطقة الزمنية
  const getMarkedDates = () => {
    const marked: any = {};

    // إضافة اليوم المحدد
    if (selectedDate) {
      marked[selectedDate] = {
        selected: true,
        selectedColor: theme.colors.primary,
      };
    }

    // إضافة الأيام المتاحة للشهر الظاهر في التقويم (يدعم التنقل بين الشهور)
    const today = new Date();
    const currentMonth = visibleMonthDate.getMonth();
    const currentYear = visibleMonthDate.getFullYear();

    for (let day = 1; day <= 31; day++) {
      const date = new Date(currentYear, currentMonth, day);

      // تخطي الأيام الماضية
      if (date < today) continue;

      // تخطي الأيام من الشهر التالي
      if (date.getMonth() !== currentMonth) break;

      // إصلاح مشكلة المنطقة الزمنية - استخدام التنسيق المحلي بدلاً من UTC
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const dayStr = String(date.getDate()).padStart(2, '0');
      const dateString = `${year}-${month}-${dayStr}`;

      // 🔑 النقطة الأساسية: التحقق من أيام عدم التواجد أولاً
      const isUnavailable = unavailableDays.some(
        (day: any) => day.date === dateString
      );

      if (isUnavailable) {
        // إضافة علامة للأيام غير المتاحة (أيام الإجازات)
        marked[dateString] = {
          marked: true,
          dotColor: theme.colors.alertError, // لون أحمر
          textColor: theme.colors.alertError,
          dotStyle: {
            width: 8,
            height: 8,
            borderRadius: 4,
            marginTop: 2,
          },
          customStyles: {
            text: {
              color: theme.colors.alertError,
              fontWeight: 'bold',
            },
          },
        };
  
      } else if (isDayAvailable(date)) {
        // إضافة علامة للأيام المتاحة
        if (selectedDate !== dateString) {
          marked[dateString] = {
            marked: true,
            dotColor: theme.colors.success,
            textColor: theme.colors.textPrimary,
            dotStyle: {
              width: 8,
              height: 8,
              borderRadius: 4,
              marginTop: 2,
            },
          };
        }
      }
    }

    return marked;
  };

  // دالة لاستخراج إحداثيات من رابط Google Maps
  const extractCoordinatesFromMapUrl = (mapUrl: string) => {
    try {
      // إذا كان الرابط يحتوي على إحداثيات مباشرة
      if (mapUrl.includes('@')) {
        const coordsMatch = mapUrl.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
        if (coordsMatch) {
          return {
            latitude: parseFloat(coordsMatch[1]),
            longitude: parseFloat(coordsMatch[2]),
          };
        }
      }

      // إذا كان الرابط يحتوي على query parameters
      if (mapUrl.includes('q=')) {
        const qMatch = mapUrl.match(/q=([^&]+)/);
        if (qMatch) {
          const location = decodeURIComponent(qMatch[1]);
          // يمكن إضافة geocoding هنا لتحويل العنوان إلى إحداثيات
          // للآن سنستخدم إحداثيات بغداد كافتراضي
          return {
            latitude: 33.3152,
            longitude: 44.3661,
          };
        }
      }

      // إحداثيات افتراضية لبغداد
      return {
        latitude: 33.3152,
        longitude: 44.3661,
      };
    } catch (error) {
      return {
        latitude: 33.3152,
        longitude: 44.3661,
      };
    }
  };

  // عند اختيار تاريخ
  const onDayPress = (day: any) => {
    const selectedDateStr = day.dateString;

    // 🔑 التحقق من أن اليوم غير متاح (أيام الإجازات)
    const isUnavailable = unavailableDays.some(
      (unavailableDay: any) => unavailableDay.date === selectedDateStr
    );

    if (isUnavailable) {
      // إظهار رسالة منبثقة أن اليوم غير متاح
      showAlert(
        'هذا اليوم غير متاح',
        'هذا اليوم هو يوم إجازة للطبيب ولا يمكن حجز مواعيد فيه.'
      );
      return; // إيقاف العملية هنا
    }

    // إذا كان اليوم متاح، متابعة العملية الطبيعية
    setSelectedDate(selectedDateStr);

    // مسح الأوقات المتاحة السابقة
    setAvailableTimes([]);
    setSelectedTime('');

    const selectedDateObj = new Date(selectedDateStr);
    const dayKey = weekdayKeys[selectedDateObj.getDay()];
    const dayName = getWeekdayName(selectedDateObj.getDay());


    // 🔑 التحقق مرة أخرى من أن اليوم ليس يوم إجازة
    const isUnavailableForBooking = unavailableDays.some(
      unavailableDay => unavailableDay.date === selectedDateStr
    );

    if (isUnavailableForBooking) {
      setAvailableTimes([]);
      setSelectedTime('');
      return;
    }

    const times = doctor.workTimes.filter(
      (wt: any) => normalizeDayToKey(wt.day) === dayKey
    );

    // تقسيم كل فترة زمنية إلى مواعيد منفصلة
    const allSlots: string[] = [];
    times.forEach((wt: any) => {
      if (wt.from && wt.to) {
        const slots = generateTimeSlots(wt.from, wt.to);
        allSlots.push(...slots);
      }
    });

    setAvailableTimes(allSlots);
    setSelectedTime('');

    // جلب المواعيد المحجوزة لهذا اليوم
    fetchBookedAppointments(selectedDateStr);
  };

  const bookAppointment = async () => {
    try {
      setBookingLoading(true);

      // فحص إضافي لحالة المستخدم والتوكن
      if (!user?.id) {
        showError(t('error.title'), 'يجب تسجيل الدخول أولاً');
        setBookingLoading(false);
        return;
      }

      // التحقق من أن معرف المستخدم ليس محلياً
      if (user.id.startsWith('local_')) {
        showError(
          t('error.title'), 
          'يبدو أن حسابك محلي. يرجى تسجيل الخروج وتسجيل الدخول مرة أخرى للحصول على حساب صحيح.'
        );
        setBookingLoading(false);
        return;
      }

      if (!selectedDate || !selectedTime) {
        showError(t('error.title'), t('validation.select_date_time'));
        setBookingLoading(false);
        return;
      }

      let finalAge: number;
      let finalPatientName: string;
      let finalPatientPhone: string;
      let finalBookerName: string;

      if (isBookingForOther) {
        // التحقق من بيانات المريض الآخر
        if (!patientName.trim()) {
          Alert.alert(t('error.title'), t('validation.patient_name_required'));
          return;
        }
        if (!patientPhone.trim()) {
          Alert.alert(t('error.title'), t('validation.patient_phone_required'));
          return;
        }
        if (!patientAge.trim()) {
          Alert.alert(t('error.title'), t('validation.patient_age_required'));
          return;
        }

        // تحويل الأرقام العربية إلى إنجليزية
        const normalizedAge = normalizeArabicNumbers(patientAge.trim());
        
        const ageNumber = parseInt(normalizedAge);
        if (isNaN(ageNumber) || ageNumber < 1 || ageNumber > 120) {
          Alert.alert(t('error.title'), t('validation.patient_age_invalid'));
          return;
        }

        finalAge = ageNumber;
        finalPatientName = patientName.trim();
        finalPatientPhone = patientPhone.trim();
        finalBookerName = profile?.first_name || profile?.name || user?.name || t('common.user');
      } else {
        // التحقق من عمر المريض نفسه
        if (!age.trim()) {
          Alert.alert(t('error.title'), t('validation.age_required'));
          return;
        }

        // تحويل الأرقام العربية إلى إنجليزية
        const normalizedAge = age.trim().replace(/[٠-٩]/g, (match) => {
          return String.fromCharCode(match.charCodeAt(0) - '٠'.charCodeAt(0) + '0'.charCodeAt(0));
        });
        
        const ageNumber = parseInt(normalizedAge);
        if (isNaN(ageNumber) || ageNumber < 1 || ageNumber > 120) {
          Alert.alert(t('error.title'), t('validation.age_invalid'));
          return;
        }

        finalAge = ageNumber;
        finalPatientName = profile?.first_name || profile?.name || user?.name || t('calendar.patient');
        finalPatientPhone = profile?.phone || user?.phone || '';
        finalBookerName = profile?.first_name || profile?.name || user?.name || t('common.user');
      }

      // إصلاح تنسيق البيانات المرسلة للخادم - محدث ليتطابق مع قاعدة البيانات
      const bookingData = {
        userId: user?.id, // معرف المستخدم
        doctorId: doctorId, // معرف الطبيب
        userName: finalPatientName, // اسم المريض الفعلي
        doctorName: doctor?.name || t('common.doctor'), // اسم الطبيب
        centerName: '', // اسم المركز الصحي (فارغ حالياً)
        date: selectedDate, // التاريخ
        time: selectedTime, // الوقت
        reason: reason || '', // سبب الزيارة
        patientAge: finalAge, // عمر المريض - إجباري (يتطابق مع قاعدة البيانات)
        price: 0, // السعر (صفر حالياً)
        notes: '', // ملاحظات (فارغة حالياً)
        type: 'normal' as const, // نوع الموعد (عادي)
        patientPhone: finalPatientPhone, // رقم هاتف المريض
        duration: doctor?.appointmentDuration || 30, // مدة الموعد (دقائق)
        attendance: 'absent' as const, // حالة الحضور (غائب افتراضياً)
        attendanceTime: '', // وقت تسجيل الحضور (فارغ حالياً)
        createdAt: new Date().toISOString(), // تاريخ الإنشاء
        updatedAt: new Date().toISOString(), // تاريخ التحديث
        
        // حقول الحجز لشخص آخر
        isBookingForOther: isBookingForOther,
        patientName: finalPatientName, // اسم المريض الفعلي دائماً
        bookerName: isBookingForOther ? finalBookerName : undefined,
        
        // حقول احتياطية للتوافق مع الكود الحالي
        age: finalAge, // العمر (احتياطي)
      };


      const response = await api.post('/appointments', bookingData);


      // جدولة تذكير بالموعد (قبل ساعة من الموعد)
      try {
        // إنشاء تاريخ الموعد بطريقة محلية وآمنة مع تحليل وقت يدعم الأرقام العربية
        const [y, m, d] = selectedDate.split('-').map(n => parseInt(n, 10));
        const parsed = parseTimeSafe(selectedTime);
        if (!parsed) {
          Alert.alert(t('error.title'), t('validation.time_format_not_supported'));
          return;
        }
        const { hour: hh, minute: mm } = parsed;
        const appointmentDate = new Date(y, (m || 1) - 1, d, hh, mm, 0, 0);

        // إرسال إشعار للدكتور في الخلفية (بدون انتظار)
        sendAppointmentNotificationToDoctor(
          doctorId,
          response.data?.appointment?._id || Date.now().toString(),
          profile?.first_name || profile?.name || user?.name || t('calendar.patient'),
          appointmentDate,
          appointmentDate.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })
        )
          .then(() => {
            // Silent success
          })
          .catch(notificationError => {
            // Silent error handling
          });

        // تحديث عداد إشعارات الطبيب في الخلفية (بدون انتظار)
        refreshDoctorNotifications(doctorId)
          .then(() => {
            // Silent success
          })
          .catch(e => {
            // Silent error handling
          });


        try {
        const result = await scheduleAppointmentReminder(
          response.data?.appointment?._id || Date.now().toString(),
          appointmentDate,
          doctor?.name || doctor?.first_name || doctor?.full_name || t('common.doctor') + ' ' + (doctor?.specialty || t('common.doctor')),
          profile?.first_name || profile?.name || user?.name || t('calendar.patient')
        );
        } catch (error) {
          throw error;
        }

        // فحص الإشعارات المجدولة للتأكد من نجاح الجدولة
        try {
          const scheduled =
            await Notifications.getAllScheduledNotificationsAsync();
        } catch (error) {
          // Silent error handling
        }

        // عرض رسالة تأكيد مع تفاصيل التوقيت
        const reminderTime = new Date(
          appointmentDate.getTime() - 60 * 60 * 1000
        );
      } catch (reminderError) {
        // لا نعرض رسالة خطأ للمستخدم لأن الحجز نجح
        // سيتم المحاولة مرة أخرى عند إعادة تشغيل التطبيق
      }

              const successMessage = isBookingForOther
          ? `تم الحجز بنجاح لـ ${finalPatientName}!`
          : t('appointments.booking_success');

        Alert.alert(t('success.title'), successMessage, [
          {
            text: t('common.ok'),
            onPress: () => {
              setShowBookingModal(false);
              setShowBookingForOtherModal(false);
              setIsBookingForOther(false);
              setPatientName('');
              setPatientPhone('');
              setPatientAge('');
              navigation.navigate('MyAppointments' as never);
            },
          },
        ]);
    } catch (error: any) {

      // رسالة خطأ أكثر تفصيلاً
      let errorMessage = t('error.booking_failed');
      if (error?.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error?.message) {
        errorMessage = error.message;
      }

      Alert.alert(t('error.title'), errorMessage);
    } finally {
      setBookingLoading(false);
    }
  };

  const handleBookAppointment = () => {
    setShowBookingModal(true);
  };

  const handleBookForOtherPerson = () => {
    setShowBookingForOtherModal(true);
    
    // إغلاق مودال التقويم أولاً
    setShowCalendar(false);
  };

  // دالة إرسال التقييم
  const handleSubmitRating = async () => {

    if (!user || !doctor || userRating === 0) {
      Alert.alert(t('rating.error'), t('rating.please_select_rating'));
      return;
    }

    if (!user.id) {
      Alert.alert(t('rating.error'), t('rating.login_required'));
      return;
    }

    if (!doctorId) {
      Alert.alert(t('rating.error'), t('doctor.id_not_found'));
      return;
    }

    setRatingLoading(true);
    try {
      const isUpdate = isEditingRating && userExistingRating;
      const url = isUpdate 
        ? `${API_CONFIG.BASE_URL}/ratings/${userExistingRating.id}`
        : `${API_CONFIG.BASE_URL}/ratings`;
      
      const method = isUpdate ? 'PUT' : 'POST';
      
      const ratingData = {
        userId: user.id,
        doctorId: doctorId,
        rating: userRating,
        comment: userComment.trim() || undefined,
      };
      
      
      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(ratingData),
      });

      const data = await response.json();

      if (response.ok) {
        Alert.alert(
          t('rating.success'),
          isUpdate ? t('rating.rating_updated') : t('rating.rating_submitted_successfully'),
          [{ text: t('common.ok') }]
        );
        
        // إعادة تحميل بيانات الطبيب لتحديث التقييم
        fetchDoctorDetails();
        
        // تحديث حالة التقييم المحلي
        if (isUpdate) {
          setUserExistingRating({ ...userExistingRating, rating: userRating, comment: userComment.trim() });
        } else {
          setUserExistingRating({ id: data.rating?.id, rating: userRating, comment: userComment.trim() });
          setIsEditingRating(true);
        }
      } else {
        Alert.alert(t('rating.error'), data.error || t('rating.rating_failed'));
      }
    } catch (error: any) {
      Alert.alert(t('rating.error'), t('rating.rating_failed'));
    } finally {
      setRatingLoading(false);
    }
  };

  // دالة إعادة تعيين التقييم
  const handleResetRating = () => {
    setUserRating(0);
    setUserComment('');
    setIsEditingRating(false);
    setUserExistingRating(null);
  };

  const handleConfirmBookingForOther = () => {
    if (!patientName.trim() || !patientPhone.trim() || !patientAge.trim()) {
      Alert.alert(t('error.title'), t('validation.all_fields_required'));
      return;
    }
    
    // تحويل الأرقام العربية إلى إنجليزية
    const normalizedAge = normalizeArabicNumbers(patientAge.trim());
    
    // التحقق من صحة العمر
    const ageNum = parseInt(normalizedAge);
    if (isNaN(ageNum) || ageNum < 1 || ageNum > 120) {
      Alert.alert(t('error.title'), t('validation.age_invalid'));
      return;
    }
    
    setIsBookingForOther(true);
    setShowBookingForOtherModal(false);
    setShowBookingModal(true);
  };

  const handleCancelBookingForOther = () => {
    setIsBookingForOther(false);
    setPatientName('');
    setPatientPhone('');
    setPatientAge('');
    setShowBookingForOtherModal(false);
    setShowBookingModal(false);
  };

  // دالة لتحويل الأرقام العربية إلى إنجليزية
  const normalizeArabicNumbers = (text: string) => {
    return text.replace(/[٠-٩]/g, (match) => {
      return String.fromCharCode(match.charCodeAt(0) - '٠'.charCodeAt(0) + '0'.charCodeAt(0));
    });
  };

  // دالة لتحديث العمر مع تحويل الأرقام العربية
  const handleAgeChange = (text: string) => {
    const normalizedText = normalizeArabicNumbers(text);
    setPatientAge(normalizedText);
  };

  const openMap = () => {
    if (doctor?.mapLocation) {
      setShowMap(true);
    } else {
      Alert.alert(t('common.info'), t('map.no_link'));
    }
  };

  const openMapInBrowser = () => {
    if (doctor?.mapLocation) {
      // فتح الرابط في المتصفح
      Linking.openURL(doctor.mapLocation);
    } else {
      Alert.alert(t('common.info'), t('map.no_link'));
    }
  };

  // دالة مساعدة لمعالجة مسار الصورة
  const getImageUrl = (imagePath: string | null | undefined): string | null => {
    if (!imagePath || imagePath === 'null' || imagePath === 'undefined') {
      return null;
    }

    // إذا كانت الصورة من Cloudinary (تبدأ بـ https://res.cloudinary.com)
    if (imagePath.startsWith('https://res.cloudinary.com')) {
      return imagePath;
    }

    // إذا كانت الصورة محلية (تبدأ بـ /uploads/)
    if (imagePath.startsWith('/uploads/')) {
      return `${API_CONFIG.BASE_URL}${imagePath}`;
    }

    // إذا كانت الصورة رابط كامل
    if (imagePath.startsWith('http')) {
      return imagePath;
    }

    // إذا كانت الصورة مسار نسبي (بدون /uploads/)
    if (
      imagePath &&
      !imagePath.startsWith('http') &&
      !imagePath.startsWith('/uploads/')
    ) {
      return `${API_CONFIG.BASE_URL}/${imagePath}`;
    }

    return null;
  };



  // استخراج إحداثيات الموقع
  const mapCoordinates = doctor?.mapLocation
    ? extractCoordinatesFromMapUrl(doctor.mapLocation)
    : null;



  // التحقق من حالة تعطيل الطبيب
  const checkDoctorDisabled = () => {
    if (doctor && doctor.disabled) {
      return (
        <View style={styles.disabledDoctorContainer}>
          <View style={styles.disabledDoctorContent}>
            <Ionicons name="lock-closed" size={80} color={theme.colors.error} />
            <Text style={styles.disabledDoctorTitle}>{t('doctor.not_available')}</Text>
            <Text style={styles.disabledDoctorMessage}>
              عذراً، هذا الطبيب غير متاح حالياً لحجز المواعيد. يرجى اختيار طبيب آخر من قائمة الأطباء المتاحين.
            </Text>
            <TouchableOpacity
              style={styles.backToDoctorsButton}
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.backToDoctorsButtonText}>{t('doctor.back_to_doctors')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>{t('common.loading')}</Text>
      </View>
    );
  }

  if (!doctor) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle" size={64} color={theme.colors.error} />
        <Text style={styles.errorText}>{t('error.doctor_not_found')}</Text>
      </View>
    );
  }

  // التحقق من حالة تعطيل الطبيب
  const disabledDoctorView = checkDoctorDisabled();
  if (disabledDoctorView) {
    return disabledDoctorView;
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
        {/* زر الرجوع */}
        <TouchableOpacity
          style={styles.simpleBackButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={theme.colors.textPrimary} />
        </TouchableOpacity>

        {/* صورة الطبيب */}
        <View style={styles.imageContainer}>
          {(() => {
            const imageUrl = getImageUrl(
              doctor.imageUrl || doctor.image || doctor.profile_image
            );
            return imageUrl ? (
              <Image
                source={{ uri: imageUrl }}
                style={styles.doctorImage}
                resizeMode="cover"
                defaultSource={require('../../assets/icon.png')}
                onError={e => {
                  // Silent error handling
                }}
                onLoad={() => {
                  // Silent success
                }}
              />
            ) : (
              <Image
                source={require('../../assets/icon.png')}
                style={styles.doctorImage}
                resizeMode="cover"
              />
            );
          })()}
        </View>

        {/* معلومات الطبيب */}
        <View style={styles.infoContainer}>
          <Text style={styles.doctorName}>{doctor.name}</Text>

          {/* تحسين عرض التخصص */}
          <View style={styles.specialtyContainer}>
            <Ionicons name="medical" size={20} color={theme.colors.primary} />
            <Text style={styles.doctorSpecialty}>
              {doctor.specialty || t('common.not_specified')}
            </Text>
          </View>

          {doctor.experienceYears && (
            <View style={styles.infoRow}>
              <Ionicons name="time" size={20} color={theme.colors.primary} />
              <Text style={styles.infoText}>
                {t('doctor.experience')}: {doctor.experienceYears}{' '}
                {t('doctor.years')}
              </Text>
            </View>
          )}

          {/* عرض التقييم - فقط إذا كان هناك تقييم فعلي */}
          {(doctor.rating && doctor.rating > 0) && (
            <View style={styles.ratingContainer}>
              <StarRating
                rating={doctor.rating}
                size="large"
                showText={true}
                interactive={false}
              />
              {doctor.reviews_count && doctor.reviews_count > 0 && (
                <TouchableOpacity
                  style={styles.reviewsButton}
                  onPress={() => (navigation as any).navigate('DoctorReviews', { doctorId: doctor.id })}
                >
                  <Text style={styles.ratingCount}>
                    {t('rating.based_on')} {doctor.reviews_count} {t('rating.reviews')}
                  </Text>
                  <Ionicons name="chevron-forward" size={16} color={theme.colors.primary} />
                </TouchableOpacity>
              )}
            </View>
          )}



          {doctor.clinicLocation && (
            <View style={styles.infoRow}>
              <Ionicons
                name="location"
                size={20}
                color={theme.colors.primary}
              />
              <Text style={styles.infoText}>{doctor.clinicLocation}</Text>
            </View>
          )}

          {doctor.province && doctor.area && (
            <View style={styles.infoRow}>
              <Ionicons
                name="location-outline"
                size={20}
                color={theme.colors.primary}
              />
              <Text style={styles.infoText}>
                {mapProvinceToLocalized(doctor.province)}, {doctor.area}
              </Text>
            </View>
          )}
        </View>

        {/* وصف الطبيب */}
        {doctor.about && (
          <View style={styles.descriptionContainer}>
            <Text style={styles.sectionTitle}>{t('doctor.about')}</Text>
            <Text style={styles.descriptionText}>{doctor.about}</Text>
          </View>
        )}





        {/* موقع العيادة */}
        {doctor.clinicLocation && (
          <View style={styles.infoRow}>
            <Ionicons
              name="location-outline"
              size={20}
              color={theme.colors.primary}
            />
            {doctor.mapLocation ? (
              <TouchableOpacity
                style={styles.infoTextContainer}
                onPress={() => Linking.openURL(doctor.mapLocation)}
                activeOpacity={0.7}
              >
                <Text style={[styles.infoText, styles.clickableInfoText]}>
                  {t('location.manual')}: {doctor.clinicLocation}
                </Text>
                <Ionicons
                  name="map-outline"
                  size={20}
                  color={theme.colors.primary}
                  style={styles.mapIconInline}
                />
              </TouchableOpacity>
            ) : (
              <Text style={styles.infoText}>
                {t('location.manual')}: {doctor.clinicLocation}
              </Text>
            )}
          </View>
        )}

        {/* زر نسخ الرابط */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => {
              const doctorUrl = `${APP_CONFIG.APP.WEBSITE_URL}/doctor/${
                doctor._id || doctor.id || doctorId
              }`;
              Clipboard.setString(doctorUrl);
              Alert.alert(t('common.copied'), t('doctor.link_copied_successfully'));
            }}
          >
            <Ionicons
              name="share-outline"
              size={20}
              color={theme.colors.primary}
            />
            <Text style={styles.actionButtonText}>{t('common.copy_link')}</Text>
          </TouchableOpacity>
        </View>

        {/* قسم التقييم الجديد */}
        {user && user.user_type === 'user' && user.id && (
          <View style={styles.ratingSection}>
            <View style={styles.ratingSectionHeader}>
              <Text style={styles.ratingSectionTitle}>
                {isEditingRating ? t('rating.update_rating') : t('rating.rate_doctor')}
              </Text>
              {isEditingRating && (
                <TouchableOpacity
                  style={styles.editRatingButton}
                  onPress={handleResetRating}
                >
                  <Ionicons name="refresh" size={16} color={theme.colors.primary} />
                  <Text style={styles.editRatingButtonText}>
                    {t('rating.new_rating')}
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {/* عرض التقييم الحالي إذا كان موجود */}
            {isEditingRating && userExistingRating && (
              <View style={styles.currentRatingContainer}>
                <Text style={styles.currentRatingLabel}>
                  {t('rating.your_current_rating')}:
                </Text>
                <View style={styles.currentRatingDisplay}>
                  <StarRating
                    rating={userExistingRating.rating}
                    size="medium"
                    showText={true}
                    interactive={false}
                  />
                  {userExistingRating.comment && (
                    <Text style={styles.currentRatingComment}>
                      "{userExistingRating.comment}"
                    </Text>
                  )}
                </View>
              </View>
            )}

            {/* قسم اختيار التقييم */}
            <View style={styles.ratingInputContainer}>
              <Text style={styles.ratingInputLabel}>
                {t('rating.your_rating')}:
              </Text>
              
              {/* النجوم التفاعلية */}
              <View style={styles.interactiveStarsContainer}>
                {[1, 2, 3, 4, 5].map((star) => {
                  const isFilled = star <= userRating;
                  return (
                    <TouchableOpacity
                      key={star}
                      onPress={() => setUserRating(star)}
                      style={styles.interactiveStarButton}
                      activeOpacity={0.7}
                    >
                      <Ionicons
                        name="star"
                        size={32}
                        color={isFilled ? '#FFD700' : '#E0E0E0'}
                      />
                    </TouchableOpacity>
                  );
                })}
              </View>
              
              {/* عرض التقييم المختار */}
              {userRating > 0 && (
                <View style={styles.ratingDisplay}>
                  <Text style={styles.ratingNumber}>
                    {userRating}/5
                  </Text>
                  <Text style={styles.ratingDescription}>
                    {userRating === 1 && t('rating.very_poor')}
                    {userRating === 2 && t('rating.poor')}
                    {userRating === 3 && t('rating.average')}
                    {userRating === 4 && t('rating.good')}
                    {userRating === 5 && t('rating.excellent')}
                  </Text>
                </View>
              )}
            </View>

            {/* قسم التعليق */}
            <View style={styles.commentInputContainer}>
              <Text style={styles.commentInputLabel}>
                {t('rating.add_comment')} ({t('rating.comment_optional')}):
              </Text>
              
              <TextInput
                style={styles.commentInput}
                value={userComment}
                onChangeText={setUserComment}
                placeholder={t('rating.comment_placeholder')}
                placeholderTextColor={theme.colors.textSecondary}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
                maxLength={500}
              />
              
              <View style={styles.commentFooter}>
                <Text style={styles.commentCounter}>
                  {userComment.length}/500
                </Text>
              </View>
            </View>

            {/* ملاحظة مهمة */}
            <View style={styles.ratingNote}>
              <Ionicons name="information-circle" size={16} color={theme.colors.primary} />
              <Text style={styles.ratingNoteText}>
                {t('rating.comments_private')}
              </Text>
            </View>

            {/* زر الإرسال */}
            <TouchableOpacity
              style={[
                styles.submitRatingButton,
                userRating === 0 && styles.submitButtonDisabled
              ]}
              onPress={handleSubmitRating}
              disabled={userRating === 0 || ratingLoading}
            >
              {ratingLoading ? (
                <ActivityIndicator size="small" color={theme.colors.white} />
              ) : (
                <>
                  <Ionicons name="star" size={16} color={theme.colors.white} />
                  <Text style={styles.submitRatingButtonText}>
                    {isEditingRating ? t('rating.update_rating') : t('rating.submit_rating')}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* مساحة إضافية في الأسفل لضمان ظهور الأزرار */}
        <View style={styles.bottomSpacer} />
        </View>
      </ScrollView>

      {/* زر الحجز الثابت */}
      <View style={styles.fixedBookingContainer}>
        <TouchableOpacity
          style={styles.fixedBookingButton}
          onPress={() => setShowCalendar(true)}
        >
          <Ionicons name="calendar" size={18} color={theme.colors.white} />
          <Text style={styles.fixedBookingButtonText}>{t('appointment.book_appointment')}</Text>
        </TouchableOpacity>
      </View>

      {/* Modal التقويم */}
      <Modal
        visible={showCalendar}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowCalendar(false)}
            >
              <Ionicons
                name="close"
                size={24}
                color={theme.colors.textPrimary}
              />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>{t('appointment.choose_appointment_time')}</Text>
          </View>

          {!selectedTime && (
            <View style={styles.calendarInfo}>
              <Text style={styles.calendarInfoText}>
                {t('appointments.green_dots_available')}
              </Text>
              <Text style={styles.calendarInfoText}>
                {t('appointments.selected_day_blue')}
              </Text>
            </View>
          )}

          <ScrollView
            style={styles.modalScrollView}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.calendarScrollContainer}
          >
            <Calendar
              onDayPress={onDayPress}
              markedDates={getMarkedDates()}
              minDate={(() => {
                const today = new Date();
                const year = today.getFullYear();
                const month = String(today.getMonth() + 1).padStart(2, '0');
                const day = String(today.getDate()).padStart(2, '0');
                return `${year}-${month}-${day}`;
              })()}
              onMonthChange={(m: any) => {
                try {
                  const d = new Date(
                    `${m.year}-${String(m.month).padStart(2, '0')}-01T00:00:00`
                  );
                  setVisibleMonthDate(d);
                } catch {}
              }}
              theme={{
                selectedDayBackgroundColor: theme.colors.primary,
                selectedDayTextColor: theme.colors.white,
                todayTextColor: theme.colors.primary,
                dayTextColor: theme.colors.textPrimary,
                textDisabledColor: theme.colors.textSecondary,
                arrowColor: theme.colors.primary,
                monthTextColor: theme.colors.textPrimary,
                indicatorColor: theme.colors.primary,
              }}
            />

            {selectedDate && (
              <>
                {availableTimes.length > 0 ? (
                  <View style={styles.timeSlotsContainer}>
                    <Text style={styles.timeSlotsTitle}>
                      {t('appointments.choose_time_for_day')}: {selectedDate}
                    </Text>
                    <View style={styles.timeSlotsGrid}>
                      {availableTimes.map((time, index) => {
                        const isBooked = bookedTimes.includes(time);
                        return (
                          <TouchableOpacity
                            key={index}
                            style={[
                              styles.timeSlot,
                              selectedTime === time && styles.selectedTimeSlot,
                              isBooked && styles.bookedTimeSlot,
                            ]}
                            onPress={() => !isBooked && setSelectedTime(time)}
                            disabled={isBooked}
                          >
                            <Text
                              style={[
                                styles.timeSlotText,
                                selectedTime === time &&
                                  styles.selectedTimeSlotText,
                                isBooked && styles.bookedTimeSlotText,
                              ]}
                            >
                              {time} {isBooked && `(${t('appointments.booked')})`}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>
                ) : (
                  // 🔑 رسالة عندما لا توجد أوقات متاحة (مثل أيام الإجازات)
                  <View style={styles.noTimesAvailableContainer}>
                    <Ionicons
                      name="calendar-outline"
                      size={48}
                      color={theme.colors.alertError}
                    />
                    <Text style={styles.noTimesAvailableTitle}>
                      {t('appointments.day_not_available')}
                    </Text>
                    <Text style={styles.noTimesAvailableSubtitle}>
                      {t('appointments.day_holiday_or_no_work_times')}
                    </Text>
                  </View>
                )}
              </>
            )}
          </ScrollView>

          {/* زر التأكيد ثابت في الأسفل */}
          {selectedDate && selectedTime && (
            <View style={styles.fixedBottomContainer}>
              {/* زر الحجز لشخص آخر */}
              <TouchableOpacity
                style={[styles.confirmButton, { backgroundColor: theme.colors.success, marginBottom: 10 }]}
                onPress={handleBookForOtherPerson}
              >
                <Text style={styles.confirmButtonText}>{t('booking_for_other.title')}</Text>
              </TouchableOpacity>
              
              {/* زر التأكيد العادي */}
              <TouchableOpacity
                style={styles.confirmButton}
                onPress={() => {
                  setShowCalendar(false);
                  setShowBookingModal(true);
                }}
              >
                <Text style={styles.confirmButtonText}>{t('appointments.confirm_booking')}</Text>
              </TouchableOpacity>
            </View>
          )}


        </View>
      </Modal>

      {/* Modal الخريطة */}
      <Modal
        visible={showMap}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowMap(false)}
            >
              <Ionicons
                name="close"
                size={24}
                color={theme.colors.textPrimary}
              />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>{t('doctor.clinic_location')}</Text>
            <TouchableOpacity
              style={styles.browserButton}
              onPress={openMapInBrowser}
            >
              <Ionicons
                name="open-outline"
                size={24}
                color={theme.colors.primary}
              />
            </TouchableOpacity>
          </View>

          {/* MapView temporarily disabled for web compatibility */}
          <View style={styles.mapView}>
            <Text style={styles.mapPlaceholderText}>🗺️ {t('doctor.location_map')}</Text>
            <Text style={styles.mapPlaceholderSubText}>
              {t('doctor.map_component_web')}
            </Text>
          </View>
        </View>
      </Modal>

      {/* Modal تأكيد الحجز */}
      <Modal
        visible={showBookingModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowBookingModal(false)}
            >
              <Ionicons
                name="close"
                size={24}
                color={theme.colors.textPrimary}
              />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>{t('appointments.choose_booking_time')}</Text>
          </View>

          <ScrollView 
            style={styles.modalScrollView}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.bookingFormScrollContainer}
          >
            <View style={styles.bookingForm}>
              <View style={styles.bookingInfo}>
                <Text style={styles.bookingInfoText}>
                  {t('validation.date')}: {selectedDate}
                </Text>
                <Text style={styles.bookingInfoText}>{t('validation.time')}: {selectedTime}</Text>
                <Text style={styles.bookingInfoText}>{t('validation.doctor')}: {doctor?.name}</Text>
                <Text style={styles.bookingInfoText}>
                  {t('validation.specialty')}: {doctor?.specialty}
                </Text>
              </View>

              {/* عرض معلومات المريض إذا كان الحجز لشخص آخر */}
              {isBookingForOther && (
                <View style={styles.patientInfoContainer}>
                  <Text style={styles.patientInfoTitle}>{t('booking_for_other.patient_info')}</Text>
                  <View style={styles.patientInfoRow}>
                    <Text style={styles.patientInfoLabel}>{t('validation.patient_name')}:</Text>
                    <Text style={styles.patientInfoValue}>{patientName}</Text>
                  </View>
                  <View style={styles.patientInfoRow}>
                    <Text style={styles.patientInfoLabel}>{t('validation.patient_phone')}:</Text>
                    <Text style={styles.patientInfoValue}>{patientPhone}</Text>
                  </View>
                  <View style={styles.patientInfoRow}>
                    <Text style={styles.patientInfoLabel}>{t('validation.patient_age')}:</Text>
                    <Text style={styles.patientInfoValue}>{patientAge}</Text>
                  </View>
                  <View style={styles.patientInfoRow}>
                    <Text style={styles.patientInfoLabel}>{t('booking_for_other.booker_name')}:</Text>
                    <Text style={styles.patientInfoValue}>{profile?.first_name || profile?.name || user?.name || t('common.user')}</Text>
                  </View>
                </View>
              )}

              {/* حقل العمر للمريض نفسه فقط */}
              {!isBookingForOther && (
                <>
                  <Text style={styles.inputLabel}>{t('validation.patient_age')} ({t('validation.age_required')}):</Text>
                  <TextInput
                    style={styles.ageInput}
                    value={age}
                    onChangeText={setAge}
                    placeholder={t('auth.enter_age_arabic_numeric')}
                    keyboardType="numeric"
                    maxLength={3}
                    textAlign="right"
                    autoCorrect={false}
                    autoCapitalize="none"
                    contextMenuHidden={true}
                    textContentType="none"
                    autoComplete="off"
                    spellCheck={false}
                    importantForAutofill="no"
                  />
                </>
              )}

              <Text style={styles.inputLabel}>{t('validation.visit_reason_optional')}:</Text>
              <TextInput
                style={styles.textInput}
                value={reason}
                onChangeText={setReason}
                placeholder={t('validation.enter_visit_reason')}
                multiline
                numberOfLines={3}
              />

              <TouchableOpacity
                style={[
                  styles.bookButton,
                  bookingLoading && styles.bookButtonDisabled,
                ]}
                onPress={bookAppointment}
                disabled={bookingLoading}
              >
                {bookingLoading ? (
                  <ActivityIndicator size="small" color={theme.colors.white} />
                ) : (
                  <Text style={styles.bookButtonText}>{t('validation.confirm_booking')}</Text>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Modal>


      {/* Modal تأكيد الحجز لشخص آخر */}
      <Modal
        visible={showBookingForOtherModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowBookingForOtherModal(false)}
            >
              <Ionicons
                name="close"
                size={24}
                color={theme.colors.textPrimary}
              />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>{t('appointments.book_for_other_person')}</Text>
          </View>

          <ScrollView 
            style={styles.modalScrollView}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.bookingFormScrollContainer}
          >
            <View style={styles.bookingForm}>
              <View style={styles.bookingInfo}>
                <Text style={styles.bookingInfoText}>{t('validation.patient_name')}:</Text>
                <TextInput
                  style={styles.textInput}
                  value={patientName}
                  onChangeText={setPatientName}
                  placeholder={t('validation.enter_patient_name')}
                />
                <Text style={styles.bookingInfoText}>{t('validation.patient_phone')}:</Text>
                <TextInput
                  style={styles.textInput}
                  value={patientPhone}
                  onChangeText={setPatientPhone}
                  placeholder={t('validation.enter_patient_phone')}
                  keyboardType="phone-pad"
                />
                <Text style={styles.bookingInfoText}>{t('validation.patient_age')}:</Text>
                <TextInput
                  style={styles.ageInput}
                  value={patientAge}
                  onChangeText={handleAgeChange}
                  placeholder={t('validation.enter_patient_age')}
                  keyboardType="numeric"
                  maxLength={3}
                  textAlign="right"
                  autoCorrect={false}
                  autoCapitalize="none"
                  contextMenuHidden={true}
                  textContentType="none"
                  autoComplete="off"
                  spellCheck={false}
                  importantForAutofill="no"
                />
              </View>

              <TouchableOpacity
                style={[
                  styles.bookButton,
                  bookingLoading && styles.bookButtonDisabled,
                ]}
                onPress={handleConfirmBookingForOther}
                disabled={bookingLoading}
              >
                {bookingLoading ? (
                  <ActivityIndicator size="small" color={theme.colors.white} />
                ) : (
                  <Text style={styles.bookButtonText}>{t('appointments.confirm_booking_for_other')}</Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.bookButton}
                onPress={handleCancelBookingForOther}
              >
                <Text style={styles.bookButtonText}>{t('common.cancel')}</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* Toast Component */}
      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        duration={toast.duration}
        onHide={hideToast}
        action={toast.action}
      />

      {/* Custom Modal Component */}
      <CustomModal
        visible={modal.visible}
        title={modal.title}
        message={modal.message}
        type={modal.type}
        buttons={modal.buttons}
        onClose={hideModal}
        showCloseButton={modal.showCloseButton}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100, // مساحة للزر الثابت
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: theme.colors.textSecondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    color: theme.colors.error,
    textAlign: 'center',
  },
  header: {
    backgroundColor: theme.colors.primary,
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.white,
  },
  content: {
    padding: 20,
  },
  simpleBackButton: {
    alignSelf: 'flex-start',
    marginBottom: 16,
    padding: 8,
  },
  imageContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  doctorImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: theme.colors.primary,
  },
  placeholderImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: theme.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: theme.colors.primary,
  },
  infoContainer: {
    marginBottom: 24,
  },
  doctorName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
    marginBottom: 8,
  },
  doctorSpecialty: {
    fontSize: 18,
    color: theme.colors.primary,
    marginBottom: 16,
  },
  specialtyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: theme.colors.primary + '20',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 16,
    color: theme.colors.textPrimary,
    marginLeft: 12,
    flex: 1,
  },
  infoTextContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 12,
  },
  clickableInfoText: {
    flex: 1,
    color: theme.colors.primary,
    textDecorationLine: 'underline',
  },
  mapIconInline: {
    marginLeft: 8,
  },
  ratingContainer: {
    alignItems: 'center',
    marginVertical: 16,
    paddingVertical: 16,
    backgroundColor: theme.colors.background,
    borderRadius: 12,
  },
  ratingCount: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginTop: 8,
  },
  reviewsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },

  descriptionContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
    marginBottom: 12,
  },
  descriptionText: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    lineHeight: 24,
  },

  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    paddingHorizontal: 20,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.primary,
    borderRadius: 5,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  actionButtonText: {
    color: theme.colors.primary,
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 5,
  },
  rateButton: {
    backgroundColor: '#FFF8E1',
    borderColor: '#FFD700',
  },
  rateButtonText: {
    color: '#FF8F00',
  },
  mapIconButton: {
    flex: 1,
    backgroundColor: theme.colors.success,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginHorizontal: 4,
  },
  mapButton: {
    backgroundColor: theme.colors.success,
  },

  modalContainer: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    paddingTop: 50,
  },
  closeButton: {
    marginRight: 16,
  },
  browserButton: {
    marginLeft: 'auto',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
  },
  calendarInfo: {
    backgroundColor: theme.colors.border,
    padding: 12,
    marginHorizontal: 20,
    borderRadius: 8,
    marginBottom: 10,
  },
  calendarInfoText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: 4,
  },
  timeSlotsContainer: {
    padding: 20,
  },
  timeSlotsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
    marginBottom: 12,
    textAlign: 'center',
  },
  timeSlotsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  timeSlot: {
    backgroundColor: theme.colors.border,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    minWidth: 80,
    alignItems: 'center',
  },
  selectedTimeSlot: {
    backgroundColor: theme.colors.primary,
  },
  bookedTimeSlot: {
    backgroundColor: theme.colors.error + '20',
    opacity: 0.6,
  },
  timeSlotText: {
    fontSize: 14,
    color: theme.colors.textPrimary,
    fontWeight: '600',
  },
  selectedTimeSlotText: {
    color: theme.colors.white,
  },
  bookedTimeSlotText: {
    color: theme.colors.error,
  },
  confirmButton: {
    backgroundColor: theme.colors.primary,
    margin: 15,
    paddingVertical: 10,
    borderRadius: 6,
    alignItems: 'center',
  },
  confirmButtonText: {
    color: theme.colors.white,
    fontSize: 13,
    fontWeight: 'bold',
  },
  mapView: {
    flex: 1,
  },
  mapPlaceholderText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
    textAlign: 'center',
    marginBottom: 8,
  },
  mapPlaceholderSubText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  bookingForm: {
    padding: 20,
  },
  bookingInfo: {
    backgroundColor: theme.colors.border,
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
  },
  bookingInfoText: {
    fontSize: 16,
    color: theme.colors.textPrimary,
    marginBottom: 4,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    marginBottom: 8,
  },
  ageInput: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: theme.colors.textPrimary,
    backgroundColor: theme.colors.white,
    marginBottom: 20,
    textAlign: 'center',
  },
  textInput: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: theme.colors.textPrimary,
    backgroundColor: theme.colors.white,
    marginBottom: 20,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  bookButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 8,
    borderRadius: 5,
    alignItems: 'center',
  },
  bookButtonDisabled: {
    opacity: 0.6,
  },
  bookButtonText: {
    color: theme.colors.white,
    fontSize: 12,
    fontWeight: 'bold',
  },
  modalScrollView: {
    flex: 1,
  },
  fixedBottomContainer: {
    backgroundColor: theme.colors.white,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  bottomSpacer: {
    height: 100,
  },


  mapContainer: {
    marginTop: 10,
    alignItems: 'center',
  },
  mapButtonText: {
    color: theme.colors.white,
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  // أنماط رسالة عدم توفر الأوقات
  noTimesAvailableContainer: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  noTimesAvailableTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.alertError,
    marginTop: 16,
    textAlign: 'center',
  },
  noTimesAvailableSubtitle: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
  },
  disabledDoctorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
    padding: 20,
  },
  disabledDoctorContent: {
    alignItems: 'center',
    backgroundColor: theme.colors.white,
    padding: 30,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  disabledDoctorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.alertError,
    marginTop: 20,
    textAlign: 'center',
  },
  disabledDoctorMessage: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    marginTop: 10,
    textAlign: 'center',
    lineHeight: 22,
  },
  backToDoctorsButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 8,
    marginTop: 20,
  },
  backToDoctorsButtonText: {
    color: theme.colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    marginTop: 20,
  },
  cancelButton: {
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.border,
    flex: 1,
  },
  cancelButtonText: {
    color: theme.colors.textPrimary,
  },
  
  // أنماط معلومات المريض
  patientInfoContainer: {
    backgroundColor: theme.colors.background,
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  patientInfoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.primary,
    marginBottom: 12,
    textAlign: 'center',
  },
  patientInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  patientInfoLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    flex: 1,
  },
  patientInfoValue: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    flex: 1,
    textAlign: 'right',
    fontWeight: '500',
  },
  
  // نمط حاوية التمرير في مودال الحجز
  bookingFormScrollContainer: {
    paddingBottom: 20,
    flexGrow: 1,
  },
  
  // نمط حاوية التمرير في مودال التقويم
  calendarScrollContainer: {
    paddingBottom: 20,
    flexGrow: 1,
  },
  
  // أنماط قسم التقييم الجديد
  ratingSection: {
    backgroundColor: theme.colors.white,
    margin: 20,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  ratingSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  ratingSectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
  },
  editRatingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },
  editRatingButtonText: {
    fontSize: 12,
    color: theme.colors.primary,
    marginLeft: 4,
    fontWeight: '600',
  },
  currentRatingContainer: {
    backgroundColor: '#F8F9FA',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  currentRatingLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    marginBottom: 8,
  },
  currentRatingDisplay: {
    alignItems: 'center',
  },
  currentRatingComment: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    fontStyle: 'italic',
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
  },
  ratingInputContainer: {
    marginBottom: 20,
    alignItems: 'center',
  },
  ratingInputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    marginBottom: 16,
  },
  interactiveStarsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    gap: 8,
  },
  interactiveStarButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.3)',
  },
  ratingDisplay: {
    alignItems: 'center',
  },
  ratingNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.primary,
    marginBottom: 4,
  },
  ratingDescription: {
    fontSize: 14,
    color: theme.colors.primary,
    fontWeight: '500',
  },
  commentInputContainer: {
    marginBottom: 16,
  },
  commentInputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    marginBottom: 8,
  },
  commentInput: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: theme.colors.textPrimary,
    backgroundColor: theme.colors.white,
    minHeight: 100,
    textAlignVertical: 'top',
    textAlign: 'right',
  },
  commentFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 4,
  },
  commentCounter: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  ratingNote: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E3F2FD',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
  },
  ratingNoteText: {
    fontSize: 12,
    color: theme.colors.primary,
    marginLeft: 8,
    flex: 1,
  },
  submitRatingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  submitRatingButtonText: {
    color: theme.colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  fixedBookingContainer: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 0 : 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    backgroundColor: theme.colors.white,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 40 : 26,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
    gap: 12,
  },
  fixedBookingButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  fixedBookingButtonText: {
    color: theme.colors.white,
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 6,
  },
  fixedMapButton: {
    backgroundColor: theme.colors.success,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapButtonInline: {
    marginLeft: 8,
    padding: 8,
    borderRadius: 8,
    backgroundColor: theme.colors.background,
  },
});

export default DoctorDetailsScreen;
