import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  Platform,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../utils/theme';
import { api, appointmentsAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../contexts/NotificationContext';
import { getTodayLocalizedDayName, getLocalizedDayName } from '../utils/dateUtils';
import { logger, logError, logWarn, logInfo, logDebug, logUserAction, logApiCall, logApiResponse } from '../utils/logger';

interface Appointment {
  _id: string;
  id?: string;
  date: string;
  time: string;
  reason: string;
  age?: number; // العمر (احتياطي)
  patientAge?: number; // عمر المريض من قاعدة البيانات
  status: string;
  userName: string;
  attendance?: 'present' | 'absent' | 'late' | 'not_marked'; // حالة الحضور
  attendance_time?: string; // وقت تسجيل الحضور
  userId?: {
    _id: string;
    first_name: string;
    phone: string;
  };
  // حقول إضافية من قاعدة البيانات
  doctorId?: string;
  centerName?: string;
  price?: number;
  notes?: string;
  type?: 'normal' | 'special_appointment';
  patientPhone?: string;
  duration?: number;
  attendanceTime?: string;
  createdAt?: string;
  updatedAt?: string;
  isBookingForOther?: boolean; // إضافة حقل جديد لتحديد إذا كان الحجز للمريض الآخر
  patientName?: string; // اسم المريض الفعلي (عند الحجز لشخص آخر)
  bookerName?: string; // اسم الشخص الذي قام بالحجز
  patient_id?: string; // معرف المريض (احتياطي)
}

const DoctorAppointmentsScreen: React.FC = () => {
  const { t } = useTranslation();
  const { profile, checkStorageStatus, reloadFromStorage } = useAuth();
  const { sendAppointmentCancellationNotification } = useNotifications();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('asc');
  const [showPastAppointments, setShowPastAppointments] = useState(false);

  const appointmentsRef = useRef(appointments);

  useEffect(() => {
    if (profile?._id) {
      fetchAppointments();
    } else {
      logWarn('لا يوجد ملف شخصي للطبيب، انتظار...');
      setLoading(false);
    }
  }, [profile]);

  // تحديث appointmentsRef عند تغيير appointments
  useEffect(() => {
    appointmentsRef.current = [...appointments];
  }, [appointments]);

  const fetchAppointments = async () => {
    if (!profile?._id) {
      logError('لا يمكن جلب المواعيد: لا يوجد معرف للطبيب');
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      logApiCall('/appointments/doctor', 'GET', { doctorId: profile._id });
      
      // استخدام API المحسن مع معالجة أفضل للأخطاء
      const response = await appointmentsAPI.getDoctorAppointmentsById(profile._id);
      
      // التأكد من أن البيانات موجودة
      if (response && Array.isArray(response)) {
        // معالجة البيانات المستلمة من قاعدة البيانات
        const processedAppointments = response.map(appointment => ({
          ...appointment,
          // استخدام patientAge من قاعدة البيانات أو age كاحتياطي
          age: appointment.patientAge || appointment.age,
          // التأكد من وجود المعرفات
          id: appointment._id || appointment.id,
          userId: appointment.userId || appointment.patient_id,
          doctorId: appointment.doctorId || appointment.doctor_id,
        }));
        
        setAppointments(processedAppointments);
        logApiResponse('/appointments/doctor', 200);
        logDebug('بيانات المواعيد المعالجة', { 
          appointments: processedAppointments.map(apt => ({ 
            id: apt.id, 
            age: apt.age, 
            patientAge: apt.patientAge,
            reason: apt.reason,
            userName: apt.userName,
            hasAge: !!apt.age,
            ageType: typeof apt.age
          }))
        });
      } else {
        logWarn('لا توجد مواعيد أو البيانات غير صحيحة', { response });
        setAppointments([]);
      }
    } catch (error) {
      logError('خطأ في جلب المواعيد', error);
      Alert.alert(t('common.error'), t('appointments.fetch_error'));
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchAppointments();
    setRefreshing(false);
  };

  const filterAppointments = (appointments: Appointment[]) => {
    let filtered = appointments;

    // دائماً استبعد المواعيد الملغاة من جميع القوائم
    filtered = filtered.filter(apt => apt.status !== 'cancelled');

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(apt => 
        apt.userName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        apt.userId?.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        apt.reason?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by status
    if (filterStatus !== 'all') {
      filtered = filtered.filter(apt => apt.attendance === filterStatus);
    }

    // Filter by date (show past appointments only if enabled)
    if (!showPastAppointments) {
      const today = getLocalDateString();
      filtered = filtered.filter(apt => extractDatePart(apt.date) >= today);
    }

    return filtered;
  };

  const sortAppointments = (appointments: Appointment[]) => {
    const today = getLocalDateString();
    
    // تقسيم المواعيد إلى فئات
    const todayAppointments = appointments.filter(apt => extractDatePart(apt.date) === today);
    const futureAppointments = appointments.filter(apt => extractDatePart(apt.date) > today);
    const pastAppointments = appointments.filter(apt => extractDatePart(apt.date) < today);

    // ترتيب كل فئة
    const sortCategory = (category: Appointment[]) => {
      return category.sort((a, b) => {
        let comparison = 0;
        
        switch (sortBy) {
          case 'date':
            {
              const da = new Date(a.date).getTime();
              const db = new Date(b.date).getTime();
              comparison = da - db;
              // في حال تساوي التاريخ، قارن الوقت لفرز أدق
              if (comparison === 0) {
                comparison = (a.time || '').localeCompare(b.time || '');
              }
            }
            break;
          case 'time':
            comparison = a.time.localeCompare(b.time);
            break;
          case 'name':
            comparison = (a.userName || a.userId?.first_name || '').localeCompare(b.userName || b.userId?.first_name || '');
            break;
          default:
            comparison = 0;
        }
        
        return sortOrder === 'asc' ? comparison : -comparison;
      });
    };

    // ترتيب الفئات
    const sortedToday = sortCategory(todayAppointments);
    const sortedFuture = sortCategory(futureAppointments);
    const sortedPast = sortCategory(pastAppointments);

    // إرجاع المواعيد بالترتيب المطلوب: اليوم، ثم القادمة، ثم السابقة (إذا كانت مفعلة)
    if (showPastAppointments) {
      return [...sortedToday, ...sortedFuture, ...sortedPast];
    } else {
      return [...sortedToday, ...sortedFuture];
    }
  };

  const getDisplayedAppointments = () => {
    const filtered = filterAppointments(appointments);
    return sortAppointments(filtered);
  };

  const extractDatePart = (dateString: string) => {
    if (!dateString) return '';
    const m = /^(\d{4}-\d{2}-\d{2})/.exec(String(dateString));
    if (m) return m[1];
    try {
      const d = new Date(dateString);
      const y = d.getFullYear();
      const mo = String(d.getMonth() + 1).padStart(2, '0');
      const da = String(d.getDate()).padStart(2, '0');
      return `${y}-${mo}-${da}`;
    } catch { return ''; }
  };

  const isPastAppointment = (dateString: string) => {
    const today = getLocalDateString();
    return extractDatePart(dateString) < today;
  };

  // دالة للحصول على التاريخ المحلي بصيغة YYYY-MM-DD
  const getLocalDateString = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const isTodayAppointment = (dateString: string) => {
    const today = getLocalDateString();
    return extractDatePart(dateString) === today;
  };

  const isUpcomingAppointment = (dateString: string) => {
    const today = getLocalDateString();
    return extractDatePart(dateString) >= today;
  };

  const getAppointmentStatus = (dateString: string) => {
    if (isPastAppointment(dateString)) return 'past';
    if (isTodayAppointment(dateString)) return 'today';
    return 'upcoming';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return theme.colors.success;
      case 'completed':
        return theme.colors.primary;
      case 'cancelled':
        return theme.colors.error;
      default:
        return theme.colors.textSecondary;
    }
  };

  // دالة للحصول على لون حالة الحضور
  const getAttendanceColor = (attendance?: string) => {
    switch (attendance) {
      case 'present':
        return theme.colors.success;
      case 'absent':
        return theme.colors.error;
      case 'not_marked':
      default:
        return theme.colors.textSecondary;
    }
  };

  // دالة للحصول على نص حالة الحضور
  const getAttendanceText = (attendance?: string) => {
    switch (attendance) {
      case 'present':
        return t('appointments.present');
      case 'absent':
        return t('appointments.absent');
      case 'not_marked':
      default:
        return t('appointments.not_marked');
    }
  };


  // دالة لتحديد الحضور
  const markAttendance = useCallback(async (appointmentId: string, attendance: 'present' | 'absent') => {
    if (!profile?._id) {
      Alert.alert('خطأ', 'يجب تسجيل الدخول أولاً');
      return;
    }

    try {
      logUserAction('محاولة تحديث حالة الحضور', { appointmentId, attendance, attendanceTime: undefined });
      
      // تحديث الواجهة فوراً
      setAppointments(prev => {
        const updated = prev.map(apt => 
          apt._id === appointmentId
            ? { 
                ...apt, 
                attendance, 
                attendance_time: new Date().toISOString() 
              }
            : apt
        );
        logDebug('تحديث الواجهة فوراً', { 
          appointmentId, 
          attendance, 
          before: prev.length, 
          after: updated.length 
        });
        return updated;
      });

      // حفظ البيانات الحالية
      appointmentsRef.current = [...appointments];

      // تحديث الحضور عبر API
      const result = await appointmentsAPI.markAttendance(appointmentId, attendance);
      
      if (result && result.success) {
        logInfo('تم تحديث حالة الحضور بنجاح');
        
        // تأكيد التحديث في الواجهة
        setAppointments(prev => 
          prev.map(apt => 
            apt._id === appointmentId
              ? { 
                  ...apt, 
                  attendance, 
                  attendance_time: new Date().toISOString() 
                }
              : apt
          )
        );

        // إعادة جلب المواعيد بعد تأخير قصير
        logDebug('جدولة إعادة جلب المواعيد بعد 500ms');
        setTimeout(async () => {
          try {
            logDebug('إعادة جلب المواعيد للتأكد من التحديث');
            logDebug('البيانات المحفوظة قبل إعادة الجلب', { count: appointmentsRef.current.length });
            logDebug('البيانات الحالية قبل إعادة الجلب', { count: appointments.length });
            await fetchAppointments();
            logInfo('تم إعادة جلب المواعيد بنجاح');
            logDebug('البيانات بعد إعادة الجلب', { count: appointments.length });
          } catch (error) {
            logWarn('فشل في إعادة جلب المواعيد', error);
            // استعادة البيانات المحفوظة في حالة الفشل
            logDebug('استعادة البيانات المحفوظة');
            setAppointments(appointmentsRef.current);
          }
        }, 500);
        
        Alert.alert(
          'نجح', 
          `تم تحديث حالة الحضور إلى: ${attendance === 'present' ? 'حاضر' : 'غائب'}`,
          [{ text: 'حسناً', style: 'default' }]
        );
      } else {
        logError('فشل في تحديث حالة الحضور', { error: result?.error || 'خطأ غير معروف' });
        Alert.alert('خطأ', 'فشل في تحديث حالة الحضور');
        
        // استعادة البيانات الأصلية
        setAppointments(appointmentsRef.current);
      }
    } catch (error) {
      logError('خطأ في تحديث حالة الحضور', error);
      Alert.alert('خطأ', 'حدث خطأ أثناء تحديث حالة الحضور');
      
      // استعادة البيانات الأصلية
      setAppointments(appointmentsRef.current);
    }
  }, [profile?._id, appointments]);

  const getStatusText = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'مؤكد';
      case 'completed':
        return 'مكتمل';
      case 'cancelled':
        return 'ملغي';
      default:
        return ''; // إزالة عرض حالة pending
    }
  };

  // دالة جديدة لتنسيق التاريخ مع يوم الأسبوع
  const formatDateWithDay = (dateString: string) => {
    try {
      const dayName = getLocalizedDayName(dateString, t);
      const date = new Date(dateString);
      
      // استخدام الترجمة للأشهر
      const monthNames = [
        'january', 'february', 'march', 'april', 'may', 'june',
        'july', 'august', 'september', 'october', 'november', 'december'
      ];
      const monthName = t(`month_names.${monthNames[date.getMonth()]}`);
      const day = date.getDate();
      const year = date.getFullYear();
      
      return `${dayName} - ${day} ${monthName} ${year}`;
    } catch (error) {
      logError('خطأ في تنسيق التاريخ', error);
      return dateString;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'checkmark-circle';
      case 'completed':
        return 'checkmark-done-circle';
      case 'cancelled':
        return 'close-circle';
      default:
        return 'help-circle';
    }
  };

  const handleAppointmentAction = (appointmentId: string, action: 'complete' | 'cancel') => {
    Alert.alert(
      action === 'complete' ? 'إكمال الموعد' : 'إلغاء الموعد',
      `هل أنت متأكد من ${action === 'complete' ? 'إكمال' : 'إلغاء'} هذا الموعد؟`,
      [
        {
          text: 'إلغاء',
          style: 'cancel',
        },
        {
          text: 'تأكيد',
          onPress: () => updateAppointmentStatus(appointmentId, action),
        },
      ]
    );
  };

  const updateAppointmentStatus = async (appointmentId: string, action: string) => {
    try {
      const status = action === 'complete' ? 'completed' : 'cancelled';
      
      logUserAction('تحديث حالة الموعد', { appointmentId, status });
      
      let resp: any = null;
      if (status === 'cancelled') {
        // توحيد الإلغاء بالحذف الكامل كما في الويب
        resp = await appointmentsAPI.cancelAppointment(appointmentId);
      } else {
        // إكمال الموعد يبقى تحديث حالة
        resp = await appointmentsAPI.updateAppointmentStatus(appointmentId, status);
      }
      
      if (!resp) {
        throw new Error('No response from server');
      }
      
      // التحقق من نجاح العملية
      if (!resp.success) {
        throw new Error(resp.message || 'Failed to update appointment status');
      }
      
        logInfo('تم تحديث حالة الموعد بنجاح', { response: resp });
      
      // تحديث القائمة المحلية فوراً بإزالة الموعد الملغي
      if (status === 'cancelled') {
        setAppointments(prev => prev.filter(apt => apt._id !== appointmentId));
      }
      
      // عند إلغاء الطبيب، نرسل إشعاراً للمستخدم
      if (status === 'cancelled') {
        try {
          logInfo('إرسال إشعار إلغاء الموعد للمستخدم');
          
          // البحث عن معرف المستخدم من المواعيد المحلية
          const appointment = appointments.find(apt => apt._id === appointmentId);
          // تشخيص أفضل لمعرف المستخدم
          logDebug('تشخيص معرف المستخدم', {
            appointmentId,
            userId: appointment?.userId,
            userIdType: typeof appointment?.userId,
            userIdId: appointment?.userId?._id,
            patientId: appointment?.patient_id,
            hasUserId: !!appointment?.userId,
            hasUserIdId: !!appointment?.userId?._id
          });
          
          const userId = appointment?.userId?._id || appointment?.patient_id || (typeof appointment?.userId === 'string' ? appointment.userId : '');
          
          if (userId) {
            logInfo('تم العثور على معرف المستخدم', { userId });
            
            
            // استخدام NotificationContext لإرسال الإشعار
            const doctorName = profile?.first_name || profile?.name || 'طبيب';
            logDebug('بيانات الدكتور المرسلة', {
              profile: profile ? {
                _id: profile._id,
                first_name: profile.first_name,
                name: profile.name,
                full_name: profile.full_name
              } : 'null',
              doctorName: doctorName
            });
            
            // إرسال إشعار فوري مباشرة
            try {
              const NotificationService = require('../services/NotificationService').default;
              
              // إرسال إشعار محلي فوري مع صوت واهتزاز قوي
              await NotificationService.sendAppointmentCancellationLocalNotification(
                'تم إلغاء الموعد',
                `تم إلغاء موعدك مع ${doctorName} في ${appointment?.date} الساعة ${appointment?.time}`,
                {
                  type: 'appointment_cancelled',
                  appointmentId,
                  doctorName,
                  date: appointment?.date,
                  time: appointment?.time,
                  isLocalNotification: true, // علامة للإشعار المحلي
                  urgent: true, // إشعار عاجل
                }
              );
              
              // إرسال إشعار مباشر إضافي للتأكد من الظهور
              const Notifications = require('expo-notifications').default;
              await Notifications.scheduleNotificationAsync({
                content: {
                  title: 'تم إلغاء الموعد',
                  body: `تم إلغاء موعدك مع ${doctorName} في ${appointment?.date} الساعة ${appointment?.time}`,
                  sound: 'default',
                  priority: Notifications.AndroidNotificationPriority.MAX,
                  vibrate: [0, 1000, 500, 1000, 500, 1000],
                  data: {
                    type: 'appointment_cancelled',
                    appointmentId,
                    doctorName,
                    date: appointment?.date,
                    time: appointment?.time,
                    urgent: true,
                  },
                  ...(Platform.OS === 'android' && {
                    channelId: 'appointment_cancellation',
                    color: '#FF0000',
                    smallIcon: 'ic_notification',
                    largeIcon: 'ic_launcher',
                    categoryId: 'appointment_cancellation',
                    autoCancel: false,
                    ongoing: false,
                    visibility: Notifications.AndroidNotificationVisibility.PUBLIC,
                    showTimestamp: true,
                    when: Date.now(),
                  }),
                },
                trigger: null,
              });
              
              logInfo('تم إرسال إشعار إلغاء الموعد الفوري');
            } catch (localNotificationError) {
              logError('فشل في إرسال الإشعار الفوري', localNotificationError);
            }
            
            // إرسال إشعار عادي
            await sendAppointmentCancellationNotification(
              userId,
              appointment?.userName || 'مريض',
              doctorName,
              new Date(appointment?.date || new Date().toISOString()),
              appointment?.time || '',
              appointmentId,
              appointment?.isBookingForOther || false,
              appointment?.bookerName
            );
            
            logInfo('تم إرسال إشعار إلغاء الموعد بنجاح');
            
            // فحص فوري للإشعارات الجديدة بعد إلغاء الموعد
            try {
              logDebug('فحص فوري للإشعارات بعد إلغاء الموعد');
              const { syncNotificationsWithServer } = require('../contexts/NotificationContext');
              await syncNotificationsWithServer(userId, false);
              logInfo('تم فحص الإشعارات فوراً');
            } catch (syncError) {
              logError('فشل في الفحص الفوري للإشعارات', syncError);
            }
          } else {
            logWarn('لم يتم العثور على معرف المستخدم');
            logDebug('البيانات المتاحة', {
              appointment: appointment ? {
                _id: appointment._id,
                userId: appointment.userId,
                patient_id: appointment.patient_id,
                userName: appointment.userName
              } : 'null'
            });
          }
        } catch (notifyErr) {
          logError('فشل إرسال إشعار إلغاء الموعد للمستخدم', notifyErr);
          // لا نوقف العملية إذا فشل الإشعار
        }
      }
      
      await reloadFromStorage();
      
      Alert.alert('نجح', `تم ${action === 'complete' ? 'إكمال' : 'إلغاء'} الموعد بنجاح`);
      
    } catch (error) {
      logError('خطأ في تحديث حالة الموعد', error);
      Alert.alert('خطأ', `فشل في ${action === 'complete' ? 'إكمال' : 'إلغاء'} الموعد. يرجى المحاولة مرة أخرى.`);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>{t('common.loading')}</Text>
      </View>
    );
  }

  if (!profile?._id) {
    return (
      <View style={styles.loadingContainer}>
        <Ionicons name="person-outline" size={64} color={theme.colors.textSecondary} />
        <Text style={styles.emptyText}>{t('appointments.please_login_as_doctor')}</Text>
        <Text style={[styles.emptyText, { fontSize: 14, marginTop: 8 }]}>
          {t('appointments.cannot_display_without_login')}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t('appointments.doctor_appointments')}</Text>
        <Text style={styles.headerSubtitle}>{t('appointments.manage_appointments')} - {getTodayLocalizedDayName(t)}</Text>
        {profile?._id && (
          <Text style={[styles.headerSubtitle, { fontSize: 12, marginTop: 4 }]}>
            {t('appointments.doctor_id')}: {profile._id.substring(0, 8)}...
          </Text>
        )}
      </View>

      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Search and Filter Controls */}
        <View style={styles.controlsContainer}>
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color={theme.colors.textSecondary} />
            <TextInput
              style={styles.searchInput}
              placeholder={t('appointments.search_placeholder')}
              value={searchTerm}
              onChangeText={setSearchTerm}
            />
          </View>

          {/* Filter Status Display */}
          <View style={styles.filterStatusDisplay}>
            <Text style={styles.filterStatusText}>
              {t('appointments.filter')}: {filterStatus === 'all' ? t('appointments.all') : filterStatus === 'present' ? t('appointments.present') : filterStatus === 'absent' ? t('appointments.absent') : t('validation.not_specified')}
            </Text>
          </View>

          <View style={styles.filterContainer}>
            <TouchableOpacity
              style={[
                styles.filterButton,
                filterStatus === 'all' && styles.filterButtonActive
              ]}
              onPress={() => setFilterStatus('all')}
            >
              <Text style={[
                styles.filterButtonText,
                filterStatus === 'all' && styles.filterButtonTextActive
              ]}>{t('appointments.all')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.filterButton,
                filterStatus === 'present' && styles.filterButtonActive
              ]}
              onPress={() => setFilterStatus('present')}
            >
              <Text style={[
                styles.filterButtonText,
                filterStatus === 'present' && styles.filterButtonTextActive
              ]}>{t('appointments.present')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.filterButton,
                filterStatus === 'absent' && styles.filterButtonActive
              ]}
              onPress={() => setFilterStatus('absent')}
            >
              <Text style={[
                styles.filterButtonText,
                filterStatus === 'absent' && styles.filterButtonTextActive
              ]}>{t('appointments.absent')}</Text>
            </TouchableOpacity>
          </View>

          {/* زر إظهار المواعيد السابقة */}
          <TouchableOpacity
            style={[
              styles.toggleButton,
              showPastAppointments && styles.toggleButtonActive
            ]}
            onPress={() => setShowPastAppointments(!showPastAppointments)}
          >
            <Ionicons 
              name={showPastAppointments ? "eye-off" : "eye"} 
              size={16} 
              color={showPastAppointments ? theme.colors.white : theme.colors.primary} 
            />
            <Text style={[
              styles.toggleButtonText,
              showPastAppointments && styles.toggleButtonTextActive
            ]}>
              {showPastAppointments ? t('appointments.hide_past') : t('appointments.show_past')}
            </Text>
          </TouchableOpacity>

          <View style={styles.sortContainer}>
            <TouchableOpacity
              style={styles.sortButton}
              onPress={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            >
              <Ionicons 
                name={sortOrder === 'asc' ? 'arrow-up' : 'arrow-down'} 
                size={20} 
                color={theme.colors.primary} 
              />
              <Text style={styles.sortButtonText}>
                {sortBy === 'date' ? t('appointments.date') : sortBy === 'time' ? t('appointments.time') : t('appointments.name')}
              </Text>
            </TouchableOpacity>
          </View>


        </View>

        {/* Appointments List */}
        <View style={styles.appointmentsInfo}>
          <Text style={styles.appointmentsCount}>
            {t('appointments.appointments_count')}: {appointments.length} | {t('appointments.displayed')}: {getDisplayedAppointments().length}
          </Text>
        </View>
        
        {getDisplayedAppointments().length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="calendar-outline" size={64} color={theme.colors.textSecondary} />
            <Text style={styles.emptyText}>
              {appointments.length === 0 
                ? t('appointments.no_appointments')
                : t('appointments.no_matching_appointments')
              }
            </Text>
            {appointments.length > 0 && (
              <Text style={[styles.emptyText, { fontSize: 14, marginTop: 8, textAlign: 'center' }]}>
                {t('appointments.try_changing_filters')}
              </Text>
            )}
          </View>
        ) : (
          getDisplayedAppointments().map((appointment) => (
            <View key={appointment._id} style={styles.appointmentCard}>
              {/* شارة "الحجز لشخص آخر" */}
              {appointment.isBookingForOther && (
                <View style={styles.bookingForOtherBadge}>
                  <Ionicons name="people" size={16} color={theme.colors.success} />
                  <Text style={styles.bookingForOtherText}>
                    {t('booking_for_other.info.booking_for_other')}
                  </Text>
                </View>
              )}

              <View style={styles.appointmentHeader}>
                {/* عرض اسم المريض: عند الحجز لشخص آخر، اعرض patientName (اسم المريض الفعلي) */}
                {/* عند الحجز للنفس، اعرض userName (اسم المستخدم) */}
                <Text style={styles.patientName}>
                  {appointment.isBookingForOther
                    ? (appointment.patientName || appointment.userName || t('validation.unidentified_patient'))
                    : (appointment.userName || appointment.userId?.first_name || t('validation.unidentified_patient'))
                  }
                </Text>
                {/* تم إلغاء شارة الحالة - كل المواعيد تعتبر فعّالة ما لم تُلغَ */}
              </View>

              <View style={styles.appointmentDetails}>
                <View style={styles.detailRow}>
                  <Ionicons name="calendar" size={16} color={theme.colors.primary} />
                  <Text style={styles.detailText}>{formatDateWithDay(appointment.date)}</Text>
                </View>

                <View style={styles.detailRow}>
                  <Ionicons name="time" size={16} color={theme.colors.primary} />
                  <Text style={styles.detailText}>{appointment.time}</Text>
                </View>

                {appointment.reason && (
                  <View style={styles.detailRow}>
                    <Ionicons name="document-text" size={16} color={theme.colors.primary} />
                    <Text style={styles.detailText}>{appointment.reason}</Text>
                  </View>
                )}

                {/* عرض رقم الهاتف - إما المريض الآخر أو المستخدم نفسه */}
                {(appointment.isBookingForOther ? appointment.patientPhone : (appointment.userId?.phone || appointment.patientPhone)) && (
                  <View style={styles.detailRow}>
                    <Ionicons name="call" size={16} color={theme.colors.primary} />
                    <Text style={styles.detailText}>
                      {appointment.isBookingForOther ? appointment.patientPhone : (appointment.userId?.phone || appointment.patientPhone)}
                    </Text>
                  </View>
                )}

                {/* عرض العمر - محدث ليتعامل مع البيانات الجديدة */}
                <View style={styles.detailRow}>
                  <Ionicons name="person" size={16} color={theme.colors.primary} />
                  <Text style={styles.detailText}>
                    {t('validation.patient_age')}: {(appointment.patientAge || appointment.age) ? `${appointment.patientAge || appointment.age} ${t('validation.years')}` : t('validation.not_available')}
                  </Text>
                </View>

                {/* عرض اسم الحاجز إذا كان الحجز لشخص آخر */}
                {appointment.isBookingForOther && appointment.bookerName && (
                  <View style={styles.detailRow}>
                    <Ionicons name="person-add" size={16} color={theme.colors.success} />
                    <Text style={styles.detailText}>
                      {t('booking_for_other.booker_name')}: {appointment.bookerName}
                    </Text>
                  </View>
                )}


              </View>

              {/* Action Buttons: أزرار الإلغاء والإكمال - للمواعيد القادمة فقط */}
              {appointment.status !== 'cancelled' && isUpcomingAppointment(appointment.date) && (
                <View style={styles.actionButtons}>
                  {/* عرض حالة الحضور */}
                  <View style={styles.attendanceStatus}>
                    <Text style={styles.attendanceLabel}>{t('appointments.attendance')}:</Text>
                    <View style={[
                      styles.attendanceBadge,
                      { backgroundColor: getAttendanceColor(appointment.attendance) }
                    ]}>
                      <Text style={styles.attendanceBadgeText}>
                        {getAttendanceText(appointment.attendance)}
                      </Text>
                    </View>
                  </View>

                  {/* أزرار الإجراءات */}
                  <View style={styles.actionButtonsRow}>
                    <TouchableOpacity
                      style={[styles.actionButton, styles.completeButton]}
                      onPress={() => handleAppointmentAction(appointment._id, 'complete')}
                    >
                      <Ionicons name="checkmark-circle" size={16} color={theme.colors.white} />
                      <Text style={styles.actionButtonText}>{t('appointments.complete')}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.actionButton, styles.cancelButton]}
                      onPress={() => handleAppointmentAction(appointment._id, 'cancel')}
                    >
                      <Ionicons name="close-circle" size={16} color={theme.colors.white} />
                      <Text style={styles.actionButtonText}>{t('appointments.cancel')}</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {/* عرض حالة الحضور فقط للمواعيد السابقة */}
              {appointment.status !== 'cancelled' && !isUpcomingAppointment(appointment.date) && (
                <View style={styles.attendanceStatus}>
                  <Text style={styles.attendanceLabel}>{t('appointments.attendance')}:</Text>
                  <View style={[
                    styles.attendanceBadge,
                    { backgroundColor: getAttendanceColor(appointment.attendance) }
                  ]}>
                    <Text style={styles.attendanceBadgeText}>
                      {getAttendanceText(appointment.attendance)}
                    </Text>
                  </View>
                </View>
              )}
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
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
  header: {
    backgroundColor: theme.colors.primary,
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.white,
  },
  headerSubtitle: {
    fontSize: 14,
    color: theme.colors.white,
    marginTop: 4,
  },
  content: {
    padding: 20,
  },
  controlsContainer: {
    marginBottom: 20,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.white,
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    fontSize: 16,
    color: theme.colors.textPrimary,
  },
  filterContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  filterButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.white,
  },
  filterButtonActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  filterButtonText: {
    textAlign: 'center',
    fontSize: 14,
    color: theme.colors.textPrimary,
  },
  filterButtonTextActive: {
    color: theme.colors.white,
    fontWeight: 'bold',
  },
  sortContainer: {
    marginBottom: 12,
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.white,
  },
  sortButtonText: {
    marginLeft: 8,
    fontSize: 14,
    color: theme.colors.textPrimary,
  },
  toggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.white,
    marginBottom: 12,
    alignSelf: 'flex-start',
  },
  toggleButtonActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  toggleButtonText: {
    marginLeft: 6,
    fontSize: 14,
    color: theme.colors.primary,
    fontWeight: '500',
  },
  toggleButtonTextActive: {
    color: theme.colors.white,
    fontWeight: 'bold',
  },
  filterStatusDisplay: {
    backgroundColor: theme.colors.info,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    marginBottom: 12,
  },
  filterStatusText: {
    fontSize: 14,
    color: theme.colors.white,
    textAlign: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    marginTop: 16,
    textAlign: 'center',
  },
  appointmentCard: {
    backgroundColor: theme.colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: theme.colors.shadow,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  appointmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  patientName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: theme.colors.white,
  },
  appointmentDetails: {
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginLeft: 8,
    flex: 1,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 4,
  },
  acceptButton: {
    backgroundColor: theme.colors.success,
  },
  rejectButton: {
    backgroundColor: theme.colors.error,
  },
  cancelButton: {
    backgroundColor: theme.colors.error,
  },
  completeButton: {
    backgroundColor: theme.colors.primary,
  },
  actionButtonText: {
    color: theme.colors.white,
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 8,
  },
  attendanceStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  attendanceLabel: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginRight: 8,
  },
  attendanceBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  attendanceBadgeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: theme.colors.white,
  },
  attendanceButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 8,
  },
  attendanceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginHorizontal: 4,
  },
  presentButton: {
    backgroundColor: theme.colors.success,
  },
  absentButton: {
    backgroundColor: theme.colors.error,
  },
  attendanceButtonText: {
    color: theme.colors.white,
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  attendanceButtonActive: {
    opacity: 0.7, // To indicate it's already marked
  },
  appointmentsInfo: {
    marginBottom: 12,
    alignItems: 'center',
  },
  appointmentsCount: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  
  // أنماط شارة "الحجز لشخص آخر"
  bookingForOtherBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.success + '20',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginBottom: 12,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: theme.colors.success,
  },
  bookingForOtherText: {
    fontSize: 12,
    color: theme.colors.success,
    fontWeight: '600',
    marginLeft: 4,
  },
});

export default DoctorAppointmentsScreen; 
