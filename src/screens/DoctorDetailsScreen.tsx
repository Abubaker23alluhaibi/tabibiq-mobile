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
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { Calendar } from 'react-native-calendars';
// import MapView, { Marker } from 'react-native-maps';
import { theme } from '../utils/theme';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../contexts/NotificationContext';
import { API_CONFIG } from '../config/api';
import { mapSpecialtyToArabic } from '../utils/specialtyMapper';

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
  const { user } = useAuth();
  const { scheduleAppointmentReminder } = useNotifications();
  const [doctor, setDoctor] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [reason, setReason] = useState('');
  const [availableTimes, setAvailableTimes] = useState<string[]>([]);
  const [bookedTimes, setBookedTimes] = useState<string[]>([]);
  const [showCalendar, setShowCalendar] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [showBookingModal, setShowBookingModal] = useState(false);

  useEffect(() => {
    fetchDoctorDetails();
  }, [doctorId]);

  const fetchDoctorDetails = async () => {
    try {
      setLoading(true);
      console.log('🔄 جلب تفاصيل الطبيب:', doctorId);
      console.log('📍 عنوان API:', `${API_CONFIG.BASE_URL}/doctors/${doctorId}`);
      
      // محاولة جلب الطبيب من نقطة API محددة
      const response = await fetch(`${API_CONFIG.BASE_URL}/doctors/${doctorId}`);
      
      if (response.ok) {
        const doctorData = await response.json();
        console.log('📥 استجابة تفاصيل الطبيب:', doctorData);
        
        // تحسين معالجة بيانات التخصص باستخدام الدالة الجديدة
        const specialty = mapSpecialtyToArabic(doctorData.specialty || doctorData.category_ar || doctorData.category);
        
        console.log('🔍 التخصص المستخرج:', {
          original: doctorData.specialty,
          category_ar: doctorData.category_ar,
          category: doctorData.category,
          final: specialty
        });
        
        // تحديث بيانات الطبيب مع التخصص المحسن
        const enhancedDoctor = {
          ...doctorData,
          specialty: specialty
        };
        
        setDoctor(enhancedDoctor);
      } else {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      console.error('❌ خطأ في جلب تفاصيل الطبيب:', error);
      
      // محاولة جلب جميع الأطباء والبحث عن الطبيب المطلوب
      try {
        const allDoctorsResponse = await fetch(`${API_CONFIG.BASE_URL}/doctors`);
        if (allDoctorsResponse.ok) {
          const allDoctors = await allDoctorsResponse.json();
          const foundDoctor = allDoctors.find((d: any) => d._id === doctorId || d.id === doctorId);
          
          if (foundDoctor) {
            console.log('✅ تم العثور على الطبيب من القائمة العامة');
            
            // تحسين معالجة بيانات التخصص باستخدام الدالة الجديدة
            const specialty = mapSpecialtyToArabic(foundDoctor.specialty || foundDoctor.category_ar || foundDoctor.category);
            
            const enhancedDoctor = {
              ...foundDoctor,
              specialty: specialty
            };
            
            setDoctor(enhancedDoctor);
          } else {
            console.error('❌ لم يتم العثور على الطبيب');
            Alert.alert(t('error.title'), t('error.doctor_not_found'));
          }
        } else {
          throw new Error(`HTTP error! status: ${allDoctorsResponse.status}`);
        }
      } catch (fallbackError) {
        console.error('❌ خطأ في جلب جميع الأطباء:', fallbackError);
        Alert.alert(t('error.title'), t('error.fetch_doctor'));
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
      const duration = doctor?.appointmentDuration ? Number(doctor.appointmentDuration) : 30;
      
      while (start < end) {
        const timeString = start.toTimeString().slice(0, 5);
        slots.push(timeString);
        start.setMinutes(start.getMinutes() + duration);
      }
    } catch (error) {
      console.error('❌ خطأ في توليد الأوقات:', error);
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
      console.error('❌ خطأ في جلب المواعيد المحجوزة:', error);
      setBookedTimes([]);
    }
  };

  // دالة لتحديد الأيام المتاحة
  const getAvailableDays = () => {
    if (!doctor?.workTimes) return [];
    return doctor.workTimes.map((wt: any) => wt.day).filter(Boolean);
  };

  // دالة للتحقق من توفر اليوم
  const isDayAvailable = (date: any) => {
    // ترتيب الأيام حسب JavaScript: الأحد=0، الاثنين=1، الثلاثاء=2، الأربعاء=3، الخميس=4، الجمعة=5، السبت=6
    const weekDays = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
    const dayName = weekDays[date.getDay()];
    return getAvailableDays().includes(dayName);
  };

  // دالة لإنشاء markedDates للتقويم - إصلاح مشكلة المنطقة الزمنية
  const getMarkedDates = () => {
    const marked: any = {};
    
    // إضافة اليوم المحدد
    if (selectedDate) {
      marked[selectedDate] = { 
        selected: true, 
        selectedColor: theme.colors.primary 
      };
    }

    // إضافة الأيام المتاحة للشهر الحالي
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    
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
      
      if (isDayAvailable(date)) {
        // إذا كان اليوم محدد، لا نضيف علامة إضافية
        if (selectedDate !== dateString) {
          marked[dateString] = {
            marked: true,
            dotColor: theme.colors.success,
            textColor: theme.colors.textPrimary,
            dotStyle: {
              width: 8,
              height: 8,
              borderRadius: 4,
              marginTop: 2
            }
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
            longitude: parseFloat(coordsMatch[2])
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
            longitude: 44.3661
          };
        }
      }
      
      // إحداثيات افتراضية لبغداد
      return {
        latitude: 33.3152,
        longitude: 44.3661
      };
    } catch (error) {
      console.error('❌ خطأ في استخراج الإحداثيات:', error);
      return {
        latitude: 33.3152,
        longitude: 44.3661
      };
    }
  };

  // عند اختيار تاريخ
  const onDayPress = (day: any) => {
    const selectedDateStr = day.dateString;
    setSelectedDate(selectedDateStr);
    
    // ترتيب الأيام حسب JavaScript: الأحد=0، الاثنين=1، الثلاثاء=2، الأربعاء=3، الخميس=4، الجمعة=5، السبت=6
    const weekDays = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
    const selectedDateObj = new Date(selectedDateStr);
    const dayName = weekDays[selectedDateObj.getDay()];
    
    console.log('📅 اليوم المحدد:', selectedDateStr, 'اسم اليوم:', dayName);
    
    const times = doctor.workTimes.filter((wt: any) => wt.day === dayName);
    
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
      
      if (!selectedDate || !selectedTime) {
        Alert.alert(t('error.title'), 'يرجى اختيار التاريخ والوقت');
        return;
      }

      // إصلاح تنسيق البيانات المرسلة للخادم
      const bookingData = {
        userId: user?.id, // معرف المستخدم
        doctorId: doctorId, // معرف الطبيب
        userName: user?.name || 'مستخدم', // اسم المستخدم
        doctorName: doctor?.name || 'طبيب', // اسم الطبيب
        date: selectedDate, // التاريخ
        time: selectedTime, // الوقت
        reason: reason || '', // سبب الزيارة
        duration: doctor?.appointmentDuration || 30 // مدة الموعد
      };

      console.log('📤 بيانات الحجز المرسلة:', bookingData);

      const response = await api.post('/appointments', bookingData);
      
      console.log('✅ تم الحجز بنجاح:', response);
      
      // جدولة تذكير بالموعد (قبل ساعة من الموعد)
      try {
        const appointmentDate = new Date(`${selectedDate}T${selectedTime}`);
        await scheduleAppointmentReminder(
          response.data?.appointment?._id || Date.now().toString(),
          appointmentDate,
          doctor?.name || 'طبيب',
          user?.name || 'مريض'
        );
        console.log('✅ تم جدولة تذكير الموعد بنجاح');
      } catch (reminderError) {
        console.log('⚠️ فشل في جدولة تذكير الموعد:', reminderError);
      }

      Alert.alert(
        t('success.title'),
        t('appointments.booking_success'),
        [
          {
            text: t('common.ok'),
            onPress: () => {
              setShowBookingModal(false);
              navigation.navigate('MyAppointments' as never);
            },
          },
        ]
      );
    } catch (error: any) {
      console.error('❌ خطأ في حجز الموعد:', error);
      
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

  const openMap = () => {
    if (doctor?.mapLocation) {
      setShowMap(true);
    } else {
      Alert.alert('معلومات', 'لا يوجد رابط للخريطة');
    }
  };

  const openMapInBrowser = () => {
    if (doctor?.mapLocation) {
      // فتح الرابط في المتصفح
      Linking.openURL(doctor.mapLocation);
    } else {
      Alert.alert('معلومات', 'لا يوجد رابط للخريطة');
    }
  };

  // استخراج إحداثيات الموقع
  const mapCoordinates = doctor?.mapLocation ? extractCoordinatesFromMapUrl(doctor.mapLocation) : null;

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

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={theme.colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('doctor.details')}</Text>
      </View>

      <View style={styles.content}>
        {/* صورة الطبيب */}
        <View style={styles.imageContainer}>
          {doctor.imageUrl || doctor.image || doctor.profile_image ? (
            <Image 
              source={{ uri: doctor.imageUrl || doctor.image || doctor.profile_image }} 
              style={styles.doctorImage} 
            />
          ) : (
            <View style={styles.placeholderImage}>
              <Ionicons name="person" size={64} color={theme.colors.textSecondary} />
            </View>
          )}
        </View>

        {/* معلومات الطبيب */}
        <View style={styles.infoContainer}>
          <Text style={styles.doctorName}>{doctor.name}</Text>
          
          {/* تحسين عرض التخصص */}
          <View style={styles.specialtyContainer}>
            <Ionicons name="medical" size={20} color={theme.colors.primary} />
            <Text style={styles.doctorSpecialty}>
              {doctor.specialty || 'غير محدد'}
            </Text>
          </View>
          
          {doctor.experienceYears && (
            <View style={styles.infoRow}>
              <Ionicons name="time" size={20} color={theme.colors.primary} />
              <Text style={styles.infoText}>
                {t('doctor.experience')}: {doctor.experienceYears} {t('doctor.years')}
              </Text>
            </View>
          )}

          {doctor.phone && (
            <View style={styles.infoRow}>
              <Ionicons name="call" size={20} color={theme.colors.primary} />
              <Text style={styles.infoText}>{doctor.phone}</Text>
            </View>
          )}

          {doctor.email && (
            <View style={styles.infoRow}>
              <Ionicons name="mail" size={20} color={theme.colors.primary} />
              <Text style={styles.infoText}>{doctor.email}</Text>
            </View>
          )}

          {doctor.clinicLocation && (
            <View style={styles.infoRow}>
              <Ionicons name="location" size={20} color={theme.colors.primary} />
              <Text style={styles.infoText}>{doctor.clinicLocation}</Text>
            </View>
          )}

          {doctor.province && doctor.area && (
            <View style={styles.infoRow}>
              <Ionicons name="location-outline" size={20} color={theme.colors.primary} />
              <Text style={styles.infoText}>{doctor.province}, {doctor.area}</Text>
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

        {/* أوقات العمل */}
        {doctor.workTimes && (
          <View style={styles.workTimesContainer}>
            <Text style={styles.sectionTitle}>{t('doctor.work_times')}</Text>
            {Array.isArray(doctor.workTimes) ? (
              doctor.workTimes.map((time: any, index: number) => (
                <Text key={index} style={styles.workTimesText}>
                  {time.day}: {time.from} - {time.to}
                </Text>
              ))
            ) : (
              <Text style={styles.workTimesText}>{doctor.workTimes}</Text>
            )}
          </View>
        )}

        {/* مدة الموعد */}
        {doctor.appointmentDuration && (
          <View style={styles.infoRow}>
            <Ionicons name="time-outline" size={20} color={theme.colors.primary} />
            <Text style={styles.infoText}>
              {t('doctor.appointment_duration')}: {doctor.appointmentDuration} {t('common.minutes')}
            </Text>
          </View>
        )}

        {/* موقع العيادة */}
        {doctor.clinicLocation && (
          <View style={styles.infoRow}>
            <Ionicons name="location-outline" size={20} color={theme.colors.primary} />
            <Text style={styles.infoText}>
              {t('location.manual')}: {doctor.clinicLocation}
            </Text>
          </View>
        )}

        {/* رابط الخريطة */}
        {doctor.mapLocation && (
          <View style={styles.mapContainer}>
            <TouchableOpacity
              style={styles.mapButton}
              onPress={() => Linking.openURL(doctor.mapLocation)}
            >
              <Ionicons name="map-outline" size={20} color={theme.colors.white} />
              <Text style={styles.mapButtonText}>
                {t('location.open_map')}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* أزرار الإجراءات */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => setShowCalendar(true)}
          >
            <Ionicons name="calendar" size={20} color={theme.colors.white} />
            <Text style={styles.actionButtonText}>حجز موعد</Text>
          </TouchableOpacity>

          {doctor.mapLocation && (
            <TouchableOpacity
              style={[styles.actionButton, styles.mapButton]}
              onPress={openMap}
            >
              <Ionicons name="map" size={20} color={theme.colors.white} />
              <Text style={styles.actionButtonText}>عرض الخريطة</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* مساحة إضافية في الأسفل لضمان ظهور الأزرار */}
        <View style={styles.bottomSpacer} />
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
              <Ionicons name="close" size={24} color={theme.colors.textPrimary} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>اختر موعد الحجز</Text>
          </View>

          <View style={styles.calendarInfo}>
            <Text style={styles.calendarInfoText}>
              النقاط الخضراء = أيام متاحة للحجز
            </Text>
            <Text style={styles.calendarInfoText}>
              اليوم المحدد = لون أزرق
            </Text>
          </View>

          <ScrollView style={styles.modalScrollView} showsVerticalScrollIndicator={false}>
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

            {selectedDate && availableTimes.length > 0 && (
              <View style={styles.timeSlotsContainer}>
                <Text style={styles.timeSlotsTitle}>
                  اختر الوقت لليوم: {selectedDate}
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
                          isBooked && styles.bookedTimeSlot
                        ]}
                        onPress={() => !isBooked && setSelectedTime(time)}
                        disabled={isBooked}
                      >
                        <Text style={[
                          styles.timeSlotText,
                          selectedTime === time && styles.selectedTimeSlotText,
                          isBooked && styles.bookedTimeSlotText
                        ]}>
                          {time} {isBooked && '(محجوز)'}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            )}
          </ScrollView>

          {/* زر التأكيد ثابت في الأسفل */}
          {selectedDate && selectedTime && (
            <View style={styles.fixedBottomContainer}>
              <TouchableOpacity
                style={styles.confirmButton}
                onPress={() => {
                  setShowCalendar(false);
                  setShowBookingModal(true);
                }}
              >
                <Text style={styles.confirmButtonText}>تأكيد الحجز</Text>
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
              <Ionicons name="close" size={24} color={theme.colors.textPrimary} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>موقع العيادة</Text>
            <TouchableOpacity
              style={styles.browserButton}
              onPress={openMapInBrowser}
            >
              <Ionicons name="open-outline" size={24} color={theme.colors.primary} />
            </TouchableOpacity>
          </View>

                     {/* MapView temporarily disabled for web compatibility */}
                     <View style={styles.mapView}>
                       <Text style={styles.mapPlaceholderText}>🗺️ خريطة الموقع</Text>
                       <Text style={styles.mapPlaceholderSubText}>Map Component (Web)</Text>
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
              <Ionicons name="close" size={24} color={theme.colors.textPrimary} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>تأكيد الحجز</Text>
          </View>

          <View style={styles.bookingForm}>
            <View style={styles.bookingInfo}>
              <Text style={styles.bookingInfoText}>
                التاريخ: {selectedDate}
              </Text>
              <Text style={styles.bookingInfoText}>
                الوقت: {selectedTime}
              </Text>
            </View>

            <Text style={styles.inputLabel}>سبب الزيارة (اختياري):</Text>
            <TextInput
              style={styles.textInput}
              value={reason}
              onChangeText={setReason}
              placeholder="أدخل سبب الزيارة..."
              multiline
              numberOfLines={3}
            />

            <TouchableOpacity
              style={[styles.bookButton, bookingLoading && styles.bookButtonDisabled]}
              onPress={bookAppointment}
              disabled={bookingLoading}
            >
              {bookingLoading ? (
                <ActivityIndicator size="small" color={theme.colors.white} />
              ) : (
                <Text style={styles.bookButtonText}>تأكيد الحجز</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
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
  imageContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  doctorImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  placeholderImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: theme.colors.border,
    justifyContent: 'center',
    alignItems: 'center',
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
  workTimesContainer: {
    marginBottom: 24,
  },
  workTimesText: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    lineHeight: 24,
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  actionButton: {
    backgroundColor: theme.colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 4,
  },
  mapButton: {
    backgroundColor: theme.colors.success,
  },
  actionButtonText: {
    color: theme.colors.white,
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 8,
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
    margin: 20,
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  confirmButtonText: {
    color: theme.colors.white,
    fontSize: 16,
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
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  bookButtonDisabled: {
    opacity: 0.6,
  },
  bookButtonText: {
    color: theme.colors.white,
    fontSize: 16,
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
});

export default DoctorDetailsScreen; 