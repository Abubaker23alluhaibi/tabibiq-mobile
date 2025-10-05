import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  Dimensions,
  StatusBar,
  RefreshControl,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../utils/theme';
import { useAuth } from '../contexts/AuthContext';
import { API_CONFIG } from '../config/api';
import StarRating from '../components/StarRating';
import { mapSpecialtyToLocalized } from '../utils/specialtyMapper';

const { width, height } = Dimensions.get('window');

interface Review {
  id: string;
  patient_id: string;
  doctor_id: string;
  rating: number;
  comment?: string;
  created_at: string;
  patient?: {
    id: string;
    name: string;
    profileImage?: string;
  };
}

interface Doctor {
  id: string;
  name: string;
  specialty: string;
  image?: string;
  rating?: number;
  reviews_count?: number;
}

const DoctorReviewsScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const route = useRoute();
  const { user } = useAuth();
  
  const { doctorId } = route.params as { doctorId: string };
  
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDoctorReviews();
  }, [doctorId]);

  const fetchDoctorReviews = async () => {
    try {
      setLoading(true);
      setError(null);

      // جلب بيانات الطبيب
      const doctorResponse = await fetch(`${API_CONFIG.BASE_URL}/doctors/${doctorId}`);
      if (doctorResponse.ok) {
        const doctorData = await doctorResponse.json();
        setDoctor(doctorData.data || doctorData);
      }

      // جلب التعليقات
      const reviewsResponse = await fetch(`${API_CONFIG.BASE_URL}/reviews/doctor/${doctorId}`);
      if (reviewsResponse.ok) {
        const reviewsData = await reviewsResponse.json();
        setReviews(reviewsData.data || reviewsData);
      } else {
        throw new Error('Failed to fetch reviews');
      }
    } catch (error: any) {
      setError(error.message || t('common.error_occurred'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchDoctorReviews();
  };

  const renderReviewItem = ({ item }: { item: Review }) => (
    <View style={styles.reviewCard}>
      <View style={styles.reviewHeader}>
        <View style={styles.patientInfo}>
          <Image
            source={
              item.patient?.profileImage
                ? { uri: item.patient.profileImage }
                : require('../../assets/icon.png')
            }
            style={styles.patientAvatar}
            defaultSource={require('../../assets/icon.png')}
          />
          <View style={styles.patientDetails}>
            <Text style={styles.patientName}>
              {item.patient?.name || t('rating.anonymous')}
            </Text>
            <Text style={styles.reviewDate}>
              {new Date(item.created_at).toLocaleDateString('ar-EG', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </Text>
          </View>
        </View>
        <StarRating
          rating={item.rating}
          size="small"
          showText={false}
          interactive={false}
        />
      </View>
      
      {item.comment && (
        <View style={styles.commentContainer}>
          <Text style={styles.commentText}>{item.comment}</Text>
        </View>
      )}
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons
        name="chatbubbles-outline"
        size={64}
        color={theme.colors.textSecondary}
      />
      <Text style={styles.emptyTitle}>{t('rating.no_reviews_yet')}</Text>
      <Text style={styles.emptySubtitle}>
        {t('rating.be_first_to_review')}
      </Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>{t('common.loading')}</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle" size={64} color={theme.colors.error} />
        <Text style={styles.errorTitle}>{t('common.error')}</Text>
        <Text style={styles.errorMessage}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchDoctorReviews}>
          <Text style={styles.retryButtonText}>{t('common.retry')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={theme.colors.white} />
      
      {/* Header */}
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
        
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>{t('rating.reviews')}</Text>
          {doctor && (
            <Text style={styles.doctorName}>{doctor.name}</Text>
          )}
        </View>
      </LinearGradient>

      {/* Doctor Info */}
      {doctor && (
        <View style={styles.doctorInfoCard}>
          <Image
            source={
              doctor.image
                ? { uri: doctor.image }
                : require('../../assets/icon.png')
            }
            style={styles.doctorImage}
            defaultSource={require('../../assets/icon.png')}
          />
          <View style={styles.doctorInfo}>
            <Text style={styles.doctorNameInCard}>{doctor.name}</Text>
            <Text style={styles.doctorSpecialty}>{mapSpecialtyToLocalized(doctor.specialty)}</Text>
            <View style={styles.ratingContainer}>
              <StarRating
                rating={doctor.rating || 0}
                size="medium"
                showText={true}
                interactive={false}
              />
              {doctor.reviews_count && doctor.reviews_count > 0 && (
                <Text style={styles.reviewsCount}>
                  {t('rating.based_on')} {doctor.reviews_count} {t('rating.reviews')}
                </Text>
              )}
            </View>
          </View>
        </View>
      )}

      {/* Reviews List */}
      <FlatList
        data={reviews}
        renderItem={renderReviewItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.reviewsList}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={renderEmptyState}
        showsVerticalScrollIndicator={false}
      />
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
    paddingHorizontal: 20,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
    marginTop: 16,
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: StatusBar.currentHeight || 44,
    paddingBottom: 16,
    paddingHorizontal: 20,
  },
  backButton: {
    marginRight: 16,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.white,
  },
  doctorName: {
    fontSize: 14,
    color: theme.colors.white,
    opacity: 0.9,
    marginTop: 2,
  },
  doctorInfoCard: {
    flexDirection: 'row',
    backgroundColor: theme.colors.white,
    margin: 20,
    padding: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  doctorImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 16,
  },
  doctorInfo: {
    flex: 1,
  },
  doctorNameInCard: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
    marginBottom: 4,
  },
  doctorSpecialty: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginBottom: 8,
  },
  ratingContainer: {
    alignItems: 'flex-start',
  },
  reviewsCount: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: 4,
  },
  reviewsList: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  reviewCard: {
    backgroundColor: theme.colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  patientInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  patientAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  patientDetails: {
    flex: 1,
  },
  patientName: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    marginBottom: 2,
  },
  reviewDate: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  commentContainer: {
    marginTop: 8,
  },
  commentText: {
    fontSize: 14,
    color: theme.colors.textPrimary,
    lineHeight: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
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
    paddingHorizontal: 40,
  },
});

export default DoctorReviewsScreen;










