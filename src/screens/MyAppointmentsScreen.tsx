import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  Image,
  Dimensions,
  StatusBar,
  RefreshControl,
  TextInput,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native'; // ✅ استيراد useFocusEffect
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../utils/theme';
import { api, appointmentsAPI } from '../services/api';
import { API_CONFIG } from '../config/api'; 
import { mapSpecialtyToLocalized } from '../utils/specialtyMapper';
import Toast from '../components/Toast';
import CustomModal from '../components/CustomModal';
import { useToast } from '../hooks/useToast';
import { useModal } from '../hooks/useModal';
import { useAuth } from '../contexts/AuthContext';

const MyAppointmentsScreen = () => {
  const navigation = useNavigation();
  const { t } = useTranslation();
  const { user } = useAuth();
  const { toast, showToast, hideToast, showSuccess, showError } = useToast();
  const { modal, showConfirm, hideModal } = useModal(); 

  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'upcoming' | 'today' | 'archived'>('upcoming');
  const [searchText, setSearchText] = useState('');

  // ✅ استخدام useFocusEffect لتحديث البيانات عند العودة للصفحة
  useFocusEffect(
    useCallback(() => {
      if (user?.id) {
        fetchAppointments();
      }
    }, [user?.id])
  );

  const getImageUrl = (imagePath: string | null | undefined): string | null => {
    if (!imagePath || imagePath === 'null' || imagePath === 'undefined' || imagePath === '') return null;
    if (imagePath.startsWith('http')) return imagePath;
    return `${API_CONFIG.BASE_URL}/${imagePath.replace(/^\/+/, '')}`;
  };

  const fetchAppointments = async () => {
    // ✅ نجعل التحميل خفياً (بدون شاشة تحميل كاملة) إذا كانت البيانات موجودة مسبقاً
    if (appointments.length === 0) setLoading(true);
    
    try {
      if (!user?.id) { setAppointments([]); return; }
      
      const response = await api.get(`/user-appointments/${user.id}`);
      
      if (Array.isArray(response)) {
        const formattedAppointments = response.map((appointment: any) => {
            const docObj = appointment.doctorId || appointment.doctor || {};
            const rawDoctorImage = 
                docObj.imageUrl || 
                docObj.image || 
                docObj.profile_image || 
                docObj.profileImage ||
                null;

            return {
                id: appointment._id || appointment.id,
                _id: appointment._id || appointment.id,
                doctorId: docObj._id || docObj.id,
                doctorName: appointment.doctorName || docObj.name || t('common.doctor'),
                doctorSpecialty: docObj.specialty || t('common.general_specialty'),
                doctorImage: rawDoctorImage, 
                date: appointment.date,
                time: appointment.time,
                status: appointment.status || 'pending',
                type: appointment.type || 'consultation',
                location: docObj.clinicLocation || t('common.clinic_location'),
                reason: appointment.reason || '',
                isBookingForOther: appointment.isBookingForOther || false,
                patientName: appointment.patientName || '',
                attendance: appointment.attendance || 'not_set',
            };
        });
        setAppointments(formattedAppointments);
      }
    } catch (error) { 
        console.log("Error fetching appointments:", error);
        setAppointments([]); 
    } 
    finally { setLoading(false); }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchAppointments();
    setRefreshing(false);
  };

  // دوال التاريخ
  const getDayNumber = (dateString: string) => {
    try { const date = new Date(dateString); return date.getDate(); } catch { return ''; }
  };
  const getMonthName = (dateString: string) => {
    try { const date = new Date(dateString); return date.toLocaleDateString('ar-IQ', { month: 'short' }); } catch { return ''; }
  };
  const getDayName = (dateString: string) => {
    try { const date = new Date(dateString); return date.toLocaleDateString('ar-IQ', { weekday: 'long' }); } catch { return ''; }
  };

  // الفلترة
  const getLocalDateString = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  const isPastAppointment = (dateString: string) => dateString < getLocalDateString();
  const isTodayAppointment = (dateString: string) => dateString === getLocalDateString();
  const isUpcomingAppointment = (dateString: string) => dateString > getLocalDateString();

  let filteredAppointments = [];
  if (selectedTab === 'today') {
    filteredAppointments = appointments.filter(apt => apt.status !== 'cancelled' && isTodayAppointment(apt.date));
  } else if (selectedTab === 'archived') {
    filteredAppointments = appointments.filter(apt => apt.status === 'cancelled' || isPastAppointment(apt.date));
  } else {
    filteredAppointments = appointments.filter(apt => apt.status !== 'cancelled' && (isTodayAppointment(apt.date) || isUpcomingAppointment(apt.date)));
  }

  if (searchText.trim()) {
      const lower = searchText.toLowerCase();
      filteredAppointments = filteredAppointments.filter(apt => apt.isBookingForOther && apt.patientName.toLowerCase().includes(lower));
  }

  const handleDoctorPress = (appointment: any) => {
    if (!user) {
      hideModal();
      (navigation as any).navigate('Login');
      return;
    }
    const resolvedDoctorId = appointment.doctorId; 
    if (resolvedDoctorId) {
      (navigation as any).navigate('DoctorDetails', { doctorId: String(resolvedDoctorId) });
    }
  };

  const onCancelByUser = async (appointmentId: string) => {
    showConfirm(
        t('appointment.cancel_appointment'),
        t('appointment.confirm_cancel'),
        async () => {
            try {
                showToast(t('common.loading'), 'info');
                const result = await appointmentsAPI.cancelAppointment(appointmentId);
                
                if (result && result.success) {
                    setAppointments(prev => prev.filter(apt => (apt._id || apt.id) !== appointmentId));
                    hideModal();
                    showSuccess(t('success.title'), t('appointment.cancel_appointment'));
                    await fetchAppointments();
                } else {
                    hideModal();
                    showError(t('error.title'), t('error.message'));
                }
            } catch (err) {
                hideModal();
                showError(t('error.title'), t('error.message'));
            }
        }
    );
  };

  const getStatusColor = (status: string) => {
    if (status === 'confirmed') return theme.colors.success;
    if (status === 'cancelled') return theme.colors.error;
    if (status === 'completed') return theme.colors.primary;
    return theme.colors.warning;
  };
  
  const getStatusText = (status: string) => {
      if (status === 'confirmed') return t('appointments.status_confirmed');
      if (status === 'completed') return t('appointments.status_completed');
      if (status === 'cancelled') return t('appointments.status_cancelled');
      if (status === 'pending') return t('appointments.status_pending');
      return status;
  };

  const renderAppointmentCard = ({ item }: any) => {
    const validImage = getImageUrl(item.doctorImage);

    return (
        <TouchableOpacity 
          style={styles.cardContainer} 
          activeOpacity={0.9}
          onPress={() => handleDoctorPress(item)}
        >
          <View style={styles.cardMainRow}>
            <View style={styles.dateBox}>
              <Text style={styles.dateDayName}>{getDayName(item.date)}</Text>
              <Text style={styles.dateNumber}>{getDayNumber(item.date)}</Text>
              <Text style={styles.dateMonth}>{getMonthName(item.date)}</Text>
            </View>

            <View style={styles.cardContent}>
              <View style={styles.doctorHeader}>
                {validImage ? (
                    <Image 
                        source={{ uri: validImage }} 
                        style={styles.avatar} 
                        resizeMode="cover"
                        key={validImage} 
                    />
                ) : (
                    <Image 
                        source={require('../../assets/icon.png')} 
                        style={styles.avatar} 
                        resizeMode="cover"
                    />
                )}
                
                <View style={styles.doctorTextInfo}>
                  <Text style={styles.cardDoctorName} numberOfLines={1}>{item.doctorName}</Text>
                  <Text style={styles.cardSpecialty} numberOfLines={1}>{mapSpecialtyToLocalized(item.doctorSpecialty)}</Text>
                </View>
              </View>

              <View style={styles.divider} />

              <View style={styles.metaContainer}>
                <View style={styles.metaItem}>
                  <Ionicons name="time-outline" size={14} color={theme.colors.textSecondary} />
                  <Text style={styles.metaText}>{item.time}</Text>
                </View>
                <View style={styles.metaItem}>
                    <View style={[styles.statusDot, { backgroundColor: getStatusColor(item.status) }]} />
                    <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
                        {getStatusText(item.status)}
                    </Text>
                </View>
              </View>
              
              {item.isBookingForOther && (
                 <View style={styles.patientBadge}>
                    <Ionicons name="person" size={12} color={theme.colors.primary} />
                    <Text style={styles.patientBadgeText}>{item.patientName}</Text>
                 </View>
              )}
            </View>
          </View>

          <View style={styles.cardActions}>
            {item.status !== 'cancelled' && !isPastAppointment(item.date) && (
                <TouchableOpacity 
                    style={styles.actionBtnSecondary}
                    onPress={() => onCancelByUser(item._id || item.id)}
                >
                    <Text style={styles.actionBtnTextSecondary}>{t('appointment.cancel')}</Text>
                </TouchableOpacity>
            )}
            
            <TouchableOpacity style={styles.actionBtnPrimary}>
                <Text style={styles.actionBtnTextPrimary}>{t('appointment.details')}</Text>
                <Ionicons name="arrow-back" size={16} color="#fff" style={{transform: [{rotate: '180deg'}], marginLeft: 4}} /> 
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.primary} />
      
      <View style={styles.headerContainer}>
        <LinearGradient
            colors={[theme.colors.primary, theme.colors.primaryDark]}
            style={styles.headerGradient}
        >
            <View style={styles.headerContent}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.screenTitle}>{t('appointments.my_appointments')}</Text>
                <View style={{width: 24}} /> 
            </View>
            <View style={styles.statsContainer}>
                <Text style={styles.statsText}>
                    {appointments.length} {t('appointments.appointment_count')}
                </Text>
            </View>
        </LinearGradient>
      </View>

      <View style={styles.tabsContainer}>
         <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsScroll}>
            {[
                { key: 'upcoming', label: t('appointments.upcoming_tab') },
                { key: 'today', label: t('appointments.today_tab') },
                { key: 'archived', label: t('appointments.archived_tab') }
            ].map((tab) => (
                <TouchableOpacity
                    key={tab.key}
                    style={[styles.tabItem, selectedTab === tab.key && styles.tabItemActive]}
                    onPress={() => setSelectedTab(tab.key as any)}
                >
                    <Text style={[styles.tabText, selectedTab === tab.key && styles.tabTextActive]}>
                        {tab.label}
                    </Text>
                </TouchableOpacity>
            ))}
         </ScrollView>
      </View>

      <View style={styles.searchSection}>
         <View style={styles.searchBox}>
            <Ionicons name="search" size={20} color={theme.colors.textSecondary} />
            <TextInput 
                style={styles.searchInput}
                placeholder={t('appointments.search_patient_placeholder')}
                value={searchText}
                onChangeText={setSearchText}
            />
            {searchText.length > 0 && (
                <TouchableOpacity onPress={() => setSearchText('')}>
                    <Ionicons name="close-circle" size={18} color={theme.colors.textSecondary} />
                </TouchableOpacity>
            )}
         </View>
      </View>

      <View style={styles.content}>
        {loading && appointments.length === 0 ? ( // ✅ تحميل فقط إذا كانت القائمة فارغة
            <View style={styles.centerView}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
            </View>
        ) : filteredAppointments.length === 0 ? (
            <View style={styles.emptyView}>
                <Ionicons name="calendar-outline" size={64} color="#DDD" style={{marginBottom: 10}} /> 
                <Text style={styles.emptyText}>{t('appointments.no_appointments')}</Text>
                <TouchableOpacity style={styles.bookNowBtn} onPress={() => navigation.navigate('UserHome' as never)}>
                    <Text style={styles.bookNowText}>{t('appointment.book_now')}</Text>
                </TouchableOpacity>
            </View>
        ) : (
            <FlatList
                data={filteredAppointments}
                renderItem={renderAppointmentCard}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listPadding}
                showsVerticalScrollIndicator={false}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            />
        )}
      </View>

      <Toast visible={toast.visible} message={toast.message} type={toast.type} onHide={hideToast} />
      
      <CustomModal 
        visible={modal.visible} 
        title={modal.title}
        message={modal.message}
        type={modal.type}
        buttons={modal.buttons}
        onClose={hideModal} 
        showCloseButton={modal.showCloseButton}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F8FA' },
  headerContainer: { marginBottom: 0 },
  headerGradient: {
      paddingTop: 50, paddingBottom: 20, paddingHorizontal: 20,
      borderBottomLeftRadius: 24, borderBottomRightRadius: 24,
  },
  headerContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  screenTitle: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
  backButton: { padding: 4 },
  statsContainer: { alignItems: 'center' },
  statsText: { color: 'rgba(255,255,255,0.8)', fontSize: 13 },

  tabsContainer: { marginTop: -20, paddingHorizontal: 16 },
  tabsScroll: { paddingVertical: 8 },
  tabItem: {
      backgroundColor: '#fff', paddingVertical: 10, paddingHorizontal: 20,
      borderRadius: 25, marginRight: 10,
      shadowColor: '#000', shadowOffset: {width:0, height:2}, shadowOpacity: 0.05, shadowRadius: 4, elevation: 3
  },
  tabItemActive: { backgroundColor: theme.colors.primary },
  tabText: { fontSize: 14, color: theme.colors.textSecondary, fontWeight: '600' },
  tabTextActive: { color: '#fff' },

  searchSection: { paddingHorizontal: 20, marginTop: 10, marginBottom: 5 },
  searchBox: {
      flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
      borderRadius: 12, paddingHorizontal: 12, height: 46,
      borderWidth: 1, borderColor: '#EEE'
  },
  searchInput: { flex: 1, marginLeft: 10, fontSize: 14, color: '#333', textAlign: 'right' },

  content: { flex: 1 },
  listPadding: { padding: 20, paddingBottom: 50 },
  centerView: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  
  emptyView: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 50 },
  emptyText: { fontSize: 16, color: '#999', marginBottom: 20 },
  bookNowBtn: { backgroundColor: theme.colors.primary, paddingHorizontal: 30, paddingVertical: 12, borderRadius: 25 },
  bookNowText: { color: '#fff', fontWeight: 'bold' },

  cardContainer: {
      backgroundColor: '#fff', borderRadius: 16, marginBottom: 16,
      shadowColor: '#000', shadowOffset: {width:0, height: 2}, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
      borderWidth: 1, borderColor: '#F0F0F0'
  },
  cardMainRow: { flexDirection: 'row', padding: 16 },
  
  dateBox: {
      width: 60, backgroundColor: '#F8F9FA', borderRadius: 12,
      justifyContent: 'center', alignItems: 'center', paddingVertical: 8, marginRight: 12,
      borderWidth: 1, borderColor: '#EEE'
  },
  dateDayName: { fontSize: 10, color: '#999', marginBottom: 2 },
  dateNumber: { fontSize: 22, fontWeight: 'bold', color: theme.colors.primary },
  dateMonth: { fontSize: 12, fontWeight: '600', color: theme.colors.textPrimary },

  cardContent: { flex: 1 },
  doctorHeader: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#EEE', marginRight: 10 },
  doctorTextInfo: { flex: 1 },
  cardDoctorName: { fontSize: 15, fontWeight: '700', color: theme.colors.textPrimary, textAlign: 'left' },
  cardSpecialty: { fontSize: 12, color: theme.colors.textSecondary, textAlign: 'left' },
  
  divider: { height: 1, backgroundColor: '#F0F0F0', marginVertical: 10 },
  
  metaContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  metaItem: { flexDirection: 'row', alignItems: 'center' },
  metaText: { fontSize: 12, color: '#666', marginLeft: 4, fontWeight: '500' },
  
  statusDot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
  statusText: { fontSize: 12, fontWeight: '600' },

  patientBadge: {
      flexDirection: 'row', alignItems: 'center', marginTop: 8, 
      backgroundColor: theme.colors.primary + '10', padding: 6, borderRadius: 6, alignSelf: 'flex-start'
  },
  patientBadgeText: { fontSize: 11, color: theme.colors.primary, marginLeft: 6 },

  cardActions: {
      flexDirection: 'row', borderTopWidth: 1, borderTopColor: '#F0F0F0',
  },
  actionBtnSecondary: {
      flex: 1, paddingVertical: 12, alignItems: 'center', borderRightWidth: 1, borderRightColor: '#F0F0F0',
  },
  actionBtnTextSecondary: { fontSize: 13, color: theme.colors.error, fontWeight: '600' },
  actionBtnPrimary: {
      flex: 1, paddingVertical: 12, alignItems: 'center', backgroundColor: theme.colors.primary,
      borderBottomRightRadius: 16, borderBottomLeftRadius: Platform.OS === 'ios' ? 0 : 16
  },
  actionBtnTextPrimary: { fontSize: 13, color: '#fff', fontWeight: '600', flexDirection: 'row' },
});

export default MyAppointmentsScreen;