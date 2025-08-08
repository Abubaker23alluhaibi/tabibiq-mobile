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
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../utils/theme';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';

const { width, height } = Dimensions.get('window');

const MyAppointmentsScreen = () => {
  const navigation = useNavigation();
  const { t } = useTranslation();
  const { user } = useAuth();
  
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState('all');

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      console.log('🔄 جلب مواعيد المستخدم:', user?.id);
      
      if (!user?.id) {
        console.log('❌ لا يوجد مستخدم مسجل دخول');
        setAppointments([]);
        return;
      }

      // جلب المواعيد الحقيقية من الخادم
      const response = await api.get(`/user-appointments/${user.id}`);
      console.log('📥 استجابة المواعيد:', response);
      
             if (Array.isArray(response)) {
         // تحويل البيانات إلى التنسيق المطلوب للعرض
         const formattedAppointments = response.map((appointment: any) => {
           console.log('📋 بيانات الموعد:', appointment);
           
           return {
             id: appointment._id || appointment.id,
             doctorName: appointment.doctorName || appointment.doctorId?.name || 'طبيب',
             doctorSpecialty: appointment.doctorId?.specialty || 'تخصص عام',
             doctorImage: appointment.doctorId?.image || appointment.doctorId?.profile_image || 'https://via.placeholder.com/60',
             date: appointment.date,
             time: appointment.time,
             status: appointment.status || 'pending',
             type: appointment.type || 'consultation',
             location: appointment.doctorId?.clinicLocation || appointment.doctorId?.province || 'موقع العيادة',
             reason: appointment.reason || '',
             duration: appointment.duration || 30
           };
         });
        
        console.log('✅ تم تنسيق المواعيد:', formattedAppointments);
        setAppointments(formattedAppointments);
      } else {
        console.log('⚠️ استجابة غير متوقعة:', response);
        setAppointments([]);
      }
    } catch (error) {
      console.error('❌ خطأ في جلب المواعيد:', error);
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
        return t('appointment.confirmed');
      case 'completed':
        return t('appointment.completed');
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

  const filteredAppointments = appointments.filter(appointment => {
    if (selectedFilter === 'all') return true;
    return appointment.status === selectedFilter;
  });

  const renderAppointmentCard = ({ item }: any) => (
    <View style={styles.appointmentCard}>
      <View style={styles.appointmentHeader}>
        <View style={styles.doctorInfo}>
          <Image source={{ uri: item.doctorImage }} style={styles.doctorImage} />
          <View>
            <Text style={styles.doctorName}>{item.doctorName}</Text>
            <Text style={styles.doctorSpecialty}>{item.doctorSpecialty}</Text>
          </View>
        </View>
        
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.statusText}>{getStatusText(item.status)}</Text>
        </View>
      </View>
      
      <View style={styles.appointmentDetails}>
        <View style={styles.detailRow}>
          <Ionicons name="calendar" size={16} color={theme.colors.textSecondary} />
          <Text style={styles.detailText}>{item.date}</Text>
        </View>
        
        <View style={styles.detailRow}>
          <Ionicons name="time" size={16} color={theme.colors.textSecondary} />
          <Text style={styles.detailText}>{item.time}</Text>
        </View>
        
        <View style={styles.detailRow}>
          <Ionicons name="location" size={16} color={theme.colors.textSecondary} />
          <Text style={styles.detailText}>{item.location}</Text>
        </View>
        
        <View style={styles.detailRow}>
          <Ionicons name="medical" size={16} color={theme.colors.textSecondary} />
          <Text style={styles.detailText}>{getTypeText(item.type)}</Text>
        </View>
      </View>
      
      <View style={styles.appointmentActions}>
        {item.status === 'confirmed' && (
          <>
            <TouchableOpacity style={styles.actionButton}>
              <Ionicons name="call" size={16} color={theme.colors.primary} />
              <Text style={styles.actionText}>{t('appointment.call')}</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.actionButton}>
              <Ionicons name="chatbubble" size={16} color={theme.colors.primary} />
              <Text style={styles.actionText}>{t('appointment.message')}</Text>
            </TouchableOpacity>
          </>
        )}
        
        {item.status === 'pending' && (
          <TouchableOpacity style={styles.cancelButton}>
            <Ionicons name="close-circle" size={16} color={theme.colors.error} />
            <Text style={styles.cancelButtonText}>{t('appointment.cancel')}</Text>
          </TouchableOpacity>
        )}
        
        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="document-text" size={16} color={theme.colors.primary} />
          <Text style={styles.actionText}>{t('appointment.details')}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderFilterButton = ({ title, value }: any) => (
    <TouchableOpacity
      style={[
        styles.filterButton,
        selectedFilter === value && styles.filterButtonActive
      ]}
      onPress={() => setSelectedFilter(value)}
    >
      <Text style={[
        styles.filterButtonText,
        selectedFilter === value && styles.filterButtonTextActive
      ]}>
        {title}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.primary} />
      
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
        <Text style={styles.headerTitle}>{t('appointments.my_appointments')}</Text>
      </LinearGradient>

      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {[
            { title: t('common.all'), value: 'all' },
            { title: t('appointment.confirmed'), value: 'confirmed' },
            { title: t('appointment.pending'), value: 'pending' },
            { title: t('appointment.cancelled'), value: 'cancelled' },
          ].map((filter) => (
            <View key={filter.value} style={styles.filterButtonContainer}>
              {renderFilterButton(filter)}
            </View>
          ))}
        </ScrollView>
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
            <Ionicons name="calendar-outline" size={64} color={theme.colors.textSecondary} />
            <Text style={styles.emptyTitle}>{t('appointments.no_appointments')}</Text>
            <Text style={styles.emptySubtitle}>{t('appointments.no_appointments_subtitle')}</Text>
            <TouchableOpacity
              style={styles.bookButton}
              onPress={() => navigation.navigate('UserHome' as never)}
            >
              <Text style={styles.bookButtonText}>{t('appointment.book_now')}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={filteredAppointments}
            renderItem={renderAppointmentCard}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
            contentContainerStyle={styles.appointmentsList}
          />
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
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.white,
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
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  doctorName: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.textPrimary,
  },
  doctorSpecialty: {
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
    marginBottom: 12,
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
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  cancelButtonText: {
    fontSize: 12,
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
});

export default MyAppointmentsScreen; 