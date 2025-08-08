import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../utils/theme';
import { api } from '../services/api';

const TABS = [
  { id: 'overview', label: 'نظرة عامة', icon: 'stats-chart' },
  { id: 'users', label: 'المستخدمين', icon: 'people' },
  { id: 'doctors', label: 'الأطباء', icon: 'medkit' },
  { id: 'centers', label: 'المراكز الصحية', icon: 'business' },
  { id: 'appointments', label: 'المواعيد', icon: 'calendar' },
  { id: 'analytics', label: 'التحليل', icon: 'analytics' },
];

const AdminDashboardScreen: React.FC = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<any[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [centers, setCenters] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any>({});

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [usersRes, doctorsRes, appointmentsRes, centersRes, analyticsRes] = await Promise.all([
        api.get('/admin/users'),
        api.get('/admin/doctors'),
        api.get('/admin/appointments'),
        api.get('/admin/health-centers'),
        api.get('/admin/analytics'),
      ]);
      setUsers(usersRes.data);
      setDoctors(doctorsRes.data);
      setAppointments(appointmentsRes.data);
      setCenters(centersRes.data);
      setAnalytics(analyticsRes.data);
    } catch (error) {
      Alert.alert('خطأ', 'فشل في جلب بيانات الأدمن');
    } finally {
      setLoading(false);
    }
  };

  const renderTab = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <ScrollView style={styles.tabContent}>
            <Text style={styles.sectionTitle}>إحصائيات سريعة</Text>
            <View style={styles.statsRow}>
              <View style={styles.statBox}><Text style={styles.statNumber}>{users.length}</Text><Text style={styles.statLabel}>المستخدمين</Text></View>
              <View style={styles.statBox}><Text style={styles.statNumber}>{doctors.length}</Text><Text style={styles.statLabel}>الأطباء</Text></View>
            </View>
            <View style={styles.statsRow}>
              <View style={styles.statBox}><Text style={styles.statNumber}>{appointments.length}</Text><Text style={styles.statLabel}>المواعيد</Text></View>
              <View style={styles.statBox}><Text style={styles.statNumber}>{centers.length}</Text><Text style={styles.statLabel}>المراكز الصحية</Text></View>
            </View>
          </ScrollView>
        );
      case 'users':
        return (
          <ScrollView style={styles.tabContent}>
            <Text style={styles.sectionTitle}>قائمة المستخدمين</Text>
            {users.map((user, idx) => (
              <View key={user.id || idx} style={styles.listItem}>
                <Ionicons name="person" size={24} color={theme.colors.primary} />
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.itemTitle}>{user.name}</Text>
                  <Text style={styles.itemSubtitle}>{user.email}</Text>
                </View>
              </View>
            ))}
          </ScrollView>
        );
      case 'doctors':
        return (
          <ScrollView style={styles.tabContent}>
            <Text style={styles.sectionTitle}>قائمة الأطباء</Text>
            {doctors.map((doctor, idx) => (
              <View key={doctor.id || idx} style={styles.listItem}>
                <Ionicons name="medkit" size={24} color={theme.colors.primary} />
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.itemTitle}>{doctor.name}</Text>
                  <Text style={styles.itemSubtitle}>{doctor.specialty}</Text>
                </View>
              </View>
            ))}
          </ScrollView>
        );
      case 'centers':
        return (
          <ScrollView style={styles.tabContent}>
            <Text style={styles.sectionTitle}>المراكز الصحية</Text>
            {centers.map((center, idx) => (
              <View key={center.id || idx} style={styles.listItem}>
                <Ionicons name="business" size={24} color={theme.colors.primary} />
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.itemTitle}>{center.name}</Text>
                  <Text style={styles.itemSubtitle}>{center.type}</Text>
                </View>
              </View>
            ))}
          </ScrollView>
        );
      case 'appointments':
        return (
          <ScrollView style={styles.tabContent}>
            <Text style={styles.sectionTitle}>قائمة المواعيد</Text>
            {appointments.map((apt, idx) => (
              <View key={apt.id || idx} style={styles.listItem}>
                <Ionicons name="calendar" size={24} color={theme.colors.primary} />
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.itemTitle}>{apt.user_name} - {apt.doctor_name}</Text>
                  <Text style={styles.itemSubtitle}>{apt.date} {apt.time}</Text>
                </View>
              </View>
            ))}
          </ScrollView>
        );
      case 'analytics':
        return (
          <ScrollView style={styles.tabContent}>
            <Text style={styles.sectionTitle}>التحليل والإحصائيات</Text>
            {/* مثال: أفضل الأطباء */}
            <Text style={styles.sectionSubtitle}>أفضل الأطباء</Text>
            {analytics.topDoctors && analytics.topDoctors.map((doc, idx) => (
              <View key={idx} style={styles.listItem}>
                <Ionicons name="star" size={24} color={theme.colors.warning} />
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.itemTitle}>{doc.name}</Text>
                  <Text style={styles.itemSubtitle}>{doc.specialty} - {doc.appointments} موعد</Text>
                </View>
              </View>
            ))}
            {/* مثال: أفضل التخصصات */}
            <Text style={styles.sectionSubtitle}>أفضل التخصصات</Text>
            {analytics.topSpecialties && analytics.topSpecialties.map((spec, idx) => (
              <View key={idx} style={styles.listItem}>
                <Ionicons name="medal" size={24} color={theme.colors.primary} />
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.itemTitle}>{spec.specialty}</Text>
                  <Text style={styles.itemSubtitle}>{spec.count} طبيب - {spec.appointments} موعد</Text>
                </View>
              </View>
            ))}
          </ScrollView>
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>جاري تحميل بيانات الأدمن...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* التبويبات */}
      <View style={styles.tabsRow}>
        {TABS.map(tab => (
          <TouchableOpacity
            key={tab.id}
            style={[styles.tabButton, activeTab === tab.id && styles.tabButtonActive]}
            onPress={() => setActiveTab(tab.id)}
          >
            <Ionicons name={tab.icon} size={20} color={activeTab === tab.id ? theme.colors.white : theme.colors.primary} />
            <Text style={[styles.tabLabel, activeTab === tab.id && styles.tabLabelActive]}>{tab.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
      {/* محتوى التبويب */}
      {renderTab()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.colors.background },
  loadingText: { marginTop: 16, fontSize: 16, color: theme.colors.textSecondary },
  tabsRow: { flexDirection: 'row', backgroundColor: theme.colors.white, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
  tabButton: { flex: 1, alignItems: 'center', paddingVertical: 12, flexDirection: 'row', justifyContent: 'center' },
  tabButtonActive: { backgroundColor: theme.colors.primary },
  tabLabel: { marginLeft: 6, color: theme.colors.primary, fontWeight: 'bold' },
  tabLabelActive: { color: theme.colors.white },
  tabContent: { flex: 1, padding: 16 },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', color: theme.colors.primary, marginBottom: 16 },
  sectionSubtitle: { fontSize: 16, fontWeight: 'bold', color: theme.colors.textSecondary, marginTop: 16, marginBottom: 8 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  statBox: { flex: 1, backgroundColor: theme.colors.white, borderRadius: 12, padding: 16, marginHorizontal: 4, alignItems: 'center', elevation: 2 },
  statNumber: { fontSize: 24, fontWeight: 'bold', color: theme.colors.primary },
  statLabel: { fontSize: 14, color: theme.colors.textSecondary },
  listItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.colors.white, borderRadius: 8, padding: 12, marginBottom: 8, elevation: 1 },
  itemTitle: { fontSize: 16, fontWeight: 'bold', color: theme.colors.textPrimary },
  itemSubtitle: { fontSize: 13, color: theme.colors.textSecondary },
});

export default AdminDashboardScreen;