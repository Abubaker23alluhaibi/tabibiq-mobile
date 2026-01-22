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
  StatusBar,
  Dimensions,
  SafeAreaView,
  Platform, // ✅ تمت إضافتها هنا (كانت ناقصة)
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

const { width } = Dimensions.get('window');

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
    
    let filteredAppointments = appointments;
    let periodStart = new Date();
    let periodEnd = new Date();
    
    if (period === 'week') {
      const currentDay = now.getDay();
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
      periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
      periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
      
      filteredAppointments = appointments.filter(apt => {
        const aptDate = new Date(apt.date);
        return aptDate >= periodStart && aptDate <= periodEnd;
      });
    } else if (period === 'year') {
      periodStart = new Date(now.getFullYear(), 0, 1);
      periodEnd = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
      
      filteredAppointments = appointments.filter(apt => {
        const aptDate = new Date(apt.date);
        return aptDate >= periodStart && aptDate <= periodEnd;
      });
    }

    const totalAttended = filteredAppointments.filter(apt => apt.attendance === 'present').length;
    const totalNotAttended = filteredAppointments.filter(apt => !apt.attendance || apt.attendance !== 'present').length;
    const totalAppointments = filteredAppointments.length;
    const attendanceRate = totalAppointments > 0 ? Math.round((totalAttended / totalAppointments) * 100) : 0;

    const appointmentsByDay: Record<string, number> = {};
    const appointmentsByMonth: Record<string, number> = {};
    const appointmentsByTime: Record<string, number> = {};
    
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
    
    for (let i = 8; i <= 20; i++) {
      appointmentsByTime[`${i}:00`] = 0;
    }
    
    filteredAppointments.forEach(apt => {
      const dayIndex = new Date(apt.date).getDay();
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
      
      const hour = apt.time?.split(':')[0] || '8';
      const timeKey = `${hour}:00`;
      if (appointmentsByTime[timeKey] !== undefined) {
        appointmentsByTime[timeKey]++;
      }
    });

    const mostBusyDay = Object.entries(appointmentsByDay).sort(([, a], [, b]) => b - a)[0] || null;
    const mostBusyTime = Object.entries(appointmentsByTime).sort(([, a], [, b]) => b - a)[0] || null;

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
      totalAttended,
      totalNotAttended,
      attendanceRate,
    };
  };

  const getPeriodText = (period: string) => {
    switch (period) {
      case 'week': return t('analytics.week');
      case 'month': return t('analytics.month');
      case 'year': return t('analytics.year');
      default: return t('analytics.week');
    }
  };

  const StatCard = ({ icon, color, number, label }: { icon: any, color: string, number: number, label: string }) => (
    <View style={styles.statCard}>
      <View style={[styles.iconContainer, { backgroundColor: color + '15' }]}>
        <Ionicons name={icon} size={24} color={color} />
      </View>
      <Text style={styles.statNumber}>{number}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );

  const AnalysisItem = ({ title, value, subtext, icon, color }: any) => (
    <View style={styles.analysisItemContainer}>
      <View style={[styles.analysisIconBox, { backgroundColor: color + '15' }]}>
         <Ionicons name={icon} size={22} color={color} />
      </View>
      <View style={styles.analysisContentBox}>
         <Text style={styles.analysisItemTitle}>{title}</Text>
         <View style={{flexDirection: 'row', alignItems: 'baseline'}}>
            <Text style={styles.analysisItemValue}>{value}</Text>
            <Text style={styles.analysisItemSubtext}> {subtext}</Text>
         </View>
      </View>
    </View>
  );

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
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.primary} />
      
      {/* Modern Header */}
      <View style={styles.header}>
        <SafeAreaView>
          <View style={styles.headerContent}>
             <View>
                <Text style={styles.headerTitle}>{t('analytics.title')}</Text>
                <Text style={styles.headerSubtitle}>{t('analytics.subtitle')}</Text>
             </View>
             <View style={styles.headerIcon}>
                <Ionicons name="stats-chart" size={28} color="rgba(255,255,255,0.9)" />
             </View>
          </View>
        </SafeAreaView>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Period Selector (Floating Pill) */}
        <View style={styles.periodContainer}>
          <View style={styles.periodSelectorWrapper}>
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

        <Text style={styles.sectionHeader}>{t('analytics.dashboard')}</Text>

        {/* Main Stats Grid */}
        <View style={styles.gridContainer}>
          <StatCard 
            icon="calendar" 
            color={theme.colors.primary} 
            number={analytics?.totalAppointments || 0} 
            label={t('analytics.stats.total_appointments')} 
          />
          <StatCard 
            icon="today" 
            color="#FF9800" 
            number={analytics?.todayAppointments || 0} 
            label={t('analytics.stats.today_appointments')} 
          />
          <StatCard 
            icon="time" 
            color="#2196F3" 
            number={analytics?.upcomingAppointments || 0} 
            label={t('analytics.stats.upcoming_appointments')} 
          />
          <StatCard 
            icon="checkmark-circle" 
            color="#4CAF50" 
            number={analytics?.pastAppointments || 0} 
            label={t('analytics.stats.completed_appointments')} 
          />
        </View>

        {/* Highlights Section */}
        <View style={styles.rowContainer}>
           <View style={[styles.highlightCard, { backgroundColor: '#E3F2FD' }]}>
              <View style={styles.highlightHeader}>
                  <Text style={styles.highlightNumber}>{analytics?.totalPatients || 0}</Text>
                  <Ionicons name="people" size={20} color={theme.colors.primary} />
              </View>
              <Text style={styles.highlightLabel}>{t('analytics.stats.total_patients')}</Text>
           </View>

           <View style={[styles.highlightCard, { backgroundColor: '#E8F5E9' }]}>
              <View style={styles.highlightHeader}>
                  <Text style={[styles.highlightNumber, {color: theme.colors.success}]}>{analytics?.averageAppointmentsPerDay || 0}</Text>
                  <Ionicons name="trending-up" size={20} color={theme.colors.success} />
              </View>
              <Text style={styles.highlightLabel}>{t('analytics.stats.average_per_day')}</Text>
           </View>
        </View>

        {/* Attendance Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
             <Text style={styles.cardTitle}>{t('analytics.attendance.title')}</Text>
             <View style={styles.attendanceBadge}>
                <Text style={styles.attendanceBadgeText}>{analytics?.attendanceRate || 0}%</Text>
             </View>
          </View>
          
          <View style={styles.attendanceRow}>
             <View style={styles.attendanceItem}>
                <Text style={[styles.attendanceValue, {color: theme.colors.success}]}>{analytics?.totalAttended || 0}</Text>
                <Text style={styles.attendanceLabel}>{t('analytics.attendance.present')}</Text>
             </View>
             <View style={styles.verticalDivider} />
             <View style={styles.attendanceItem}>
                <Text style={[styles.attendanceValue, {color: theme.colors.error}]}>{analytics?.totalNotAttended || 0}</Text>
                <Text style={styles.attendanceLabel}>{t('analytics.attendance.not_present')}</Text>
             </View>
          </View>
          
          {/* Progress Bar Visual */}
          <View style={styles.progressBarContainer}>
             <View style={[styles.progressBarFill, { width: `${analytics?.attendanceRate || 0}%` }]} />
          </View>
        </View>

        {/* Smart Analysis Section */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionHeader}>{t('analytics.analysis.title') || 'تحليلات ذكية'}</Text>
          
          {analytics?.mostBusyDay && (
             <AnalysisItem 
               title={t('analytics.analysis.busiest_day')}
               value={analytics.mostBusyDay[0]}
               subtext={`(${analytics.mostBusyDay[1]} ${analytics.mostBusyDay[1] === 1 ? t('analytics.analysis.appointment') : t('analytics.analysis.appointments')})`}
               icon="calendar"
               color={theme.colors.primary}
             />
          )}

          {analytics?.mostBusyTime && (
             <AnalysisItem 
               title={t('analytics.analysis.busiest_time')}
               value={analytics.mostBusyTime[0]}
               subtext={`(${analytics.mostBusyTime[1]} ${analytics.mostBusyTime[1] === 1 ? t('analytics.analysis.appointment') : t('analytics.analysis.appointments')})`}
               icon="time"
               color="#FF9800"
             />
          )}
        </View>

        {/* Charts Section */}
        {Object.keys(analytics?.appointmentsByDay || {}).length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{t('analytics.analysis.by_day')}</Text>
            <View style={styles.chartContainer}>
              {Object.entries(analytics?.appointmentsByDay || {})
                .filter(([, count]) => count > 0)
                .sort(([, a], [, b]) => b - a)
                .slice(0, selectedPeriod === 'week' ? 7 : 5)
                .map(([day, count]) => {
                  const maxCount = Math.max(...Object.values(analytics?.appointmentsByDay || {}));
                  const barWidth = maxCount > 0 ? (count / maxCount) * 100 : 0;
                  
                  return (
                    <View key={day} style={styles.chartRow}>
                      <Text style={styles.chartLabel} numberOfLines={1}>{day}</Text>
                      <View style={styles.chartBarBackground}>
                        <View style={[styles.chartBarFill, { width: `${barWidth}%`, backgroundColor: theme.colors.primary }]} />
                      </View>
                      <Text style={styles.chartValue}>{count}</Text>
                    </View>
                  );
                })}
            </View>
          </View>
        )}

        {Object.keys(analytics?.appointmentsByTime || {}).length > 0 && (
           <View style={styles.card}>
             <Text style={styles.cardTitle}>{t('analytics.analysis.by_time')}</Text>
             <View style={styles.chartContainer}>
               {Object.entries(analytics?.appointmentsByTime || {})
                 .sort(([, a], [, b]) => b - a)
                 .slice(0, 5)
                 .map(([time, count]) => {
                   const maxCount = Math.max(...Object.values(analytics?.appointmentsByTime || {}));
                   const barWidth = maxCount > 0 ? (count / maxCount) * 100 : 0;
                   
                   return (
                     <View key={time} style={styles.chartRow}>
                       <Text style={styles.chartLabel}>{time}</Text>
                       <View style={styles.chartBarBackground}>
                         <View style={[styles.chartBarFill, { width: `${barWidth}%`, backgroundColor: '#FF9800' }]} />
                       </View>
                       <Text style={styles.chartValue}>{count}</Text>
                     </View>
                   );
                 })}
             </View>
           </View>
        )}

        {(!analytics || (Object.keys(analytics.appointmentsByDay || {}).every(k => analytics.appointmentsByDay[k] === 0))) && (
           <View style={styles.emptyState}>
              <Ionicons name="bar-chart-outline" size={48} color={theme.colors.textSecondary + '50'} />
              <Text style={styles.emptyStateText}>{t('analytics.no_appointments_for_period')}</Text>
           </View>
        )}

      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F9FC',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F7F9FC',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: theme.colors.textSecondary,
    fontWeight: '500',
  },
  
  // Header Styles
  header: {
    backgroundColor: theme.colors.primary,
    paddingTop: Platform.OS === 'android' ? 40 : 10,
    paddingBottom: 30,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    elevation: 5,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    marginTop: 4,
  },
  headerIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  content: {
    flex: 1,
    padding: 16,
    marginTop: -20, // To pull content up slightly
  },

  // Period Selector Styles
  periodContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  periodSelectorWrapper: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 25,
    padding: 4,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    width: '100%',
    maxWidth: 320,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  periodButtonActive: {
    backgroundColor: theme.colors.primary,
  },
  periodButtonText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    fontWeight: '600',
  },
  periodButtonTextActive: {
    color: '#fff',
    fontWeight: 'bold',
  },

  sectionHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
    marginBottom: 12,
    marginTop: 8,
    paddingHorizontal: 4,
  },

  // Grid Stats
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    width: (width - 44) / 2, // 2 columns
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    alignItems: 'flex-start',
  },
  iconContainer: {
    width: 42,
    height: 42,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statNumber: {
    fontSize: 22,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    fontWeight: '500',
  },

  // Highlight Row
  rowContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  highlightCard: {
    flex: 1,
    borderRadius: 16,
    padding: 16,
    justifyContent: 'center',
  },
  highlightHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  highlightNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  highlightLabel: {
    fontSize: 13,
    color: theme.colors.textPrimary,
    opacity: 0.8,
  },

  // General Card
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
  },
  attendanceBadge: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  attendanceBadgeText: {
    color: theme.colors.success,
    fontWeight: 'bold',
    fontSize: 14,
  },
  attendanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginBottom: 20,
  },
  attendanceItem: {
    alignItems: 'center',
  },
  verticalDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#EEEEEE',
  },
  attendanceValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  attendanceLabel: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: '#F0F0F0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: theme.colors.success,
    borderRadius: 4,
  },

  // Analysis Item
  sectionContainer: {
    marginBottom: 20,
  },
  analysisItemContainer: {
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    elevation: 1,
  },
  analysisIconBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  analysisContentBox: {
    flex: 1,
  },
  analysisItemTitle: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginBottom: 4,
  },
  analysisItemValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
  },
  analysisItemSubtext: {
    fontSize: 13,
    color: theme.colors.textSecondary,
  },

  // Chart Styles
  chartContainer: {
    marginTop: 8,
  },
  chartRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  chartLabel: {
    width: 60,
    fontSize: 13,
    color: theme.colors.textSecondary,
    fontWeight: '500',
  },
  chartBarBackground: {
    flex: 1,
    height: 10,
    backgroundColor: '#F5F5F5',
    borderRadius: 5,
    marginHorizontal: 10,
    overflow: 'hidden',
  },
  chartBarFill: {
    height: '100%',
    borderRadius: 5,
  },
  chartValue: {
    width: 30,
    fontSize: 13,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
    textAlign: 'right',
  },
  
  emptyState: {
     padding: 40,
     alignItems: 'center',
     justifyContent: 'center',
     opacity: 0.6
  },
  emptyStateText: {
     marginTop: 10,
     color: theme.colors.textSecondary,
     fontSize: 14
  }
});

export default DoctorAnalyticsScreen;