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
  Platform, // ✅ تم إصلاح خطأ Platform
  SafeAreaView,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../utils/theme';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../contexts/NotificationContext';
import { appointmentsAPI } from '../services/api';
import AdvertisementSlider from '../components/AdvertisementSlider';
import { getLocalizedDayName } from '../utils/dateUtils';
import { logError, logApiCall, logApiResponse } from '../utils/logger';
import { API_CONFIG } from '../config/api';

const { width } = Dimensions.get('window');

// ✅✅ الحل لمشكلة الكيبورد: فصلنا الهيدر ليكون مكوناً مستقلاً
// هذا يمنع إعادة تحميله عند الكتابة
const DashboardHeader = React.memo(({ 
  user, 
  profile, 
  notifications, 
  navigation, 
  loading, 
  onRefresh, 
  searchTerm, 
  setSearchTerm, 
  doctorImage,
  todayAttendanceCount,
  todayAppointmentsCount,
  t 
}: any) => {
  return (
    <View>
      {/* Header Section */}
      <LinearGradient colors={[theme.colors.primary, theme.colors.primaryDark]} style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.doctorInfo}>
            {doctorImage ? (
              <Image source={{ uri: doctorImage }} style={styles.doctorImage} />
            ) : (
              <View style={[styles.doctorImage, styles.placeholderImage]}>
                <Ionicons name="person" size={30} color="#FFF" />
              </View>
            )}
            <View>
              <Text style={styles.doctorName}>{profile?.first_name || user?.name}</Text>
              <Text style={styles.doctorSpecialty}>{profile?.specialty || t('common.doctor')}</Text>
            </View>
          </View>
          
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.iconButton} onPress={onRefresh}>
               <Ionicons name="refresh" size={22} color="#FFF" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconButton} onPress={() => navigation.navigate('Notifications')}>
               <Ionicons name="notifications" size={22} color="#FFF" />
               {notifications.filter((n: any) => !n.isRead).length > 0 && (
                 <View style={styles.badge} />
               )}
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>

      <View style={styles.bodyContent}>
        <AdvertisementSlider target="both" style={styles.adSlider} />

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={[styles.statCard, { backgroundColor: '#E8F5E9' }]}>
            <View style={styles.statHeader}>
               <Ionicons name="checkmark-circle" size={20} color={theme.colors.success} />
               <Text style={[styles.statValue, { color: theme.colors.success }]}>{todayAttendanceCount}</Text>
            </View>
            <Text style={styles.statLabel}>{t('doctor.attendance_today')}</Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: '#E3F2FD' }]}>
            <View style={styles.statHeader}>
               <Ionicons name="calendar" size={20} color={theme.colors.primary} />
               <Text style={[styles.statValue, { color: theme.colors.primary }]}>{todayAppointmentsCount}</Text>
            </View>
            <Text style={styles.statLabel}>{t('doctor.today_appointments')}</Text>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.actionsRow}>
           <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.navigate('DoctorAnalytics')}>
              <Ionicons name="stats-chart" size={20} color={theme.colors.primary} />
              <Text style={styles.actionBtnText}>{t('doctor.analytics')}</Text>
           </TouchableOpacity>
           <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.navigate('DoctorProfile')}>
              <Ionicons name="person-circle" size={20} color={theme.colors.primary} />
              <Text style={styles.actionBtnText}>{t('profile.title')}</Text>
           </TouchableOpacity>
        </View>

        {/* قسم البحث */}
        <View style={styles.searchSection}>
           <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>{t('doctor.today_appointments')}</Text>
           </View>
           
           <View style={styles.searchContainer}>
              <Ionicons name="search" size={20} color={theme.colors.primary} style={styles.searchIcon} />
              <TextInput 
                 style={styles.searchInput} 
                 placeholder="ابحث عن اسم المريض..."
                 value={searchTerm}
                 onChangeText={setSearchTerm}
                 placeholderTextColor="#999"
              />
              {searchTerm.length > 0 && (
                 <TouchableOpacity onPress={() => setSearchTerm('')} style={styles.clearButton}>
                    <Ionicons name="close-circle" size={18} color="#999" />
                 </TouchableOpacity>
              )}
           </View>
        </View>
      </View>
    </View>
  );
});

