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
import { Linking } from 'react-native';

const DoctorProfileEditScreen: React.FC = () => {
  const navigation = useNavigation();
  const { t } = useTranslation();
  const { profile, updateProfile } = useAuth();
  
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    specialty: '',
    experienceYears: '',
    about: '',
    clinicLocation: '',
    mapLocation: '',
    province: '',
    area: '',
    profileImage: '',
    licenseNumber: '',
    education: '',
    certifications: '',
    languages: '',
    consultationFee: '',
    emergencyContact: '',
    workingHours: '',
    appointmentDuration: '30',
  });
  const [workTimes, setWorkTimes] = useState([]);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [privacySettings, setPrivacySettings] = useState({
    showPhone: true,
    showEmail: true,
    showAddress: true,
    showConsultationFee: true,
  });

  useEffect(() => {
    if (profile) {
      setForm({
        name: profile.name || '',
        email: profile.email || '',
        phone: profile.phone || '',
        specialty: profile.specialty || '',
        experienceYears: profile.experienceYears?.toString() || '',
        about: profile.about || '',
        clinicLocation: profile.clinicLocation || '',
        mapLocation: profile.mapLocation || '',
        province: profile.province || '',
        area: profile.area || '',
        profileImage: profile.profileImage || profile.image || '',
        licenseNumber: profile.licenseNumber || profile.license_number || '',
        education: profile.education || '',
        certifications: profile.certifications || '',
        languages: profile.languages || '',
        consultationFee: profile.consultationFee?.toString() || profile.consultation_fee?.toString() || '',
        emergencyContact: profile.emergencyContact || profile.emergency_contact || '',
        workingHours: profile.workingHours || profile.working_hours || '',
        appointmentDuration: profile.appointmentDuration?.toString() || '30',
      });
      setWorkTimes(profile.workTimes || []);
      setNotificationsEnabled(profile.notificationsEnabled !== false);
      setPrivacySettings({
        showPhone: profile.privacySettings?.showPhone !== false,
        showEmail: profile.privacySettings?.showEmail !== false,
        showAddress: profile.privacySettings?.showAddress !== false,
        showConsultationFee: profile.privacySettings?.showConsultationFee !== false,
      });
    }
  }, [profile]);

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

  const addWorkTime = () => {
    setWorkTimes([...workTimes, { day: '', from: '09:00', to: '17:00' }]);
  };

  const removeWorkTime = (index: number) => {
    setWorkTimes(workTimes.filter((_, i) => i !== index));
  };

  const updateWorkTime = (index: number, field: string, value: string) => {
    const updated = [...workTimes];
    updated[index] = { ...updated[index], [field]: value };
    setWorkTimes(updated);
  };

  const handleOpenMaps = () => {
    if (form.mapLocation) {
      // إذا كان هناك رابط موجود، افتحه
      Linking.openURL(form.mapLocation).catch(() => {
        Alert.alert(t('common.error'), t('auth.invalid_location'));
      });
    } else {
      // إذا لم يكن هناك رابط، اطلب من المستخدم إدخاله
      Alert.alert(
        t('auth.add_map_location'),
        t('auth.enter_map_location'),
        [
          { text: t('common.cancel'), style: 'cancel' },
          {
            text: t('common.ok'),
            onPress: () => {
              // يمكن إضافة منطق إضافي هنا مثل فتح منتقي الموقع
            }
          }
        ]
      );
    }
  };

  const handleSave = async () => {
    if (!profile?._id) {
      Alert.alert('خطأ', 'يجب تسجيل الدخول أولاً');
      return;
    }

    setSaving(true);
    try {
      console.log('🔍 DoctorProfileEditScreen - Saving profile...');
      console.log('🔍 DoctorProfileEditScreen - Profile ID:', profile._id);
      
      const updatedData = {
        ...form,
        workTimes,
        notificationsEnabled,
        privacySettings,
        appointmentDuration: Number(form.appointmentDuration),
        consultationFee: Number(form.consultationFee) || 0,
        experienceYears: Number(form.experienceYears) || 0,
      };

      console.log('🔍 DoctorProfileEditScreen - Updated data:', updatedData);

      const result = await updateProfile(updatedData);
      
      if (result.error) {
        console.error('❌ DoctorProfileEditScreen - Error:', result.error);
        Alert.alert('خطأ', result.error);
      } else {
        console.log('✅ DoctorProfileEditScreen - Success:', result.data);
        Alert.alert('نجح', 'تم تحديث البيانات بنجاح');
        navigation.goBack();
      }
    } catch (error: any) {
      console.error('❌ DoctorProfileEditScreen - Exception:', error);
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

  const renderInput = (label: string, field: string, placeholder: string, type: 'text' | 'email' | 'phone' | 'number' = 'text') => (
    <View style={styles.inputContainer}>
      <Text style={styles.inputLabel}>{label}</Text>
      <TextInput
        style={styles.input}
        value={form[field]}
        onChangeText={(value) => handleChange(field, value)}
        placeholder={placeholder}
        placeholderTextColor={theme.colors.textSecondary}
        keyboardType={type === 'email' ? 'email-address' : type === 'phone' ? 'phone-pad' : type === 'number' ? 'numeric' : 'default'}
      />
    </View>
  );

  const weekdays = [
    'الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'
  ];

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
            {renderInput(t('profile.doctor_name'), 'name', t('profile.enter_name_profile'))}
            {renderInput(t('profile.email'), 'email', t('profile.enter_email_profile'), 'email')}
            {renderInput(t('profile.phone'), 'phone', t('profile.enter_phone_profile'), 'phone')}
            {renderInput(t('profile.specialty'), 'specialty', t('profile.enter_specialty'))}
            {renderInput(t('profile.experience_years'), 'experienceYears', t('profile.enter_experience'), 'number')}
            {renderInput(t('profile.license_number'), 'licenseNumber', t('profile.enter_license'))}
          </View>
        ))}

        {/* المعلومات المهنية */}
        {renderSection(t('profile.professional_info'), (
          <View>
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>{t('profile.about')}</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={form.about}
                onChangeText={(value) => handleChange('about', value)}
                placeholder={t('profile.enter_about')}
                placeholderTextColor={theme.colors.textSecondary}
                multiline
                numberOfLines={4}
              />
            </View>
            {renderInput(t('profile.education'), 'education', t('profile.enter_education'))}
            {renderInput(t('profile.certifications'), 'certifications', t('profile.enter_certifications'))}
            {renderInput(t('profile.languages'), 'languages', t('profile.enter_languages'))}
          </View>
        ))}

        {/* معلومات العيادة */}
        {renderSection(t('profile.clinic_info'), (
          <View>
            {renderInput(t('profile.clinic_location'), 'clinicLocation', t('profile.enter_clinic_location'))}
            
            {/* موقع الخريطة */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>{t('auth.map_location')}</Text>
              <View style={styles.mapLocationContainer}>
                <TextInput
                  style={[styles.input, styles.mapLocationInput]}
                  value={form.mapLocation}
                  onChangeText={(value) => handleChange('mapLocation', value)}
                  placeholder={t('auth.enter_map_location')}
                  placeholderTextColor={theme.colors.textSecondary}
                />
                <TouchableOpacity 
                  style={styles.mapLocationButton}
                  onPress={() => handleOpenMaps()}
                >
                  <Ionicons name="location" size={20} color={theme.colors.white} />
                </TouchableOpacity>
              </View>
              {form.mapLocation ? (
                <TouchableOpacity 
                  style={styles.openMapsButton}
                  onPress={() => handleOpenMaps()}
                >
                  <Ionicons name="map" size={16} color={theme.colors.primary} />
                  <Text style={styles.openMapsText}>{t('auth.open_in_maps')}</Text>
                </TouchableOpacity>
              ) : null}
            </View>

            {renderInput(t('profile.province'), 'province', t('profile.enter_province'))}
            {renderInput(t('profile.area'), 'area', t('profile.enter_area'))}
            {renderInput(t('profile.consultation_fee'), 'consultationFee', t('profile.enter_consultation_fee'), 'number')}
            {renderInput(t('profile.emergency_contact'), 'emergencyContact', t('profile.enter_emergency_contact'), 'phone')}
          </View>
        ))}

        {/* أوقات العمل */}
        {renderSection(t('profile.work_times'), (
          <View>
            {workTimes.map((time, index) => (
              <View key={index} style={styles.workTimeRow}>
                <View style={styles.workTimeInputs}>
                  <View style={styles.workTimeInput}>
                    <Text style={styles.inputLabel}>{t('profile.day')}</Text>
                    <View style={styles.pickerContainer}>
                      <Text style={styles.pickerText}>{time.day || t('profile.select_day')}</Text>
                    </View>
                  </View>
                  <View style={styles.workTimeInput}>
                    <Text style={styles.inputLabel}>{t('profile.from')}</Text>
                    <TextInput
                      style={styles.input}
                      value={time.from}
                      onChangeText={(value) => updateWorkTime(index, 'from', value)}
                      placeholder="09:00"
                    />
                  </View>
                  <View style={styles.workTimeInput}>
                    <Text style={styles.inputLabel}>{t('profile.to')}</Text>
                    <TextInput
                      style={styles.input}
                      value={time.to}
                      onChangeText={(value) => updateWorkTime(index, 'to', value)}
                      placeholder="17:00"
                    />
                  </View>
                </View>
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => removeWorkTime(index)}
                >
                  <Ionicons name="trash" size={20} color={theme.colors.error} />
                </TouchableOpacity>
              </View>
            ))}
            <TouchableOpacity style={styles.addWorkTimeButton} onPress={addWorkTime}>
              <Ionicons name="add" size={20} color={theme.colors.primary} />
              <Text style={styles.addWorkTimeText}>{t('profile.add_work_time')}</Text>
            </TouchableOpacity>
          </View>
        ))}

        {/* مدة الموعد */}
        {renderSection(t('profile.appointment_duration'), (
          <View>
            <Text style={styles.inputLabel}>{t('profile.appointment_duration')}</Text>
            <View style={styles.durationOptions}>
              {['15', '30', '45', '60'].map((duration) => (
                <TouchableOpacity
                  key={duration}
                  style={[
                    styles.durationOption,
                    form.appointmentDuration === duration && styles.durationOptionActive
                  ]}
                  onPress={() => handleChange('appointmentDuration', duration)}
                >
                  <Text style={[
                    styles.durationOptionText,
                    form.appointmentDuration === duration && styles.durationOptionTextActive
                  ]}>
                    {duration} {t('common.minutes')}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
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
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingTitle}>{t('profile.show_consultation_fee')}</Text>
                <Text style={styles.settingDescription}>{t('profile.show_consultation_fee_description')}</Text>
              </View>
              <Switch
                value={privacySettings.showConsultationFee}
                onValueChange={(value) => setPrivacySettings(prev => ({ ...prev, showConsultationFee: value }))}
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
  workTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  workTimeInputs: {
    flex: 1,
    flexDirection: 'row',
    gap: 8,
  },
  workTimeInput: {
    flex: 1,
  },
  removeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.error + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  addWorkTimeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    backgroundColor: theme.colors.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  addWorkTimeText: {
    marginLeft: 8,
    fontSize: 16,
    color: theme.colors.primary,
    fontWeight: '600',
  },
  durationOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  durationOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  durationOptionActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  durationOptionText: {
    fontSize: 14,
    color: theme.colors.textPrimary,
  },
  durationOptionTextActive: {
    color: theme.colors.white,
    fontWeight: '600',
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
  pickerContainer: {
    backgroundColor: theme.colors.white,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  pickerText: {
    fontSize: 16,
    color: theme.colors.textPrimary,
  },
  mapLocationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  mapLocationInput: {
    flex: 1,
    marginRight: 10,
  },
  mapLocationButton: {
    backgroundColor: theme.colors.primary,
    padding: 12,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    width: 44,
    height: 44,
  },
  openMapsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    padding: 8,
    backgroundColor: theme.colors.primary + '10',
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  openMapsText: {
    marginLeft: 6,
    color: theme.colors.primary,
    fontSize: 14,
    fontWeight: '500',
  },
});

export default DoctorProfileEditScreen;
