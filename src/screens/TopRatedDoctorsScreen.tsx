import React, { useState, useEffect } from 'react';
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
  Alert,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../utils/theme';
import { useAuth } from '../contexts/AuthContext';
import { API_CONFIG } from '../config/api';
import StarRating from '../components/StarRating';
import { mapProvinceToLocalized, mapSpecialtyToLocalized } from '../utils/specialtyMapper';

const { width, height } = Dimensions.get('window');

interface Doctor {
  _id: string;
  name: string;
  specialty: string;
  province: string;
  area: string;
  averageRating: number;
  totalRatings: number;
  imageUrl?: string;
  image?: string;
  profileImage?: string;
  profile_image?: string;
  about?: string;
  experienceYears?: number;
  phone?: string;
  clinicLocation?: string;
}

const TopRatedDoctorsScreen = () => {
  const navigation = useNavigation();
  const { t } = useTranslation();
  const { signOut, user } = useAuth();
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTopRatedDoctors();
  }, []);

  const fetchTopRatedDoctors = async () => {
    try {
      setLoading(true);
      setError(null);
      
      
      const response = await fetch(`${API_CONFIG.BASE_URL}/doctors/top-rated`);
      const data = await response.json();
      
      
      if (response.ok) {
        // تصفية الأطباء الذين لديهم تقييم فعلي فقط
        const filteredDoctors = data.filter((doctor: Doctor) => 
          doctor.averageRating && doctor.averageRating > 0 && doctor.totalRatings && doctor.totalRatings > 0
        );
        
        
        setDoctors(filteredDoctors);
      } else {
        setError(data.error || t('error.fetch_doctor'));
      }
    } catch (err) {
      setError(t('error.fetch_doctor'));
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchTopRatedDoctors();
    setRefreshing(false);
  };

  const handleLogout = async () => {
    Alert.alert(t('auth.logout'), t('auth.logout_confirm'), [
      {
        text: t('common.cancel'),
        style: 'cancel',
      },
      {
        text: t('common.confirm'),
        onPress: signOut,
      },
    ]);
  };

  const handleDoctorPress = (doctor: Doctor) => {
    (navigation as any).navigate('DoctorDetails', { doctorId: doctor._id });
  };

  const getImageUrl = (imagePath: string | null | undefined): string | null => {
    if (!imagePath || imagePath === 'null' || imagePath === 'undefined' || imagePath.trim() === '') {
      return null;
    }

    try {
      // إصلاح الروابط المزدوجة - إزالة BASE_URL إذا كان موجوداً في بداية رابط Cloudinary
      let cleanPath = imagePath;
      if (imagePath.includes('https://res.cloudinary.com') && imagePath.startsWith(API_CONFIG.BASE_URL)) {
        cleanPath = imagePath.replace(API_CONFIG.BASE_URL, '');
      }

      // إذا كانت الصورة من Cloudinary
      if (cleanPath.startsWith('https://res.cloudinary.com')) {
        return cleanPath;
      }

      // إذا كانت الصورة محلية (تبدأ بـ /uploads/)
      if (cleanPath.startsWith('/uploads/')) {
        const fullUrl = `${API_CONFIG.BASE_URL}${cleanPath}`;
        return fullUrl;
      }

      // إذا كانت الصورة رابط كامل
      if (cleanPath.startsWith('http')) {
        try {
          new URL(cleanPath);
          return cleanPath;
        } catch {
          return null;
        }
      }

      // إذا كانت الصورة مسار نسبي
      if (cleanPath && !cleanPath.startsWith('http') && !cleanPath.startsWith('/uploads/')) {
        const normalizedPath = cleanPath.replace(/^\/+/, '');
        const fullUrl = `${API_CONFIG.BASE_URL}/${normalizedPath}`;
        return fullUrl;
      }

      return null;
    } catch (error) {
      return null;
    }
  };

  const renderDoctorCard = ({ item, index }: { item: Doctor; index: number }) => {
    // جلب صورة الطبيب من جميع المصادر المحتملة - الأولوية للصورة النظيفة
    const imageUrl = getImageUrl(item.image || item.profileImage || item.profile_image || item.imageUrl);
    

    return (
      <TouchableOpacity
        style={styles.doctorCard}
        onPress={() => handleDoctorPress(item)}
      >
        {/* ترتيب الطبيب */}
        <View style={styles.rankBadge}>
          <Text style={styles.rankText}>{index + 1}</Text>
        </View>

        {/* محتوى البطاقة */}
        <View style={styles.cardContent}>
          <View style={styles.doctorInfo}>
            <Image
              source={imageUrl ? { uri: imageUrl } : require('../../assets/icon.png')}
              style={styles.doctorImage}
              resizeMode="cover"
              defaultSource={require('../../assets/icon.png')}
              onError={(error) => {

              }}
              onLoad={() => {

              }}
            />
            
            <View style={styles.doctorDetails}>
              <Text style={styles.doctorName}>{item.name}</Text>
              <Text style={styles.doctorSpecialty}>{mapSpecialtyToLocalized(item.specialty)}</Text>
              <Text style={styles.doctorLocation}>
                {mapProvinceToLocalized(item.province)}, {item.area}
              </Text>
            </View>
          </View>
          
          {/* التقييم */}
          <View style={styles.ratingContainer}>
            <StarRating 
              rating={item.averageRating || 0}
              size="small"
              showText={false}
            />
            <Text style={styles.ratingCount}>
              ({item.totalRatings || 0})
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderStatsCard = () => (
    <View style={styles.statsCard}>
      <View style={styles.statItem}>
        <Text style={styles.statNumber}>{doctors.length}</Text>
        <Text style={styles.statLabel}>{t('doctor.title')}</Text>
      </View>
      <View style={styles.statItem}>
        <Text style={styles.statNumber}>
          {doctors.length > 0 ? doctors[0].averageRating?.toFixed(1) || '0.0' : '0.0'}
        </Text>
        <Text style={styles.statLabel}>{t('rating.average_rating')}</Text>
      </View>
      <View style={styles.statItem}>
        <Text style={styles.statNumber}>
          {doctors.reduce((sum, doc) => sum + (doc.totalRatings || 0), 0)}
        </Text>
        <Text style={styles.statLabel}>{t('rating.total_ratings')}</Text>
      </View>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="star-outline" size={64} color={theme.colors.textSecondary} />
      <Text style={styles.emptyTitle}>{t('rating.no_ratings_yet')}</Text>
      <Text style={styles.emptySubtitle}>
        لا توجد تقييمات كافية لعرض الأطباء الأعلى تقييماً
      </Text>
      <TouchableOpacity 
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <Text style={styles.backButtonText}>{t('common.back')}</Text>
      </TouchableOpacity>
    </View>
  );

  const renderErrorState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="alert-circle-outline" size={64} color={theme.colors.error} />
      <Text style={styles.emptyTitle}>{error}</Text>
      <TouchableOpacity 
        style={styles.retryButton}
        onPress={fetchTopRatedDoctors}
      >
        <Text style={styles.retryButtonText}>{t('common.retry')}</Text>
      </TouchableOpacity>
    </View>
  );

  const renderLoadingState = () => (
    <View style={styles.loadingContainer}>
      <View style={styles.loadingSpinner} />
      <Text style={styles.loadingText}>{t('common.loading')}...</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="light-content"
        backgroundColor={theme.colors.primary}
      />

      {/* Header */}
      <LinearGradient
        colors={[theme.colors.primary, theme.colors.primaryDark]}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color={theme.colors.white} />
          </TouchableOpacity>
          
          <View style={styles.headerTitle}>
            <Ionicons name="star" size={24} color={theme.colors.white} />
            <Text style={styles.headerText}>{t('rating.top_rated_doctors')}</Text>
          </View>

          <TouchableOpacity
            style={styles.logoutButton}
            onPress={handleLogout}
          >
            <Ionicons name="log-out-outline" size={24} color={theme.colors.white} />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Content */}
      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {loading ? (
          renderLoadingState()
        ) : error ? (
          renderErrorState()
        ) : doctors.length === 0 ? (
          renderEmptyState()
        ) : (
          <>
            {/* Stats Card */}
            {renderStatsCard()}

            {/* Doctors List */}
            <View style={styles.doctorsList}>
              <Text style={styles.sectionTitle}>
                {t('rating.top_rated_doctors')}
              </Text>
              <FlatList
                data={doctors}
                renderItem={renderDoctorCard}
                keyExtractor={(item) => item._id}
                scrollEnabled={false}
                showsVerticalScrollIndicator={false}
              />
            </View>
          </>
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
    paddingTop: 44,
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  headerText: {
    color: theme.colors.white,
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  logoutButton: {
    padding: 8,
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingSpinner: {
    width: 40,
    height: 40,
    borderWidth: 4,
    borderColor: theme.colors.primary,
    borderTopColor: 'transparent',
    borderRadius: 20,
    marginBottom: 16,
  },
  loadingText: {
    color: theme.colors.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  retryButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: theme.colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  statsCard: {
    backgroundColor: theme.colors.white,
    margin: 16,
    borderRadius: 12,
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-around',
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    fontWeight: '600',
    textAlign: 'center',
  },
  doctorsList: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
    marginBottom: 16,
    textAlign: 'center',
  },
  doctorCard: {
    backgroundColor: theme.colors.white,
    borderRadius: 10,
    marginBottom: 8,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    position: 'relative',
  },
  rankBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: theme.colors.primary,
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  rankText: {
    color: theme.colors.white,
    fontSize: 12,
    fontWeight: 'bold',
  },
  cardContent: {
    padding: 12,
  },
  doctorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  doctorImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 10,
    borderWidth: 2,
    borderColor: theme.colors.primary,
  },
  doctorDetails: {
    flex: 1,
  },
  doctorName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
    marginBottom: 2,
  },
  doctorSpecialty: {
    fontSize: 12,
    color: theme.colors.primary,
    fontWeight: '600',
    marginBottom: 2,
  },
  doctorLocation: {
    fontSize: 10,
    color: theme.colors.textSecondary,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  ratingCount: {
    fontSize: 10,
    color: theme.colors.textSecondary,
    fontWeight: '500',
  },
});

export default TopRatedDoctorsScreen;
