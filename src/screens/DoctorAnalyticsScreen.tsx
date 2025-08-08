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
        const analyticsData = getAnalytics(response);
        setAnalytics(analyticsData);
        console.log('✅ تم جلب التحليلات بنجاح:', response.length, 'موعد');
      } else {
        console.log('⚠️ لا توجد مواعيد للتحليل:', response);
        setAnalytics(null);
      }
    } catch (error) {
      console.error('❌ خطأ في جلب التحليلات:', error);
      Alert.alert('خطأ', 'فشل في جلب التحليلات من قاعدة البيانات');
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

  const getAnalytics = (appointments: any[]): Analytics => {
    const today = getLocalDateString(); // استخدام التوقيت المحلي
    const analytics: Analytics = {
      totalAppointments: appointments.length,
      todayAppointments: appointments.filter(apt => apt.date === today).length,
      upcomingAppointments: appointments.filter(apt => new Date(apt.date) > new Date()).length,
      pastAppointments: appointments.filter(apt => new Date(apt.date) < new Date()).length,
      appointmentsByDay: {},
      appointmentsByMonth: {},
      appointmentsByTime: {},
      mostBusyDay: null,
      mostBusyTime: null,
      averageAppointmentsPerDay: 0,
      totalPatients: 0
    };

    // تحليل حسب الأيام والأشهر والأوقات
    appointments.forEach(apt => {
      const date = new Date(apt.date);
      const dayKey = date.toLocaleDateString('ar-EG', { weekday: 'long' });
      const monthKey = date.toLocaleDateString('ar-EG', { month: 'long', year: 'numeric' });
      const timeKey = apt.time;
      
      analytics.appointmentsByDay[dayKey] = (analytics.appointmentsByDay[dayKey] || 0) + 1;
      analytics.appointmentsByMonth[monthKey] = (analytics.appointmentsByMonth[monthKey] || 0) + 1;
      analytics.appointmentsByTime[timeKey] = (analytics.appointmentsByTime[timeKey] || 0) + 1;
    });

    // العثور على أكثر يوم مشغول
    analytics.mostBusyDay = Object.entries(analytics.appointmentsByDay)
      .sort(([,a], [,b]) => b - a)[0] || null;
    
    // العثور على أكثر وقت مشغول
    analytics.mostBusyTime = Object.entries(analytics.appointmentsByTime)
      .sort(([,a], [,b]) => b - a)[0] || null;
    
    // متوسط المواعيد يومياً
    const uniqueDays = Object.keys(analytics.appointmentsByDay).length;
    analytics.averageAppointmentsPerDay = uniqueDays > 0 ? 
      parseFloat((analytics.totalAppointments / uniqueDays).toFixed(1)) : 0;
    
    // إجمالي المرضى الفريدين
    const uniquePatients = new Set(appointments.map(apt => apt.userId?._id || apt.userName));
    analytics.totalPatients = uniquePatients.size;
    
    return analytics;
  };

  const getPeriodText = (period: string) => {
    switch (period) {
      case 'week': return 'الأسبوع';
      case 'month': return 'الشهر';
      case 'year': return 'السنة';
      default: return 'الأسبوع';
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>جاري تحميل التحليلات...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>تحليلات الطبيب</Text>
        <Text style={styles.headerSubtitle}>إحصائيات وتقارير الأداء</Text>
      </View>

      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Period Selector */}
        <View style={styles.periodSelector}>
          <Text style={styles.periodLabel}>الفترة الزمنية:</Text>
          <View style={styles.periodButtons}>
            {['week', 'month', 'year'].map((period) => (
              <TouchableOpacity
                key={period}
                style={[
                  styles.periodButton,
                  selectedPeriod === period && styles.periodButtonActive,
                ]}
                onPress={() => setSelectedPeriod(period)}
              >
                <Text style={[
                  styles.periodButtonText,
                  selectedPeriod === period && styles.periodButtonTextActive,
                ]}>
                  {getPeriodText(period)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Quick Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Ionicons name="calendar" size={32} color={theme.colors.primary} />
            <Text style={styles.statNumber}>{analytics?.totalAppointments || 0}</Text>
            <Text style={styles.statLabel}>إجمالي المواعيد</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="today" size={32} color={theme.colors.warning} />
            <Text style={styles.statNumber}>{analytics?.todayAppointments || 0}</Text>
            <Text style={styles.statLabel}>مواعيد اليوم</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="time" size={32} color={theme.colors.info} />
            <Text style={styles.statNumber}>{analytics?.upcomingAppointments || 0}</Text>
            <Text style={styles.statLabel}>مواعيد قادمة</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="checkmark-circle" size={32} color={theme.colors.success} />
            <Text style={styles.statNumber}>{analytics?.pastAppointments || 0}</Text>
            <Text style={styles.statLabel}>مواعيد مكتملة</Text>
          </View>
        </View>

        {/* Additional Stats */}
        <View style={styles.additionalStatsContainer}>
          <View style={styles.additionalStatCard}>
            <Ionicons name="people" size={24} color={theme.colors.primary} />
            <View style={styles.additionalStatContent}>
              <Text style={styles.additionalStatNumber}>{analytics?.totalPatients || 0}</Text>
              <Text style={styles.additionalStatLabel}>إجمالي المرضى</Text>
            </View>
          </View>
          <View style={styles.additionalStatCard}>
            <Ionicons name="trending-up" size={24} color={theme.colors.success} />
            <View style={styles.additionalStatContent}>
              <Text style={styles.additionalStatNumber}>{analytics?.averageAppointmentsPerDay || 0}</Text>
              <Text style={styles.additionalStatLabel}>متوسط المواعيد/يوم</Text>
            </View>
          </View>
        </View>

        {/* Busy Day Analysis */}
        {analytics?.mostBusyDay && (
          <View style={styles.analysisCard}>
            <Text style={styles.analysisTitle}>أكثر يوم مشغول</Text>
            <View style={styles.analysisContent}>
              <Ionicons name="calendar" size={24} color={theme.colors.primary} />
              <View style={styles.analysisText}>
                <Text style={styles.analysisValue}>{analytics.mostBusyDay[0]}</Text>
                <Text style={styles.analysisSubtext}>{analytics.mostBusyDay[1]} موعد</Text>
              </View>
            </View>
          </View>
        )}

        {/* Busy Time Analysis */}
        {analytics?.mostBusyTime && (
          <View style={styles.analysisCard}>
            <Text style={styles.analysisTitle}>أكثر وقت مشغول</Text>
            <View style={styles.analysisContent}>
              <Ionicons name="time" size={24} color={theme.colors.warning} />
              <View style={styles.analysisText}>
                <Text style={styles.analysisValue}>{analytics.mostBusyTime[0]}</Text>
                <Text style={styles.analysisSubtext}>{analytics.mostBusyTime[1]} موعد</Text>
              </View>
            </View>
          </View>
        )}

        {/* Appointments by Day */}
        {Object.keys(analytics?.appointmentsByDay || {}).length > 0 && (
          <View style={styles.analysisCard}>
            <Text style={styles.analysisTitle}>المواعيد حسب اليوم</Text>
            {Object.entries(analytics?.appointmentsByDay || {}).map(([day, count]) => (
              <View key={day} style={styles.dayAnalysis}>
                <Text style={styles.dayName}>{day}</Text>
                <View style={styles.dayBar}>
                  <View 
                    style={[
                      styles.dayBarFill, 
                      { 
                        width: `${(count / Math.max(...Object.values(analytics?.appointmentsByDay || {}))) * 100}%` 
                      }
                    ]} 
                  />
                </View>
                <Text style={styles.dayCount}>{count}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Appointments by Time */}
        {Object.keys(analytics?.appointmentsByTime || {}).length > 0 && (
          <View style={styles.analysisCard}>
            <Text style={styles.analysisTitle}>المواعيد حسب الوقت</Text>
            {Object.entries(analytics?.appointmentsByTime || {})
              .sort(([,a], [,b]) => b - a)
              .slice(0, 5)
              .map(([time, count]) => (
                <View key={time} style={styles.timeAnalysis}>
                  <Text style={styles.timeValue}>{time}</Text>
                  <View style={styles.timeBar}>
                    <View 
                      style={[
                        styles.timeBarFill, 
                        { 
                          width: `${(count / Math.max(...Object.values(analytics?.appointmentsByTime || {}))) * 100}%` 
                        }
                      ]} 
                    />
                  </View>
                  <Text style={styles.timeCount}>{count}</Text>
                </View>
              ))}
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
});

export default DoctorAnalyticsScreen; 