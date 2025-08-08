import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
  Image,
  Dimensions,
  StatusBar,
  RefreshControl,
  Alert,
} from 'react-native';
import CSSScrollView from '../components/web/CSSScrollView';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../utils/theme';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../contexts/NotificationContext';
import { API_CONFIG } from '../config/api';
import { mapSpecialtyToArabic, getArabicSpecialties } from '../utils/specialtyMapper';

const { width, height } = Dimensions.get('window');

// تعريف نوع البيانات للطبيب
interface Doctor {
  id: string;
  name: string;
  specialty: string;
  province: string;
  area: string;
  rating: number;
  experience: string;
  image: string;
  available: boolean;
  about?: string;
  clinicLocation?: string;
  phone?: string;
  email?: string;
  isFeatured?: boolean;
  status?: string;
}

const UserHomeScreen = () => {
  const navigation = useNavigation();
  const { t } = useTranslation();
  const { user, signOut } = useAuth();
  const { 
    notifications, 
    scheduledNotifications, 
    isNotificationEnabled,
    registerForNotifications,
    sendNotification 
  } = useNotifications();
  
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProvince, setSelectedProvince] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const provinces = (t('provinces', { returnObjects: true }) as string[]) || [];
  const specialties = getArabicSpecialties();

  useEffect(() => {
    fetchDoctors();
    
    // تسجيل الإشعارات إذا لم تكن مفعلة
    if (!isNotificationEnabled) {
      registerForNotifications();
    }
  }, []);

  const fetchDoctors = async () => {
    setLoading(true);
    try {
      console.log('🔄 جلب الأطباء من قاعدة البيانات...');
      console.log('📍 عنوان API:', `${API_CONFIG.BASE_URL}/doctors`);
      
      // جلب الأطباء من API الحقيقي
      const response = await fetch(`${API_CONFIG.BASE_URL}/doctors`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const doctorsData = await response.json();
      console.log('📥 تم جلب الأطباء:', doctorsData.length, 'طبيب');
      
      // إضافة logging مفصل لبيانات الأطباء
      console.log('🔍 عينة من بيانات الأطباء:', doctorsData.slice(0, 2) as any);
      
      // معالجة البيانات لتتناسب مع التطبيق
      const processedDoctors = doctorsData.map((doctor: any, index: number) => {
        // إضافة logging لكل طبيب
        console.log(`🔍 معالجة الطبيب ${index + 1}:`, {
          id: doctor._id || doctor.id,
          name: doctor.name,
          specialty: doctor.specialty,
          originalSpecialty: doctor.specialty,
          category_ar: doctor.category_ar,
          category: doctor.category
        });
        
        // تحسين استخراج التخصص باستخدام الدالة الجديدة
        let specialty = mapSpecialtyToArabic(doctor.specialty || doctor.category_ar || doctor.category);
        
        const processedDoctor: Doctor = {
          id: doctor._id || doctor.id,
          name: doctor.name || 'د. غير محدد',
          specialty: specialty,
          province: doctor.province || 'غير محدد',
          area: doctor.area || 'غير محدد',
          rating: doctor.rating || 4.5,
          experience: doctor.experienceYears ? `${doctor.experienceYears} سنة` : 'غير محدد',
          image: doctor.imageUrl || (doctor.image ? `${API_CONFIG.BASE_URL}${doctor.image}` : 'https://via.placeholder.com/100'),
          available: doctor.status === 'approved' && doctor.active !== false,
          about: doctor.about || '',
          clinicLocation: doctor.clinicLocation || '',
          phone: doctor.phone || '',
          email: doctor.email || '',
          isFeatured: doctor.isFeatured || false,
          status: doctor.status || 'pending'
        };
        
        console.log(`✅ الطبيب ${index + 1} بعد المعالجة:`, {
          name: processedDoctor.name,
          specialty: processedDoctor.specialty
        });
        
        return processedDoctor;
      });
      
      console.log('✅ تم معالجة الأطباء:', processedDoctors.length);
      console.log('🔍 عينة من الأطباء المعالجين:', processedDoctors.slice(0, 2) as any);
      setDoctors(processedDoctors);
      
    } catch (error) {
      console.error('❌ خطأ في جلب الأطباء:', error);
      // في حالة الخطأ، استخدم بيانات وهمية كاحتياطي
      const fallbackDoctors: Doctor[] = [
        {
          id: '1',
          name: 'د. أحمد محمد',
          specialty: 'طب القلب',
          province: 'بغداد',
          area: 'الكرادة',
          rating: 4.8,
          experience: '15 سنة',
          image: 'https://via.placeholder.com/100',
          available: true,
        },
        {
          id: '2',
          name: 'د. فاطمة علي',
          specialty: 'طب الأطفال',
          province: 'بغداد',
          area: 'المنصور',
          rating: 4.9,
          experience: '12 سنة',
          image: 'https://via.placeholder.com/100',
          available: true,
        },
      ];
      setDoctors(fallbackDoctors);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchDoctors();
    setRefreshing(false);
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    // تطبيق البحث
  };

  const handleFilter = (province: string, specialty: string) => {
    setSelectedProvince(province);
    setSelectedSpecialty(specialty);
    setShowFilters(false);
    // تطبيق الفلتر
  };

  // فلترة الأطباء حسب البحث والفلترة
  const filteredDoctors = doctors.filter((doctor) => {
    const matchesSearch = !searchQuery || 
      doctor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doctor.specialty.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doctor.province.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doctor.area.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesProvince = !selectedProvince || doctor.province === selectedProvince;
    const matchesSpecialty = !selectedSpecialty || doctor.specialty === selectedSpecialty;
    
    return matchesSearch && matchesProvince && matchesSpecialty;
  });

  const handleDoctorPress = (doctor: Doctor) => {
    (navigation as any).navigate('DoctorDetails', { doctorId: doctor.id });
  };

  const handleSignOut = () => {
    Alert.alert(
      t('auth.logout'),
      t('auth.logout_confirm'),
      [
        {
          text: t('common.cancel'),
          style: 'cancel',
        },
        {
          text: t('common.confirm'),
          onPress: signOut,
        },
      ]
    );
  };

  const renderDoctorCard = ({ item }: { item: Doctor }) => (
    <TouchableOpacity
      style={styles.doctorCard}
      onPress={() => handleDoctorPress(item)}
    >
      <View style={styles.doctorImageContainer}>
        <Image source={{ uri: item.image }} style={styles.doctorImage} />
        {item.available && (
          <View style={styles.availableBadge}>
            <Text style={styles.availableText}>{t('doctor.available')}</Text>
          </View>
        )}
      </View>
      
      <View style={styles.doctorInfo}>
        <Text style={styles.doctorName}>{item.name}</Text>
        
        {/* تحسين عرض التخصص */}
        <View style={styles.specialtyContainer}>
          <Ionicons name="medical" size={16} color={theme.colors.primary} />
          <Text style={styles.doctorSpecialty}>
            {item.specialty || 'غير محدد'}
          </Text>
        </View>
        
        <View style={styles.doctorLocation}>
          <Ionicons name="location" size={14} color={theme.colors.textSecondary} />
          <Text style={styles.doctorLocationText}>
            {item.province}, {item.area}
          </Text>
        </View>
        
        <View style={styles.doctorRating}>
          <Ionicons name="star" size={16} color={theme.colors.warning} />
          <Text style={styles.doctorRatingText}>{item.rating}</Text>
          <Text style={styles.doctorExperience}>{item.experience}</Text>
        </View>
      </View>
      
      <TouchableOpacity style={styles.bookButton}>
        <Text style={styles.bookButtonText}>{t('appointment.book')}</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  const renderFilterModal = () => (
    <View style={styles.filterModal}>
      <View style={styles.filterHeader}>
        <Text style={styles.filterTitle}>{t('search.filters')}</Text>
        <TouchableOpacity onPress={() => setShowFilters(false)}>
          <Ionicons name="close" size={24} color={theme.colors.textPrimary} />
        </TouchableOpacity>
      </View>
      
      <View style={styles.filterSection}>
        <Text style={styles.filterLabel}>{t('search.province')}</Text>
        <CSSScrollView horizontal showsHorizontalScrollIndicator={false}>
          {provinces.map((province: string) => (
            <TouchableOpacity
              key={province}
              style={[
                styles.filterChip,
                selectedProvince === province && styles.filterChipActive
              ]}
              onPress={() => setSelectedProvince(province)}
            >
              <Text style={[
                styles.filterChipText,
                selectedProvince === province && styles.filterChipTextActive
              ]}>
                {province}
              </Text>
            </TouchableOpacity>
          ))}
        </CSSScrollView>
      </View>
      
      <View style={styles.filterSection}>
        <Text style={styles.filterLabel}>{t('search.specialty')}</Text>
        <CSSScrollView horizontal showsHorizontalScrollIndicator={false}>
          {specialties.map((specialty: string) => (
            <TouchableOpacity
              key={specialty}
              style={[
                styles.filterChip,
                selectedSpecialty === specialty && styles.filterChipActive
              ]}
              onPress={() => setSelectedSpecialty(specialty)}
            >
              <Text style={[
                styles.filterChipText,
                selectedSpecialty === specialty && styles.filterChipTextActive
              ]}>
                {specialty}
              </Text>
            </TouchableOpacity>
          ))}
        </CSSScrollView>
      </View>
      
      <TouchableOpacity
        style={styles.applyFilterButton}
        onPress={() => handleFilter(selectedProvince, selectedSpecialty)}
      >
        <Text style={styles.applyFilterButtonText}>{t('search.apply_filters')}</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.primary} />
      
      <LinearGradient
        colors={[theme.colors.primary, theme.colors.primaryDark]}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <View style={styles.userInfo}>
            <Text style={styles.welcomeText}>{t('user_home.welcome')}</Text>
            <Text style={styles.userName}>{user?.name}</Text>
          </View>
          
          <View style={styles.headerButtons}>
            <TouchableOpacity 
              style={styles.notificationButton} 
              onPress={() => navigation.navigate('NotificationSettings' as never)}
            >
              <Ionicons name="notifications" size={24} color={theme.colors.white} />
              {notifications.length > 0 && (
                <View style={styles.notificationBadge}>
                  <Text style={styles.notificationBadgeText}>
                    {notifications.length > 9 ? '9+' : notifications.length}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.profileButton} onPress={() => navigation.navigate('UserProfile' as never)}>
              <Ionicons name="person" size={24} color={theme.colors.white} />
            </TouchableOpacity>
          </View>
        </View>
        
        <View style={styles.searchContainer}>
          <View style={styles.searchInputContainer}>
            <Ionicons name="search" size={20} color={theme.colors.textSecondary} />
            <TextInput
              style={styles.searchInput}
              placeholder={t('search.find_doctor')}
              placeholderTextColor={theme.colors.textSecondary}
              value={searchQuery}
              onChangeText={handleSearch}
            />
          </View>
          
          <TouchableOpacity
            style={styles.filterButton}
            onPress={() => setShowFilters(!showFilters)}
          >
            <Ionicons name="filter" size={20} color={theme.colors.white} />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {showFilters && renderFilterModal()}

      <CSSScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Ionicons name="calendar" size={24} color={theme.colors.primary} />
            <Text style={styles.statNumber}>5</Text>
            <Text style={styles.statLabel}>{t('user_home.appointments')}</Text>
          </View>
          
          <View style={styles.statCard}>
            <Ionicons name="medical" size={24} color={theme.colors.primary} />
            <Text style={styles.statNumber}>{scheduledNotifications.filter(n => n.content.data?.type === 'medicine').length}</Text>
            <Text style={styles.statLabel}>{t('user_home.reminders')}</Text>
          </View>
          
          <View style={styles.statCard}>
            <Ionicons name="notifications" size={24} color={theme.colors.primary} />
            <Text style={styles.statNumber}>{notifications.length}</Text>
            <Text style={styles.statLabel}>{t('user_home.notifications')}</Text>
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{t('user_home.recommended_doctors')}</Text>
          <TouchableOpacity>
            <Text style={styles.seeAllText}>{t('common.see_all')}</Text>
          </TouchableOpacity>
        </View>

        <FlatList
          data={filteredDoctors}
          renderItem={renderDoctorCard}
          keyExtractor={(item) => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.doctorsList}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="search" size={64} color={theme.colors.textSecondary} />
              <Text style={styles.emptyText}>
                {loading ? 'جاري التحميل...' : 'لا يوجد أطباء متاحون'}
              </Text>
            </View>
          }
        />

        <View style={styles.quickActions}>
          <TouchableOpacity
            style={styles.quickAction}
            onPress={() => navigation.navigate('MyAppointments' as never)}
          >
            <View style={styles.quickActionIcon}>
              <Ionicons name="calendar" size={24} color={theme.colors.white} />
            </View>
            <Text style={styles.quickActionText}>{t('appointments.my_appointments')}</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.quickAction}
            onPress={() => navigation.navigate('MedicineReminder' as never)}
          >
            <View style={styles.quickActionIcon}>
              <Ionicons name="medical" size={24} color={theme.colors.white} />
            </View>
            <Text style={styles.quickActionText}>{t('medicine_reminder.title')}</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.quickAction}
            onPress={() => navigation.navigate('HealthCenters' as never)}
          >
            <View style={styles.quickActionIcon}>
              <Ionicons name="business" size={24} color={theme.colors.white} />
            </View>
            <Text style={styles.quickActionText}>{t('health_centers.title')}</Text>
          </TouchableOpacity>
        </View>
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
    marginBottom: 20,
  },
  userInfo: {
    flex: 1,
  },
  welcomeText: {
    fontSize: 16,
    color: theme.colors.white + 'CC',
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.white,
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  notificationButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.white + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: theme.colors.error,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationBadgeText: {
    color: theme.colors.white,
    fontSize: 10,
    fontWeight: 'bold',
  },
  profileButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.white + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.white,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: theme.colors.textPrimary,
    marginLeft: 8,
  },
  filterButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: theme.colors.white + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterModal: {
    backgroundColor: theme.colors.white,
    padding: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  filterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  filterTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
  },
  filterSection: {
    marginBottom: 20,
  },
  filterLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    marginBottom: 12,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: theme.colors.background,
    marginRight: 8,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  filterChipActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  filterChipText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  filterChipTextActive: {
    color: theme.colors.white,
  },
  applyFilterButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  applyFilterButtonText: {
    color: theme.colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyText: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginTop: 16,
  },
  content: {
    flex: 1,
    paddingBottom: 100, // إضافة مساحة في الأسفل للتمرير
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: theme.colors.white,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginHorizontal: 4,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
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
  doctorsList: {
    paddingHorizontal: 20,
  },
  doctorCard: {
    width: 280,
    backgroundColor: theme.colors.white,
    borderRadius: 16,
    padding: 16,
    marginRight: 16,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  doctorImageContainer: {
    position: 'relative',
    alignItems: 'center',
    marginBottom: 12,
  },
  doctorImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  availableBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: theme.colors.success,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  availableText: {
    fontSize: 10,
    color: theme.colors.white,
    fontWeight: 'bold',
  },
  doctorInfo: {
    alignItems: 'center',
    marginBottom: 12,
  },
  doctorName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
    marginBottom: 4,
  },
  doctorSpecialty: {
    fontSize: 14,
    color: theme.colors.primary,
    marginBottom: 8,
  },
  specialtyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginBottom: 8,
  },
  doctorLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  doctorLocationText: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginLeft: 4,
  },
  doctorRating: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  doctorRatingText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    marginLeft: 4,
  },
  doctorExperience: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginLeft: 8,
  },
  bookButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center',
  },
  bookButtonText: {
    color: theme.colors.white,
    fontSize: 14,
    fontWeight: 'bold',
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    marginBottom: 20, // إضافة مساحة إضافية في الأسفل
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
});

export default UserHomeScreen; 