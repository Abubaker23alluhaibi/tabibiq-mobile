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
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../utils/theme';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

interface Analytics {
  totalAppointments: number;
  todayAppointments: number;
  upcomingAppointments: number;
  pastAppointments: number;
  appointmentsByDay: Record<string, number>;
  appointmentsByMonth: Record<string, number>;
  appointmentsByTime: Record<string, number>;
  mostBusyDay: [string, number] | null;
  mostBusyTime: [string, number] | null;
  averageAppointmentsPerDay: number;
  totalPatients: number;
  // إحصائيات الحضور
  totalAttended: number;
  totalNotAttended: number;
  attendanceRate: number; // نسبة الحضور
}

const DoctorAnalyticsScreen: React.FC = () => {
  const { t } = useTranslation();
  const { profile } = useAuth();
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState('week');

  useEffect(() => {
    if (profile?._id) {
      fetchAnalytics();
    }
  }, [selectedPeriod, profile]);

  const fetchAnalytics = async () => {
    if (!profile?._id) return;

    try {
      setLoading(true);
      const response = await api.get(`/doctor-appointments/${profile._id}`);

      // التأكد من أن البيانات موجودة
      if (response && Array.isArray(response)) {
        const analyticsData = getAnalytics(response, selectedPeriod);
        setAnalytics(analyticsData);
      } else {
        setAnalytics(null);
      }
    } catch (error: any) {
      Alert.alert(t('common.error'), error.message || t('analytics.error'));
      setAnalytics(null);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchAnalytics();
    setRefreshing(false);
  };

  // دالة للحصول على التاريخ المحلي بصيغة YYYY-MM-DD
  const getLocalDateString = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const getAnalytics = (appointments: any[], period: string): Analytics => {
    const now = new Date();
    const today = getLocalDateString();
    
    // ملاحظة مهمة: جميع الإحصائيات (الأيام، الأسابيع، الأشهر، الساعات) 
    // تعتمد على المواعيد المحجوزة وليس على الحضور
    // فقط إحصائيات الحضور تعتمد على حالة الحضور الفعلية
    
    // تصفية المواعيد حسب الفترة المحددة
    let filteredAppointments = appointments;
    let periodStart = new Date();
    let periodEnd = new Date();
    
    if (period === 'week') {
      // الأسبوع الحالي (من الأحد إلى السبت)
      const currentDay = now.getDay(); // 0 = الأحد، 6 = السبت
      const daysFromSunday = currentDay === 0 ? 0 : currentDay;
      periodStart.setDate(now.getDate() - daysFromSunday);
      periodStart.setHours(0, 0, 0, 0);
      periodEnd.setDate(periodStart.getDate() + 6);
      periodEnd.setHours(23, 59, 59, 999);
      
      filteredAppointments = appointments.filter(apt => {
        const aptDate = new Date(apt.date);
        return aptDate >= periodStart && aptDate <= periodEnd;
      });
    } else if (period === 'month') {
      // الشهر الحالي
      periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
      periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
      
      filteredAppointments = appointments.filter(apt => {
        const aptDate = new Date(apt.date);
        return aptDate >= periodStart && aptDate <= periodEnd;
      });
    } else if (period === 'year') {
      // السنة الحالية
      periodStart = new Date(now.getFullYear(), 0, 1);
      periodEnd = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
      
      filteredAppointments = appointments.filter(apt => {
        const aptDate = new Date(apt.date);
        return aptDate >= periodStart && aptDate <= periodEnd;
      });
    }

    // حساب إحصائيات الحضور
    const totalAttended = filteredAppointments.filter(apt => apt.attendance === 'present').length;
    const totalNotAttended = filteredAppointments.filter(apt => !apt.attendance || apt.attendance !== 'present').length;
    const totalAppointments = filteredAppointments.length;
    const attendanceRate = totalAppointments > 0 ? Math.round((totalAttended / totalAppointments) * 100) : 0;

    // حساب إحصائيات الأيام بناءً على المواعيد (الحجز) وليس الحضور
    const appointmentsByDay: Record<string, number> = {};
    const appointmentsByMonth: Record<string, number> = {};
    const appointmentsByTime: Record<string, number> = {};
    
    // لجميع الفترات: إظهار أيام الأسبوع (الأحد، الاثنين، الثلاثاء...)
    const weekDays = [
      t('analytics.week_days.sunday'),
      t('analytics.week_days.monday'),
      t('analytics.week_days.tuesday'),
      t('analytics.week_days.wednesday'),
      t('analytics.week_days.thursday'),
      t('analytics.week_days.friday'),
      t('analytics.week_days.saturday')
    ];
    weekDays.forEach(day => {
      appointmentsByDay[day] = 0;
    });
    
    // تهيئة الساعات
    for (let i = 8; i <= 20; i++) {
      appointmentsByTime[`${i}:00`] = 0;
    }
    
    // حساب الإحصائيات حسب جميع المواعيد (الحجز) وليس فقط الحضور
    filteredAppointments.forEach(apt => {
      // إحصائيات أيام الأسبوع/الشهر/السنة (بناءً على الحجز)
      // إحصائيات أيام الأسبوع (لجميع الفترات: أسبوع، شهر، سنة)
      const dayIndex = new Date(apt.date).getDay(); // 0 = الأحد، 6 = السبت
      const weekDays = [
        t('analytics.week_days.sunday'),
        t('analytics.week_days.monday'),
        t('analytics.week_days.tuesday'),
        t('analytics.week_days.wednesday'),
        t('analytics.week_days.thursday'),
        t('analytics.week_days.friday'),
        t('analytics.week_days.saturday')
      ];
      const day = weekDays[dayIndex];
      if (appointmentsByDay[day] !== undefined) {
        appointmentsByDay[day]++;
      }
      
      // إحصائيات الساعات (بناءً على الحجز)
      const hour = apt.time?.split(':')[0] || '8';
      const timeKey = `${hour}:00`;
      if (appointmentsByTime[timeKey] !== undefined) {
        appointmentsByTime[timeKey]++;
      }
    });

    // أكثر يوم/أسبوع/شهر ازدحاماً (بناءً على الحجز)
    const mostBusyDay = Object.entries(appointmentsByDay)
      .sort(([, a], [, b]) => b - a)[0] || null;

    // أكثر ساعة ازدحاماً (بناءً على الحجز)
    const mostBusyTime = Object.entries(appointmentsByTime)
      .sort(([, a], [, b]) => b - a)[0] || null;

    return {
      totalAppointments: filteredAppointments.length,
      todayAppointments: appointments.filter(apt => apt.date === today).length,
      upcomingAppointments: appointments.filter(apt => apt.date > today && apt.status !== 'cancelled').length,
      pastAppointments: appointments.filter(apt => apt.date < today).length,
      appointmentsByDay,
      appointmentsByMonth,
      appointmentsByTime,
      mostBusyDay,
      mostBusyTime,
      averageAppointmentsPerDay: Math.round(filteredAppointments.length / (period === 'week' ? 7 : period === 'month' ? 30 : 365)),
      totalPatients: new Set(filteredAppointments.map(apt => apt.patient_id || apt.userId?._id)).size,
      // إحصائيات الحضور
      totalAttended,
      totalNotAttended,
      attendanceRate,
    };
  };

  const getPeriodText = (period: string) => {
    switch (period) {
      case 'week':
        return t('analytics.week');
      case 'month':
        return t('analytics.month');
      case 'year':
        return t('analytics.year');
      default:
        return t('analytics.week');
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>{t('analytics.loading')}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t('analytics.title')}</Text>
        <Text style={styles.headerSubtitle}>
          {t('analytics.subtitle')} - {getPeriodText(selectedPeriod)}
        </Text>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Period Selector */}
        <View style={styles.periodSelector}>
          <Text style={styles.periodLabel}>{t('analytics.period_selector')}</Text>
          <View style={styles.periodButtons}>
            {['week', 'month', 'year'].map(period => (
              <TouchableOpacity
                key={period}
                style={[
                  styles.periodButton,
                  selectedPeriod === period && styles.periodButtonActive,
                ]}
                onPress={() => setSelectedPeriod(period)}
              >
                <Text
                  style={[
                    styles.periodButtonText,
                    selectedPeriod === period && styles.periodButtonTextActive,
                  ]}
                >
                  {getPeriodText(period)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Period Info */}
        <View style={styles.periodInfo}>
          <Ionicons
            name="information-circle"
            size={20}
            color={theme.colors.primary}
          />
          <Text style={styles.periodInfoText}>
            {selectedPeriod === 'week' && t('analytics.period_info.week')}
            {selectedPeriod === 'month' && t('analytics.period_info.month')}
            {selectedPeriod === 'year' && t('analytics.period_info.year')}
          </Text>
        </View>

        {/* Quick Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Ionicons name="calendar" size={32} color={theme.colors.primary} />
            <Text style={styles.statNumber}>
              {analytics?.totalAppointments || 0}
            </Text>
            <Text style={styles.statLabel}>{t('analytics.stats.total_appointments')}</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="today" size={32} color={theme.colors.warning} />
            <Text style={styles.statNumber}>
              {analytics?.todayAppointments || 0}
            </Text>
            <Text style={styles.statLabel}>{t('analytics.stats.today_appointments')}</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="time" size={32} color={theme.colors.info} />
            <Text style={styles.statNumber}>
              {analytics?.upcomingAppointments || 0}
            </Text>
            <Text style={styles.statLabel}>{t('analytics.stats.upcoming_appointments')}</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons
              name="checkmark-circle"
              size={32}
              color={theme.colors.success}
            />
            <Text style={styles.statNumber}>
              {analytics?.pastAppointments || 0}
            </Text>
            <Text style={styles.statLabel}>{t('analytics.stats.completed_appointments')}</Text>
          </View>
        </View>

        {/* Additional Stats */}
        <View style={styles.additionalStatsContainer}>
          <View style={styles.additionalStatCard}>
            <Ionicons name="people" size={24} color={theme.colors.primary} />
            <View style={styles.additionalStatContent}>
              <Text style={styles.additionalStatNumber}>
                {analytics?.totalPatients || 0}
              </Text>
              <Text style={styles.additionalStatLabel}>{t('analytics.stats.total_patients')}</Text>
            </View>
          </View>
          <View style={styles.additionalStatCard}>
            <Ionicons
              name="trending-up"
              size={24}
              color={theme.colors.success}
            />
            <View style={styles.additionalStatContent}>
              <Text style={styles.additionalStatNumber}>
                {analytics?.averageAppointmentsPerDay || 0}
              </Text>
              <Text style={styles.additionalStatLabel}>{t('analytics.stats.average_per_day')}</Text>
            </View>
          </View>
        </View>

        {/* Attendance Statistics */}
        <View style={styles.attendanceStatsContainer}>
          <Text style={styles.attendanceStatsTitle}>{t('analytics.attendance.title')}</Text>
          <View style={styles.attendanceStatsGrid}>
            <View style={styles.attendanceStatCard}>
              <Ionicons name="checkmark-circle" size={24} color={theme.colors.success} />
              <Text style={styles.attendanceStatNumber}>
                {analytics?.totalAttended || 0}
              </Text>
              <Text style={styles.attendanceStatLabel}>{t('analytics.attendance.present')}</Text>
            </View>
            <View style={styles.attendanceStatCard}>
              <Ionicons name="close-circle" size={24} color={theme.colors.error} />
              <Text style={styles.attendanceStatNumber}>
                {analytics?.totalNotAttended || 0}
              </Text>
              <Text style={styles.attendanceStatLabel}>{t('analytics.attendance.not_present')}</Text>
            </View>
          </View>
          
          {/* نسبة الحضور */}
          <View style={styles.attendanceRateContainer}>
            <Text style={styles.attendanceRateLabel}>{t('analytics.attendance.rate')}</Text>
            <Text style={styles.attendanceRateValue}>
              {analytics?.attendanceRate || 0}%
            </Text>
          </View>
        </View>

        {/* Busy Day Analysis */}
        {analytics?.mostBusyDay && (
          <View style={styles.analysisCard}>
            <Text style={styles.analysisTitle}>{t('analytics.analysis.busiest_day')}</Text>
            <View style={styles.analysisContent}>
              <Ionicons
                name="calendar"
                size={24}
                color={theme.colors.primary}
              />
              <View style={styles.analysisText}>
                <Text style={styles.analysisValue}>
                  {analytics.mostBusyDay[0]}
                </Text>
                <Text style={styles.analysisSubtext}>
                  {analytics.mostBusyDay[1]} {analytics.mostBusyDay[1] === 1 ? t('analytics.analysis.appointment') : t('analytics.analysis.appointments')}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Busy Time Analysis */}
        {analytics?.mostBusyTime && (
          <View style={styles.analysisCard}>
            <Text style={styles.analysisTitle}>{t('analytics.analysis.busiest_time')}</Text>
            <View style={styles.analysisContent}>
              <Ionicons name="time" size={24} color={theme.colors.warning} />
              <View style={styles.analysisText}>
                <Text style={styles.analysisValue}>
                  {analytics.mostBusyTime[0]}
                </Text>
                <Text style={styles.analysisSubtext}>
                  {analytics.mostBusyTime[1]} {analytics.mostBusyTime[1] === 1 ? t('analytics.analysis.appointment') : t('analytics.analysis.appointments')}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Appointments by Day */}
        {Object.keys(analytics?.appointmentsByDay || {}).length > 0 && (
          <View style={styles.analysisCard}>
            <Text style={styles.analysisTitle}>{t('analytics.analysis.by_day')}</Text>
            {Object.entries(analytics?.appointmentsByDay || {})
              .filter(([, count]) => count > 0) // عرض الأيام التي لديها مواعيد فقط
              .sort(([, a], [, b]) => b - a) // ترتيب تنازلي
              .slice(0, selectedPeriod === 'week' ? 7 : selectedPeriod === 'month' ? 31 : 50) // تحديد عدد الأيام المعروضة
              .map(([day, count]) => {
                const maxCount = Math.max(...Object.values(analytics?.appointmentsByDay || {}));
                const barWidth = maxCount > 0 ? (count / maxCount) * 100 : 0;
                
                // اسم اليوم هو نفسه لجميع الفترات
                const dayLabel = day;
                
                return (
                  <View key={day} style={styles.dayAnalysis}>
                    <Text style={styles.dayName}>{dayLabel}</Text>
                    <View style={styles.dayBar}>
                      <View
                        style={[
                          styles.dayBarFill,
                          {
                            width: `${barWidth}%`,
                          },
                        ]}
                      />
                    </View>
                    <Text style={styles.dayCount}>{count}</Text>
                  </View>
                );
              })}
            {Object.values(analytics?.appointmentsByDay || {}).every(count => count === 0) && (
              <Text style={styles.noDataText}>
                {t('analytics.no_appointments_for_period')}
              </Text>
            )}
          </View>
        )}

        {/* No Appointments Message */}
        {(!analytics || Object.keys(analytics.appointmentsByDay || {}).length === 0) && (
          <View style={styles.analysisCard}>
            <Text style={styles.analysisTitle}>{t('analytics.analysis.by_day')}</Text>
            <Text style={styles.noDataText}>
              {t('analytics.no_appointments_for_period')}
            </Text>
          </View>
        )}

        {/* Appointments by Time */}
        {Object.keys(analytics?.appointmentsByTime || {}).length > 0 && (
          <View style={styles.analysisCard}>
            <Text style={styles.analysisTitle}>{t('analytics.analysis.by_time')}</Text>
            {Object.entries(analytics?.appointmentsByTime || {})
              .sort(([, a], [, b]) => b - a)
              .slice(0, 5)
              .map(([time, count]) => {
                const maxCount = Math.max(...Object.values(analytics?.appointmentsByTime || {}));
                const barWidth = maxCount > 0 ? (count / maxCount) * 100 : 0;
                
                return (
                  <View key={time} style={styles.timeAnalysis}>
                    <Text style={styles.timeValue}>{time}</Text>
                    <View style={styles.timeBar}>
                      <View
                        style={[
                          styles.timeBarFill,
                          {
                            width: `${barWidth}%`,
                          },
                        ]}
                      />
                    </View>
                    <Text style={styles.timeCount}>{count}</Text>
                  </View>
                );
              })}
            {Object.values(analytics?.appointmentsByTime || {}).every(count => count === 0) && (
              <Text style={styles.noDataText}>
                {t('analytics.no_appointments_for_period')}
              </Text>
            )}
          </View>
        )}

        {/* No Appointments Message for Time */}
        {(!analytics || Object.keys(analytics.appointmentsByTime || {}).length === 0) && (
          <View style={styles.analysisCard}>
            <Text style={styles.analysisTitle}>{t('analytics.analysis.by_time')}</Text>
            <Text style={styles.noDataText}>
              {t('analytics.no_appointments_for_period')}
            </Text>
          </View>
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
    padding: 20,
    paddingTop: 50,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.white,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: theme.colors.white,
    opacity: 0.8,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  periodSelector: {
    backgroundColor: theme.colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
  },
  periodLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
    marginBottom: 12,
  },
  periodButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  periodButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  periodButtonActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  periodButtonText: {
    fontSize: 14,
    textAlign: 'center',
    color: theme.colors.textSecondary,
  },
  periodButtonTextActive: {
    color: theme.colors.white,
    fontWeight: 'bold',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: theme.colors.white,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginHorizontal: 4,
    elevation: 2,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: 4,
    textAlign: 'center',
  },
  analyticsContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
    marginBottom: 16,
  },
  analyticsCard: {
    backgroundColor: theme.colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
    marginBottom: 12,
  },
  statusItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  statusInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  statusText: {
    fontSize: 14,
    color: theme.colors.textPrimary,
  },
  statusCount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
  },
  demographicItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  demographicLabel: {
    fontSize: 14,
    color: theme.colors.textPrimary,
    marginLeft: 8,
    flex: 1,
  },
  demographicValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
  },
  revenueItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  revenueLabel: {
    fontSize: 14,
    color: theme.colors.textPrimary,
    marginLeft: 8,
    flex: 1,
  },
  revenueValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.success,
  },
  metricItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  metricLabel: {
    fontSize: 14,
    color: theme.colors.textPrimary,
    marginLeft: 8,
    flex: 1,
  },
  metricValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
  },
  additionalStatsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  additionalStatCard: {
    flex: 1,
    backgroundColor: theme.colors.white,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  additionalStatContent: {
    marginLeft: 12,
    flex: 1,
  },
  additionalStatNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  additionalStatLabel: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  analysisCard: {
    backgroundColor: theme.colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  analysisTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 16,
  },
  analysisContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  analysisText: {
    marginLeft: 12,
    flex: 1,
  },
  analysisValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  analysisSubtext: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  dayAnalysis: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  dayName: {
    width: 80,
    fontSize: 14,
    color: theme.colors.text,
    fontWeight: '600',
  },
  dayBar: {
    flex: 1,
    height: 8,
    backgroundColor: theme.colors.border,
    borderRadius: 4,
    marginHorizontal: 12,
  },
  dayBarFill: {
    height: '100%',
    backgroundColor: theme.colors.primary,
    borderRadius: 4,
  },
  dayCount: {
    width: 30,
    fontSize: 14,
    fontWeight: 'bold',
    color: theme.colors.text,
    textAlign: 'right',
  },
  timeAnalysis: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  timeValue: {
    width: 60,
    fontSize: 14,
    color: theme.colors.text,
    fontWeight: '600',
  },
  timeBar: {
    flex: 1,
    height: 8,
    backgroundColor: theme.colors.border,
    borderRadius: 4,
    marginHorizontal: 12,
  },
  timeBarFill: {
    height: '100%',
    backgroundColor: theme.colors.warning,
    borderRadius: 4,
  },
  timeCount: {
    width: 30,
    fontSize: 14,
    fontWeight: 'bold',
    color: theme.colors.text,
    textAlign: 'right',
  },
  periodInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.primary,
  },
  periodInfoText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginLeft: 8,
    flex: 1,
    lineHeight: 20,
  },
  attendanceStatsContainer: {
    backgroundColor: theme.colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    elevation: 2,
  },
  attendanceStatsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
    marginBottom: 16,
    textAlign: 'center',
  },
  attendanceStatsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  attendanceStatCard: {
    alignItems: 'center',
  },
  attendanceStatNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
    marginTop: 8,
  },
  attendanceStatLabel: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: 4,
  },
  attendanceRateContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
  attendanceRateLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
  },
  attendanceRateValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  noDataText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    fontStyle: 'italic',
    marginTop: 16,
  },
});

export default DoctorAnalyticsScreen;
