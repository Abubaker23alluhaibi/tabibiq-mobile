import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Image,
  Switch,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  Linking,
  Modal,
} from 'react-native';
import { ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../utils/theme';
import { useAuth } from '../contexts/AuthContext';
import { doctorsAPI } from '../services/api';
import { MEDICAL_SPECIALTIES, getSpecialtiesByCategory, SPECIALTY_CATEGORIES as NEW_SPECIALTY_CATEGORIES } from '../utils/medicalSpecialties';

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
    mapLocation: '',
    profileImage: '',
  });
  const [privacySettings, setPrivacySettings] = useState({
    showPhone: true,
    showEmail: true,
    showAddress: true,
    showConsultationFee: true,
  });
  
  // حالة للفئات والتخصصات
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [isSelectionModalVisible, setIsSelectionModalVisible] = useState(false);
  const [selectionType, setSelectionType] = useState<'category' | 'specialty'>('category');
  const [selectionData, setSelectionData] = useState<string[]>([]);

  // دوال للتعامل مع اختيار الفئات والتخصصات
  const openSelectionModal = useCallback((type: 'category' | 'specialty') => {
    setSelectionType(type);
    if (type === 'category') {
      setSelectionData(NEW_SPECIALTY_CATEGORIES);
    } else {
      if (selectedCategory) {
        const categorySpecialties = getSpecialtiesByCategory(selectedCategory);
        setSelectionData(categorySpecialties.map(s => s.ar));
      } else {
        setSelectionData([]);
      }
    }
    setIsSelectionModalVisible(true);
  }, [selectedCategory]);

  const closeSelectionModal = useCallback(() => {
    setIsSelectionModalVisible(false);
  }, []);

  const handleSelection = useCallback((value: string) => {
    if (selectionType === 'category') {
      setSelectedCategory(value);
      closeSelectionModal();
      // افتح قائمة التخصصات للفئة المختارة
      setTimeout(() => {
        openSelectionModal('specialty');
      }, 100);
    } else {
      setForm(prev => ({ ...prev, specialty: value }));
      closeSelectionModal();
    }
  }, [selectionType, openSelectionModal, closeSelectionModal]);

  useEffect(() => {
    if (profile) {
      setForm({
        name: profile.name || '',
        email: profile.email || '',
        phone: profile.phone || '',
        specialty: profile.specialty || '',
        experienceYears: profile.experienceYears?.toString() || '',
        about: profile.about || '',
        mapLocation: profile.mapLocation || '',
        profileImage: profile.profileImage || profile.image || '',
      });
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

  const handlePickImage = async () => {
    Alert.alert('تنبيه', 'لا يمكن رفع الصور من التطبيق. يرجى إضافة الصورة من موقع الويب.');
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


      
      let updatedData = {
        ...form,
        privacySettings,
      };

      // ✅ رفع الصورة إذا تم تغييرها
      if (form.profileImage && form.profileImage !== profile.profileImage) {

        try {
          const imageResult = await doctorsAPI.uploadProfileImage(form.profileImage);
          
          if (imageResult && imageResult.success) {

            
            // تحديث البيانات بالصورة الجديدة
            if (imageResult.data && imageResult.data.imageUrl) {
              updatedData.profileImage = imageResult.data.imageUrl;
            } else if (imageResult.data && imageResult.data.profileImage) {
              updatedData.profileImage = imageResult.data.profileImage;
            }
          } else {

            Alert.alert('تحذير', 'فشل في رفع الصورة: ' + imageResult.error);
            // استمر مع الصورة المحلية
          }
        } catch (imageError) {
          Alert.alert('تحذير', 'فشل في رفع الصورة. سيتم استخدام الصورة المحلية.');
          // استمر مع الصورة المحلية
        }
      }



      const result = await updateProfile(updatedData);
      
      if (result.error) {
        Alert.alert('خطأ', result.error);
      } else {

        Alert.alert('نجح', 'تم تحديث البيانات بنجاح', [
          {
            text: 'حسناً',
            onPress: () => {
              // ✅ إصلاح: استخدام navigate بدلاً من goBack
              navigation.navigate('DoctorProfile' as never);
            }
          }
        ]);
      }
    } catch (error: any) {
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
        value={form[field as keyof typeof form]}
        onChangeText={(value) => handleChange(field, value)}
        placeholder={placeholder}
        placeholderTextColor={colors.textSecondary}
        keyboardType={type === 'email' ? 'email-address' : type === 'phone' ? 'phone-pad' : type === 'number' ? 'numeric' : 'default'}
      />
    </View>
  );



  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>{t('common.loading')}</Text>
      </View>
    );
  }

  return (
    <>
      <KeyboardAvoidingView 
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        enabled={true}
      >
      <StatusBar barStyle="light-content" backgroundColor={colors.primary} />
      
      <LinearGradient
        colors={['rgba(0, 150, 136, 0.9)', 'rgba(0, 105, 92, 0.9)']}
        style={styles.headerGradient}
      >
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('profile.edit_profile')}</Text>
        <TouchableOpacity onPress={handleSave} style={styles.saveButton} disabled={saving}>
          {saving ? (
            <ActivityIndicator size="small" color={colors.white} />
          ) : (
            <Text style={styles.saveButtonText}>{t('common.save')}</Text>
          )}
        </TouchableOpacity>
      </LinearGradient>

      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="always"
        keyboardDismissMode="none"
        contentContainerStyle={styles.scrollContent}
        nestedScrollEnabled={true}
        removeClippedSubviews={false}
      >
        {/* صورة الملف الشخصي */}
        {renderSection(t('profile.profile_image'), (
          <View style={styles.imageSection}>
            <View style={styles.imageContainer}>
              {form.profileImage ? (
                <Image source={{ uri: form.profileImage }} style={styles.profileImage} />
              ) : (
                <View style={styles.imagePlaceholder}>
                  <Ionicons name="person" size={40} color={colors.textSecondary} />
                </View>
              )}
              <View style={styles.imageOverlay}>
                <Ionicons name="information-circle" size={20} color={colors.white} />
              </View>
            </View>
            <Text style={styles.imageHint}>الصورة متاحة من موقع الويب فقط</Text>
          </View>
        ))}

        {/* المعلومات الأساسية */}
        {renderSection(t('profile.basic_info'), (
          <View>
            {renderInput(t('auth.full_name') || 'الاسم الكامل', 'name', t('auth.enter_full_name') || 'أدخل اسمك الكامل')}
            {renderInput(t('auth.email') || 'البريد الإلكتروني', 'email', t('auth.enter_email') || 'أدخل بريدك الإلكتروني', 'email')}
            {renderInput(t('auth.phone') || 'رقم الهاتف', 'phone', t('auth.enter_phone') || 'أدخل رقم هاتفك', 'phone')}
            {/* اختيار فئة التخصص */}
            <TouchableOpacity
              style={styles.inputContainer}
              onPress={() => openSelectionModal('category')}
            >
              <Text style={styles.inputLabel}>فئة التخصص</Text>
              <View style={styles.inputContainer}>
                <Text style={[styles.input, !selectedCategory && styles.placeholder]}>
                  {selectedCategory || 'اختر فئة التخصص'}
                </Text>
                <Ionicons name="chevron-down" size={20} color={colors.textSecondary} />
              </View>
            </TouchableOpacity>

            {/* اختيار التخصص */}
            <TouchableOpacity
              style={styles.inputContainer}
              onPress={() => {
                if (selectedCategory) {
                  openSelectionModal('specialty');
                } else {
                  Alert.alert('تنبيه', 'يرجى اختيار فئة التخصص أولاً');
                }
              }}
            >
              <Text style={styles.inputLabel}>{t('auth.specialty') || 'التخصص'}</Text>
              <View style={styles.inputContainer}>
                <Text style={[styles.input, !form.specialty && styles.placeholder]}>
                  {form.specialty || t('auth.select_specialty') || 'اختر التخصص'}
                </Text>
                <Ionicons name="chevron-down" size={20} color={colors.textSecondary} />
              </View>
            </TouchableOpacity>
            {renderInput(t('profile.experience_years') || 'سنوات الخبرة', 'experienceYears', t('profile.enter_experience') || 'أدخل سنوات الخبرة', 'number')}
          </View>
        ))}

        {/* معلومات إضافية */}
        {renderSection(t('profile.additional_info'), (
          <View>
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>{t('auth.about') || 'نبذة عنك'}</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={form.about}
                onChangeText={(value) => handleChange('about', value)}
                placeholder={t('auth.enter_about') || 'اكتب نبذة عن نفسك'}
                placeholderTextColor={colors.textSecondary}
                multiline
                numberOfLines={4}
              />
            </View>
            
            {/* موقع الخريطة */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>{t('auth.map_location') || 'موقع الخريطة'}</Text>
              <View style={styles.mapLocationContainer}>
                <TextInput
                  style={[styles.input, styles.mapLocationInput]}
                  value={form.mapLocation}
                  onChangeText={(value) => handleChange('mapLocation', value)}
                  placeholder={t('auth.enter_map_location') || 'أدخل موقعك على الخريطة'}
                  placeholderTextColor={colors.textSecondary}
                />
                <TouchableOpacity 
                  style={styles.mapLocationButton}
                  onPress={() => handleOpenMaps()}
                >
                  <Ionicons name="location" size={20} color={colors.white} />
                </TouchableOpacity>
              </View>
              {form.mapLocation ? (
                <TouchableOpacity 
                  style={styles.openMapsButton}
                  onPress={() => handleOpenMaps()}
                >
                  <Ionicons name="map" size={16} color={colors.primary} />
                  <Text style={styles.openMapsText}>{t('auth.open_in_maps') || 'فتح في الخرائط'}</Text>
                </TouchableOpacity>
              ) : null}
            </View>
                      </View>
          ))}

        {/* إعدادات الخصوصية */}
        {renderSection(t('profile.privacy_settings') || 'إعدادات الخصوصية', (
          <View>
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingTitle}>{t('profile.show_phone') || 'إظهار رقم الهاتف'}</Text>
                <Text style={styles.settingDescription}>{t('profile.show_phone_description') || 'السماح للمرضى برؤية رقم هاتفك'}</Text>
              </View>
              <Switch
                value={privacySettings.showPhone}
                onValueChange={(value) => setPrivacySettings(prev => ({ ...prev, showPhone: value }))}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor={colors.white}
              />
            </View>
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingTitle}>{t('profile.show_email') || 'إظهار البريد الإلكتروني'}</Text>
                <Text style={styles.settingDescription}>{t('profile.show_email_description') || 'السماح للمرضى برؤية بريدك الإلكتروني'}</Text>
              </View>
              <Switch
                value={privacySettings.showEmail}
                onValueChange={(value) => setPrivacySettings(prev => ({ ...prev, showEmail: value }))}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor={colors.white}
              />
            </View>
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingTitle}>{t('profile.show_address') || 'إظهار العنوان'}</Text>
                <Text style={styles.settingDescription}>{t('profile.show_address_description') || 'السماح للمرضى برؤية عنوانك'}</Text>
              </View>
              <Switch
                value={privacySettings.showAddress}
                onValueChange={(value) => setPrivacySettings(prev => ({ ...prev, showAddress: value }))}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor={colors.white}
              />
            </View>
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingTitle}>{t('profile.show_consultation_fee') || 'إظهار رسوم الاستشارة'}</Text>
                <Text style={styles.settingDescription}>{t('profile.show_consultation_fee_description') || 'السماح للمرضى برؤية رسوم الاستشارة'}</Text>
              </View>
              <Switch
                value={privacySettings.showConsultationFee}
                onValueChange={(value) => setPrivacySettings(prev => ({ ...prev, showConsultationFee: value }))}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor={colors.white}
              />
            </View>
          </View>
        ))}
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal
        visible={isSelectionModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={closeSelectionModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {selectionType === 'category' ? 'فئة التخصص' : t('auth.specialty') || 'التخصص'}
              </Text>
              <TouchableOpacity onPress={closeSelectionModal} style={styles.closeButton}>
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalList}>
              {selectionData.map((item, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.modalItem}
                  onPress={() => handleSelection(item)}
                >
                  <Text style={styles.modalItemText}>{item}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
  };

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.textSecondary,
  },
  headerGradient: {
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
    backgroundColor: colors.white + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.white,
    flex: 1,
    textAlign: 'center',
  },
  saveButton: {
    backgroundColor: colors.white + '20',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  saveButtonText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    paddingBottom: 100,
  },
  scrollContent: {
    flexGrow: 1,
  },
  section: {
    marginBottom: 30,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 20,
    textAlign: 'right',
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
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.border,
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageHint: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 10,
    textAlign: 'right',
  },
  input: {
    backgroundColor: colors.white,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.border,
    textAlign: 'right',
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
    backgroundColor: colors.error + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  addWorkTimeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    backgroundColor: colors.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  addWorkTimeText: {
    marginLeft: 8,
    fontSize: 16,
    color: colors.primary,
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
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  durationOptionActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  durationOptionText: {
    fontSize: 14,
    color: colors.textPrimary,
  },
  durationOptionTextActive: {
    color: colors.white,
    fontWeight: '600',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: colors.white,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 3,
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 6,
    textAlign: 'right',
  },
  settingDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'right',
  },
  pickerContainer: {
    backgroundColor: colors.white,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pickerText: {
    fontSize: 16,
    color: colors.textPrimary,
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
    backgroundColor: colors.primary,
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
    backgroundColor: colors.primary + '10',
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  openMapsText: {
    marginLeft: 6,
    color: colors.primary,
    fontSize: 14,
    fontWeight: '500',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  closeButton: {
    padding: 4,
  },
  modalList: {
    maxHeight: 400,
  },
  modalItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalItemText: {
    fontSize: 16,
    color: colors.textPrimary,
  },
  placeholder: {
    color: colors.textSecondary,
  },
});

export default DoctorProfileEditScreen;
