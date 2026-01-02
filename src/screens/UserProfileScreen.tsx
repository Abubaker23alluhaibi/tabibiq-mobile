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
  StatusBar,
  SafeAreaView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../utils/theme';
import { changeLanguage, getCurrentLanguage } from '../locales/index';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const UserProfileScreen: React.FC = () => {
  const navigation = useNavigation();
  const { t } = useTranslation();
  const { user, profile: authProfile, signOut } = useAuth();
  const [loading, setLoading] = useState(false);
  const [edit, setEdit] = useState(false);
  const [activeTab, setActiveTab] = useState<'info' | 'settings'>('info');
  const [form, setForm] = useState({
    first_name: '',
    email: '',
    phone: '',
    profileImage: ''
  });

  // استخدام البيانات الشخصية من AuthContext مباشرة
  const profile = authProfile || user;

  useEffect(() => {
    // تحديث النموذج بالبيانات الشخصية
    if (profile) {
      setForm({
        first_name: profile.first_name || profile.name || '',
        email: profile.email || '',
        phone: profile.phone || '',
        profileImage: profile.profileImage || profile.avatar || profile.image || ''
      });
    }
  }, [profile]);

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
    navigation.navigate('UserProfileEdit' as never);
  };

  const handleSaveProfile = async () => {
    try {
      setLoading(true);
      // هنا يمكن إضافة منطق حفظ البيانات
      // await api.put('/user/:id', form);
      setEdit(false);
      Alert.alert('نجح', 'تم حفظ البيانات بنجاح');
    } catch (error) {
      Alert.alert('خطأ', 'فشل في حفظ البيانات');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setEdit(false);
    // إعادة تعيين النموذج للبيانات الأصلية
    if (profile) {
      setForm({
        first_name: profile.first_name || profile.name || '',
        email: profile.email || '',
        phone: profile.phone || '',
        profileImage: profile.profileImage || profile.avatar || profile.image || ''
      });
    }
  };

  if (loading && !profile && !user) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <StatusBar backgroundColor={theme.colors.gradientStart} barStyle="light-content" />
        <View style={styles.loadingContent}>
          <Text style={styles.loadingIcon}>⏳</Text>
          <Text style={styles.loadingTitle}>{t('common.loading')}</Text>
          <Text style={styles.loadingSubtitle}>{t('common.please_wait')}</Text>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
          <Text style={styles.backButtonText}>{t('common.back')}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor={theme.colors.primary} barStyle="light-content" />
      
      {/* Header مع صورة المستخدم */}
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

        <View style={styles.profileHeader}>
          <View style={styles.imageContainer}>
            {form.profileImage ? (
              <Image source={{ uri: form.profileImage }} style={styles.userImage} />
            ) : (
              <View style={styles.placeholderImage}>
                <Ionicons name="person" size={24} color={theme.colors.white} />
              </View>
            )}
            {edit && (
              <TouchableOpacity style={styles.editImageButton}>
                <Ionicons name="camera" size={10} color={theme.colors.white} />
              </TouchableOpacity>
            )}
          </View>
          <Text style={styles.userName}>{form.first_name || t('common.not_specified')}</Text>
          <Text style={styles.userEmail}>{form.email || ''}</Text>
        </View>
      </LinearGradient>

      {/* التبويبات */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'info' && styles.tabActive]}
          onPress={() => setActiveTab('info')}
        >
          <Ionicons 
            name="person" 
            size={20} 
            color={activeTab === 'info' ? theme.colors.primary : theme.colors.textSecondary} 
          />
          <Text style={[styles.tabText, activeTab === 'info' && styles.tabTextActive]}>
            {t('profile.info') || 'المعلومات'}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'settings' && styles.tabActive]}
          onPress={() => setActiveTab('settings')}
        >
          <Ionicons 
            name="settings" 
            size={20} 
            color={activeTab === 'settings' ? theme.colors.primary : theme.colors.textSecondary} 
          />
          <Text style={[styles.tabText, activeTab === 'settings' && styles.tabTextActive]}>
            {t('profile.settings') || 'الإعدادات'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {activeTab === 'info' ? (
          <View style={styles.tabContent}>
            {/* معلومات المستخدم */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t('profile.personal_info') || 'المعلومات الشخصية'}</Text>
              
              <View style={styles.infoCard}>
                <View style={styles.infoRow}>
                  <Ionicons name="person-outline" size={20} color={theme.colors.primary} />
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>{t('auth.full_name')}</Text>
                    <Text style={styles.infoValue}>{form.first_name || t('common.not_specified')}</Text>
                  </View>
                </View>

                <View style={styles.divider} />

                <View style={styles.infoRow}>
                  <Ionicons name="mail-outline" size={20} color={theme.colors.primary} />
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>{t('auth.email')}</Text>
                    <Text style={styles.infoValue}>{form.email || t('common.not_specified')}</Text>
                  </View>
                </View>

                <View style={styles.divider} />

                <View style={styles.infoRow}>
                  <Ionicons name="call-outline" size={20} color={theme.colors.primary} />
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>{t('auth.phone')}</Text>
                    <Text style={styles.infoValue}>{form.phone || t('common.not_specified')}</Text>
                  </View>
                </View>
              </View>

              {/* أزرار التحكم */}
              <View style={styles.actionButtons}>
                <TouchableOpacity 
                  style={styles.primaryButton}
                  onPress={handleEditProfile}
                >
                  <Ionicons name="create-outline" size={20} color={theme.colors.white} />
                  <Text style={styles.primaryButtonText}>{t('profile.edit')}</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.secondaryButton}
                  onPress={() => navigation.navigate('ChangePassword' as never)}
                >
                  <Ionicons name="lock-closed-outline" size={20} color={theme.colors.primary} />
                  <Text style={styles.secondaryButtonText}>{t('auth.password') || 'كلمة المرور'}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ) : (
          <View style={styles.tabContent}>
            {/* الإعدادات */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t('profile.settings') || 'الإعدادات'}</Text>
              
              {/* اختيار اللغة */}
              <View style={styles.settingsCard}>
                <View style={styles.settingsRow}>
                  <Ionicons name="language-outline" size={24} color={theme.colors.primary} />
                  <Text style={styles.settingsLabel}>{t('profile.change_language')}</Text>
                </View>
                <View style={styles.languageButtons}>
                  <TouchableOpacity 
                    style={[styles.langBtn, getCurrentLanguage() === 'ar' && styles.langBtnActive]} 
                    onPress={() => changeLanguage('ar')}
                  >
                    <Text style={[styles.langBtnText, getCurrentLanguage() === 'ar' && styles.langBtnTextActive]}>AR</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.langBtn, getCurrentLanguage() === 'en' && styles.langBtnActive]} 
                    onPress={() => changeLanguage('en')}
                  >
                    <Text style={[styles.langBtnText, getCurrentLanguage() === 'en' && styles.langBtnTextActive]}>EN</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.langBtn, getCurrentLanguage() === 'ku' && styles.langBtnActive]} 
                    onPress={() => changeLanguage('ku')}
                  >
                    <Text style={[styles.langBtnText, getCurrentLanguage() === 'ku' && styles.langBtnTextActive]}>KU</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* الخيارات */}
              <View style={styles.settingsCard}>
                <TouchableOpacity 
                  style={styles.settingsItem}
                  onPress={() => navigation.navigate('MyAppointments' as never)}
                >
                  <View style={styles.settingsRow}>
                    <Ionicons name="calendar-outline" size={24} color={theme.colors.primary} />
                    <Text style={styles.settingsLabel}>{t('appointments.my_appointments')}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={theme.colors.textSecondary} />
                </TouchableOpacity>

                <View style={styles.divider} />

                <TouchableOpacity 
                  style={styles.settingsItem}
                  onPress={() => navigation.navigate('MedicineReminder' as never)}
                >
                  <View style={styles.settingsRow}>
                    <Ionicons name="medical-outline" size={24} color={theme.colors.primary} />
                    <Text style={styles.settingsLabel}>{t('medicine_reminder.title')}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={theme.colors.textSecondary} />
                </TouchableOpacity>

                <View style={styles.divider} />

                <TouchableOpacity 
                  style={styles.settingsItem}
                  onPress={() => navigation.navigate('PrivacySettings' as never)}
                >
                  <View style={styles.settingsRow}>
                    <Ionicons name="shield-checkmark-outline" size={24} color={theme.colors.primary} />
                    <Text style={styles.settingsLabel}>{t('privacy.settings') || 'إعدادات الخصوصية'}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={theme.colors.textSecondary} />
                </TouchableOpacity>

              </View>

              {/* زر تسجيل الخروج */}
              <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                <Ionicons name="log-out-outline" size={20} color={theme.colors.white} />
                <Text style={styles.logoutButtonText}>{t('auth.logout')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  loadingContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
  },
  loadingIcon: {
    fontSize: 48,
    color: theme.colors.primary,
    marginBottom: theme.spacing.md,
  },
  loadingTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.sm,
  },
  loadingSubtitle: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xl,
  },
  header: {
    paddingTop: 15,
    paddingBottom: 15,
    paddingHorizontal: theme.spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  backButtonText: {
    color: theme.colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  profileHeader: {
    alignItems: 'center',
  },
  imageContainer: {
    position: 'relative',
    marginBottom: theme.spacing.sm,
  },
  userImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: theme.colors.white,
  },
  placeholderImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: theme.colors.white,
  },
  editImageButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: theme.colors.primaryDark,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: theme.colors.white,
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.white,
    marginTop: theme.spacing.xs,
  },
  userEmail: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: theme.colors.white,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    paddingHorizontal: theme.spacing.md,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: theme.colors.primary,
  },
  tabText: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    marginLeft: theme.spacing.sm,
    fontWeight: '500',
  },
  tabTextActive: {
    color: theme.colors.primary,
    fontWeight: 'bold',
  },
  scrollView: {
    flex: 1,
  },
  tabContent: {
    padding: theme.spacing.md,
  },
  section: {
    marginBottom: theme.spacing.lg,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.md,
    marginLeft: theme.spacing.sm,
  },
  infoCard: {
    backgroundColor: theme.colors.white,
    borderRadius: 12,
    padding: theme.spacing.md,
    ...theme.shadows.small,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
  },
  infoContent: {
    flex: 1,
    marginLeft: theme.spacing.md,
  },
  infoLabel: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    color: theme.colors.textPrimary,
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.border,
    marginVertical: theme.spacing.sm,
  },
  actionButtons: {
    marginTop: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary,
    borderRadius: 12,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    ...theme.shadows.small,
  },
  primaryButtonText: {
    color: theme.colors.white,
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: theme.spacing.sm,
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.white,
    borderRadius: 12,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    borderWidth: 2,
    borderColor: theme.colors.primary,
    ...theme.shadows.small,
  },
  secondaryButtonText: {
    color: theme.colors.primary,
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: theme.spacing.sm,
  },
  settingsCard: {
    backgroundColor: theme.colors.white,
    borderRadius: 12,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    ...theme.shadows.small,
  },
  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingsLabel: {
    fontSize: 16,
    color: theme.colors.textPrimary,
    marginLeft: theme.spacing.md,
    flex: 1,
  },
  settingsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: theme.spacing.sm,
  },
  languageButtons: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.md,
  },
  langBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  langBtnActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  langBtnText: {
    color: theme.colors.textPrimary,
    fontWeight: '600',
    fontSize: 14,
  },
  langBtnTextActive: {
    color: theme.colors.white,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.error,
    borderRadius: 12,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.xl,
    marginTop: theme.spacing.lg,
    ...theme.shadows.small,
  },
  logoutButtonText: {
    color: theme.colors.white,
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: theme.spacing.sm,
  },
});

export default UserProfileScreen; 
