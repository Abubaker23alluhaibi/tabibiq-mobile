import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  RefreshControl,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../utils/theme';
import { API_CONFIG } from '../config/api';
import { useNearestDoctors, NearestDoctor } from '../hooks/useNearestDoctors';
import { mapSpecialtyToLocalized, mapProvinceToLocalized } from '../utils/specialtyMapper';

const getImageUrl = (imagePath: string | null | undefined): string | null => {
  if (!imagePath || imagePath === 'null' || imagePath === 'undefined' || String(imagePath).trim() === '') return null;
  if (imagePath.startsWith('https://') || imagePath.startsWith('http://')) return imagePath;
  if (imagePath.startsWith('/uploads/')) return `${API_CONFIG.BASE_URL}${imagePath}`;
  if (!imagePath.startsWith('http')) return `${API_CONFIG.BASE_URL}/${imagePath.replace(/^\/+/, '')}`;
  return null;
};

const formatDistance = (meters: number | undefined): string => {
  if (meters == null || isNaN(meters)) return '';
  if (meters < 1000) return `${Math.round(meters)} م`;
  return `${(meters / 1000).toFixed(1)} كم`;
};

const NearestDoctorsScreen = () => {
  const { t, i18n } = useTranslation();
  const navigation = useNavigation();
  const { doctors, loading, error, refetch } = useNearestDoctors(50);

  useEffect(() => {
    refetch();
  }, []);

  const renderItem = ({ item }: { item: NearestDoctor }) => {
    const imageUri = getImageUrl(item.image || item.profileImage || null);
    const distanceText = formatDistance(item.distance);

    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.8}
        onPress={() => (navigation as any).navigate('DoctorDetails', { doctorId: item.id })}
      >
        <View style={styles.imageWrap}>
          {imageUri ? (
            <Image source={{ uri: imageUri }} style={styles.avatar} resizeMode="cover" />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder]}>
              <Ionicons name="person" size={32} color={theme.colors.textSecondary} />
            </View>
          )}
        </View>
        <View style={styles.cardBody}>
          <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
          <Text style={styles.specialty} numberOfLines={1}>{mapSpecialtyToLocalized(item.specialty, i18n.language)}</Text>
          {(item.province || item.area) && (
            <View style={styles.locationRow}>
              <Ionicons name="location-outline" size={14} color={theme.colors.textSecondary} />
              <Text style={styles.locationText} numberOfLines={1}>
                {item.province ? mapProvinceToLocalized(item.province, i18n.language) : ''}
                {item.area ? ` - ${item.area}` : ''}
              </Text>
            </View>
          )}
          <View style={styles.footer}>
            {item.averageRating != null && item.averageRating > 0 && (
              <View style={styles.ratingRow}>
                <Ionicons name="star" size={14} color="#FFD700" />
                <Text style={styles.ratingText}>{item.averageRating.toFixed(1)}</Text>
              </View>
            )}
            {distanceText ? (
              <View style={styles.distanceRow}>
                <Ionicons name="navigate-outline" size={14} color={theme.colors.primary} />
                <Text style={styles.distanceText}>{distanceText}</Text>
              </View>
            ) : null}
          </View>
        </View>
        <Ionicons name="chevron-forward" size={22} color={theme.colors.textSecondary} />
      </TouchableOpacity>
    );
  };

  if (loading && doctors.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>{t('nearest_doctors.title', 'الأطباء الأقرب')}</Text>
        </View>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.hint}>{t('nearest_doctors.getting_location', 'جاري تحديد موقعك...')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('nearest_doctors.title', 'الأطباء الأقرب')}</Text>
        <Text style={styles.subtitle}>{t('nearest_doctors.subtitle', 'مرتبون حسب المسافة من موقعك')}</Text>
      </View>

      {error ? (
        <View style={styles.centered}>
          <Ionicons name="location-outline" size={48} color={theme.colors.textSecondary} />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={refetch}>
            <Text style={styles.retryText}>{t('common.retry', 'إعادة المحاولة')}</Text>
          </TouchableOpacity>
        </View>
      ) : doctors.length === 0 ? (
        <View style={styles.centered}>
          <Ionicons name="medical-outline" size={48} color={theme.colors.textSecondary} />
          <Text style={styles.emptyText}>{t('nearest_doctors.no_doctors', 'لا يوجد أطباء قريبون من موقعك حالياً')}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={refetch}>
            <Text style={styles.retryText}>{t('common.retry', 'إعادة المحاولة')}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={doctors}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={loading} onRefresh={refetch} colors={[theme.colors.primary]} />
          }
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  subtitle: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginTop: 4,
  },
  listContent: {
    padding: 16,
    paddingBottom: 32,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  imageWrap: {
    marginRight: 12,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  avatarPlaceholder: {
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardBody: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.textPrimary,
  },
  specialty: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  locationText: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginLeft: 4,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 12,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 13,
    color: theme.colors.textPrimary,
    marginLeft: 4,
  },
  distanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  distanceText: {
    fontSize: 13,
    color: theme.colors.primary,
    marginLeft: 4,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  hint: {
    marginTop: 12,
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  errorText: {
    marginTop: 12,
    fontSize: 15,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  emptyText: {
    marginTop: 12,
    fontSize: 15,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: theme.colors.primary,
    borderRadius: 8,
  },
  retryText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
});

export default NearestDoctorsScreen;
