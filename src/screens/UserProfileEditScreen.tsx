import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Image,
  Switch,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../utils/theme';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';
import * as ImagePicker from 'expo-image-picker';

const UserProfileEditScreen: React.FC = () => {
  const navigation = useNavigation();
  const { t } = useTranslation();
  const { user, updateProfile } = useAuth();
  
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    gender: '',
    address: '',
    emergencyContact: '',
    medicalHistory: '',
    allergies: '',
    currentMedications: '',
    insuranceProvider: '',
    insuranceNumber: '',
    profileImage: '',
  });
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [privacySettings, setPrivacySettings] = useState({
    showPhone: true,
    showEmail: true,
    showAddress: false,
  });

  useEffect(() => {
    if (user) {
      setForm({
        firstName: user.firstName || user.first_name || '',
        lastName: user.lastName || user.last_name || '',
        email: user.email || '',
        phone: user.phone || '',
        dateOfBirth: user.dateOfBirth || user.date_of_birth || '',
        gender: user.gender || '',
        address: user.address || '',
        emergencyContact: user.emergencyContact || user.emergency_contact || '',
        medicalHistory: user.medicalHistory || user.medical_history || '',
        allergies: user.allergies || '',
        currentMedications: user.currentMedications || user.current_medications || '',
        insuranceProvider: user.insuranceProvider || user.insurance_provider || '',
        insuranceNumber: user.insuranceNumber || user.insurance_number || '',
        profileImage: user.profileImage || user.profile_image || '',
      });
      setNotificationsEnabled(user.notificationsEnabled !== false);
      setPrivacySettings({
        showPhone: user.privacySettings?.showPhone !== false,
        showEmail: user.privacySettings?.showEmail !== false,
        showAddress: user.privacySettings?.showAddress === true,
      });
    }
  }, [user]);

  const handleChange = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const imageUri = result.assets[0].uri;
        setForm(prev => ({ ...prev, profileImage: imageUri }));
      }
    } catch (error) {
      Alert.alert('خطأ', 'فشل في اختيار الصورة');
    }
  };

  const handleSave = async () => {
    if (!user?.id) {
      Alert.alert('خطأ', 'يجب تسجيل الدخول أولاً');
      return;
    }

    setSaving(true);
    try {
      console.log('🔍 UserProfileEditScreen - Saving profile...');
      console.log('🔍 UserProfileEditScreen - User ID:', user.id);
      
      const updatedData = {
        ...form,
        notificationsEnabled,
        privacySettings,
      };

      console.log('🔍 UserProfileEditScreen - Updated data:', updatedData);

      const result = await updateProfile(updatedData);
      
      if (result.error) {
        console.error('❌ UserProfileEditScreen - Error:', result.error);
        Alert.alert('خطأ', result.error);
      } else {
        console.log('✅ UserProfileEditScreen - Success:', result.data);
        Alert.alert('نجح', 'تم تحديث البيانات بنجاح');
        navigation.goBack();
      }
    } catch (error: any) {
      console.error('❌ UserProfileEditScreen - Exception:', error);
      Alert.alert('خطأ', 'فشل في تحديث البيانات');
    } finally {
      setSaving(false);
    }
  };

  const renderSection = (title: string, children: React.ReactNode) => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );

  const renderInput = (label: string, field: string, placeholder: string, type: 'text' | 'email' | 'phone' = 'text') => (
    <View style={styles.inputContainer}>
      <Text style={styles.inputLabel}>{label}</Text>
      <TextInput
        style={styles.input}
        value={form[field]}
        onChangeText={(value) => handleChange(field, value)}
        placeholder={placeholder}
        placeholderTextColor={theme.colors.textSecondary}
        keyboardType={type === 'email' ? 'email-address' : type === 'phone' ? 'phone-pad' : 'default'}
      />
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

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('profile.edit_profile')}</Text>
        <TouchableOpacity onPress={handleSave} style={styles.saveButton} disabled={saving}>
          {saving ? (
            <ActivityIndicator size="small" color={theme.colors.white} />
          ) : (
            <Text style={styles.saveButtonText}>{t('common.save')}</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* صورة الملف الشخصي */}
        {renderSection(t('profile.profile_image'), (
          <View style={styles.imageSection}>
            <TouchableOpacity onPress={pickImage} style={styles.imageContainer}>
              {form.profileImage ? (
                <Image source={{ uri: form.profileImage }} style={styles.profileImage} />
              ) : (
                <View style={styles.imagePlaceholder}>
                  <Ionicons name="person" size={40} color={theme.colors.textSecondary} />
                </View>
              )}
              <View style={styles.imageOverlay}>
                <Ionicons name="camera" size={20} color={theme.colors.white} />
              </View>
            </TouchableOpacity>
            <Text style={styles.imageHint}>{t('profile.tap_to_change')}</Text>
          </View>
        ))}

        {/* المعلومات الأساسية */}
        {renderSection(t('profile.basic_info'), (
          <View>
            {renderInput(t('profile.first_name'), 'firstName', t('profile.enter_first_name'))}
            {renderInput(t('profile.last_name'), 'lastName', t('profile.enter_last_name'))}
            {renderInput(t('profile.email'), 'email', t('profile.enter_email'), 'email')}
            {renderInput(t('profile.phone'), 'phone', t('profile.enter_phone'), 'phone')}
            {renderInput(t('profile.date_of_birth'), 'dateOfBirth', t('profile.enter_dob'))}
            {renderInput(t('profile.gender'), 'gender', t('profile.enter_gender'))}
            {renderInput(t('profile.address'), 'address', t('profile.enter_address'))}
          </View>
        ))}

        {/* معلومات الطوارئ */}
        {renderSection(t('profile.emergency_contact'), (
          <View>
            {renderInput(t('profile.emergency_contact'), 'emergencyContact', t('profile.enter_emergency_contact'), 'phone')}
          </View>
        ))}

        {/* التاريخ الطبي */}
        {renderSection(t('profile.medical_history'), (
          <View>
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>{t('profile.medical_history')}</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={form.medicalHistory}
                onChangeText={(value) => handleChange('medicalHistory', value)}
                placeholder={t('profile.enter_medical_history')}
                placeholderTextColor={theme.colors.textSecondary}
                multiline
                numberOfLines={4}
              />
            </View>
            {renderInput(t('profile.allergies'), 'allergies', t('profile.enter_allergies'))}
            {renderInput(t('profile.current_medications'), 'currentMedications', t('profile.enter_medications'))}
          </View>
        ))}

        {/* معلومات التأمين */}
        {renderSection(t('profile.insurance_info'), (
          <View>
            {renderInput(t('profile.insurance_provider'), 'insuranceProvider', t('profile.enter_insurance_provider'))}
            {renderInput(t('profile.insurance_number'), 'insuranceNumber', t('profile.enter_insurance_number'))}
          </View>
        ))}

        {/* إعدادات الإشعارات */}
        {renderSection(t('profile.notifications'), (
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>{t('profile.enable_notifications')}</Text>
              <Text style={styles.settingDescription}>{t('profile.notifications_description')}</Text>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
              trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
              thumbColor={theme.colors.white}
            />
          </View>
        ))}

        {/* إعدادات الخصوصية */}
        {renderSection(t('profile.privacy_settings'), (
          <View>
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingTitle}>{t('profile.show_phone')}</Text>
                <Text style={styles.settingDescription}>{t('profile.show_phone_description')}</Text>
              </View>
              <Switch
                value={privacySettings.showPhone}
                onValueChange={(value) => setPrivacySettings(prev => ({ ...prev, showPhone: value }))}
                trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
                thumbColor={theme.colors.white}
              />
            </View>
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingTitle}>{t('profile.show_email')}</Text>
                <Text style={styles.settingDescription}>{t('profile.show_email_description')}</Text>
              </View>
              <Switch
                value={privacySettings.showEmail}
                onValueChange={(value) => setPrivacySettings(prev => ({ ...prev, showEmail: value }))}
                trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
                thumbColor={theme.colors.white}
              />
            </View>
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingTitle}>{t('profile.show_address')}</Text>
                <Text style={styles.settingDescription}>{t('profile.show_address_description')}</Text>
              </View>
              <Switch
                value={privacySettings.showAddress}
                onValueChange={(value) => setPrivacySettings(prev => ({ ...prev, showAddress: value }))}
                trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
                thumbColor={theme.colors.white}
              />
            </View>
          </View>
        ))}
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
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.white + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.white,
  },
  saveButton: {
    backgroundColor: theme.colors.white + '20',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  saveButtonText: {
    color: theme.colors.white,
    fontSize: 14,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
    marginBottom: 16,
  },
  imageSection: {
    alignItems: 'center',
  },
  imageContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  imagePlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: theme.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: theme.colors.border,
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageHint: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    marginBottom: 8,
  },
  input: {
    backgroundColor: theme.colors.white,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: theme.colors.textPrimary,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
});

export default UserProfileEditScreen;

