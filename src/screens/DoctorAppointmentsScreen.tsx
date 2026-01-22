import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  Platform,
  FlatList,
  StatusBar,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../utils/theme';
import { appointmentsAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../contexts/NotificationContext';
import { getLocalizedDayName } from '../utils/dateUtils';
import { logError, logApiCall, logApiResponse } from '../utils/logger';

interface Appointment {
  _id: string;
  id?: string;
  date: string;
  time: string;
  reason: string;
  patientName: string;
  patientPhone: string;
  status: string;
  attendance: string;
  isBookingForOther: boolean;
  bookerName?: string;
  age?: number;
  patientAge?: number;
  userName?: string;
  userId?: any;
}

const ITEMS_PER_PAGE = 10;

const DoctorAppointmentsScreen: React.FC = () => {
  const { t } = useTranslation();
  const { profile } = useAuth();
  const { sendAppointmentCancellationNotification } = useNotifications();
  
  // Data States
  const [allAppointments, setAllAppointments] = useState<Appointment[]>([]); // المخزن الكامل
  const [displayedAppointments, setDisplayedAppointments] = useState<Appointment[]>([]); // المعروض حالياً
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  // UI States
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all'); // all, present, absent
  const [showPastAppointments, setShowPastAppointments] = useState(false);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  useEffect(() => {
    if (profile?._id) {
      fetchAppointments();
    }
  }, [profile]);

  // تحديث القائمة المعروضة عند تغيير الفلاتر أو البحث
  useEffect(() => {
    applyFiltersAndSort();
  }, [searchTerm, filterStatus, showPastAppointments, sortOrder, allAppointments]);

  const fetchAppointments = async () => {
    if (!profile?._id) return;
    
    try {
      setLoading(true);
      const response = await appointmentsAPI.getDoctorAppointmentsById(profile._id);
      
      if (response && Array.isArray(response)) {
        const processed = response.map((apt: any) => ({
          ...apt,
          id: apt._id,
          patientName: apt.isBookingForOther 
            ? (apt.patientName || t('calendar.patient_unknown')) 
            : (apt.userId?.first_name || apt.patientName || apt.userName || t('calendar.patient_unknown')),
          patientPhone: apt.isBookingForOther 
            ? (apt.patientPhone || '') 
            : (apt.userId?.phone || apt.patientPhone || ''),
          attendance: apt.attendance || 'not_marked',
        }));
        
        setAllAppointments(processed);
      }
    } catch (error) {
      logError('Error fetching appointments', error);
      Alert.alert(t('common.error'), t('appointments.fetch_error'));
    } finally {
      setLoading(false);
    }
  };

  const applyFiltersAndSort = () => {
    let filtered = [...allAppointments];
    const today = new Date().toISOString().split('T')[0];

    // 1. استبعاد الملغاة
    filtered = filtered.filter(a => a.status !== 'cancelled');

    // 2. البحث
    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      filtered = filtered.filter(a => 
        a.patientName?.toLowerCase().includes(lower) ||
        a.bookerName?.toLowerCase().includes(lower) ||
        a.reason?.toLowerCase().includes(lower)
      );
    }

    // 3. فلترة الحضور
    if (filterStatus !== 'all') {
      filtered = filtered.filter(a => a.attendance === filterStatus);
    }

    // 4. المواعيد السابقة
    if (!showPastAppointments) {
      filtered = filtered.filter(a => {
         const d = a.date.includes('T') ? a.date.split('T')[0] : a.date;
         return d >= today;
      });
    }

    // 5. الترتيب
    filtered.sort((a, b) => {
      const da = new Date(a.date).getTime();
      const db = new Date(b.date).getTime();
      return sortOrder === 'asc' ? da - db : db - da;
    });

    // إعادة ضبط التصفح (Pagination)
    setPage(1);
    setHasMore(filtered.length > ITEMS_PER_PAGE);
    setDisplayedAppointments(filtered.slice(0, ITEMS_PER_PAGE));
  };

  const loadMoreAppointments = () => {
    if (loadingMore || !hasMore) return;

    setLoadingMore(true);
    // محاكاة تأخير بسيط لتحسين تجربة المستخدم
    setTimeout(() => {
      const nextPage = page + 1;
      const startIndex = (nextPage - 1) * ITEMS_PER_PAGE;
      const endIndex = startIndex + ITEMS_PER_PAGE;
      
      // هنا نعيد تطبيق الفلترة (لأننا نأخذ من القائمة المفلترة "نظرياً")
      // لتحسين الأداء، سنستخدم displayedAppointments الحالية ونضيف عليها
      // (ملاحظة: الطريقة المثلى هي حفظ القائمة المفلترة بالكامل في state منفصل، لكن للتبسيط هنا:)
      
      // سنعيد تطبيق الفلترة للحصول على القائمة الكاملة المفلترة
      let filteredFull = [...allAppointments]; 
      // ... (نفس منطق applyFiltersAndSort لكن بدون setDisplayed)
      const today = new Date().toISOString().split('T')[0];
      filteredFull = filteredFull.filter(a => a.status !== 'cancelled');
      if (searchTerm) {
         const lower = searchTerm.toLowerCase();
         filteredFull = filteredFull.filter(a => a.patientName?.toLowerCase().includes(lower));
      }
      if (filterStatus !== 'all') filteredFull = filteredFull.filter(a => a.attendance === filterStatus);
      if (!showPastAppointments) {
         filteredFull = filteredFull.filter(a => (a.date.includes('T') ? a.date.split('T')[0] : a.date) >= today);
      }
      filteredFull.sort((a, b) => {
         const da = new Date(a.date).getTime();
         const db = new Date(b.date).getTime();
         return sortOrder === 'asc' ? da - db : db - da;
      });

      const nextBatch = filteredFull.slice(startIndex, endIndex);
      
      if (nextBatch.length > 0) {
        setDisplayedAppointments(prev => [...prev, ...nextBatch]);
        setPage(nextPage);
        setHasMore(endIndex < filteredFull.length);
      } else {
        setHasMore(false);
      }
      setLoadingMore(false);
    }, 500);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchAppointments();
    setRefreshing(false);
  };

  // --- Handlers ---

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
              // تحديث محلي
              setAllAppointments(prev => prev.filter(a => a._id !== appointmentId));
              Alert.alert(t('common.success'), t('appointment.cancel_success'));
            } catch (e) {
              Alert.alert(t('common.error'), t('appointment.cancel_error'));
            }
          }
        }
      ]
    );
  };

  const markAttendance = async (appointmentId: string, attendance: 'present' | 'absent') => {
    // تحديث متفائل (Optimistic Update)
    setAllAppointments(prev => prev.map(a => a._id === appointmentId ? { ...a, attendance } : a));
    
    try {
      await appointmentsAPI.markAttendance(appointmentId, attendance);
    } catch (error) {
      // تراجع عند الخطأ
      fetchAppointments();
      Alert.alert(t('common.error'), t('attendance.update_error'));
    }
  };

  // --- Render Items ---

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const day = getLocalizedDayName(dateString, t);
    return `${day} ${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
  };

  const renderAppointmentItem = ({ item }: { item: Appointment }) => (
    <View style={styles.card}>
       {/* Header: Date & Time */}
       <View style={styles.cardHeader}>
          <View style={styles.dateBadge}>
             <Ionicons name="calendar" size={14} color={theme.colors.primary} />
             <Text style={styles.dateText}>{formatDate(item.date)}</Text>
          </View>
          <View style={styles.timeBadge}>
             <Ionicons name="time" size={14} color="#FFF" />
             <Text style={styles.timeText}>{item.time}</Text>
          </View>
       </View>

       {/* Body: Patient Info */}
       <View style={styles.cardBody}>
          <View style={styles.patientRow}>
             <View style={styles.avatar}>
                <Ionicons name="person" size={20} color="#FFF" />
             </View>
             <View style={{flex: 1}}>
                <Text style={styles.patientName}>{item.patientName}</Text>
                {item.isBookingForOther && (
                   <Text style={styles.bookerText}>
                      {t('booking_for_other.booker_name')}: {item.bookerName}
                   </Text>
                )}
             </View>
          </View>

          <View style={styles.detailsGrid}>
             <View style={styles.detailItem}>
                <Ionicons name="call-outline" size={14} color="#666" />
                <Text style={styles.detailText}>{item.patientPhone || t('common.not_specified')}</Text>
             </View>
             <View style={styles.detailItem}>
                <Ionicons name="happy-outline" size={14} color="#666" />
                <Text style={styles.detailText}>
                   {(item.patientAge || item.age) ? `${item.patientAge || item.age} ${t('validation.years')}` : '-'}
                </Text>
             </View>
             {item.reason && (
                <View style={[styles.detailItem, { width: '100%' }]}>
                   <Ionicons name="document-text-outline" size={14} color="#666" />
                   <Text style={styles.detailText} numberOfLines={1}>{item.reason}</Text>
                </View>
             )}
          </View>
       </View>

       {/* Footer: Actions */}
       <View style={styles.cardFooter}>
          <TouchableOpacity 
             style={[
                styles.actionButton, 
                item.attendance === 'present' ? styles.btnPresentActive : styles.btnPresent
             ]}
             onPress={() => markAttendance(item._id, 'present')}
             disabled={item.attendance === 'present'}
          >
             <Ionicons name="checkmark-circle" size={18} color={item.attendance === 'present' ? "#FFF" : theme.colors.success} />
             <Text style={[styles.btnText, item.attendance === 'present' && { color: '#FFF' }]}>
                {item.attendance === 'present' ? t('doctor.attendance_marked') : t('doctor.present')}
             </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.cancelBtn} onPress={() => handleCancelAppointment(item._id, item.patientName)}>
             <Ionicons name="close-circle-outline" size={22} color={theme.colors.error} />
          </TouchableOpacity>
       </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.primary} />
      
      {/* Header & Controls */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t('appointments.doctor_appointments')}</Text>
        <Text style={styles.countText}>{allAppointments.length} {t('doctor.appointments_count_plural')}</Text>
      </View>

      <View style={styles.controls}>
        {/* Search */}
        <View style={styles.searchBox}>
           <Ionicons name="search" size={20} color="#999" />
           <TextInput 
              style={styles.input}
              placeholder={t('appointments.search_placeholder')}
              value={searchTerm}
              onChangeText={setSearchTerm}
           />
           {searchTerm.length > 0 && (
              <TouchableOpacity onPress={() => setSearchTerm('')}>
                 <Ionicons name="close-circle" size={18} color="#999" />
              </TouchableOpacity>
           )}
        </View>

        {/* Filters Row */}
        <View style={styles.filtersRow}>
           <TouchableOpacity 
              style={[styles.filterChip, filterStatus === 'all' && styles.filterChipActive]}
              onPress={() => setFilterStatus('all')}
           >
              <Text style={[styles.filterText, filterStatus === 'all' && styles.filterTextActive]}>{t('appointments.all')}</Text>
           </TouchableOpacity>
           
           <TouchableOpacity 
              style={[styles.filterChip, filterStatus === 'present' && styles.filterChipActive]}
              onPress={() => setFilterStatus('present')}
           >
              <Text style={[styles.filterText, filterStatus === 'present' && styles.filterTextActive]}>{t('appointments.present')}</Text>
           </TouchableOpacity>

           <TouchableOpacity 
              style={[styles.iconButton, showPastAppointments && styles.iconButtonActive]}
              onPress={() => setShowPastAppointments(!showPastAppointments)}
           >
              <Ionicons name="time-outline" size={20} color={showPastAppointments ? "#FFF" : theme.colors.primary} />
           </TouchableOpacity>
           
           <TouchableOpacity 
              style={styles.iconButton}
              onPress={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
           >
              <Ionicons name={sortOrder === 'asc' ? "arrow-up" : "arrow-down"} size={20} color={theme.colors.primary} />
           </TouchableOpacity>
        </View>
      </View>

      {/* List */}
      <FlatList
        data={displayedAppointments}
        keyExtractor={(item) => item._id}
        renderItem={renderAppointmentItem}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />}
        onEndReached={loadMoreAppointments}
        onEndReachedThreshold={0.5}
        ListFooterComponent={
           loadingMore ? <ActivityIndicator size="small" color={theme.colors.primary} style={{ margin: 20 }} /> : <View style={{height: 40}} />
        }
        ListEmptyComponent={
           !loading && (
             <View style={styles.emptyState}>
                <Ionicons name="calendar-outline" size={64} color="#DDD" />
                <Text style={styles.emptyText}>{t('appointments.no_matching_appointments')}</Text>
             </View>
           )
        }
      />

      {loading && (
         <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
         </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },
  
  // Header
  header: {
    backgroundColor: theme.colors.primary,
    paddingTop: Platform.OS === 'android' ? 40 : 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#FFF' },
  countText: { fontSize: 14, color: 'rgba(255,255,255,0.8)', marginTop: 4 },

  // Controls
  controls: { padding: 16 },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  input: { flex: 1, marginLeft: 10, fontSize: 16, textAlign: 'right' },
  
  filtersRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  filterChipActive: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
  filterText: { fontSize: 13, color: '#666', fontWeight: '500' },
  filterTextActive: { color: '#FFF' },
  
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  iconButtonActive: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },

  // List
  listContent: { padding: 16, paddingBottom: 80 },
  
  // Card
  card: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 12,
    backgroundColor: '#FAFAFA',
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  dateBadge: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dateText: { fontSize: 13, color: theme.colors.textPrimary, fontWeight: '600' },
  timeBadge: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 4, 
    backgroundColor: theme.colors.primary, 
    paddingHorizontal: 10, 
    paddingVertical: 4, 
    borderRadius: 8 
  },
  timeText: { fontSize: 12, color: '#FFF', fontWeight: 'bold' },

  cardBody: { padding: 16 },
  patientRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  avatar: { 
    width: 40, 
    height: 40, 
    borderRadius: 20, 
    backgroundColor: '#E3F2FD', 
    alignItems: 'center', 
    justifyContent: 'center',
    marginRight: 12
  },
  patientName: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  bookerText: { fontSize: 11, color: '#888', marginTop: 2 },
  
  detailsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  detailItem: { flexDirection: 'row', alignItems: 'center', gap: 6, width: '45%' },
  detailText: { fontSize: 13, color: '#666' },

  cardFooter: {
    flexDirection: 'row',
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#EEE',
    alignItems: 'center',
    gap: 10,
  },
  btnPresent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.success,
    gap: 6,
  },
  btnPresentActive: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: theme.colors.success,
    gap: 6,
  },
  btnText: { fontSize: 14, fontWeight: '600', color: theme.colors.success },
  cancelBtn: {
    padding: 10,
    backgroundColor: '#FFEBEE',
    borderRadius: 8,
  },

  emptyState: { alignItems: 'center', marginTop: 60, opacity: 0.6 },
  emptyText: { marginTop: 12, fontSize: 16, color: '#999' },
  loadingOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(255,255,255,0.8)', alignItems: 'center', justifyContent: 'center' },
});

export default DoctorAppointmentsScreen;