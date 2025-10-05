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
        <Text style={styles.loadingText}>جاري تحميل بيانات المركز...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>مرحباً بك في المركز الصحي</Text>
        <Text style={styles.headerSubtitle}>{centerData?.name || 'مركز صحي'}</Text>
      </View>

      <ScrollView style={styles.content}>
        {/* Quick Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Ionicons name="people" size={32} color={theme.colors.primary} />
            <Text style={styles.statNumber}>12</Text>
            <Text style={styles.statLabel}>الأطباء</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="calendar" size={32} color={theme.colors.success} />
            <Text style={styles.statNumber}>45</Text>
            <Text style={styles.statLabel}>المواعيد اليوم</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="medical" size={32} color={theme.colors.warning} />
            <Text style={styles.statNumber}>8</Text>
            <Text style={styles.statLabel}>الخدمات</Text>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.actionsContainer}>
          <Text style={styles.sectionTitle}>إجراءات سريعة</Text>
          
          <View style={styles.actionGrid}>
            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => handleAction('إدارة الأطباء')}
            >
              <Ionicons name="people" size={32} color={theme.colors.primary} />
              <Text style={styles.actionTitle}>إدارة الأطباء</Text>
              <Text style={styles.actionSubtitle}>إضافة وتعديل الأطباء</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => handleAction('المواعيد')}
            >
              <Ionicons name="calendar" size={32} color={theme.colors.success} />
              <Text style={styles.actionTitle}>المواعيد</Text>
              <Text style={styles.actionSubtitle}>إدارة المواعيد اليومية</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => handleAction('الخدمات')}
            >
              <Ionicons name="medical" size={32} color={theme.colors.warning} />
              <Text style={styles.actionTitle}>الخدمات</Text>
              <Text style={styles.actionSubtitle}>إدارة الخدمات المقدمة</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => handleAction('التقارير')}
            >
              <Ionicons name="analytics" size={32} color={theme.colors.error} />
              <Text style={styles.actionTitle}>التقارير</Text>
              <Text style={styles.actionSubtitle}>عرض الإحصائيات والتقارير</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Recent Activity */}
        <View style={styles.activityContainer}>
          <Text style={styles.sectionTitle}>النشاطات الأخيرة</Text>
          
          <View style={styles.activityList}>
            <View style={styles.activityItem}>
              <Ionicons name="checkmark-circle" size={20} color={theme.colors.success} />
              <View style={styles.activityContent}>
                <Text style={styles.activityTitle}>تم إضافة طبيب جديد</Text>
                <Text style={styles.activityTime}>منذ ساعتين</Text>
              </View>
            </View>

            <View style={styles.activityItem}>
              <Ionicons name="calendar" size={20} color={theme.colors.primary} />
              <View style={styles.activityContent}>
                <Text style={styles.activityTitle}>موعد جديد محجوز</Text>
                <Text style={styles.activityTime}>منذ 3 ساعات</Text>
              </View>
            </View>

            <View style={styles.activityItem}>
              <Ionicons name="medical" size={20} color={theme.colors.warning} />
              <View style={styles.activityContent}>
                <Text style={styles.activityTitle}>تم تحديث الخدمات</Text>
                <Text style={styles.activityTime}>منذ 5 ساعات</Text>
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