const DoctorDashboardScreen = () => {
  const navigation = useNavigation();
  const { t } = useTranslation();
  const { user, profile } = useAuth();
  const { notifications, isNotificationEnabled, registerForDoctorNotifications } = useNotifications();
  
  // States
  const [searchTerm, setSearchTerm] = useState('');
  const [appointments, setAppointments] = useState<any[]>([]);
  const [allAppointments, setAllAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // --- Helper Functions ---

  const getImageUrl = (img: string | null | undefined) => {
    if (!img) return null;
    if (img.startsWith('https')) return img;
    if (img.startsWith('/uploads/')) return API_CONFIG.BASE_URL + img;
    return null;
  };

  const getDoctorImage = () => {
    const userImage = user?.image || profile?.image;
    return getImageUrl(userImage);
  };

  const getLocalDateString = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const formatTime = (timeString: string) => {
    if (!timeString) return '';
    const [hours, minutes] = timeString.split(':');
    let h = parseInt(hours);
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12;
    h = h ? h : 12; 
    return `${h}:${minutes} ${ampm}`;
  };

  // --- Data Fetching ---

  const fetchDashboardData = async () => {
    const doctorId = profile?._id || (user as any)?._id;
    if (!doctorId) return;
    
    setLoading(true);
    try {
      const response = await appointmentsAPI.getDoctorAppointmentsById(doctorId);
      
      if (response && Array.isArray(response)) {
        const activeAppointments = response.filter(app => app.status !== 'cancelled');
        
        const formattedAppointments = activeAppointments.map(appointment => {
          let formattedDate = appointment.date;
          if (formattedDate && formattedDate.includes('T')) {
            formattedDate = formattedDate.split('T')[0];
          }
          
          return {
            id: appointment._id,
            patientName: appointment.isBookingForOther 
              ? (appointment.patientName || t('calendar.patient_unknown')) 
              : (appointment.userId?.first_name || appointment.patientName || appointment.userName || t('calendar.patient_unknown')),
            
            patientPhone: appointment.isBookingForOther 
              ? (appointment.patientPhone || '') 
              : (appointment.userId?.phone || appointment.patientPhone || ''),
              
            patientId: appointment.userId?._id || appointment.userId,
            isBookingForOther: appointment.isBookingForOther || false,
            bookerName: appointment.bookerName,
            date: formattedDate,
            time: appointment.time,
            status: appointment.status,
            type: appointment.reason || t('calendar.consultation'),
            duration: appointment.duration || 30,
            attendance: appointment.attendance || 'not_marked',
            age: appointment.patientAge || appointment.age,
          };
        });
        
        setAllAppointments(formattedAppointments);
        setAppointments(formattedAppointments);
      }
    } catch (error) {
      logError('Error fetching dashboard', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const doctorId = profile?._id || (user as any)?._id;
    if (doctorId) {
      fetchDashboardData();
      if (!isNotificationEnabled) registerForDoctorNotifications(doctorId);
    }
  }, [profile, user]);

  useFocusEffect(
    useCallback(() => {
      fetchDashboardData();
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchDashboardData();
    setRefreshing(false);
  };

  // --- Logic for Search ---

  const getFilteredTodayAppointments = () => {
    const today = getLocalDateString();
    let todayApps = allAppointments.filter(apt => apt.date === today);

    if (searchTerm.trim()) {
      const lowerSearch = searchTerm.toLowerCase();
      todayApps = todayApps.filter(apt => 
        apt.patientName?.toLowerCase().includes(lowerSearch) || 
        apt.bookerName?.toLowerCase().includes(lowerSearch)
      );
    }
    return todayApps;
  };

  const getTodayAttendanceCount = () => {
    const today = getLocalDateString();
    const todayApps = allAppointments.filter(apt => apt.date === today);
    return todayApps.filter(apt => apt.attendance === 'present').length;
  };

  const markAttendance = useCallback(async (appointmentId: string, attendance: 'present' | 'absent') => {
    setAppointments(prev => prev.map(apt => apt.id === appointmentId ? { ...apt, attendance } : apt));
    try {
      await appointmentsAPI.markAttendance(appointmentId, attendance);
    } catch (error) {
      Alert.alert(t('common.error'), t('attendance.update_error'));
      fetchDashboardData();
    }
  }, []);

  const handleCancelAppointment = (appointmentId: string, patientName: string) => {
    Alert.alert(
      t('appointment.cancel_appointment'),
      t('appointment.cancellation_confirm', { patientName }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        { 
          text: t('common.confirm'), 
          style: 'destructive', 
          onPress: async () => {
            try {
              await appointmentsAPI.cancelAppointment(appointmentId);
              fetchDashboardData();
            } catch (e) {
              Alert.alert(t('common.error'), t('appointment.cancel_error'));
            }
          }
        }
      ]
    );
  };

  const renderAppointmentItem = ({ item }: any) => (
    <View style={styles.card}>
       {item.isBookingForOther && (
         <View style={styles.tagContainer}>
            <View style={styles.otherBadge}>
               <Ionicons name="people" size={12} color="#FFF" />
               <Text style={styles.otherBadgeText}>{t('booking_for_other.info.booking_for_other')}</Text>
            </View>
            {item.bookerName && <Text style={styles.bookerName}>({t('booking_for_other.booker_name')}: {item.bookerName})</Text>}
         </View>
       )}

       <View style={styles.cardRow}>
          <View style={styles.timeColumn}>
             <Text style={styles.timeText}>{formatTime(item.time)}</Text>
             <Text style={styles.durationText}>{item.duration} {t('common.minutes')}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoColumn}>
             <Text style={styles.patientName}>{item.patientName}</Text>
             <Text style={styles.reasonText}>{item.type}</Text>
             <View style={styles.metaRow}>
                {item.age && (
                   <View style={styles.metaItem}>
                      <Ionicons name="calendar-outline" size={12} color="#666" />
                      <Text style={styles.metaText}>{item.age} {t('validation.years')}</Text>
                   </View>
                )}
                <View style={styles.metaItem}>
                   <Ionicons name="call-outline" size={12} color="#666" />
                   <Text style={styles.metaText}>{item.patientPhone || t('common.not_specified')}</Text>
                </View>
             </View>
          </View>

          <View style={styles.statusColumn}>
             <Ionicons 
                name={item.attendance === 'present' ? "checkmark-circle" : "ellipse-outline"} 
                size={24} 
                color={item.attendance === 'present' ? theme.colors.success : "#CCC"} 
             />
          </View>
       </View>

       <View style={styles.cardFooter}>
          <TouchableOpacity 
             style={[styles.footerBtn, item.attendance === 'present' ? styles.btnSuccess : styles.btnOutline]}
             onPress={() => markAttendance(item.id, 'present')}
             disabled={item.attendance === 'present'}
          >
             <Text style={[styles.footerBtnText, item.attendance === 'present' && {color: '#FFF'}]}>
                {item.attendance === 'present' ? t('doctor.attendance_marked') : t('doctor.present')}
             </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.footerIconBtn} onPress={() => handleCancelAppointment(item.id, item.patientName)}>
             <Ionicons name="close-circle-outline" size={24} color={theme.colors.error} />
          </TouchableOpacity>
       </View>
    </View>
  );

  const todayAppointments = getFilteredTodayAppointments();
  
  // حساب عدد مواعيد اليوم للبحث
  const todayCount = allAppointments.filter(a => a.date === getLocalDateString()).length;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.primary} />
      
      <FlatList
        data={todayAppointments}
        keyExtractor={(item) => item.id}
        renderItem={renderAppointmentItem}
        // ✅ استخدام الهيدر المستقل لتجنب إعادة تحميل الكيبورد
        ListHeaderComponent={
          <DashboardHeader 
             user={user}
             profile={profile}
             notifications={notifications}
             navigation={navigation}
             loading={loading}
             onRefresh={fetchDashboardData}
             searchTerm={searchTerm}
             setSearchTerm={setSearchTerm}
             doctorImage={getDoctorImage()}
             todayAttendanceCount={getTodayAttendanceCount()}
             todayAppointmentsCount={todayCount}
             t={t}
          />
        }
        ListFooterComponent={<View style={{ height: 100 }} />}
        ListEmptyComponent={
           <View style={styles.emptyContainer}>
              <Ionicons name={searchTerm ? "search-outline" : "calendar-outline"} size={48} color="#CCC" />
              <Text style={styles.emptyText}>
                 {searchTerm ? `لا توجد نتائج بحث لـ "${searchTerm}"` : t('doctor.no_confirmed_appointments_for_day')}
              </Text>
           </View>
        }
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />}
        contentContainerStyle={styles.listContent}
        keyboardShouldPersistTaps="handled" // ✅ مهم لعمل الكيبورد بسلاسة
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F9FC' },
  
  header: { 
    paddingTop: Platform.OS === 'android' ? 40 : 50, 
    paddingBottom: 25, 
    borderBottomLeftRadius: 30, 
    borderBottomRightRadius: 30,
    elevation: 5,
  },
  headerContent: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, alignItems: 'center' },
  doctorInfo: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  doctorImage: { width: 55, height: 55, borderRadius: 27.5, borderWidth: 2, borderColor: '#FFF' },
  placeholderImage: { backgroundColor: 'rgba(255,255,255,0.3)', justifyContent: 'center', alignItems: 'center' },
  doctorName: { fontSize: 18, fontWeight: 'bold', color: '#FFF' },
  doctorSpecialty: { fontSize: 13, color: 'rgba(255,255,255,0.85)' },
  headerActions: { flexDirection: 'row', gap: 10 },
  iconButton: { padding: 8, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 12 },
  badge: { width: 10, height: 10, backgroundColor: 'red', borderRadius: 5, position: 'absolute', top: 8, right: 8, borderWidth: 1.5, borderColor: theme.colors.primary },

  bodyContent: { paddingHorizontal: 20, marginTop: -15 },
  adSlider: { marginBottom: 15, borderRadius: 12, overflow: 'hidden' },
  
  statsGrid: { flexDirection: 'row', gap: 12, marginBottom: 15 },
  statCard: { flex: 1, padding: 15, borderRadius: 16, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5 },
  statHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 },
  statValue: { fontSize: 22, fontWeight: 'bold' },
  statLabel: { fontSize: 12, color: '#666' },

  actionsRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFF', padding: 12, borderRadius: 12, gap: 8, elevation: 1 },
  actionBtnText: { fontSize: 14, fontWeight: '600', color: theme.colors.textPrimary },

  searchSection: { marginBottom: 15 },
  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: theme.colors.textPrimary },
  
  searchContainer: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#FFF', 
    borderRadius: 12, 
    paddingHorizontal: 12, 
    paddingVertical: Platform.OS === 'android' ? 2 : 10,
    borderWidth: 1, 
    borderColor: '#EEE',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  searchIcon: { marginRight: 10 },
  searchInput: { flex: 1, fontSize: 14, color: '#333', textAlign: 'right' },
  clearButton: { padding: 4 },

  card: { backgroundColor: '#FFF', borderRadius: 16, padding: 15, marginBottom: 12, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05 },
  tagContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, flexWrap: 'wrap' },
  otherBadge: { flexDirection: 'row', backgroundColor: theme.colors.primary, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, alignItems: 'center', gap: 4 },
  otherBadgeText: { color: '#FFF', fontSize: 10, fontWeight: 'bold' },
  bookerName: { fontSize: 11, color: '#666', marginLeft: 8 },
  
  cardRow: { flexDirection: 'row', alignItems: 'center' },
  timeColumn: { alignItems: 'center', minWidth: 65 },
  timeText: { fontSize: 16, fontWeight: 'bold', color: theme.colors.textPrimary },
  durationText: { fontSize: 11, color: '#888', marginTop: 2 },
  
  divider: { width: 1, height: 40, backgroundColor: '#EEE', marginHorizontal: 12 },
  
  infoColumn: { flex: 1 },
  patientName: { fontSize: 16, fontWeight: 'bold', color: theme.colors.textPrimary },
  reasonText: { fontSize: 13, color: theme.colors.primary, marginBottom: 4 },
  metaRow: { flexDirection: 'row', gap: 10 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 11, color: '#666' },

  statusColumn: { justifyContent: 'center', alignItems: 'flex-end' },

  cardFooter: { flexDirection: 'row', marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#F5F5F5', alignItems: 'center', justifyContent: 'space-between' },
  footerBtn: { paddingVertical: 8, paddingHorizontal: 20, borderRadius: 20, flex: 1, marginRight: 10, alignItems: 'center' },
  btnSuccess: { backgroundColor: theme.colors.success },
  btnOutline: { borderWidth: 1, borderColor: theme.colors.success, backgroundColor: 'transparent' },
  footerBtnText: { fontSize: 13, fontWeight: '600', color: theme.colors.success },
  footerIconBtn: { padding: 5 },

  listContent: { paddingBottom: 20 },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', marginTop: 50 },
  emptyText: { marginTop: 10, color: '#999', fontSize: 15 },
});

export default DoctorDashboardScreen;