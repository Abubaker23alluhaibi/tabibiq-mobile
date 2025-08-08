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
    if (!profile?._id) return;
    
    setLoading(true);
    try {
      const response = await api.get(`/doctor-appointments/${profile._id}`);
      
      if (response && Array.isArray(response)) {
        setAppointments(response);
        console.log('✅ تم جلب المواعيد بنجاح:', response.length, 'موعد');
      } else {
        setAppointments([]);
        console.log('⚠️ لا توجد مواعيد');
      }
    } catch (error) {
      console.error('❌ خطأ في جلب المواعيد:', error);
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
    
    appointments.forEach(appointment => {
      const date = appointment.date;
      if (date) {
        if (marked[date]) {
          marked[date].dots.push({
            key: appointment._id,
            color: getStatusColor(appointment.status),
            selectedDotColor: theme.colors.white,
          });
        } else {
          marked[date] = {
            dots: [{
              key: appointment._id,
              color: getStatusColor(appointment.status),
              selectedDotColor: theme.colors.white,
            }],
            selected: date === selectedDate,
          };
        }
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

  const onDayPress = (day: any) => {
    setSelectedDate(day.dateString);
  };

  const getSelectedDateAppointments = () => {
    return appointments.filter(appointment => appointment.date === selectedDate);
  };

  const formatTime = (time: string) => {
    // تحويل الوقت إلى تنسيق 12 ساعة
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'م' : 'ص';
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
            <Text style={styles.patientName}>
              {item.userName || item.userId?.first_name || 'مريض غير محدد'}
            </Text>
            <Text style={styles.appointmentType}>
              {item.reason || 'استشارة'}
            </Text>
          </View>
        </View>
        
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.statusText}>{getStatusText(item.status)}</Text>
        </View>
      </View>
      
      <View style={styles.appointmentDetails}>
        <View style={styles.appointmentTime}>
          <Ionicons name="time" size={16} color={theme.colors.textSecondary} />
          <Text style={styles.timeText}>{formatTime(item.time)}</Text>
        </View>
        
        <View style={styles.appointmentDuration}>
          <Ionicons name="timer" size={16} color={theme.colors.textSecondary} />
          <Text style={styles.durationText}>{item.duration || 30} دقيقة</Text>
        </View>
      </View>
      
      <View style={styles.appointmentActions}>
        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="call" size={16} color={theme.colors.primary} />
          <Text style={styles.actionText}>{t('appointment.call')}</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="chatbubble" size={16} color={theme.colors.primary} />
          <Text style={styles.actionText}>{t('appointment.message')}</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="document-text" size={16} color={theme.colors.primary} />
          <Text style={styles.actionText}>{t('appointment.notes')}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const selectedDateAppointments = getSelectedDateAppointments();

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.primary} />
      
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
          
          <Text style={styles.headerTitle}>{t('doctor.calendar_title')}</Text>
          
          <TouchableOpacity
            style={styles.refreshButton}
            onPress={onRefresh}
          >
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

        {/* مواعيد اليوم المحدد */}
        <View style={styles.appointmentsSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              مواعيد {selectedDate}
            </Text>
            <Text style={styles.appointmentsCount}>
              {selectedDateAppointments.length} موعد
            </Text>
          </View>

          {selectedDateAppointments.length > 0 ? (
            <FlatList
              data={selectedDateAppointments}
              renderItem={renderAppointmentCard}
              keyExtractor={(item) => item._id}
              scrollEnabled={false}
              contentContainerStyle={styles.appointmentsList}
            />
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="calendar-outline" size={64} color={theme.colors.textSecondary} />
                           <Text style={styles.emptyStateTitle}>{t('doctor.no_appointments')}</Text>
             <Text style={styles.emptyStateSubtitle}>
               {t('doctor.no_appointments_today')}
             </Text>
            </View>
          )}
        </View>

        {/* إحصائيات سريعة */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Ionicons name="checkmark-circle" size={24} color={theme.colors.success} />
            <Text style={styles.statNumber}>
              {appointments.filter(a => a.status === 'confirmed').length}
            </Text>
                         <Text style={styles.statLabel}>{t('doctor.confirmed_appointments')}</Text>
          </View>
          
          <View style={styles.statCard}>
            <Ionicons name="time" size={24} color={theme.colors.warning} />
            <Text style={styles.statNumber}>
              {appointments.filter(a => a.status === 'pending').length}
            </Text>
                         <Text style={styles.statLabel}>{t('doctor.pending_appointments')}</Text>
          </View>
          
          <View style={styles.statCard}>
            <Ionicons name="close-circle" size={24} color={theme.colors.error} />
            <Text style={styles.statNumber}>
              {appointments.filter(a => a.status === 'cancelled').length}
            </Text>
                         <Text style={styles.statLabel}>{t('doctor.cancelled_appointments')}</Text>
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
  },
  durationText: {
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
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: theme.colors.white,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginHorizontal: 4,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginTop: 4,
  },
});

export default DoctorCalendarScreen; 