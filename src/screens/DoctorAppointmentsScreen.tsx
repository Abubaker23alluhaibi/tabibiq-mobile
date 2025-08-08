import React, { useState, useEffect } from 'react';
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
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../utils/theme';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

interface Appointment {
  _id: string;
  date: string;
  time: string;
  reason: string;
  status: string;
  userName: string;
  userId?: {
    _id: string;
    first_name: string;
    phone: string;
  };
}

const DoctorAppointmentsScreen: React.FC = () => {
  const { t } = useTranslation();
  const { profile } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('asc');
  const [showPastAppointments, setShowPastAppointments] = useState(false);

  useEffect(() => {
    if (profile?._id) {
      fetchAppointments();
    }
  }, [profile]);

  const fetchAppointments = async () => {
    if (!profile?._id) return;
    
    try {
      setLoading(true);
      const response = await api.get(`/doctor-appointments/${profile._id}`);
      
      // التأكد من أن البيانات موجودة
      if (response && Array.isArray(response)) {
        setAppointments(response);
        console.log('✅ تم جلب المواعيد بنجاح:', response.length, 'موعد');
      } else {
        console.log('⚠️ لا توجد مواعيد أو البيانات غير صحيحة:', response);
        setAppointments([]);
      }
    } catch (error) {
      console.error('❌ خطأ في جلب المواعيد:', error);
      Alert.alert('خطأ', 'فشل في جلب المواعيد من قاعدة البيانات');
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
      filtered = filtered.filter(apt => apt.status === filterStatus);
    }

    // Filter by date (past/upcoming)
    if (!showPastAppointments) {
      filtered = filtered.filter(apt => new Date(apt.date) >= new Date());
    }

    return filtered;
  };

  const sortAppointments = (appointments: Appointment[]) => {
    return appointments.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'date':
          comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
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

  const getDisplayedAppointments = () => {
    const filtered = filterAppointments(appointments);
    return sortAppointments(filtered);
  };

  const isPastAppointment = (dateString: string) => {
    return new Date(dateString) < new Date();
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
    const today = getLocalDateString(); // استخدام التوقيت المحلي
    return dateString === today;
  };

  const isUpcomingAppointment = (dateString: string) => {
    return new Date(dateString) > new Date();
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

  const getStatusText = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'مؤكد';
      case 'completed':
        return 'مكتمل';
      case 'cancelled':
        return 'ملغي';
      default:
        return 'غير محدد';
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
      await api.put(`/appointments/${appointmentId}/status`, { status });
      
      Alert.alert(
        'نجح',
        `تم ${action === 'complete' ? 'إكمال' : 'إلغاء'} الموعد بنجاح`,
        [{ text: 'حسناً', onPress: fetchAppointments }]
      );
    } catch (error) {
      console.error('Error updating appointment:', error);
      Alert.alert('خطأ', 'فشل في تحديث الموعد');
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

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>مواعيد الطبيب</Text>
        <Text style={styles.headerSubtitle}>إدارة المواعيد</Text>
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
              placeholder="البحث في المواعيد..."
              value={searchTerm}
              onChangeText={setSearchTerm}
            />
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
              ]}>الكل</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.filterButton,
                filterStatus === 'pending' && styles.filterButtonActive
              ]}
              onPress={() => setFilterStatus('pending')}
            >
              <Text style={[
                styles.filterButtonText,
                filterStatus === 'pending' && styles.filterButtonTextActive
              ]}>في الانتظار</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.filterButton,
                filterStatus === 'accepted' && styles.filterButtonActive
              ]}
              onPress={() => setFilterStatus('accepted')}
            >
              <Text style={[
                styles.filterButtonText,
                filterStatus === 'accepted' && styles.filterButtonTextActive
              ]}>مقبول</Text>
            </TouchableOpacity>
          </View>

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
                {sortBy === 'date' ? 'التاريخ' : sortBy === 'time' ? 'الوقت' : 'الاسم'}
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[
              styles.toggleButton,
              showPastAppointments && styles.toggleButtonActive
            ]}
            onPress={() => setShowPastAppointments(!showPastAppointments)}
          >
            <Text style={[
              styles.toggleButtonText,
              showPastAppointments && styles.toggleButtonTextActive
            ]}>
              {showPastAppointments ? 'إخفاء الماضية' : 'إظهار الماضية'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Appointments List */}
        {getDisplayedAppointments().length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="calendar-outline" size={64} color={theme.colors.textSecondary} />
            <Text style={styles.emptyText}>لا توجد مواعيد</Text>
          </View>
        ) : (
          getDisplayedAppointments().map((appointment) => (
            <View key={appointment._id} style={styles.appointmentCard}>
              <View style={styles.appointmentHeader}>
                <Text style={styles.patientName}>
                  {appointment.userName || appointment.userId?.first_name || 'مريض غير محدد'}
                </Text>
                <View style={[
                  styles.statusBadge,
                  { backgroundColor: getStatusColor(appointment.status) }
                ]}>
                  <Ionicons 
                    name={getStatusIcon(appointment.status) as any} 
                    size={16} 
                    color={theme.colors.white} 
                  />
                  <Text style={styles.statusText}>
                    {getStatusText(appointment.status)}
                  </Text>
                </View>
              </View>

              <View style={styles.appointmentDetails}>
                <View style={styles.detailRow}>
                  <Ionicons name="calendar" size={16} color={theme.colors.primary} />
                  <Text style={styles.detailText}>{appointment.date}</Text>
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

                {appointment.userId?.phone && (
                  <View style={styles.detailRow}>
                    <Ionicons name="call" size={16} color={theme.colors.primary} />
                    <Text style={styles.detailText}>{appointment.userId.phone}</Text>
                  </View>
                )}
              </View>

              {/* Action Buttons */}
              {appointment.status === 'confirmed' && (
                <View style={styles.actionButtons}>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.completeButton]}
                    onPress={() => handleAppointmentAction(appointment._id, 'complete')}
                  >
                    <Ionicons name="checkmark-done" size={16} color={theme.colors.white} />
                    <Text style={styles.actionButtonText}>إكمال</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.cancelButton]}
                    onPress={() => handleAppointmentAction(appointment._id, 'cancel')}
                  >
                    <Ionicons name="close" size={16} color={theme.colors.white} />
                    <Text style={styles.actionButtonText}>إلغاء</Text>
                  </TouchableOpacity>
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
    color: theme.colors.text,
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
    color: theme.colors.text,
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
    color: theme.colors.text,
  },
  toggleButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.white,
  },
  toggleButtonActive: {
    backgroundColor: theme.colors.success,
    borderColor: theme.colors.success,
  },
  toggleButtonText: {
    textAlign: 'center',
    fontSize: 14,
    color: theme.colors.text,
  },
  toggleButtonTextActive: {
    color: theme.colors.white,
    fontWeight: 'bold',
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
});

export default DoctorAppointmentsScreen; 