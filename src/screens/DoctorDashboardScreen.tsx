import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Image,
  Dimensions,
  StatusBar,
  RefreshControl,
  Alert,
  TextInput,
  ScrollView,
  Platform,
} from 'react-native';
import * as Notifications from 'expo-notifications';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../utils/theme';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../contexts/NotificationContext';
import { api, appointmentsAPI } from '../services/api';
import StarRating from '../components/StarRating';
import { getLocalDateString, getTodayLocalizedDayName, getLocalizedDayName } from '../utils/dateUtils';
import AdvertisementSlider from '../components/AdvertisementSlider';
import { logger, logError, logWarn, logInfo, logDebug, logUserAction, logApiCall, logApiResponse } from '../utils/logger';
import { API_CONFIG } from '../config/api';

const { width, height } = Dimensions.get('window');

const DoctorDashboardScreen = () => {
  const navigation = useNavigation();
  const { t } = useTranslation();
  const { user, profile } = useAuth();
  const { notifications, isNotificationEnabled, registerForDoctorNotifications } = useNotifications();
  
  // تم حذف الإشعارات الفورية
  const testImmediateNotification = async () => {
    logInfo('تم تعطيل الإشعارات الفورية');
    Alert.alert('معلومات', 'تم تعطيل الإشعارات الفورية');
  };
  
  // إضافة متغير البحث
  const [searchTerm, setSearchTerm] = useState('');

  // دالة مساعدة لمسار صورة الطبيب
  const getImageUrl = (img: string | null | undefined) => {
    if (!img) {
      return null;
    }
    
    // إذا كانت الصورة من Cloudinary (تبدأ بـ https://res.cloudinary.com)
    if (img.startsWith('https://res.cloudinary.com')) {
      return img;
    }
    
    // إذا كانت الصورة محلية (تبدأ بـ /uploads/)
    if (img.startsWith('/uploads/')) {
      const fullUrl = API_CONFIG.BASE_URL + img;
      return fullUrl;
    }
    
    // إذا كانت الصورة رابط كامل
    if (img.startsWith('http')) {
      return img;
    }
    
    // إذا كانت الصورة مسار نسبي (بدون /uploads/)
    if (img && !img.startsWith('http') && !img.startsWith('/uploads/')) {
      const fullUrl = API_CONFIG.BASE_URL + '/' + img;
      return fullUrl;
    }
    
    return null;
  };

  // دالة للحصول على صورة الطبيب من جميع المصادر المحتملة
  const getDoctorImage = () => {
    // أولاً: جرب بيانات الطبيب من API
    if (doctorData) {
      const apiImage = doctorData.imageUrl || doctorData.profile_image || doctorData.profileImage || doctorData.image;
      if (apiImage) {
        const imageUrl = getImageUrl(apiImage);
        if (imageUrl) {
          return imageUrl;
        }
      }
    }
    
    // ثانياً: جرب بيانات المستخدم الحالي
    const userImage = user?.image || profile?.image;
    if (userImage) {
      const imageUrl = getImageUrl(userImage);
      if (imageUrl) {
        return imageUrl;
      }
    }
    
    return null;
  };

  // دالة تحويل الصورة المحلية المفقودة إلى Cloudinary
  const migrateMissingImage = async (imagePath: string) => {
    if (!imagePath || !imagePath.startsWith('/uploads/')) {
      return null;
    }

    
    try {
      // محاولة استخدام endpoint الجديد
      const response = await fetch(`${API_CONFIG.BASE_URL}/migrate-single-image`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imagePath,
          userId: (profile as any)?._id || (user as any)?._id,
          userType: 'doctor'
        })
      });

      if (response.ok) {
        const data = await response.json();
        logInfo('تم تحويل الصورة المفقودة بنجاح', { cloudinaryUrl: data.cloudinaryUrl });
        return data.cloudinaryUrl;
      } else if (response.status === 404) {
        logWarn('endpoint migrate-single-image غير متوفر');
        return null;
      } else {
        logError('فشل تحويل الصورة المفقودة');
        return null;
      }
    } catch (error) {
      logError('خطأ في تحويل الصورة المفقودة', error);
      return null;
    }
  };
  
  // دالة للحصول على التاريخ المحلي بصيغة YYYY-MM-DD
  const getLocalDateString = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // دالة لتنسيق التاريخ مع اسم اليوم
  const formatDateWithDay = (dateString: string) => {
    const dayName = getLocalizedDayName(dateString, t);
    const date = new Date(dateString);
    const day = date.getDate();
    const month = date.getMonth() + 1;
    const year = date.getFullYear();
    
    return `${dayName} ${day}/${month}/${year}`;
  };

  // دالة لتنسيق الوقت
  const formatTime = (timeString: string) => {
    const [hours, minutes] = timeString.split(':');
    return `${hours}:${minutes}`;
  };
  
  const [appointments, setAppointments] = useState<any[]>([]);
  const [allAppointments, setAllAppointments] = useState<any[]>([]); // جميع المواعيد
  const [stats, setStats] = useState({
    today: 0,
    week: 0,
    month: 0,
    total: 0,
  });
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [doctorData, setDoctorData] = useState<any>(null);
  const appointmentsRef = useRef(appointments);

  useEffect(() => {
    const doctorId = profile?._id || (user as any)?._id;
    if (doctorId) {
      fetchDashboardData();
      // تسجيل إشعارات الطبيب إذا لم تكن مفعلة
      if (!isNotificationEnabled) {
        registerForDoctorNotifications(doctorId);
      }
    }
  }, [profile, user]);

  // فحص الصور المحلية المفقودة
  useEffect(() => {
    const checkMissingImages = async () => {
      const imagePath = user?.image || profile?.image;
      
      if (imagePath && imagePath.startsWith('/uploads/')) {
        logDebug('فحص الصورة المحلية', { imagePath });
        // فحص إذا كانت الصورة موجودة
        try {
          const response = await fetch(API_CONFIG.BASE_URL + imagePath);
          if (!response.ok) {
            logWarn('الصورة المحلية مفقودة، محاولة التحويل');
            const cloudinaryUrl = await migrateMissingImage(imagePath);
            if (cloudinaryUrl) {
              logInfo('تم تحويل الصورة المفقودة تلقائياً');
              // يمكن إضافة رسالة للمستخدم هنا
            }
          } else {
            logInfo('الصورة المحلية موجودة');
          }
        } catch (error) {
          logError('خطأ في فحص الصورة المحلية', error);
        }
      }
    };

    checkMissingImages();
  }, [user, profile]);

  // جلب بيانات الطبيب من API
  useEffect(() => {
    const fetchDoctorData = async () => {
      const doctorId = profile?._id || (user as any)?._id;
      if (!doctorId) {
        logWarn('لا يوجد معرف للطبيب', { profileId: profile?._id, userId: (user as any)?._id });
        return;
      }
      
      try {
        logApiCall('/doctors', 'GET', { doctorId });
        const response = await fetch(`${API_CONFIG.BASE_URL}/doctors/${doctorId}`);
        
        if (response.ok) {
          const data = await response.json();
          logApiResponse('/doctors', response.status);
          setDoctorData(data);
        } else {
          logWarn('لم يتم العثور على بيانات الطبيب في API');
        }
      } catch (error) {
        logError('خطأ في جلب بيانات الطبيب من API', error);
      }
    };

    fetchDoctorData();
  }, [profile?._id, (user as any)?._id]);

  // تحديث البيانات كل 30 ثانية
  useEffect(() => {
    const interval = setInterval(() => {
      const doctorId = profile?._id || (user as any)?._id;
      if (doctorId) {
        fetchDashboardData();
      }
    }, 30000); // 30 ثانية

    return () => clearInterval(interval);
  }, [profile, user]);

  // إعادة تحميل البيانات عند العودة للصفحة
  useFocusEffect(
    useCallback(() => {
      const doctorId = profile?._id || (user as any)?._id;
      if (doctorId) {
        logDebug('الصفحة أصبحت مركزة - إعادة تحميل البيانات');
        fetchDashboardData();
      }
    }, [profile, user])
  );

  // تحديث appointmentsRef عند تغيير appointments
  useEffect(() => {
    appointmentsRef.current = [...appointments];
  }, [appointments]);

  const fetchDashboardData = async () => {
    const doctorId = profile?._id || (user as any)?._id;
    if (!doctorId) {
      logWarn('لا يوجد معرف للطبيب في fetchDashboardData', { profileId: profile?._id, userId: (user as any)?._id });
      return;
    }
    
    setLoading(true);
    try {
      logApiCall('/appointments/doctor', 'GET', { doctorId });
      // استخدام API المحسن لجلب المواعيد
      const response = await appointmentsAPI.getDoctorAppointmentsById(doctorId);
      
      logApiResponse('/appointments/doctor', 200);
      
      if (response && Array.isArray(response)) {
        // عرض كل المواعيد ما عدا الملغاة
        const activeAppointments = response.filter(appointment => 
          appointment.status !== 'cancelled'
        );
        
        // تحويل البيانات إلى التنسيق المطلوب - عرض كروت الأطباء مع معلومات المرضى
        const formattedAppointments = activeAppointments.map(appointment => {
          // تنسيق التاريخ بشكل صحيح
          let formattedDate = appointment.date;
          if (formattedDate && formattedDate.includes('T')) {
            formattedDate = formattedDate.split('T')[0];
          }
          

          
          return {
            id: appointment._id,
            // معلومات الطبيب (الطبيب الحالي)
            doctorName: profile?.first_name || profile?.name || user?.name || t('common.doctor'),
            doctorSpecialty: profile?.specialty || t('common.general_specialty'),
            doctorImage: getDoctorImage() || 'https://via.placeholder.com/50',
            // معلومات المريض - محدث ليتعامل مع الحجز لشخص آخر
            patientName: appointment.patientName || appointment.userName || appointment.userId?.first_name || t('calendar.patient_unknown'),
            userName: appointment.userName || appointment.userId?.first_name || t('calendar.patient_unknown'),
            patientPhone: appointment.isBookingForOther 
              ? (appointment.patientPhone || '')
              : (appointment.userId?.phone || appointment.patientPhone || ''),
            patientId: appointment.userId?._id || appointment.userId,
            // معلومات الحجز لشخص آخر
            isBookingForOther: appointment.isBookingForOther || false,
            bookerName: appointment.bookerName,
            // معلومات الموعد
            date: formattedDate,
            time: appointment.time,
            status: appointment.status,
            type: appointment.reason || t('calendar.consultation'),
            formattedDateWithDay: formatDateWithDay(formattedDate),
            duration: appointment.duration || 30, // إضافة عرض مدة الموعد
            attendance: appointment.attendance || 'not_marked', // إضافة حالة الحضور
            notes: appointment.notes || '', // إضافة أي ملاحظات
            phone: appointment.patientPhone || appointment.userId?.phone || '', // إضافة رقم المريض
            // إضافة العمر - محدث ليتطابق مع قاعدة البيانات
            age: appointment.patientAge || appointment.age, // استخدام patientAge من قاعدة البيانات أو age كاحتياطي
            patientAge: appointment.patientAge, // الحقل الأصلي من قاعدة البيانات
          };
        });
        

        
        setAllAppointments(formattedAppointments); // حفظ جميع المواعيد النشطة (غير الملغاة)
        setAppointments(formattedAppointments); // عرض جميع المواعيد
        
        // حساب الإحصائيات - استخدام التوقيت المحلي
        const today = getLocalDateString(); // التاريخ المحلي الصحيح
        const utcToday = new Date().toISOString().split('T')[0]; // UTC date

        
        const todayAppointments = activeAppointments.filter(apt => {
          // معالجة تنسيقات التواريخ المختلفة
          if (!apt.date) return false;
          
          // إذا كان التاريخ في تنسيق ISO string
          if (apt.date.includes('T')) {
            const aptDate = apt.date.split('T')[0];
            return aptDate === today;
          }
          
          // إذا كان التاريخ في تنسيق YYYY-MM-DD
          if (apt.date.match(/^\d{4}-\d{2}-\d{2}$/)) {
            return apt.date === today;
          }
          
          // إذا كان التاريخ في تنسيق آخر، نحاول تحويله
          try {
            const aptDate = new Date(apt.date);
            const aptDateString = aptDate.toISOString().split('T')[0];
            return aptDateString === today;
          } catch (error) {
            logError('خطأ في تحليل التاريخ', { date: apt.date, error });
            return false;
          }
        }).length;
        
        const weekAppointments = activeAppointments.filter(apt => {
          const aptDate = new Date(apt.date);
          const weekAgo = new Date();
          weekAgo.setDate(weekAgo.getDate() - 7);
          return aptDate >= weekAgo;
        }).length;
        const monthAppointments = activeAppointments.filter(apt => {
          const aptDate = new Date(apt.date);
          const monthAgo = new Date();
          monthAgo.setMonth(monthAgo.getMonth() - 1);
          return aptDate >= monthAgo;
        }).length;
        
        setStats({
          today: todayAppointments,
          week: weekAppointments,
          month: monthAppointments,
          total: activeAppointments.length,
        });
        

        
        // تفاصيل إضافية للتشخيص
        const todayAppointmentsList = activeAppointments.filter(apt => {
          // معالجة تنسيقات التواريخ المختلفة
          if (!apt.date) return false;
          
          // إذا كان التاريخ في تنسيق ISO string
          if (apt.date.includes('T')) {
            const aptDate = apt.date.split('T')[0];
            return aptDate === today;
          }
          
          // إذا كان التاريخ في تنسيق YYYY-MM-DD
          if (apt.date.match(/^\d{4}-\d{2}-\d{2}$/)) {
            return apt.date === today;
          }
          
          // إذا كان التاريخ في تنسيق آخر، نحاول تحويله
          try {
            const aptDate = new Date(apt.date);
            const aptDateString = aptDate.toISOString().split('T')[0];
            return aptDateString === today;
          } catch (error) {
            logError('خطأ في تحليل التاريخ', { date: apt.date, error });
            return false;
          }
        });

        

      } else {

        setAppointments([]);
        setAllAppointments([]);
        setStats({
          today: 0,
          week: 0,
          month: 0,
          total: 0,
        });
      }
    } catch (error) {
      logError('خطأ في جلب بيانات لوحة التحكم', error);
      setAppointments([]);
      setAllAppointments([]);
      setStats({
        today: 0,
        week: 0,
        month: 0,
        total: 0,
      });
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchDashboardData();
    setRefreshing(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return theme.colors.success;
      case 'pending':
        return theme.colors.warning;
      case 'cancelled':
        return theme.colors.error;
      default:
        return theme.colors.textSecondary;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'confirmed':
        return t('appointment.confirmed');
      case 'pending':
        return t('appointment.pending');
      case 'cancelled':
        return t('appointment.cancelled');
      default:
        return status;
    }
  };

  const getTypeText = (type: string) => {
    switch (type) {
      case 'consultation':
        return t('appointment.consultation');
      case 'follow_up':
        return t('appointment.follow_up');
      case 'emergency':
        return t('appointment.emergency');
      default:
        return type;
    }
  };

  const handleCancelFromDashboard = async (appointmentId: string) => {
    try {
      // توحيد الإلغاء بالحذف الكامل كما في الويب
      await appointmentsAPI.cancelAppointment(appointmentId);
      await fetchDashboardData();
    } catch (e) {
      logError('فشل إلغاء الموعد من لوحة التحكم', e);
    }
  };

  // دالة إرسال إشعار موعد جديد للدكتور - إضافة الإشعارات الفورية
  const sendNewAppointmentNotification = async (appointmentData: any) => {
    try {
      logInfo('إرسال إشعار موعد جديد للدكتور', { appointmentData });
      
      // استيراد خدمة الإشعارات
      const NotificationService = require('../services/NotificationService').default;
      
      // إرسال إشعار فوري للدكتور
      await NotificationService.sendNewAppointmentNotificationToDoctor(
        profile?._id || '',
        appointmentData.patientName || t('calendar.patient'),
        appointmentData.date || new Date().toISOString(),
        appointmentData.time || '',
        appointmentData._id || ''
      );
      
      logInfo('تم إرسال إشعار الموعد الجديد فوراً للدكتور');
    } catch (notificationError) {
      logError('فشل في إرسال إشعار الموعد الجديد', notificationError);
    }
  };

  // دالة إلغاء الموعد مع التأكيد
  const handleCancelAppointment = async (appointmentId: string, patientName: string) => {
    Alert.alert(
      t('appointment.cancellation'),
      `${t('appointment.cancellation_confirm', { patientName })}`,
      [
        {
          text: t('common.cancel'),
          style: 'cancel',
        },
        {
          text: t('common.confirm'),
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              logUserAction('إلغاء الموعد', { appointmentId, patientName });
              
              // إلغاء الموعد عبر API
              const result = await appointmentsAPI.cancelAppointment(appointmentId);
              
              if (result && result.success) {
                logInfo('تم إلغاء الموعد بنجاح');
                
                // إرسال إشعار للمريض - إصلاح الإشعارات الفورية
                try {
                  // إرسال إشعار فوري مباشرة
                  const NotificationService = require('../services/NotificationService').default;
                  
                  // البحث عن معرف المستخدم من الموعد
                  const appointment = appointments.find((apt: any) => apt._id === appointmentId);
                  const userId = appointment?.userId?._id || appointment?.patient_id || 
                                (typeof appointment?.userId === 'string' ? appointment.userId : '');
                  
                  if (userId) {
                    logInfo('إرسال إشعار إلغاء الموعد فوراً للمريض', { userId, patientName, appointmentId });
                    
                    
                    // إرسال إشعار فوري مباشرة
                    try {
                      const NotificationService = require('../services/NotificationService').default;
                      
                      // إرسال إشعار محلي فوري مع صوت واهتزاز قوي
                      await NotificationService.sendAppointmentCancellationLocalNotification(
                        t('appointment.cancelled'),
                        `تم إلغاء موعدك مع ${appointment?.doctorName} في ${appointment?.date} الساعة ${appointment?.time}`,
                        {
                          type: 'appointment_cancelled',
                          appointmentId,
                          doctorName: appointment?.doctorName,
                          date: appointment?.date,
                          time: appointment?.time
                        }
                      );
                      
                      logInfo('تم إرسال إشعار إلغاء الموعد الفوري');
                    } catch (localNotificationError) {
                      logError('فشل في إرسال الإشعار الفوري', localNotificationError);
                    }
                  } else {
                    logWarn('لم يتم العثور على معرف المستخدم للموعد', { appointmentId });
                  }
                  
                } catch (notificationError) {
                  logError('فشل إرسال إشعار إلغاء الموعد', notificationError);
                }
                
                // فحص فوري للإشعارات الجديدة بعد إلغاء الموعد
                try {
                  logDebug('فحص فوري للإشعارات بعد إلغاء الموعد');
                  const { syncNotificationsWithServer } = require('../contexts/NotificationContext');
                  // البحث عن الموعد في القائمة المحلية
                  const appointment = appointments.find((apt: any) => apt.id === appointmentId);
                  // استخدام معرف المستخدم من الموعد أو معرف الطبيب الحالي
                  const targetUserId = appointment?.patientId || appointment?.userId?._id || 
                                    (typeof appointment?.userId === 'string' ? appointment.userId : '') ||
                                    (profile?._id || (user as any)?._id);
                  await syncNotificationsWithServer(targetUserId, false);
                } catch (syncError) {
                  // Silent error handling
                }
                
                // تحديث البيانات
                await fetchDashboardData();
                
                Alert.alert(
                  t('common.success'),
                  t('appointment.cancel_success'),
                  [{ text: t('common.ok'), style: 'default' }]
                );
              } else {
                Alert.alert(
                  t('common.error'),
                  t('appointment.cancel_error'),
                  [{ text: t('common.ok'), style: 'default' }]
                );
              }
            } catch (error) {
              Alert.alert(
                t('common.error'),
                t('appointment.cancel_error'),
                [{ text: t('common.ok'), style: 'default' }]
              );
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const renderAppointmentCard = ({ item }: any) => (
    <View style={styles.appointmentCard}>
      {/* عرض شارة الحجز لشخص آخر */}
      {item.isBookingForOther && (
        <View style={styles.bookingForOtherBadge}>
          <Ionicons name="people" size={16} color={theme.colors.success} />
          <Text style={styles.bookingForOtherText}>
            {t('booking_for_other.info.booking_for_other')}
          </Text>
        </View>
      )}

      <View style={styles.appointmentHeader}>
        <View style={styles.patientInfo}>
          <View style={styles.patientAvatar}>
            <Ionicons name="person" size={24} color={theme.colors.white} />
          </View>
          <View>
            {/* عرض اسم المريض: عند الحجز لشخص آخر، اعرض patientName (اسم المريض الفعلي) */}
            {/* عند الحجز للنفس، اعرض userName (اسم المستخدم) */}
            <Text style={styles.patientName}>
              {item.isBookingForOther 
                ? (item.patientName || item.userName || t('calendar.patient_unknown'))
                : (item.userName || item.patientName || item.userId?.first_name || t('calendar.patient_unknown'))
              }
            </Text>
            <Text style={styles.appointmentType}>
              {item.type || item.reason || t('calendar.consultation')}
            </Text>
            {/* إضافة رقم المريض */}
            <Text style={styles.patientPhone}>
              {`📞 ${item.patientPhone || item.userId?.phone || item.phone || t('calendar.phone_unavailable')}`}
            </Text>
            
            {/* إضافة العمر - محدث ليتعامل مع البيانات الجديدة */}
            {(item.patientAge || item.age) && (
              <Text style={styles.patientAge}>
                {`🎂 ${t('validation.patient_age')}: ${item.patientAge || item.age} ${t('validation.years')}`}
              </Text>
            )}

            {/* عرض معلومات الحاجز إذا كان الحجز لشخص آخر */}
            {item.isBookingForOther && item.bookerName && (
              <Text style={styles.bookerInfo}>
                👤 {t('booking_for_other.booker_name')}: {item.bookerName}
              </Text>
            )}

          </View>
        </View>

        {/* إزالة عرض حالة pending */}
        {item.status !== 'pending' && (
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: getStatusColor(item.status) },
            ]}
          >
            <Text style={styles.statusText}>{getStatusText(item.status)}</Text>
          </View>
        )}
      </View>

      <View style={styles.appointmentDetails}>
        <View style={styles.appointmentTime}>
          <Ionicons name="time" size={16} color={theme.colors.textSecondary} />
          <Text style={styles.timeText}>{formatTime(item.time)}</Text>
        </View>

        <View style={styles.appointmentDuration}>
          <Ionicons name="timer" size={16} color={theme.colors.textSecondary} />
          <Text style={styles.durationText}>{item.duration || 30} {t('common.minutes')}</Text>
        </View>

        {/* إضافة التاريخ مع يوم الأسبوع */}
        <View style={styles.appointmentDate}>
          <Ionicons
            name="calendar"
            size={16}
            color={theme.colors.textSecondary}
          />
          <Text style={styles.dateText}>{formatDateWithDay(item.date)}</Text>
        </View>
      </View>

      <View style={styles.appointmentActions}>
        {/* زر تحديد الحضور */}
        <TouchableOpacity 
          style={[
            styles.attendanceButton,
            item.attendance === 'present' ? styles.attendanceButtonPresent : styles.attendanceButtonDefault
          ]}
          onPress={() => markAttendance(item.id, 'present')}
          disabled={item.attendance === 'present'}
        >
          <Ionicons 
            name={item.attendance === 'present' ? "checkmark-circle" : "checkmark-circle-outline"} 
            size={16} 
            color={item.attendance === 'present' ? theme.colors.white : theme.colors.success} 
          />
          <Text style={[
            styles.attendanceButtonText,
            item.attendance === 'present' ? styles.attendanceButtonTextPresent : styles.attendanceButtonTextDefault
          ]}>
            {item.attendance === 'present' ? t('doctor.attendance_marked') : t('doctor.present')}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton}>
          <Ionicons
            name="document-text"
            size={16}
            color={theme.colors.primary}
          />
          <Text style={styles.actionText}>{t('appointment.notes')}</Text>
        </TouchableOpacity>

        {/* زر إلغاء الموعد */}
        <TouchableOpacity 
          style={styles.cancelButton}
          onPress={() => handleCancelAppointment(item.id, item.patientName || item.userName)}
        >
          <Ionicons
            name="close-circle"
            size={16}
            color={theme.colors.error}
          />
          <Text style={styles.cancelButtonText}>{t('appointment.appointment_cancellation')}</Text>
        </TouchableOpacity>
        
        {/* زر اختبار الإشعارات - للاختبار فقط */}
        <TouchableOpacity
          style={[styles.cancelButton, { backgroundColor: '#FF6B6B', marginTop: 5 }]}
          onPress={testImmediateNotification}
        >
          <Text style={styles.cancelButtonText}>{t('notifications.test_notification')}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );


  const renderAttendanceStatCard = (title: string, value: number | string, icon: string, color: string) => (
    <View style={styles.statCard}>
      <View style={[styles.statIcon, { backgroundColor: color }]}>
        <Ionicons name={icon as any} size={24} color={theme.colors.white} />
      </View>
      <Text style={styles.statNumber}>{value}</Text>
      <Text style={styles.statLabel}>{title}</Text>
    </View>
  );


  const getTodayAttendanceCount = () => {
    const today = getLocalDateString();
    const todayAppointments = allAppointments.filter(apt => {
      // معالجة تنسيقات التواريخ المختلفة
      if (!apt.date) return false;
      
      // إذا كان التاريخ في تنسيق ISO string
      if (apt.date.includes('T')) {
        const aptDate = apt.date.split('T')[0];
        return aptDate === today;
      }
      
      // إذا كان التاريخ في تنسيق YYYY-MM-DD
      if (apt.date.match(/^\d{4}-\d{2}-\d{2}$/)) {
        return apt.date === today;
      }
      
      // إذا كان التاريخ في تنسيق آخر، نحاول تحويله
      try {
        const aptDate = new Date(apt.date);
        const aptDateString = aptDate.toISOString().split('T')[0];
        return aptDateString === today;
      } catch (error) {
        return false;
      }
    });
    return todayAppointments.filter(apt => apt.attendance === 'present').length;
  };


  // دالة لتحديد الحضور
  const markAttendance = useCallback(async (appointmentId: string, attendance: 'present' | 'absent') => {
    if (!profile?._id) {
      Alert.alert(t('error.title'), t('auth.login_required'));
      return;
    }

    try {
      
      // تحديث الواجهة فوراً
      setAppointments(prev => {
        const updated = prev.map(apt => 
          apt.id === appointmentId
            ? { 
                ...apt, 
                attendance, 
                attendance_time: new Date().toISOString() 
              }
            : apt
        );
        
        return updated;
      });

      // حفظ البيانات الحالية
      appointmentsRef.current = [...appointments];

      // تحديث الحضور عبر API
      const result = await appointmentsAPI.markAttendance(appointmentId, attendance);
      
      if (result && result.success) {
        
        // تأكيد التحديث في الواجهة
        setAppointments(prev => 
          prev.map(apt => 
            apt.id === appointmentId
              ? { 
                  ...apt, 
                  attendance, 
                  attendance_time: new Date().toISOString() 
                }
              : apt
          )
        );

        // إعادة جلب البيانات بعد تأخير قصير
        setTimeout(async () => {
          try {
            await fetchDashboardData();
          } catch (error) {
            // استعادة البيانات المحفوظة في حالة الفشل
            setAppointments(appointmentsRef.current);
          }
        }, 500);
        
        Alert.alert(
          t('common.success'), 
          `${t('attendance.status_updated')}: ${attendance === 'present' ? t('attendance.present') : t('attendance.absent')}`,
          [{ text: t('common.ok'), style: 'default' }]
        );
      } else {
        Alert.alert(t('error.title'), t('attendance.update_failed'));
        
        // استعادة البيانات الأصلية
        setAppointments(appointmentsRef.current);
      }
    } catch (error) {
      Alert.alert(t('error.title'), t('attendance.update_error'));
      
      // استعادة البيانات الأصلية
      setAppointments(appointmentsRef.current);
    }
  }, [profile?._id, appointments]);

  // دالة البحث في مواعيد اليوم فقط
  const getFilteredTodayAppointments = () => {
    const today = getLocalDateString();
    
    // استخدام allAppointments بدلاً من appointments للبحث
    const appointmentsToSearch = allAppointments.length > 0 ? allAppointments : appointments;
    
    // أولاً: فلترة مواعيد اليوم فقط
    let todayAppointments = appointmentsToSearch.filter(apt => {
      // معالجة تنسيقات التواريخ المختلفة
      if (!apt.date) return false;
      
      // إذا كان التاريخ في تنسيق ISO string
      if (apt.date.includes('T')) {
        const aptDate = apt.date.split('T')[0];
        return aptDate === today;
      }
      
      // إذا كان التاريخ في تنسيق YYYY-MM-DD
      if (apt.date.match(/^\d{4}-\d{2}-\d{2}$/)) {
        return apt.date === today;
      }
      
      // إذا كان التاريخ في تنسيق آخر، نحاول تحويله
      try {
        const aptDate = new Date(apt.date);
        const aptDateString = aptDate.toISOString().split('T')[0];
        return aptDateString === today;
      } catch (error) {
        return false;
      }
    });

    // إذا كان هناك نص بحث، ابحث في مواعيد اليوم فقط
    if (searchTerm.trim()) {
      let filteredTodayAppointments = todayAppointments.filter(apt => 
        apt.userName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        apt.patientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        apt.reason?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        apt.time?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        apt.date?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        apt.type?.toLowerCase().includes(searchTerm.toLowerCase())
      );

      return filteredTodayAppointments;
    }

    // إذا لم يكن هناك بحث، اعرض جميع مواعيد اليوم
    return todayAppointments;
  };

  // دالة مساعدة لتحديد ما إذا كان الموعد اليوم
  const isTodayAppointment = (dateString: string) => {
    if (!dateString) return false;
    const today = getLocalDateString();
    
    // إذا كان التاريخ في تنسيق ISO string
    if (dateString.includes('T')) {
      const aptDate = dateString.split('T')[0];
      return aptDate === today;
    }
    
    // إذا كان التاريخ في تنسيق YYYY-MM-DD
    if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
      return dateString === today;
    }
    
    // إذا كان التاريخ في تنسيق آخر، نحاول تحويله
    try {
      const aptDate = new Date(dateString);
      const aptDateString = aptDate.toISOString().split('T')[0];
      return aptDateString === today;
    } catch (error) {
      return false;
    }
  };

  const renderTodayAppointments = () => {
    const todayAppointments = getFilteredTodayAppointments();
    const todayDayName = getTodayLocalizedDayName(t); // الحصول على اسم اليوم باللغة المحددة

    
    // إضافة تشخيص مفصل لمواعيد اليوم
    if (todayAppointments.length > 0) {
    }

    if (todayAppointments.length === 0) {
      return (
        <View style={styles.todayAppointmentsList}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              {searchTerm.trim() ? t('search.results') : `${t('doctor.today_appointments')} - ${todayDayName}`}
            </Text>
            <Text style={styles.sectionCount}>
              {searchTerm.trim() ? t('search.no_results') : t('doctor.no_confirmed_appointments_for_day')}
            </Text>
          </View>
          
          {/* مربع البحث */}
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color={theme.colors.textSecondary} />
            <TextInput
              style={styles.searchInput}
              placeholder={t('search.appointments')}
              value={searchTerm}
              onChangeText={setSearchTerm}
              placeholderTextColor={theme.colors.textSecondary}
            />
            {searchTerm.length > 0 && (
              <TouchableOpacity onPress={() => setSearchTerm('')}>
                <Ionicons name="close-circle" size={20} color={theme.colors.textSecondary} />
              </TouchableOpacity>
            )}
          </View>

          {searchTerm.trim() ? (
            <View style={styles.emptyState}>
              <Ionicons name="search-outline" size={48} color={theme.colors.textSecondary} />
              <Text style={styles.emptyText}>{t('search.no_results_for')}: "{searchTerm}"</Text>
              <Text style={styles.emptySubtext}>
                {t('search.try_different_criteria')}
              </Text>
              <Text style={styles.emptySubtext}>
                {t('appointments.available_count')}: {allAppointments.length}
              </Text>
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="calendar-outline" size={48} color={theme.colors.textSecondary} />
              <Text style={styles.emptyText}>{t('doctor.no_confirmed_appointments_for_day')}</Text>
              <Text style={styles.emptySubtext}>{t('common.last_updated')}: {new Date().toLocaleTimeString('ar-IQ')}</Text>
            </View>
          )}
        </View>
      );
    }

    return (
      <View style={styles.todayAppointmentsList}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            {searchTerm.trim() ? t('search.results') : `${t('doctor.today_appointments')} - ${todayDayName}`}
          </Text>
          <Text style={styles.sectionCount}>
            {todayAppointments.length} {todayAppointments.length === 1 ? t('doctor.appointments_count') : t('doctor.appointments_count_plural')}
            {searchTerm.trim() && ` (${t('search.results')})`}
          </Text>
        </View>
        
        {/* مربع البحث */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color={theme.colors.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder={t('search.appointments')}
            value={searchTerm}
            onChangeText={setSearchTerm}
            placeholderTextColor={theme.colors.textSecondary}
          />
          {searchTerm.length > 0 && (
            <TouchableOpacity onPress={() => setSearchTerm('')}>
              <Ionicons name="close-circle" size={20} color={theme.colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
        
        <FlatList
          data={todayAppointments}
          renderItem={renderAppointmentCard}
          keyExtractor={(item) => item.id}
          scrollEnabled={false}
          contentContainerStyle={styles.appointmentsList}
        />
      </View>
    );
  };


  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.primary} />
      
      <LinearGradient
        colors={[theme.colors.primary, theme.colors.primaryDark]}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <View style={styles.doctorInfo}>
            {(() => {
              const imageUrl = getDoctorImage();
              return imageUrl ? (
                <Image 
                  source={{ uri: imageUrl }} 
                  style={styles.doctorImage}
                  resizeMode="cover"
                  defaultSource={require('../../assets/icon.png')}
                  onError={(e) => {
                  }}
                  onLoad={() => {
                  }}
                />
              ) : (
                <View style={[styles.doctorImage, { backgroundColor: theme.colors.white + '20', justifyContent: 'center', alignItems: 'center' }]}>
                  <Ionicons name="person" size={30} color={theme.colors.white} />
                </View>
              );
            })()}
            <View>
              <Text style={styles.doctorName}>{profile?.first_name || profile?.name || user?.name}</Text>
              <Text style={styles.doctorSpecialty}>{profile?.specialty || t('common.doctor')}</Text>
            </View>
          </View>
          
          <View style={styles.headerActions}>
            <TouchableOpacity 
              style={styles.refreshButton}
              onPress={() => fetchDashboardData()}
              disabled={loading}
            >
              <Ionicons 
                name={loading ? "hourglass" : "refresh"} 
                size={20} 
                color={theme.colors.white} 
              />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.notificationButton}
              onPress={() => navigation.navigate('Notifications' as never)}
            >
              <Ionicons name="notifications" size={24} color={theme.colors.white} />
              {notifications.filter(n => !n.isRead).length > 0 && (
                <View style={styles.notificationBadge}>
                  <Text style={styles.notificationCount}>
                    {notifications.filter(n => !n.isRead).length > 9 ? '9+' : notifications.filter(n => !n.isRead).length}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* إعلانات للأطباء */}
        <AdvertisementSlider target="both" style={styles.advertisementSlider} />

        {/* إحصائيات اليوم - الحضور والمواعيد */}
        <View style={styles.attendanceStatsContainer}>
          <Text style={styles.attendanceStatsTitle}>{t('doctor.today_stats')}</Text>
          <View style={styles.attendanceStatsGrid}>
            {renderAttendanceStatCard(t('doctor.attendance_today'), getTodayAttendanceCount(), 'checkmark-circle', theme.colors.success)}
            {renderAttendanceStatCard(t('doctor.today_appointments'), getFilteredTodayAppointments().length, 'calendar', theme.colors.primary)}
          </View>
        </View>

        <View style={styles.quickActions}>
          <TouchableOpacity
            style={styles.quickAction}
            onPress={() => navigation.navigate('DoctorAnalytics' as never)}
          >
            <View style={styles.quickActionIcon}>
              <Ionicons name="analytics" size={24} color={theme.colors.white} />
            </View>
            <Text style={styles.quickActionText}>{t('doctor.analytics')}</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.quickAction}
            onPress={() => navigation.navigate('DoctorProfile' as never)}
          >
            <View style={styles.quickActionIcon}>
              <Ionicons name="person" size={24} color={theme.colors.white} />
            </View>
            <Text style={styles.quickActionText}>{t('profile.title')}</Text>
          </TouchableOpacity>

        </View>

        {/* عرض مواعيد اليوم */}
        {renderTodayAppointments()}

        {/* قسم التعليقات والتقييمات */}
        <View style={styles.reviewsSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{t('rating.reviews')}</Text>
            <TouchableOpacity
              onPress={() => (navigation as any).navigate('DoctorReviews', { doctorId: user?.id })}
            >
              <Text style={styles.seeAllText}>{t('common.see_all')}</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.ratingSummary}>
            {(user?.rating && user.rating > 0) ? (
              <>
                <StarRating
                  rating={user.rating}
                  size="large"
                  showText={true}
                  interactive={false}
                />
                <Text style={styles.ratingText}>
                  {t('rating.based_on')} {user?.reviews_count || 0} {t('rating.reviews')}
                </Text>
              </>
            ) : (
              <Text style={styles.noRatingText}>
                {t('rating.no_ratings_yet')}
              </Text>
            )}
          </View>
        </View>

      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 50 : 40,
    paddingBottom: 16,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  doctorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  doctorImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 12,
  },
  doctorName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.white,
  },
  doctorSpecialty: {
    fontSize: 14,
    color: theme.colors.white + 'CC',
  },
  appointmentDay: {
    fontSize: 12,
    color: theme.colors.primary,
    fontWeight: '600',
    marginTop: 2,
  },
  notificationButton: {
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: theme.colors.error,
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationCount: {
    fontSize: 12,
    color: theme.colors.white,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    paddingBottom: 100, // إضافة مساحة في الأسفل للتمرير
  },
  advertisementSlider: {
    marginHorizontal: 20,
    marginVertical: 10,
  },
  statsContainer: {
    paddingVertical: 20,
  },
  statsList: {
    paddingHorizontal: 20,
  },
  statCard: {
    backgroundColor: theme.colors.white,
    borderRadius: 16,
    padding: 16,
    marginRight: 12,
    width: 120,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statContent: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
  },
  statTitle: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginTop: 4,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
    textAlign: 'center',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  attendanceStatsContainer: {
    backgroundColor: theme.colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    elevation: 2,
  },
  attendanceStatsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
    marginBottom: 16,
    textAlign: 'center',
  },
  attendanceStatsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    flexWrap: 'wrap',
  },

  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
  },
  seeAllText: {
    fontSize: 14,
    color: theme.colors.primary,
    fontWeight: '600',
  },
  reviewsSection: {
    backgroundColor: theme.colors.white,
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 16,
    padding: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  ratingSummary: {
    alignItems: 'center',
    marginTop: 16,
  },
  ratingText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginTop: 8,
  },
  noRatingText: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  appointmentsList: {
    paddingHorizontal: 20,
  },
  appointmentCard: {
    backgroundColor: theme.colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  appointmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  patientInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  patientAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  patientName: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    marginBottom: 4,
  },
  appointmentType: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginBottom: 4,
  },
  patientPhone: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  patientAge: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    color: theme.colors.white,
    fontWeight: 'bold',
  },
  appointmentDetails: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  appointmentTime: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 20,
  },
  timeText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginLeft: 4,
  },
  appointmentDuration: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 20,
  },
  durationText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginLeft: 4,
  },
  appointmentDate: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginLeft: 4,
  },

  appointmentActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    paddingTop: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  actionText: {
    fontSize: 12,
    color: theme.colors.primary,
    marginLeft: 4,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
  },
  quickAction: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  quickActionIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  quickActionText: {
    fontSize: 12,
    color: theme.colors.textPrimary,
    textAlign: 'center',
  },
  todayAppointmentsSection: {
    paddingHorizontal: 20,
    marginTop: 20,
  },
  todayAppointmentsButton: {
    backgroundColor: theme.colors.white,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  todayAppointmentsIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    position: 'relative',
  },
  todayAppointmentsBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: theme.colors.error,
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  todayAppointmentsCount: {
    fontSize: 12,
    color: theme.colors.white,
    fontWeight: 'bold',
  },
  todayAppointmentsContent: {
    flex: 1,
  },
  todayAppointmentsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
    marginBottom: 4,
  },
  todayAppointmentsSubtitle: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  todayAppointmentsList: {
    padding: 20,
    marginTop: 10,
  },
  sectionCount: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    backgroundColor: theme.colors.primary + '20',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 20,
    backgroundColor: theme.colors.background,
    borderRadius: 12,
  },
  emptyText: {
    marginTop: 12,
    fontSize: 16,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  emptySubtext: {
    marginTop: 8,
    fontSize: 12,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    opacity: 0.7,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  refreshButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  periodStatsContainer: {
    marginTop: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  periodStatsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
    marginBottom: 12,
    textAlign: 'center',
  },
  periodStatsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    flexWrap: 'wrap',
  },
  attendanceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: theme.colors.success + '10',
    borderWidth: 1,
    borderColor: theme.colors.success,
  },
  attendanceButtonPresent: {
    backgroundColor: theme.colors.success,
    borderColor: theme.colors.success,
  },
  attendanceButtonDefault: {
    backgroundColor: 'transparent',
    borderColor: theme.colors.success,
  },
  attendanceButtonText: {
    fontSize: 12,
    color: theme.colors.success,
    marginLeft: 4,
  },
  attendanceButtonTextPresent: {
    color: theme.colors.white,
  },
  attendanceButtonTextDefault: {
    color: theme.colors.success,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.white,
    borderRadius: 12,
    paddingHorizontal: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
    shadowColor: theme.colors.shadow,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: theme.colors.textPrimary,
    marginLeft: 8,
  },
  bookingForOtherBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.success + '10',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginBottom: 8,
    alignSelf: 'flex-start',
  },
  bookingForOtherText: {
    fontSize: 12,
    color: theme.colors.success,
    marginLeft: 4,
    fontWeight: '600',
  },
  bookerInfo: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginTop: 4,
  },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: theme.colors.error + '10',
    borderWidth: 1,
    borderColor: theme.colors.error,
  },
  cancelButtonText: {
    fontSize: 12,
    color: theme.colors.error,
    marginLeft: 4,
  },
});

// تصدير الدالة للاستخدام الخارجي
export const refreshDoctorDashboard = () => {
  // سيتم تحديثها من خلال useFocusEffect
};

export default DoctorDashboardScreen; 
