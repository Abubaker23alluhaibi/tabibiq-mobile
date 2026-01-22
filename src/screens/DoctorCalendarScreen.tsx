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
  Platform, // ✅ تمت الإضافة هنا
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

const { width } = Dimensions.get('window');

const DoctorCalendarScreen = () => {
  const navigation = useNavigation();
  const { t } = useTranslation();
  const { profile } = useAuth();

  const [appointments, setAppointments] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [markedDates, setMarkedDates] = useState<any>({});

  // دالة للحصول على التاريخ المحلي بصيغة YYYY-MM-DD
  const getLocalDateString = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // تهيئة التاريخ المختار عند البدء
  useEffect(() => {
    setSelectedDate(getLocalDateString());
  }, []);

  const isUpcomingAppointment = (dateString: string) => {
    const today = getLocalDateString();
    return dateString >= today;
  };

  const handleCancelAppointment = async (appointmentId: string) => {
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
              await api.delete(`/appointments/${appointmentId}`);
              await fetchAppointments();
              Alert.alert(t('common.success'), t('calendar.cancel_success'));
            } catch (error: any) {
              Alert.alert(t('common.error'), error.message || t('calendar.cancel_error'));
            }
          }
        }
      ]
    );
  };

  useEffect(() => {
    if (profile?._id) {
      fetchAppointments();
    }
  }, [profile]);

  useEffect(() => {
    updateMarkedDates();
  }, [appointments, selectedDate]);

  const fetchAppointments = async () => {
    if (!profile?._id) return;

    setLoading(true);
    try {
      const response = await api.get(`/doctor-appointments/${encodeURIComponent(profile._id)}`);
      if (response && Array.isArray(response)) {
        const processedAppointments = response.map(appointment => ({
          ...appointment,
          id: appointment._id || appointment.id,
          userId: appointment.userId || appointment.patient_id,
          age: appointment.patientAge || appointment.age,
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
    const appointmentsByDate: { [key: string]: any[] } = {};

    appointments.forEach(appointment => {
      const date = appointment.date;
      if (date) {
        if (!appointmentsByDate[date]) appointmentsByDate[date] = [];
        appointmentsByDate[date].push(appointment);
      }
    });

    Object.keys(appointmentsByDate).forEach(date => {
      const dayAppointments = appointmentsByDate[date];
      const dots: any[] = [];
      let hasConfirmed = false, hasPending = false, hasCancelled = false;

      dayAppointments.forEach(apt => {
        if (apt.status === 'confirmed' && !hasConfirmed) {
          hasConfirmed = true;
          dots.push({ key: `conf_${date}`, color: theme.colors.success });
        } else if (apt.status === 'pending' && !hasPending) {
          hasPending = true;
          dots.push({ key: `pend_${date}`, color: theme.colors.warning });
        } else if (apt.status === 'cancelled' && !hasCancelled) {
          hasCancelled = true;
          dots.push({ key: `canc_${date}`, color: theme.colors.error });
        }
      });

      if (dots.length > 0) {
        marked[date] = { dots: dots.slice(0, 3), selected: date === selectedDate };
      }
    });

    if (!marked[selectedDate]) {
      marked[selectedDate] = { selected: true, selectedColor: theme.colors.primary };
    } else {
      marked[selectedDate].selected = true;
      marked[selectedDate].selectedColor = theme.colors.primary;
    }

    setMarkedDates(marked);
  };

  const getSelectedDateAppointments = () => {
    return appointments
      .filter(apt => apt.date === selectedDate)
      .sort((a, b) => {
        const timeA = parseInt(a.time.split(':')[0]) * 60 + parseInt(a.time.split(':')[1]);
        const timeB = parseInt(b.time.split(':')[0]) * 60 + parseInt(b.time.split(':')[1]);
        return timeA - timeB;
      });
  };

  const getSelectedDateAttendanceStats = () => {
    const selectedApps = getSelectedDateAppointments();
    const total = selectedApps.length;
    const present = selectedApps.filter(apt => apt.attendance === 'present').length;
    const absent = selectedApps.filter(apt => apt.attendance === 'absent').length;
    const notMarked = total - present - absent;
    return { 
      total, 
      present, 
      absent, 
      notMarked, 
      attendanceRate: total > 0 ? Math.round((present / total) * 100) : 0 
    };
  };

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
    } catch { return dateString; }
  };

  const formatTime = (time: string) => {
    if (!time) return '';
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'م' : 'ص'; // اختصارات عربية
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const renderAppointmentCard = ({ item }: any) => (
    <View style={styles.appointmentCard}>
      <View style={styles.cardHeader}>
        <View style={styles.userInfo}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={20} color="#FFF" />
          </View>
          <View>
            <Text style={styles.userName}>
              {item.isBookingForOther 
                ? (item.patientName || t('calendar.patient_unknown'))
                : (item.userName || item.userId?.first_name || t('calendar.patient_unknown'))
              }
            </Text>
            <Text style={styles.reasonText}>{item.reason || t('calendar.consultation')}</Text>
          </View>
        </View>
        
        {/* حالة الموعد */}
        {item.status !== 'pending' && (
          <View style={[styles.statusTag, { backgroundColor: item.status === 'confirmed' ? theme.colors.success + '20' : theme.colors.error + '20' }]}>
            <Text style={[styles.statusText, { color: item.status === 'confirmed' ? theme.colors.success : theme.colors.error }]}>
              {item.status === 'confirmed' ? t('appointment.confirmed') : t('appointment.cancelled')}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.divider} />

      <View style={styles.cardDetails}>
        <View style={styles.detailItem}>
          <Ionicons name="time-outline" size={16} color="#666" />
          <Text style={styles.detailText}>{formatTime(item.time)}</Text>
        </View>
        
        <View style={styles.detailItem}>
          <Ionicons name="call-outline" size={16} color="#666" />
          <Text style={styles.detailText}>
            {item.isBookingForOther ? item.patientPhone : (item.userId?.phone || item.phone || '-')}
          </Text>
        </View>

        {(item.patientAge || item.age) && (
          <View style={styles.detailItem}>
            <Ionicons name="calendar-outline" size={16} color="#666" />
            <Text style={styles.detailText}>
              {item.patientAge || item.age} {t('validation.years')}
            </Text>
          </View>
        )}
      </View>

      {/* زر الإلغاء فقط للمواعيد القادمة والغير ملغاة */}
      {isUpcomingAppointment(item.date) && item.status !== 'cancelled' && (
        <TouchableOpacity 
          style={styles.cancelBtn}
          onPress={() => handleCancelAppointment(item.id)}
        >
          <Text style={styles.cancelBtnText}>{t('calendar.cancel')}</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const selectedDateAppointments = getSelectedDateAppointments();
  const stats = getSelectedDateAttendanceStats();

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.primary} />

      <LinearGradient colors={[theme.colors.primary, theme.colors.primaryDark]} style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-forward" size={24} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('calendar.title')}</Text>
          <TouchableOpacity style={styles.iconBtn} onPress={onRefresh}>
            <Ionicons name="refresh" size={22} color="#FFF" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView 
        style={styles.content} 
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {/* التقويم */}
        <View style={styles.sectionContainer}>
          <Calendar
            onDayPress={(day: any) => setSelectedDate(day.dateString)}
            markedDates={markedDates}
            markingType="multi-dot"
            theme={{
              todayTextColor: theme.colors.primary,
              selectedDayBackgroundColor: theme.colors.primary,
              arrowColor: theme.colors.primary,
              dotColor: theme.colors.primary,
            }}
          />
        </View>

        {/* إحصائيات اليوم */}
        <View style={styles.statsCard}>
          <Text style={styles.sectionTitle}>{t('calendar.attendance_stats')}</Text>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: theme.colors.primary }]}>{stats.total}</Text>
              <Text style={styles.statLabel}>{t('calendar.total_appointments')}</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: theme.colors.success }]}>{stats.present}</Text>
              <Text style={styles.statLabel}>{t('calendar.present')}</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: theme.colors.error }]}>{stats.absent}</Text>
              <Text style={styles.statLabel}>{t('calendar.absent')}</Text>
            </View>
          </View>
        </View>

        {/* قائمة المواعيد */}
        <View style={styles.appointmentsContainer}>
          <View style={styles.listHeader}>
            <Text style={styles.listTitle}>{formatDateWithDay(selectedDate)}</Text>
            <View style={styles.countBadge}>
              <Text style={styles.countText}>{selectedDateAppointments.length}</Text>
            </View>
          </View>

          {selectedDateAppointments.length > 0 ? (
            <FlatList
              data={selectedDateAppointments}
              renderItem={renderAppointmentCard}
              keyExtractor={item => item.id}
              scrollEnabled={false}
            />
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="calendar-outline" size={50} color="#CCC" />
              <Text style={styles.emptyText}>{t('calendar.no_appointments_for_date')}</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F9FC' },
  
  header: {
    paddingTop: Platform.OS === 'android' ? 40 : 10,
    paddingBottom: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#FFF' },
  iconBtn: { padding: 8, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 12 },

  content: { flex: 1, padding: 16 },

  sectionContainer: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 10,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },

  statsCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    elevation: 2,
  },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: theme.colors.textPrimary, marginBottom: 12, textAlign: 'center' },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center' },
  statItem: { alignItems: 'center' },
  statNumber: { fontSize: 20, fontWeight: 'bold', marginBottom: 4 },
  statLabel: { fontSize: 12, color: '#666' },
  statDivider: { width: 1, height: 30, backgroundColor: '#EEE' },

  appointmentsContainer: { marginBottom: 20 },
  listHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  listTitle: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  countBadge: { backgroundColor: theme.colors.primary, paddingHorizontal: 10, paddingVertical: 2, borderRadius: 10 },
  countText: { color: '#FFF', fontSize: 12, fontWeight: 'bold' },

  appointmentCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.primary,
    elevation: 2,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  userInfo: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#E3F2FD', justifyContent: 'center', alignItems: 'center' },
  userName: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  reasonText: { fontSize: 13, color: '#666' },
  
  statusTag: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  statusText: { fontSize: 11, fontWeight: 'bold' },

  divider: { height: 1, backgroundColor: '#F0F0F0', marginVertical: 12 },

  cardDetails: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
  detailItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  detailText: { fontSize: 13, color: '#555' },

  cancelBtn: {
    marginTop: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.error,
    alignItems: 'center',
  },
  cancelBtnText: { color: theme.colors.error, fontSize: 13, fontWeight: '600' },

  emptyState: { alignItems: 'center', padding: 30, opacity: 0.6 },
  emptyText: { marginTop: 10, color: '#888' },
});

export default DoctorCalendarScreen;