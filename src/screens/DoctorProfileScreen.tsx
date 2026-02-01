import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  Platform,
  StatusBar,
  SafeAreaView,
  Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../utils/theme';
import { mapSpecialtyToLocalized } from '../utils/specialtyMapper';
import { changeLanguage } from '../locales/index';
import { useAuth } from '../contexts/AuthContext';
import { Linking } from 'react-native';

const { width } = Dimensions.get('window');

const DoctorProfileScreen: React.FC = () => {
  const navigation = useNavigation();
  const { t } = useTranslation();
  const { user, profile: authProfile, signOut } = useAuth();
  const [loading, setLoading] = useState(false);

  // استخدام البيانات الشخصية من AuthContext مباشرة
  const profile = authProfile || user;

  const handleLogout = () => {
    Alert.alert(
      t('auth.logout'),
      t('auth.logout_confirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        { text: t('common.confirm'), onPress: signOut, style: 'destructive' },
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

  // مكون لعرض صف المعلومات بشكل أنيق
  const InfoRow = ({ icon, text, onPress, isLink = false }: any) => (
    <TouchableOpacity 
      style={styles.infoRowCard} 
      onPress={onPress} 
      disabled={!onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.iconContainer, { backgroundColor: theme.colors.primary + '10' }]}>
        <Ionicons name={icon} size={20} color={theme.colors.primary} />
      </View>
      <Text style={[styles.infoRowText, isLink && styles.linkText]} numberOfLines={1}>
        {text}
      </Text>
      {isLink && <Ionicons name="open-outline" size={16} color={theme.colors.textSecondary} />}
    </TouchableOpacity>
  );

  // مكون لأزرار القائمة
  const MenuButton = ({ icon, title, onPress, color = theme.colors.primary }: any) => (
    <TouchableOpacity style={styles.menuButton} onPress={onPress}>
      <View style={[styles.menuIconBox, { backgroundColor: color + '15' }]}>
        <Ionicons name={icon} size={22} color={color} />
      </View>
      <Text style={[styles.menuText, { color: color === theme.colors.error ? theme.colors.error : theme.colors.textPrimary }]}>
        {title}
      </Text>
      <Ionicons name="chevron-forward" size={18} color="#CCC" />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.primary} />
      
      {/* الخلفية العلوية */}
      <View style={styles.headerBackground}>
        <SafeAreaView>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>{t('profile.title')}</Text>
          </View>
        </SafeAreaView>
      </View>

      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* بطاقة الملف الشخصي الرئيسية */}
        <View style={styles.profileCard}>
          <View style={styles.avatarContainer}>
            {profile?.profile_image ? (
              <Image source={{ uri: profile.profile_image }} style={styles.avatar} />
            ) : (
              <View style={styles.placeholderAvatar}>
                <Ionicons name="person" size={50} color={theme.colors.textSecondary} />
              </View>
            )}
            <TouchableOpacity style={styles.editBadge} onPress={handleEditProfile}>
              <Ionicons name="pencil" size={14} color="#FFF" />
            </TouchableOpacity>
          </View>

          <Text style={styles.nameText}>{profile?.name || t('common.not_specified')}</Text>
          <Text style={styles.specialtyText}>
            {mapSpecialtyToLocalized(profile?.specialty) || t('specialties.cardiology')}
          </Text>
          
          <View style={styles.locationTag}>
            <Ionicons name="location-sharp" size={14} color={theme.colors.textSecondary} />
            <Text style={styles.locationText}>
              {profile?.province}, {profile?.area}
            </Text>
          </View>
        </View>

        {/* قسم المعلومات */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>{t('profile.basic_info')}</Text>
          
          {profile?.phone && <InfoRow icon="call" text={profile.phone} />}
          {profile?.email && <InfoRow icon="mail" text={profile.email} />}
          {profile?.clinicLocation && <InfoRow icon="medkit" text={profile.clinicLocation} />}
          
          {profile?.mapLocation && (
            <InfoRow 
              icon="map" 
              text={t('profile.open_location')} 
              onPress={() => handleOpenMapLocation(profile.mapLocation)}
              isLink
            />
          )}

          <View style={styles.rowStats}>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>{t('doctor.experience')}</Text>
              <Text style={styles.statValue}>{profile?.experience || 0} {t('doctor.years')}</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>{t('doctor.appointment_duration')}</Text>
              <Text style={styles.statValue}>{profile?.appointment_duration || 30} {t('doctor.minutes')}</Text>
            </View>
          </View>
        </View>

        {/* قسم الإعدادات */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>{t('profile.privacy_settings')}</Text>

          {/* اللغة */}
          <View style={styles.languageContainer}>
            <Text style={styles.menuText}>{t('profile.change_language')}</Text>
            <View style={styles.langButtonsRow}>
              {['ar', 'en', 'ku'].map((lang) => (
                <TouchableOpacity 
                  key={lang} 
                  style={styles.langChip} 
                  onPress={() => changeLanguage(lang)}
                >
                  <Text style={styles.langChipText}>{lang.toUpperCase()}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <MenuButton 
            icon="create-outline" 
            title={t('profile.edit')} 
            onPress={handleEditProfile} 
          />
          
          <MenuButton 
            icon="time-outline" 
            title={t('doctor.appointment_duration_editor')} 
            onPress={() => navigation.navigate('AppointmentDurationEditor' as never)} 
          />

          <MenuButton 
            icon="lock-closed-outline" 
            title={t('auth.change_password')} 
            onPress={() => navigation.navigate('ChangePassword' as never)} 
          />
          <MenuButton 
            icon="shield-checkmark-outline" 
            title={t('privacy.settings') || 'إعدادات الخصوصية'} 
            onPress={() => navigation.navigate('PrivacySettings' as never)} 
          />
        </View>

        {/* زر الخروج */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>{t('auth.logout')}</Text>
          <Ionicons name="log-out-outline" size={20} color="#FFF" />
        </TouchableOpacity>

        <Text style={styles.versionText}>TabibiQ v1.0.2</Text>

      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA', // خلفية رمادية فاتحة جداً
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F7FA',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  
  // Header Styles
  headerBackground: {
    backgroundColor: theme.colors.primary,
    height: 160,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    paddingTop: Platform.OS === 'android' ? 40 : 10,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  headerContent: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
  },

  // ScrollView
  scrollView: {
    flex: 1,
    marginTop: -80, // تداخل مع الهيدر
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },

  // Profile Card
  profileCard: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    marginBottom: 20,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 4,
    borderColor: '#FFF',
  },
  placeholderAvatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#FFF',
  },
  editBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: theme.colors.primary,
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFF',
  },
  nameText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
    marginBottom: 4,
    textAlign: 'center',
  },
  specialtyText: {
    fontSize: 16,
    color: theme.colors.primary,
    marginBottom: 8,
    fontWeight: '500',
  },
  locationTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  locationText: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    marginLeft: 4,
  },

  // Section Styles
  sectionContainer: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
    marginBottom: 16,
  },

  // Info Row Styles
  infoRowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  infoRowText: {
    flex: 1,
    fontSize: 15,
    color: theme.colors.textPrimary,
  },
  linkText: {
    color: theme.colors.primary,
    fontWeight: '500',
  },

  // Stats Row
  rowStats: {
    flexDirection: 'row',
    marginTop: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: '#E0E0E0',
  },
  statLabel: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
  },

  // Menu Button Styles
  menuButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  menuIconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  menuText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
  },

  // Language Styles
  languageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  langButtonsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  langChip: {
    backgroundColor: theme.colors.primary + '15',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.primary + '30',
  },
  langChipText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },

  // Logout Button
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFEBEE',
    paddingVertical: 16,
    borderRadius: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#FFCDD2',
  },
  logoutText: {
    color: theme.colors.error,
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 8,
  },
  
  versionText: {
    textAlign: 'center',
    color: theme.colors.textSecondary,
    fontSize: 12,
    opacity: 0.6,
  },
});

export default DoctorProfileScreen;