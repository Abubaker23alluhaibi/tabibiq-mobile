import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  Dimensions,
  StatusBar,
  RefreshControl,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Calendar } from 'react-native-calendars';
import { theme } from '../utils/theme';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';
import { getTodayLocalizedDayName, getLocalizedDayName } from '../utils/dateUtils';

const { width, height } = Dimensions.get('window');

const DoctorCalendarScreen = () => {
  const navigation = useNavigation();
  const { t } = useTranslation();
  const { profile } = useAuth();

  const [appointments, setAppointments] = useState<any[]>([]);
  
  // دالة للحصول على التاريخ المحلي بصيغة YYYY-MM-DD
  const getLocalDateString = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // دالة للتحقق من أن الموعد قادم
  const isUpcomingAppointment = (dateString: string) => {
    const today = getLocalDateString();
    return dateString > today;
  };

  // دالة لإلغاء الموعد
  const handleCancelAppointment = async (appointmentId: string) => {
    try {
      // التحقق من صحة معرف الموعد
      if (!appointmentId || typeof appointmentId !== 'string') {
        Alert.alert(t('common.error'), 'معرف الموعد غير صحيح');
        return;
      }

      Alert.alert(
        t('calendar.cancel_confirmation'),
        t('calendar.cancel_message'),
        [
          { text: t('common.cancel'), style: 'cancel' },
          {
            text: t('common.confirm'),
            style: 'destructive',
            onPress: async () => {
              try {
                // إلغاء الموعد باستخدام API
                await api.delete(`/appointments/${appointmentId}`);
                
                // إعادة جلب البيانات لتحديث الواجهة
                await fetchAppointments();
                
                Alert.alert(t('common.success'), t('calendar.cancel_success'));
              } catch (error: any) {
                Alert.alert(t('common.error'), error.message || t('calendar.cancel_error'));
              }
            }
          }
        ]
      );
    } catch (error) {
      Alert.alert(t('common.error'), t('calendar.cancel_error'));
    }
  };

  const [selectedDate, setSelectedDate] = useState(getLocalDateString());
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [markedDates, setMarkedDates] = useState<any>({});

  useEffect(() => {
    if (profile?._id) {
      fetchAppointments();
    }
  }, [profile]);

  useEffect(() => {
    updateMarkedDates();
  }, [appointments]);

  const fetchAppointments = async () => {
    // التحقق من صحة معرف الطبيب
    if (!profile?._id || typeof profile._id !== 'string') {
      setAppointments([]);
      return;
    }

    // التحقق من أن معرف الطبيب لا يحتوي على أحرف خطيرة
    const doctorId = profile._id.replace(/[^a-zA-Z0-9-_]/g, '');
    if (!doctorId) {
      setAppointments([]);
      return;
    }

    setLoading(true);
    try {
      const response = await api.get(`/doctor-appointments/${encodeURIComponent(doctorId)}`);

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
      } else {
        setAppointments([]);
      }
    } catch (error) {
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

  const updateMarkedDates = () => {
    const marked: any = {};

    // تجميع المواعيد حسب التاريخ
    const appointmentsByDate: { [key: string]: any[] } = {};
    appointments.forEach(appointment => {
      const date = appointment.date;
      if (date) {
        if (!appointmentsByDate[date]) {
          appointmentsByDate[date] = [];
        }
        appointmentsByDate[date].push(appointment);
      }
    });

    // معالجة كل تاريخ
    Object.keys(appointmentsByDate).forEach(date => {
      const dayAppointments = appointmentsByDate[date];
      const dots: any[] = [];

      // فحص أنواع المواعيد المختلفة
      let hasConfirmed = false;
      let hasPending = false;
      let hasCancelled = false;
      let hasPresent = false;
      let hasAbsent = false;

      dayAppointments.forEach(appointment => {
        // فحص حالة الموعد
        if (appointment.status === 'confirmed' && !hasConfirmed) {
          hasConfirmed = true;
          dots.push({
            key: `confirmed_${date}`,
            color: getStatusColor('confirmed'),
            selectedDotColor: theme.colors.white,
          });
        } else if (appointment.status === 'pending' && !hasPending) {
          hasPending = true;
          dots.push({
            key: `pending_${date}`,
            color: getStatusColor('pending'),
            selectedDotColor: theme.colors.white,
          });
        } else if (appointment.status === 'cancelled' && !hasCancelled) {
          hasCancelled = true;
          dots.push({
            key: `cancelled_${date}`,
            color: getStatusColor('cancelled'),
            selectedDotColor: theme.colors.white,
          });
        }

        // فحص الحضور
        if (appointment.attendance === 'present' && !hasPresent) {
          hasPresent = true;
          dots.push({
            key: `present_${date}`,
            color: getAttendanceColor('present'),
            selectedDotColor: theme.colors.white,
          });
        } else if (appointment.attendance === 'absent' && !hasAbsent) {
          hasAbsent = true;
          dots.push({
            key: `absent_${date}`,
            color: getAttendanceColor('absent'),
            selectedDotColor: theme.colors.white,
          });
        }
      });

      // إضافة النقاط للتاريخ (حد أقصى 3 نقاط)
      if (dots.length > 0) {
        marked[date] = {
          dots: dots.slice(0, 3), // حد أقصى 3 نقاط
          selected: date === selectedDate,
        };
      }
    });

    // إضافة اليوم المحدد
    if (marked[selectedDate]) {
      marked[selectedDate].selected = true;
    } else {
      marked[selectedDate] = {
        selected: true,
        selectedColor: theme.colors.primary,
      };
    }

    setMarkedDates(marked);
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

  const getSelectedDateAppointments = () => {
    const selectedAppointments = appointments.filter(
      appointment => appointment.date === selectedDate
    );
    
    // ترتيب المواعيد حسب الوقت (حسب وقت الحجز)
    return selectedAppointments.sort((a, b) => {
      // تحويل الوقت إلى دقائق للمقارنة
      const timeToMinutes = (time: string) => {
        const [hours, minutes] = time.split(':').map(Number);
        return hours * 60 + minutes;
      };
      
      const timeA = timeToMinutes(a.time);
      const timeB = timeToMinutes(b.time);
      
      // ترتيب تصاعدي حسب الوقت
      return timeA - timeB;
    });
  };

  // دالة لحساب إحصائيات الحضور لليوم المختار
  const getSelectedDateAttendanceStats = () => {
    const selectedAppointments = getSelectedDateAppointments();
    const total = selectedAppointments.length;
    const present = selectedAppointments.filter(apt => apt.attendance === 'present').length;
    const absent = selectedAppointments.filter(apt => apt.attendance === 'absent').length;
    const notMarked = total - present - absent;
    
    return {
      total,
      present,
      absent,
      notMarked,
      attendanceRate: total > 0 ? Math.round((present / total) * 100) : 0
    };
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
        return t('calendar.present');
      case 'absent':
        return t('calendar.absent');
      case 'not_marked':
      default:
        return t('calendar.not_marked');
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'confirmed':
        return t('appointment.confirmed');
      case 'pending':
        return ''; // إزالة عرض حالة pending
      case 'cancelled':
        return t('appointment.cancelled');
      default:
        return '';
    }
  };

  // دالة جديدة لتنسيق التاريخ مع يوم الأسبوع
  const formatDateWithDay = (dateString: string) => {
    try {
      const dayName = getLocalizedDayName(dateString, t);
      const date = new Date(dateString);
      const formattedDate = date.toLocaleDateString('ar-IQ', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
      return `${dayName} - ${formattedDate}`;
    } catch (error) {
      return dateString;
    }
  };

  const onDayPress = (day: any) => {
    setSelectedDate(day.dateString);
  };

  const formatTime = (time: string) => {
    // تحويل الوقت إلى تنسيق 12 ساعة
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? t('calendar.evening_abbr') : t('calendar.morning_abbr');
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const renderAppointmentCard = ({ item }: any) => (
    <View style={styles.appointmentCard}>
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
                : (item.userName || item.userId?.first_name || t('calendar.patient_unknown'))
              }
            </Text>
            <Text style={styles.appointmentType}>
              {item.reason || t('calendar.consultation')}
            </Text>
            {/* إضافة رقم المريض */}
            <Text style={styles.patientPhone}>
              {`📞 ${item.isBookingForOther 
                ? (item.patientPhone || t('calendar.phone_unavailable'))
                : (item.userId?.phone || item.phone || t('calendar.phone_unavailable'))
              }`}
            </Text>
            
            {/* إضافة العمر - محدث ليتعامل مع البيانات الجديدة */}
            {(item.patientAge || item.age) && (
              <Text style={styles.patientAge}>
                {`🎂 ${t('validation.patient_age')}: ${item.patientAge || item.age} ${t('validation.years')}`}
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

        {/* عرض حالة الحضور */}
        {item.attendance && item.attendance !== 'not_marked' && (
          <View
            style={[
              styles.attendanceBadge,
              { backgroundColor: getAttendanceColor(item.attendance) },
            ]}
          >
            <Text style={styles.attendanceBadgeText}>
              {getAttendanceText(item.attendance)}
            </Text>
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
          <Text style={styles.durationText}>{item.duration || 30} {item.duration === 1 ? t('calendar.minutes') : t('calendar.minutes_plural')}</Text>
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
        {/* زر الإلغاء للمواعيد القادمة فقط */}
        {isUpcomingAppointment(item.date) && item.status !== 'cancelled' && (
          <TouchableOpacity 
            style={styles.cancelButton}
            onPress={() => handleCancelAppointment(item.id)}
          >
            <Ionicons name="close" size={16} color={theme.colors.white} />
            <Text style={styles.cancelButtonText}>{t('calendar.cancel')}</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="call" size={16} color={theme.colors.primary} />
          <Text style={styles.actionText}>{t('appointment.call')}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="chatbubble" size={16} color={theme.colors.primary} />
          <Text style={styles.actionText}>{t('appointment.message')}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton}>
          <Ionicons
            name="document-text"
            size={16}
            color={theme.colors.primary}
          />
          <Text style={styles.actionText}>{t('appointment.notes')}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const selectedDateAppointments = getSelectedDateAppointments();

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="light-content"
        backgroundColor={theme.colors.primary}
      />

      <LinearGradient
        colors={[theme.colors.primary, theme.colors.primaryDark]}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color={theme.colors.white} />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>
            {t('calendar.title')} - {getTodayLocalizedDayName(t)}
          </Text>

          <TouchableOpacity style={styles.refreshButton} onPress={onRefresh}>
            <Ionicons name="refresh" size={24} color={theme.colors.white} />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* التقويم */}
        <View style={styles.calendarContainer}>
          <Calendar
            onDayPress={onDayPress}
            markedDates={markedDates}
            markingType="multi-dot"
            theme={{
              backgroundColor: theme.colors.white,
              calendarBackground: theme.colors.white,
              textSectionTitleColor: theme.colors.textPrimary,
              selectedDayBackgroundColor: theme.colors.primary,
              selectedDayTextColor: theme.colors.white,
              todayTextColor: theme.colors.primary,
              dayTextColor: theme.colors.textPrimary,
              textDisabledColor: theme.colors.textSecondary,
              dotColor: theme.colors.primary,
              selectedDotColor: theme.colors.white,
              arrowColor: theme.colors.primary,
              monthTextColor: theme.colors.textPrimary,
              indicatorColor: theme.colors.primary,
              textDayFontWeight: '300',
              textMonthFontWeight: 'bold',
              textDayHeaderFontWeight: '300',
              textDayFontSize: 16,
              textMonthFontSize: 16,
              textDayHeaderFontSize: 13,
            }}
          />
        </View>

        {/* إحصائيات الحضور لليوم المختار */}
        <View style={styles.attendanceStatsContainer}>
          <Text style={styles.attendanceStatsTitle}>
            {t('calendar.attendance_stats')} - {formatDateWithDay(selectedDate)}
          </Text>
          <View style={styles.attendanceStatsGrid}>
            <View style={styles.attendanceStatCard}>
              <Ionicons name="people" size={24} color={theme.colors.primary} />
              <Text style={styles.attendanceStatNumber}>
                {getSelectedDateAttendanceStats().total}
              </Text>
              <Text style={styles.attendanceStatLabel}>{t('calendar.total_appointments')}</Text>
            </View>
            
            <View style={styles.attendanceStatCard}>
              <Ionicons name="checkmark-circle" size={24} color={theme.colors.success} />
              <Text style={styles.attendanceStatNumber}>
                {getSelectedDateAttendanceStats().present}
              </Text>
              <Text style={styles.attendanceStatLabel}>{t('calendar.present')}</Text>
            </View>
            
            <View style={styles.attendanceStatCard}>
              <Ionicons name="close-circle" size={24} color={theme.colors.error} />
              <Text style={styles.attendanceStatNumber}>
                {getSelectedDateAttendanceStats().absent}
              </Text>
              <Text style={styles.attendanceStatLabel}>{t('calendar.absent')}</Text>
            </View>
            
            <View style={styles.attendanceStatCard}>
              <Ionicons name="help-circle" size={24} color={theme.colors.textSecondary} />
              <Text style={styles.attendanceStatNumber}>
                {getSelectedDateAttendanceStats().notMarked}
              </Text>
              <Text style={styles.attendanceStatLabel}>{t('calendar.not_marked')}</Text>
            </View>
          </View>
          
          {/* نسبة الحضور */}
          <View style={styles.attendanceRateContainer}>
            <Text style={styles.attendanceRateLabel}>{t('calendar.attendance_rate')}:</Text>
            <Text style={styles.attendanceRateValue}>
              {getSelectedDateAttendanceStats().attendanceRate}%
            </Text>
          </View>
        </View>

        {/* مواعيد اليوم المحدد */}
        <View style={styles.appointmentsSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              {t('doctor.today_appointments')} {selectedDate} - {getLocalizedDayName(selectedDate, t)}
            </Text>
            <Text style={styles.appointmentsCount}>
              {selectedDateAppointments.length} {selectedDateAppointments.length === 1 ? t('calendar.appointments_count') : t('calendar.appointments_count_plural')}
            </Text>
          </View>

          {selectedDateAppointments.length > 0 ? (
            <FlatList
              data={selectedDateAppointments}
              renderItem={renderAppointmentCard}
              keyExtractor={item => item._id}
              scrollEnabled={false}
              contentContainerStyle={styles.appointmentsList}
            />
          ) : (
            <View style={styles.emptyState}>
              <Ionicons
                name="calendar-outline"
                size={64}
                color={theme.colors.textSecondary}
              />
              <Text style={styles.emptyStateTitle}>
                {t('doctor.no_appointments')}
              </Text>
              <Text style={styles.emptyStateSubtitle}>
                {t('calendar.no_appointments_for_date')}
              </Text>
            </View>
          )}
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
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.white + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.white,
  },
  refreshButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.white + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  calendarContainer: {
    backgroundColor: theme.colors.white,
    margin: 20,
    borderRadius: 16,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  // إحصائيات الحضور
  attendanceStatsContainer: {
    backgroundColor: theme.colors.white,
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 16,
    padding: 20,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  attendanceStatsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
    textAlign: 'center',
    marginBottom: 16,
  },
  attendanceStatsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  attendanceStatCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    marginHorizontal: 4,
  },
  attendanceStatNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
    marginTop: 8,
  },
  attendanceStatLabel: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginTop: 4,
  },
  attendanceRateContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
    padding: 16,
    borderRadius: 12,
  },
  attendanceRateLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.textPrimary,
  },
  attendanceRateValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.success,
  },
  appointmentsSection: {
    marginHorizontal: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
  },
  appointmentsCount: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    backgroundColor: theme.colors.primary + '20',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  appointmentsList: {
    paddingBottom: 20,
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
  },
  appointmentType: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  patientPhone: {
    fontSize: 12,
    color: theme.colors.primary,
    marginTop: 4,
    fontWeight: '500',
  },
  patientAge: {
    fontSize: 12,
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
  attendanceBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginTop: 8,
  },
  attendanceBadgeText: {
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
  },
  durationText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginLeft: 4,
  },
  appointmentDate: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
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
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: theme.colors.error,
    borderRadius: 12,
    marginRight: 8,
  },
  cancelButtonText: {
    fontSize: 12,
    color: theme.colors.white,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    backgroundColor: theme.colors.white,
    borderRadius: 16,
    marginBottom: 20,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
    marginTop: 16,
  },
  emptyStateSubtitle: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginTop: 8,
  },
});

export default DoctorCalendarScreen;
