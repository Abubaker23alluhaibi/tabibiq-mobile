import React, { useState, useEffect } from 'react';
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
  Alert,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../utils/theme';
import { useAuth } from '../contexts/AuthContext';
import { api, appointmentsAPI } from '../services/api';
import { getLocalizedDayName } from '../utils/dateUtils';
import Toast from '../components/Toast';
import CustomModal from '../components/CustomModal';
import { useToast } from '../hooks/useToast';
import { useModal } from '../hooks/useModal';

const { width, height } = Dimensions.get('window');

interface Appointment {
  id: string;
  date: string;
  time: string;
  status: string;
  type: string;
  notes?: string;
  doctorId?: string;
  doctor?: {
    _id: string;
    first_name: string;
    specialty: string;
    rating?: number;
    reviews_count?: number;
    image?: string;
  };
  attendance?: 'present' | 'absent' | 'late' | 'not_marked'; // حالة الحضور
  attendance_time?: string; // وقت تسجيل الحضور
}

const MyAppointmentsScreen = () => {
  const navigation = useNavigation();
  const { t } = useTranslation();
  const { user, checkStorageStatus } = useAuth();
  const { toast, showToast, hideToast, showSuccess: showToastSuccess, showError: showToastError } = useToast();
  const { modal, showModal, hideModal, showAlert, showConfirm, showError, showSuccess } = useModal();

  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  // تبويبات العرض: upcoming (الافتراضي)، today، archived (السابقة والملغية)
  const [selectedTab, setSelectedTab] = useState<
    'upcoming' | 'today' | 'archived'
  >('upcoming');
  // حقل البحث عن اسم المريض
  const [searchText, setSearchText] = useState('');

  useEffect(() => {
    if (user?.id) {
      fetchAppointments();
    } else {
      setLoading(false);
    }
  }, [user]);

  // إضافة useEffect منفصل للتحقق من حالة التحميل
  useEffect(() => {
  }, [user]);

  const fetchAppointments = async () => {
    setLoading(true);
    try {

      if (!user?.id) {
        setAppointments([]);
        return;
      }

      // جلب المواعيد الحقيقية من الخادم
      const response = await api.get(`/user-appointments/${user.id}`);

      if (Array.isArray(response)) {
        // تحويل البيانات إلى التنسيق المطلوب للعرض
        const formattedAppointments = response.map((appointment: any) => {

          return {
            id: appointment._id || appointment.id,
            _id: appointment._id || appointment.id,
            // حفظ معرف الطبيب لاستخدامه في فتح صفحة تفاصيل الطبيب لاحقاً
            doctorId:
              appointment.doctorId?._id ||
              appointment.doctorId?.id ||
              appointment.doctorId ||
              appointment.doctor?._id ||
              appointment.doctor?.id,
            doctorName:
              appointment.doctorName || appointment.doctorId?.name || 'طبيب',
            doctorSpecialty: appointment.doctorId?.specialty || 'تخصص عام',
            doctorImage:
              appointment.doctorId?.image ||
              appointment.doctorId?.profile_image ||
              'https://via.placeholder.com/60',
            date: appointment.date,
            time: appointment.time,
            status: appointment.status || 'pending',
            type: appointment.type || 'consultation',
            location:
              appointment.doctorId?.clinicLocation ||
              appointment.doctorId?.province ||
              'موقع العيادة',
            reason: appointment.reason || '',
            duration: appointment.duration || 30,
            // إضافة بيانات المريض للحجز لشخص آخر
            isBookingForOther: appointment.isBookingForOther || false,
            patientName: appointment.patientName || '',
            userName: appointment.userName || '',
            bookerName: appointment.bookerName || '',
            attendance: appointment.attendance || 'not_set',
            attendanceTime: appointment.attendanceTime,
          };
        });

        setAppointments(formattedAppointments);
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
        return t('appointments.status_confirmed');
      case 'completed':
        return t('appointments.status_completed');
      case 'cancelled':
        return t('appointments.status_cancelled');
      case 'pending':
        return t('appointments.status_pending');
      default:
        return status;
    }
  };

  // دالة للحصول على لون حالة الحضور
  const getAttendanceColor = (attendance?: string) => {
    switch (attendance) {
      case 'present':
        return theme.colors.success;
      default:
        return theme.colors.textSecondary;
    }
  };

  // دالة للحصول على نص حالة الحضور
  const getAttendanceText = (attendance?: string) => {
    switch (attendance) {
      case 'present':
        return t('appointments.attendance_present');
      default:
        return t('appointments.attendance_absent');
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

  // مساعدات التاريخ (لتقسيم المواعيد)
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
    } catch {
      return '';
    }
  };

  const getLocalDateString = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const isPastAppointment = (dateString: string) =>
    extractDatePart(dateString) < getLocalDateString();
  const isTodayAppointment = (dateString: string) =>
    extractDatePart(dateString) === getLocalDateString();
  const isUpcomingAppointment = (dateString: string) =>
    extractDatePart(dateString) > getLocalDateString();

  // ترتيب حسب التاريخ ثم الوقت
  const sortAppointments = (list: any[], order: 'asc' | 'desc' = 'asc') => {
    const sorted = [...list].sort((a, b) => {
      const da = new Date(a.date + 'T' + (a.time || '00:00')).getTime();
      const db = new Date(b.date + 'T' + (b.time || '00:00')).getTime();
      return da - db;
    });
    return order === 'asc' ? sorted : sorted.reverse();
  };

  // دالة البحث عن اسم المريض - تعيد أول نتيجة واحدة فقط
  const searchAppointments = (appointments: any[], searchText: string) => {
    if (!searchText.trim()) {
      return appointments;
    }
    
    const searchLower = searchText.toLowerCase().trim();
    // البحث فقط في اسم المريض وإرجاع أول نتيجة
    const foundAppointment = appointments.find(appointment => {
      return appointment.isBookingForOther && 
             appointment.patientName && 
             appointment.patientName.toLowerCase().includes(searchLower);
    });
    
    return foundAppointment ? [foundAppointment] : [];
  };

  const handleDoctorPress = (appointment: any) => {
    // التحقق من تسجيل الدخول
    if (!user) {
      showConfirm(
        t('login_required.title'), 
        t('login_required.message'),
        () => {
          (navigation as any).navigate('Login');
        }
      );
      return;
    }

    // الانتقال لصفحة تفاصيل الطبيب (باستخدام المعرّف المحفوظ في العنصر)
    const resolvedDoctorId =
      appointment.doctorId ||
      appointment.doctor?._id ||
      appointment.doctor?.id ||
      appointment.doctorId?._id ||
      appointment.doctorId?.id;

    if (resolvedDoctorId) {
      (navigation as any).navigate('DoctorDetails', {
        doctorId: String(resolvedDoctorId),
      });
      return;
    }

    showError('خطأ', t('login_required.doctor_not_found'));
  };

  // تقسيم بحسب التبويب المختار
  let filteredAppointments: any[] = [];
  if (selectedTab === 'today') {
    filteredAppointments = appointments.filter(
      apt => apt.status !== 'cancelled' && isTodayAppointment(apt.date)
    );
    filteredAppointments = sortAppointments(filteredAppointments, 'asc');
  } else if (selectedTab === 'archived') {
    filteredAppointments = appointments.filter(
      apt => apt.status === 'cancelled' || isPastAppointment(apt.date)
    );
    filteredAppointments = sortAppointments(filteredAppointments, 'desc');
  } else {
    // upcoming: لا يعرض السابقة ولا الملغية (يشمل اليوم والقادمة غير الملغية)
    filteredAppointments = appointments.filter(
      apt =>
        apt.status !== 'cancelled' &&
        (isTodayAppointment(apt.date) || isUpcomingAppointment(apt.date))
    );
    filteredAppointments = sortAppointments(filteredAppointments, 'asc');
  }

  // تطبيق البحث عن اسم المريض
  filteredAppointments = searchAppointments(filteredAppointments, searchText);

  const onCancelByUser = async (appointmentId: string) => {
    try {
      showConfirm(
        t('appointment.cancel_appointment'),
        t('appointment.confirm_cancel'),
        async () => {
              try {
                // توحيد الإلغاء بالحذف الكامل كما في الويب
                const result = await appointmentsAPI.cancelAppointment(appointmentId);
                
                // التحقق من نجاح العملية قبل تحديث القائمة
                if (result && result.success) {
                  // إزالة محلية فورية
                  setAppointments(prev =>
                    prev.filter(apt => (apt._id || apt.id) !== appointmentId)
                  );
                  showSuccess(
                    t('success.title'),
                    t('appointment.cancel_appointment')
                  );
                  // إعادة جلب المواعيد للتأكد من التحديث
                  await fetchAppointments();
                  

                  // فحص فوري للإشعارات الجديدة بعد إلغاء الموعد
                  try {
                    const { syncNotificationsWithServer } = require('../contexts/NotificationContext');
                    await syncNotificationsWithServer(user?.id, false);
                  } catch (syncError) {
                  }
                } else {
                  showError(
                    t('error.title'),
                    `${t('error.message')} (إلغاء)\n${result?.message || 'Unknown error'}`
                  );
                }
              } catch (err) {
                showError(
                  t('error.title'),
                  `${t('error.message')} (إلغاء)\n${String(err)}`
                );
              }
        }
      );
    } catch (e) {
      showError(t('error.title'), t('error.message'));
    }
  };

  const renderAppointmentCard = ({ item }: any) => (
    <View style={styles.appointmentCard}>
      <View style={styles.appointmentHeader}>
        <TouchableOpacity
          style={styles.doctorInfo}
          onPress={() => handleDoctorPress(item)}
        >
          <Image
            source={{ uri: item.doctorImage }}
            style={styles.doctorImage}
          />
          <View>
            <Text style={styles.doctorName}>{item.doctorName}</Text>
            <Text style={styles.doctorSpecialty}>{item.doctorSpecialty}</Text>
          </View>
          <Ionicons
            name="chevron-forward"
            size={16}
            color={theme.colors.textSecondary}
          />
        </TouchableOpacity>

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
        <View style={styles.detailRow}>
          <Ionicons
            name="calendar"
            size={14}
            color={theme.colors.textSecondary}
          />
          <Text style={styles.detailText}>{formatDateWithDay(item.date)}</Text>
        </View>

        <View style={styles.detailRow}>
          <Ionicons name="time" size={14} color={theme.colors.textSecondary} />
          <Text style={styles.detailText}>{item.time}</Text>
        </View>

        <View style={styles.detailRow}>
          <Ionicons
            name="location"
            size={14}
            color={theme.colors.textSecondary}
          />
          <Text style={styles.detailText}>{item.location}</Text>
        </View>

        <View style={styles.detailRow}>
          <Ionicons
            name="medical"
            size={14}
            color={theme.colors.textSecondary}
          />
          <Text style={styles.detailText}>{getTypeText(item.type)}</Text>
        </View>

        {/* عرض اسم المريض إذا كان الحجز لشخص آخر */}
        {item.isBookingForOther && item.patientName && (
          <View style={styles.detailRow}>
            <Ionicons
              name="person"
              size={14}
              color={theme.colors.primary}
            />
            <Text style={[styles.detailText, { color: theme.colors.primary, fontWeight: '600' }]}>
              {t('appointments.patient_name')}: {item.patientName}
            </Text>
          </View>
        )}
        

        {/* عرض حالة الحضور */}
        {item.attendance && (
          <View style={styles.detailRow}>
            <Ionicons
              name="checkmark-circle"
              size={14}
              color={getAttendanceColor(item.attendance)}
            />
            <Text style={styles.detailText}>
              {t('appointments.attendance_label')}: {getAttendanceText(item.attendance)}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.appointmentActions}>
        {item.status !== 'cancelled' && !isPastAppointment(item.date) && (
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => onCancelByUser(item._id || item.id)}
          >
            <Ionicons
              name="close-circle"
              size={14}
              color={theme.colors.error}
            />
            <Text style={styles.cancelButtonText}>
              {t('appointment.cancel')}
            </Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity style={styles.actionButton}>
          <Ionicons
            name="document-text"
            size={14}
            color={theme.colors.primary}
          />
          <Text style={styles.actionText}>{t('appointment.details')}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderFilterButton = ({ title, value }: any) => (
    <TouchableOpacity
      style={[
        styles.filterButton,
        selectedTab === value && styles.filterButtonActive,
      ]}
      onPress={() => setSelectedTab(value)}
    >
      <Text
        style={[
          styles.filterButtonText,
          selectedTab === value && styles.filterButtonTextActive,
        ]}
      >
        {title}
      </Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>{t('common.loading')}</Text>
      </View>
    );
  }

  if (!user?.id) {
    return (
      <View style={styles.loadingContainer}>
        <Ionicons name="person-outline" size={64} color={theme.colors.textSecondary} />
        <Text style={styles.emptyText}>{t('appointments.login_required')}</Text>
        <Text style={[styles.emptyText, { fontSize: 14, marginTop: 8 }]}>
          {t('appointments.login_required_subtitle')}
        </Text>
      </View>
    );
  }

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
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={theme.colors.white} />
        </TouchableOpacity>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{t('appointments.my_appointments')}</Text>
          <Text style={styles.headerSubtitle}>
            {appointments.length} {t('appointments.appointment_count')}
          </Text>

        </View>
      </LinearGradient>

      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {[
            { title: t('appointments.upcoming_tab'), value: 'upcoming' },
            { title: t('appointments.today_tab'), value: 'today' },
            { title: t('appointments.archived_tab'), value: 'archived' },
          ].map(tab => (
            <View key={tab.value} style={styles.filterButtonContainer}>
              <TouchableOpacity
                style={[
                  styles.filterButton,
                  selectedTab === (tab.value as any) &&
                    styles.filterButtonActive,
                ]}
                onPress={() => setSelectedTab(tab.value as any)}
              >
                <Text
                  style={[
                    styles.filterButtonText,
                    selectedTab === (tab.value as any) &&
                      styles.filterButtonTextActive,
                  ]}
                >
                  {tab.title}
                </Text>
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
      </View>

      {/* حقل البحث عن اسم المريض */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={20} color={theme.colors.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder={t('appointments.search_patient_placeholder')}
            value={searchText}
            onChangeText={setSearchText}
            placeholderTextColor={theme.colors.textSecondary}
          />
          {searchText.length > 0 && (
            <TouchableOpacity
              onPress={() => setSearchText('')}
              style={styles.clearButton}
            >
              <Ionicons name="close-circle" size={20} color={theme.colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {filteredAppointments.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons
              name="calendar-outline"
              size={64}
              color={theme.colors.textSecondary}
            />
            <Text style={styles.emptyTitle}>
              {t('appointments.no_appointments')}
            </Text>
            <Text style={styles.emptySubtitle}>
              {t('appointments.no_appointments_subtitle')}
            </Text>
            <TouchableOpacity
              style={styles.bookButton}
              onPress={() => navigation.navigate('UserHome' as never)}
            >
              <Text style={styles.bookButtonText}>
                {t('appointment.book_now')}
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={filteredAppointments}
            renderItem={renderAppointmentCard}
            keyExtractor={item => item.id}
            scrollEnabled={false}
            contentContainerStyle={styles.appointmentsList}
          />
        )}
      </ScrollView>

      {/* Toast Component */}
      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        duration={toast.duration}
        onHide={hideToast}
        action={toast.action}
      />

      {/* Custom Modal Component */}
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
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    zIndex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.white,
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 14,
    color: theme.colors.white,
    marginTop: 4,
    textAlign: 'center',
  },
  filterContainer: {
    backgroundColor: theme.colors.white,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  filterButtonContainer: {
    marginRight: 12,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  filterButtonActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  filterButtonText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  filterButtonTextActive: {
    color: theme.colors.white,
  },
  content: {
    flex: 1,
  },
  appointmentsList: {
    padding: 20,
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
  doctorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  doctorImage: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: 10,
  },
  doctorName: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.colors.textPrimary,
  },
  doctorSpecialty: {
    fontSize: 13,
    color: theme.colors.textSecondary,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    color: theme.colors.white,
    fontWeight: 'bold',
  },
  appointmentDetails: {
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailText: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    marginLeft: 8,
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
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  actionText: {
    fontSize: 11,
    color: theme.colors.primary,
    marginLeft: 4,
  },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  cancelButtonText: {
    fontSize: 11,
    color: theme.colors.error,
    marginLeft: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  bookButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  bookButtonText: {
    color: theme.colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
  loadingText: {
    marginTop: 10,
    color: theme.colors.textSecondary,
    fontSize: 16,
  },
  emptyText: {
    color: theme.colors.textSecondary,
    fontSize: 16,
    textAlign: 'center',
    marginTop: 10,
  },
  searchContainer: {
    backgroundColor: theme.colors.white,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: theme.colors.textPrimary,
    marginLeft: 8,
    paddingVertical: 4,
  },
  clearButton: {
    padding: 4,
  },
});

export default MyAppointmentsScreen;
