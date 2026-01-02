import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../utils/theme';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const CenterHomeScreen: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [centerData, setCenterData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCenterData();
  }, []);

  const fetchCenterData = async () => {
    try {
      setLoading(true);
      const response = await api.get('/center/profile');
      setCenterData(response.data);
    } catch (error) {
      Alert.alert('خطأ', 'فشل في جلب بيانات المركز');
    } finally {
      setLoading(false);
    }
  };

  const handleAction = (action: string) => {
    Alert.alert('ميزة قيد التطوير', `سيتم إضافة ${action} قريباً`);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>{t('center.loading_data')}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t('center.welcome')}</Text>
        <Text style={styles.headerSubtitle}>{centerData?.name || t('center.health_center')}</Text>
      </View>

      <ScrollView style={styles.content}>
        {/* Quick Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Ionicons name="people" size={32} color={theme.colors.primary} />
            <Text style={styles.statNumber}>12</Text>
            <Text style={styles.statLabel}>{t('center.doctors')}</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="calendar" size={32} color={theme.colors.success} />
            <Text style={styles.statNumber}>45</Text>
            <Text style={styles.statLabel}>{t('center.today_appointments')}</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="medical" size={32} color={theme.colors.warning} />
            <Text style={styles.statNumber}>8</Text>
            <Text style={styles.statLabel}>{t('center.services')}</Text>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.actionsContainer}>
          <Text style={styles.sectionTitle}>{t('center.quick_actions')}</Text>
          
          <View style={styles.actionGrid}>
            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => handleAction('إدارة الأطباء')}
            >
              <Ionicons name="people" size={32} color={theme.colors.primary} />
              <Text style={styles.actionTitle}>{t('center.manage_doctors')}</Text>
              <Text style={styles.actionSubtitle}>{t('center.add_edit_doctors')}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => handleAction('المواعيد')}
            >
              <Ionicons name="calendar" size={32} color={theme.colors.success} />
              <Text style={styles.actionTitle}>{t('center.appointments')}</Text>
              <Text style={styles.actionSubtitle}>{t('center.manage_daily_appointments')}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => handleAction('الخدمات')}
            >
              <Ionicons name="medical" size={32} color={theme.colors.warning} />
              <Text style={styles.actionTitle}>{t('center.services')}</Text>
              <Text style={styles.actionSubtitle}>{t('center.manage_services')}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => handleAction('التقارير')}
            >
              <Ionicons name="analytics" size={32} color={theme.colors.error} />
              <Text style={styles.actionTitle}>{t('center.reports')}</Text>
              <Text style={styles.actionSubtitle}>{t('center.view_statistics')}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Recent Activity */}
        <View style={styles.activityContainer}>
          <Text style={styles.sectionTitle}>{t('center.recent_activities')}</Text>
          
          <View style={styles.activityList}>
            <View style={styles.activityItem}>
              <Ionicons name="checkmark-circle" size={20} color={theme.colors.success} />
              <View style={styles.activityContent}>
                <Text style={styles.activityTitle}>{t('center.new_doctor_added')}</Text>
                <Text style={styles.activityTime}>{t('center.two_hours_ago')}</Text>
              </View>
            </View>

            <View style={styles.activityItem}>
              <Ionicons name="calendar" size={20} color={theme.colors.primary} />
              <View style={styles.activityContent}>
                <Text style={styles.activityTitle}>{t('center.new_appointment_booked')}</Text>
                <Text style={styles.activityTime}>{t('center.three_hours_ago')}</Text>
              </View>
            </View>

            <View style={styles.activityItem}>
              <Ionicons name="medical" size={20} color={theme.colors.warning} />
              <View style={styles.activityContent}>
                <Text style={styles.activityTitle}>{t('center.services_updated')}</Text>
                <Text style={styles.activityTime}>{t('center.five_hours_ago')}</Text>
              </View>
            </View>
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
    paddingTop: 30,
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
  },
  actionsContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
    marginBottom: 16,
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionCard: {
    width: '48%',
    backgroundColor: theme.colors.white,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
    elevation: 2,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
    marginTop: 8,
    textAlign: 'center',
  },
  actionSubtitle: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: 4,
    textAlign: 'center',
  },
  activityContainer: {
    marginBottom: 24,
  },
  activityList: {
    backgroundColor: theme.colors.white,
    borderRadius: 12,
    padding: 16,
    elevation: 2,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  activityContent: {
    marginLeft: 12,
    flex: 1,
  },
  activityTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
  },
  activityTime: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
});

export default CenterHomeScreen; 
