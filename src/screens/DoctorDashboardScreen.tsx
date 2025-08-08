import React, { useState, useEffect, useCallback } from 'react';
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
} from 'react-native';
import CSSScrollView from '../components/web/CSSScrollView';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../utils/theme';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../contexts/NotificationContext';
import { api } from '../services/api';

const { width, height } = Dimensions.get('window');

const DoctorDashboardScreen = () => {
  const navigation = useNavigation();
  const { t } = useTranslation();
  const { user, profile } = useAuth();
  const { notifications, isNotificationEnabled, registerForDoctorNotifications } = useNotifications();
  
  // دالة للحصول على التاريخ المحلي بصيغة YYYY-MM-DD
  const getLocalDateString = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
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

  useEffect(() => {
    if (profile?._id) {
      fetchDashboardData();
      // تسجيل إشعارات الطبيب إذا لم تكن مفعلة
      if (!isNotificationEnabled) {
        registerForDoctorNotifications();
      }
    }
  }, [profile]);

  // تحديث البيانات كل 30 ثانية
  useEffect(() => {
    const interval = setInterval(() => {
      if (profile?._id) {
        fetchDashboardData();
      }
    }, 30000); // 30 ثانية

    return () => clearInterval(interval);
  }, [profile]);

  // إعادة تحميل البيانات عند العودة للصفحة
  useFocusEffect(
    useCallback(() => {
      if (profile?._id) {
        console.log('🔄 الصفحة أصبحت مركزة - إعادة تحميل البيانات');
        fetchDashboardData();
      }
    }, [profile])
  );

  const fetchDashboardData = async () => {
    if (!profile?._id) return;
    
    setLoading(true);
    try {
      console.log('🔄 جلب بيانات المواعيد للطبيب:', profile._id);
      // جلب المواعيد الحقيقية من قاعدة البيانات
      const response = await api.get(`/doctor-appointments/${profile._id}`);
      
      console.log('📥 استجابة المواعيد:', response);
      
      if (response && Array.isArray(response)) {
        // تحويل البيانات إلى التنسيق المطلوب
        const formattedAppointments = response.map(appointment => {
          // تنسيق التاريخ بشكل صحيح
          let formattedDate = appointment.date;
          if (formattedDate && formattedDate.includes('T')) {
            formattedDate = formattedDate.split('T')[0];
          }
          
          return {
            id: appointment._id,
            patientName: appointment.userName || appointment.userId?.first_name || 'مريض غير محدد',
            patientImage: 'https://via.placeholder.com/50',
            date: formattedDate,
            time: appointment.time,
            status: appointment.status,
            type: appointment.reason || 'استشارة',
          };
        });
        
        setAllAppointments(formattedAppointments); // حفظ جميع المواعيد
        setAppointments(formattedAppointments.slice(0, 5)); // عرض أول 5 فقط
        
        // حساب الإحصائيات - استخدام التوقيت المحلي
        const today = getLocalDateString(); // التاريخ المحلي الصحيح
        const utcToday = new Date().toISOString().split('T')[0]; // UTC date
        console.log('🔍 Today date (local):', today);
        console.log('🔍 Today date (UTC):', utcToday);
        console.log('🔍 Current timezone offset (minutes):', new Date().getTimezoneOffset());
        console.log('🔍 All appointments dates:', response.map(apt => ({ date: apt.date, formattedDate: apt.date?.split('T')[0] })));
        
        const todayAppointments = response.filter(apt => {
          const aptDate = apt.date?.split('T')[0];
          return aptDate === today;
        }).length;
        const weekAppointments = response.filter(apt => {
          const aptDate = new Date(apt.date);
          const weekAgo = new Date();
          weekAgo.setDate(weekAgo.getDate() - 7);
          return aptDate >= weekAgo;
        }).length;
        const monthAppointments = response.filter(apt => {
          const aptDate = new Date(apt.date);
          const monthAgo = new Date();
          monthAgo.setMonth(monthAgo.getMonth() - 1);
          return aptDate >= monthAgo;
        }).length;
        
        setStats({
          today: todayAppointments,
          week: weekAppointments,
          month: monthAppointments,
          total: response.length,
        });
        
        console.log('🔍 إحصائيات المواعيد:', {
          today: todayAppointments,
          week: weekAppointments,
          month: monthAppointments,
          total: response.length,
          todayDate: today
        });
        
        // تفاصيل إضافية للتشخيص
        const todayAppointmentsList = response.filter(apt => {
          const aptDate = apt.date?.split('T')[0];
          return aptDate === today;
        });
        console.log('📋 قائمة مواعيد اليوم (local time):', todayAppointmentsList);
        
        // مقارنة مع UTC للتشخيص
        const utcTodayAppointmentsList = response.filter(apt => {
          const aptDate = apt.date?.split('T')[0];
          return aptDate === utcToday;
        });
        console.log('📋 قائمة مواعيد اليوم (UTC time):', utcTodayAppointmentsList);
        
        console.log('✅ تم جلب بيانات لوحة التحكم بنجاح:', response.length, 'موعد');
      } else {
        console.log('⚠️ لا توجد مواعيد للوحة التحكم:', response);
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
      console.error('❌ خطأ في جلب بيانات لوحة التحكم:', error);
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

  const renderAppointmentCard = ({ item }: any) => (
    <View style={styles.appointmentCard}>
      <View style={styles.appointmentHeader}>
        <View style={styles.patientInfo}>
          <Image source={{ uri: item.patientImage }} style={styles.patientImage} />
          <View>
            <Text style={styles.patientName}>{item.patientName}</Text>
            <Text style={styles.appointmentType}>{getTypeText(item.type)}</Text>
          </View>
        </View>
        
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.statusText}>{getStatusText(item.status)}</Text>
        </View>
      </View>
      
      <View style={styles.appointmentDetails}>
        <View style={styles.appointmentTime}>
          <Ionicons name="time" size={16} color={theme.colors.textSecondary} />
          <Text style={styles.timeText}>{item.time}</Text>
        </View>
        
        <View style={styles.appointmentDate}>
          <Ionicons name="calendar" size={16} color={theme.colors.textSecondary} />
          <Text style={styles.dateText}>{item.date}</Text>
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

  const renderStatCard = ({ title, value, icon, color }: any) => (
    <View style={styles.statCard}>
      <View style={[styles.statIcon, { backgroundColor: color }]}>
        <Ionicons name={icon} size={24} color={theme.colors.white} />
      </View>
      <View style={styles.statContent}>
        <Text style={styles.statValue}>{value}</Text>
        <Text style={styles.statTitle}>{title}</Text>
      </View>
    </View>
  );



  const renderTodayAppointments = () => {
    const today = getLocalDateString(); // استخدام التوقيت المحلي الصحيح
    const todayAppointments = allAppointments.filter(apt => apt.date === today);

    console.log('🔍 renderTodayAppointments - Today:', today);
    console.log('🔍 renderTodayAppointments - All appointments:', allAppointments.length);
    console.log('🔍 renderTodayAppointments - Today appointments:', todayAppointments.length);
    console.log('🔍 Current time info:', {
      localTime: new Date().toString(),
      utcTime: new Date().toISOString(),
      localDate: getLocalDateString(),
      timezoneOffset: new Date().getTimezoneOffset()
    });

    if (todayAppointments.length === 0) {
      return (
        <View style={styles.todayAppointmentsList}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>مواعيد اليوم ({today})</Text>
            <Text style={styles.sectionCount}>لا توجد مواعيد</Text>
          </View>
          <View style={styles.emptyState}>
            <Ionicons name="calendar-outline" size={48} color={theme.colors.textSecondary} />
            <Text style={styles.emptyText}>لا توجد مواعيد محجوزة لهذا اليوم</Text>
            <Text style={styles.emptySubtext}>آخر تحديث: {new Date().toLocaleTimeString('ar-IQ')}</Text>
          </View>
        </View>
      );
    }

    return (
      <View style={styles.todayAppointmentsList}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>مواعيد اليوم ({today})</Text>
          <Text style={styles.sectionCount}>{todayAppointments.length} موعد</Text>
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
            <Image source={{ uri: user?.image || 'https://via.placeholder.com/60' }} style={styles.doctorImage} />
            <View>
              <Text style={styles.doctorName}>{user?.name}</Text>
              <Text style={styles.doctorSpecialty}>{profile?.specialty || 'طبيب'}</Text>
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
              onPress={() => navigation.navigate('NotificationSettings' as never)}
            >
              <Ionicons name="notifications" size={24} color={theme.colors.white} />
              {notifications.length > 0 && (
                <View style={styles.notificationBadge}>
                  <Text style={styles.notificationCount}>
                    {notifications.length > 9 ? '9+' : notifications.length}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>

      <CSSScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.statsContainer}>
          <FlatList
            data={[
              { title: t('doctor.today'), value: stats.today, icon: 'today', color: theme.colors.primary },
              { title: t('doctor.this_week'), value: stats.week, icon: 'calendar', color: theme.colors.secondary },
              { title: t('doctor.this_month'), value: stats.month, icon: 'calendar-number', color: theme.colors.accent },
              { title: t('doctor.total'), value: stats.total, icon: 'people', color: theme.colors.success },
            ]}
            renderItem={({ item }) => renderStatCard(item)}
            keyExtractor={(item) => item.title}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.statsList}
          />
        </View>

        <View style={styles.quickActions}>
          <TouchableOpacity
            style={styles.quickAction}
            onPress={() => navigation.navigate('DoctorCalendar' as never)}
          >
            <View style={styles.quickActionIcon}>
              <Ionicons name="calendar" size={24} color={theme.colors.white} />
            </View>
            <Text style={styles.quickActionText}>{t('doctor.calendar')}</Text>
          </TouchableOpacity>
          
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
            onPress={() => navigation.navigate('WorkTimesEditor' as never)}
          >
            <View style={styles.quickActionIcon}>
              <Ionicons name="time" size={24} color={theme.colors.white} />
            </View>
            <Text style={styles.quickActionText}>أوقات الدوام</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.quickAction}
            onPress={() => navigation.navigate('AppointmentDurationEditor' as never)}
          >
            <View style={styles.quickActionIcon}>
              <Ionicons name="timer" size={24} color={theme.colors.white} />
            </View>
            <Text style={styles.quickActionText}>مدة الموعد</Text>
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

        {/* مواعيد اليوم - أيقونة سريعة */}
        <View style={styles.todayAppointmentsSection}>
          <TouchableOpacity
            style={styles.todayAppointmentsButton}
            onPress={() => navigation.navigate('DoctorAppointments' as never)}
          >
            <View style={styles.todayAppointmentsIcon}>
              <Ionicons name="today" size={28} color={theme.colors.white} />
              {stats.today > 0 && (
                <View style={styles.todayAppointmentsBadge}>
                  <Text style={styles.todayAppointmentsCount}>{stats.today}</Text>
                </View>
              )}
            </View>
            <View style={styles.todayAppointmentsContent}>
              <Text style={styles.todayAppointmentsTitle}>{t('doctor.today_appointments')}</Text>
              <Text style={styles.todayAppointmentsSubtitle}>
                {stats.today > 0 ? `${stats.today} موعد اليوم` : 'لا توجد مواعيد اليوم'}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={theme.colors.textSecondary} />
          </TouchableOpacity>
        </View>

        <View style={styles.quickActions}>
          <TouchableOpacity
            style={styles.quickAction}
            onPress={() => navigation.navigate('DoctorCalendar' as never)}
          >
            <View style={styles.quickActionIcon}>
              <Ionicons name="calendar" size={24} color={theme.colors.white} />
            </View>
            <Text style={styles.quickActionText}>{t('doctor.calendar')}</Text>
          </TouchableOpacity>
          
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
            onPress={() => navigation.navigate('WorkTimesEditor' as never)}
          >
            <View style={styles.quickActionIcon}>
              <Ionicons name="time" size={24} color={theme.colors.white} />
            </View>
            <Text style={styles.quickActionText}>أوقات الدوام</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.quickAction}
            onPress={() => navigation.navigate('AppointmentDurationEditor' as never)}
          >
            <View style={styles.quickActionIcon}>
              <Ionicons name="timer" size={24} color={theme.colors.white} />
            </View>
            <Text style={styles.quickActionText}>مدة الموعد</Text>
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

      </CSSScrollView>
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
  },
  patientImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
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
});

// تصدير الدالة للاستخدام الخارجي
export const refreshDoctorDashboard = () => {
  // سيتم تحديثها من خلال useFocusEffect
};

export default DoctorDashboardScreen; 