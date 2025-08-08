import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../utils/theme';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { Linking } from 'react-native';

const DoctorProfileScreen: React.FC = () => {
  const navigation = useNavigation();
  const { t } = useTranslation();
  const { user, profile: authProfile, signOut } = useAuth();
  const [loading, setLoading] = useState(false);

  // استخدام البيانات الشخصية من AuthContext مباشرة
  const profile = authProfile || user;

  // لا نحتاج لجلب البيانات من API لأنها موجودة في AuthContext

  const handleLogout = () => {
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

  const handleEditProfile = () => {
    navigation.navigate('DoctorProfileEdit' as never);
  };

  const handleOpenMapLocation = (mapLocation: string) => {
    if (mapLocation) {
      Linking.openURL(mapLocation).catch(() => {
        Alert.alert(t('common.error'), t('profile.location_error'));
      });
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>{t('common.loading')}</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t('doctor.profile')}</Text>
      </View>

      <View style={styles.content}>
        {/* صورة الطبيب */}
        <View style={styles.imageContainer}>
          {profile?.profile_image ? (
            <Image source={{ uri: profile.profile_image }} style={styles.doctorImage} />
          ) : (
            <View style={styles.placeholderImage}>
              <Ionicons name="person" size={64} color={theme.colors.textSecondary} />
            </View>
          )}
          <TouchableOpacity style={styles.editImageButton}>
            <Ionicons name="camera" size={20} color={theme.colors.white} />
          </TouchableOpacity>
        </View>

        {/* معلومات الطبيب */}
        <View style={styles.infoContainer}>
          <Text style={styles.doctorName}>{profile?.name || 'اسم الطبيب'}</Text>
          <Text style={styles.doctorSpecialty}>{profile?.specialty || 'التخصص'}</Text>
          <Text style={styles.doctorEmail}>{profile?.email || 'البريد الإلكتروني'}</Text>
          <Text style={styles.doctorPhone}>{profile?.phone || 'رقم الهاتف'}</Text>
          <Text style={styles.doctorProvince}>{profile?.province || 'المحافظة'}</Text>
          <Text style={styles.doctorArea}>{profile?.area || 'المنطقة'}</Text>
          <Text style={styles.doctorLocation}>{profile?.clinicLocation || 'موقع العيادة'}</Text>
          
          {profile?.phone && (
            <View style={styles.infoRow}>
              <Ionicons name="call" size={20} color={theme.colors.primary} />
              <Text style={styles.infoText}>{profile.phone}</Text>
            </View>
          )}

          {profile?.clinicLocation && (
            <View style={styles.infoRow}>
              <Ionicons name="location" size={20} color={theme.colors.primary} />
              <Text style={styles.infoText}>{profile.clinicLocation}</Text>
            </View>
          )}

          {profile?.mapLocation && (
            <TouchableOpacity 
              style={styles.infoRow}
              onPress={() => handleOpenMapLocation(profile.mapLocation)}
            >
              <Ionicons name="map" size={20} color={theme.colors.primary} />
              <Text style={[styles.infoText, styles.linkText]}>{t('profile.open_location')}</Text>
              <Ionicons name="open" size={16} color={theme.colors.primary} />
            </TouchableOpacity>
          )}

          {profile?.experience && (
            <View style={styles.infoRow}>
              <Ionicons name="time" size={20} color={theme.colors.primary} />
              <Text style={styles.infoText}>
                {t('doctor.experience')}: {profile.experience} {t('doctor.years')}
              </Text>
            </View>
          )}

          {profile?.work_times && (
            <View style={styles.infoRow}>
              <Ionicons name="calendar" size={20} color={theme.colors.primary} />
              <Text style={styles.infoText}>{profile.work_times}</Text>
            </View>
          )}
        </View>

        {/* خيارات الملف الشخصي */}
        <View style={styles.optionsContainer}>
          <TouchableOpacity style={styles.optionButton} onPress={handleEditProfile}>
            <Ionicons name="create" size={24} color={theme.colors.primary} />
            <Text style={styles.optionText}>{t('profile.edit')}</Text>
            <Ionicons name="chevron-forward" size={20} color={theme.colors.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.optionButton}
            onPress={() => navigation.navigate('DoctorAppointments' as never)}
          >
            <Ionicons name="calendar" size={24} color={theme.colors.primary} />
            <Text style={styles.optionText}>{t('appointments.title')}</Text>
            <Ionicons name="chevron-forward" size={20} color={theme.colors.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.optionButton}
            onPress={() => navigation.navigate('DoctorCalendar' as never)}
          >
            <Ionicons name="calendar-number" size={24} color={theme.colors.primary} />
            <Text style={styles.optionText}>{t('doctor.calendar')}</Text>
            <Ionicons name="chevron-forward" size={20} color={theme.colors.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.optionButton}
            onPress={() => navigation.navigate('DoctorAnalytics' as never)}
          >
            <Ionicons name="analytics" size={24} color={theme.colors.primary} />
            <Text style={styles.optionText}>{t('doctor.analytics')}</Text>
            <Ionicons name="chevron-forward" size={20} color={theme.colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* زر تسجيل الخروج */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out" size={20} color={theme.colors.error} />
          <Text style={styles.logoutButtonText}>{t('auth.logout')}</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
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
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.white,
  },
  content: {
    padding: 20,
  },
  imageContainer: {
    alignItems: 'center',
    marginBottom: 24,
    position: 'relative',
  },
  doctorImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  placeholderImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: theme.colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editImageButton: {
    position: 'absolute',
    bottom: 0,
    right: '35%',
    backgroundColor: theme.colors.primary,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: theme.colors.white,
  },
  infoContainer: {
    marginBottom: 32,
  },
  doctorName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
    marginBottom: 8,
    textAlign: 'center',
  },
  doctorSpecialty: {
    fontSize: 18,
    color: theme.colors.primary,
    marginBottom: 8,
    textAlign: 'center',
  },
  doctorEmail: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    marginBottom: 8,
    textAlign: 'center',
  },
  doctorPhone: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    marginBottom: 8,
    textAlign: 'center',
  },
  doctorProvince: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    marginBottom: 8,
    textAlign: 'center',
  },
  doctorArea: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    marginBottom: 8,
    textAlign: 'center',
  },
  doctorLocation: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    marginBottom: 16,
    textAlign: 'center',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 20,
  },
  infoText: {
    fontSize: 16,
    color: theme.colors.textPrimary,
    marginLeft: 12,
    flex: 1,
  },
  optionsContainer: {
    marginBottom: 32,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: theme.colors.white,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: theme.colors.shadow,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  optionText: {
    fontSize: 16,
    color: theme.colors.textPrimary,
    marginLeft: 12,
    flex: 1,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    backgroundColor: theme.colors.error,
    borderRadius: 12,
  },
  logoutButtonText: {
    color: theme.colors.white,
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  linkText: {
    color: theme.colors.primary,
    textDecorationLine: 'underline',
  },
});

export default DoctorProfileScreen; 