import React, { useState, useEffect, useCallback } from 'react';
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
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../utils/theme';
import { useAuth } from '../contexts/AuthContext';
import { doctorsAPI } from '../services/api';
import { getSpecialtiesByCategory, SPECIALTY_CATEGORIES as NEW_SPECIALTY_CATEGORIES } from '../utils/medicalSpecialties';

const DoctorProfileEditScreen: React.FC = () => {
  const navigation = useNavigation();
  const { t } = useTranslation();
  const { profile, updateProfile } = useAuth();
  
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

  const handleOpenMaps = () => {
    if (form.mapLocation) {
      Linking.openURL(form.mapLocation).catch(() => {
        Alert.alert(t('common.error'), t('auth.invalid_location'));
      });
    } else {
      Alert.alert(
        t('auth.add_map_location'),
        t('auth.enter_map_location'),
        [
          { text: t('common.cancel'), style: 'cancel' },
          { text: t('common.ok') }
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
      let updatedData = { ...form, privacySettings };

      if (form.profileImage && form.profileImage !== profile.profileImage) {
        try {
          const imageResult = await doctorsAPI.uploadProfileImage(form.profileImage);
          if (imageResult && imageResult.success) {
            if (imageResult.data?.imageUrl) {
              updatedData.profileImage = imageResult.data.imageUrl;
            } else if (imageResult.data?.profileImage) {
              updatedData.profileImage = imageResult.data.profileImage;
            }
          } else {
            Alert.alert('تحذير', 'فشل في رفع الصورة: ' + imageResult.error);
          }
        } catch (imageError) {
          Alert.alert('تحذير', 'فشل في رفع الصورة. سيتم استخدام الصورة المحلية.');
        }
      }

      const result = await updateProfile(updatedData);
      
      if (result.error) {
        Alert.alert('خطأ', result.error);
      } else {
        Alert.alert('نجح', 'تم تحديث البيانات بنجاح', [
          { text: 'حسناً', onPress: () => navigation.navigate('DoctorProfile' as never) }
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
        placeholderTextColor="#999"
        keyboardType={type === 'email' ? 'email-address' : type === 'phone' ? 'phone-pad' : type === 'number' ? 'numeric' : 'default'}
      />
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.primary} />
      
      {/* Header */}
      <LinearGradient colors={[theme.colors.primary, theme.colors.primaryDark]} style={styles.header}>
        <SafeAreaView>
          <View style={styles.headerContent}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
              <Ionicons name="arrow-forward" size={24} color="#FFF" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>{t('profile.edit_profile')}</Text>
            <TouchableOpacity onPress={handleSave} disabled={saving} style={styles.saveButton}>
              {saving ? <ActivityIndicator size="small" color="#FFF" /> : <Text style={styles.saveButtonText}>{t('common.save')}</Text>}
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </LinearGradient>

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          
          {/* Profile Image */}
          <View style={styles.imageSection}>
            <View style={styles.imageWrapper}>
              {form.profileImage ? (
                <Image source={{ uri: form.profileImage }} style={styles.profileImage} />
              ) : (
                <View style={styles.placeholderImage}>
                  <Ionicons name="person" size={40} color="#CCC" />
                </View>
              )}
              <View style={styles.editBadge}>
                <Ionicons name="camera" size={16} color="#FFF" />
              </View>
            </View>
            <Text style={styles.imageHint}>{t('profile.image_web_only')}</Text>
          </View>

          {/* Basic Info */}
          {renderSection(t('profile.basic_info'), (
            <View style={styles.card}>
              {renderInput(t('auth.full_name'), 'name', t('auth.enter_full_name'))}
              {renderInput(t('auth.email'), 'email', t('auth.enter_email'), 'email')}
              {renderInput(t('auth.phone'), 'phone', t('auth.enter_phone'), 'phone')}
              
              {/* Category Selection */}
              <TouchableOpacity style={styles.inputContainer} onPress={() => openSelectionModal('category')}>
                <Text style={styles.inputLabel}>{t('auth.specialty_category')}</Text>
                <View style={styles.selectInput}>
                  <Text style={[styles.inputText, !selectedCategory && styles.placeholderText]}>
                    {selectedCategory || 'اختر فئة التخصص'}
                  </Text>
                  <Ionicons name="chevron-down" size={20} color="#666" />
                </View>
              </TouchableOpacity>

              {/* Specialty Selection */}
              <TouchableOpacity 
                style={styles.inputContainer} 
                onPress={() => selectedCategory ? openSelectionModal('specialty') : Alert.alert('تنبيه', 'يرجى اختيار فئة التخصص أولاً')}
              >
                <Text style={styles.inputLabel}>{t('auth.specialty')}</Text>
                <View style={styles.selectInput}>
                  <Text style={[styles.inputText, !form.specialty && styles.placeholderText]}>
                    {form.specialty || t('auth.select_specialty')}
                  </Text>
                  <Ionicons name="chevron-down" size={20} color="#666" />
                </View>
              </TouchableOpacity>

              {renderInput(t('profile.experience_years'), 'experienceYears', t('profile.enter_experience'), 'number')}
            </View>
          ))}

          {/* Additional Info */}
          {renderSection(t('profile.additional_info'), (
            <View style={styles.card}>
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>{t('auth.about')}</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={form.about}
                  onChangeText={(value) => handleChange('about', value)}
                  placeholder={t('auth.enter_about')}
                  placeholderTextColor="#999"
                  multiline
                  numberOfLines={4}
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>{t('auth.map_location')}</Text>
                <View style={styles.rowInput}>
                  <TextInput
                    style={[styles.input, { flex: 1 }]}
                    value={form.mapLocation}
                    onChangeText={(value) => handleChange('mapLocation', value)}
                    placeholder={t('auth.enter_map_location')}
                    placeholderTextColor="#999"
                  />
                  <TouchableOpacity style={styles.iconBtn} onPress={handleOpenMaps}>
                    <Ionicons name="map" size={20} color={theme.colors.primary} />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ))}

          {/* Privacy Settings */}
          {renderSection(t('profile.privacy_settings'), (
            <View style={styles.card}>
              {[
                { key: 'showPhone', title: t('profile.show_phone'), desc: t('profile.show_phone_description') },
                { key: 'showEmail', title: t('profile.show_email'), desc: t('profile.show_email_description') },
                { key: 'showAddress', title: t('profile.show_address'), desc: t('profile.show_address_description') },
                { key: 'showConsultationFee', title: t('profile.show_consultation_fee'), desc: t('profile.show_consultation_fee_description') },
              ].map((item, index) => (
                <View key={item.key} style={[styles.settingRow, index !== 3 && styles.borderBottom]}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.settingTitle}>{item.title}</Text>
                    <Text style={styles.settingDesc}>{item.desc}</Text>
                  </View>
                  <Switch
                    value={privacySettings[item.key as keyof typeof privacySettings]}
                    onValueChange={(val) => setPrivacySettings(prev => ({ ...prev, [item.key]: val }))}
                    trackColor={{ false: '#E0E0E0', true: theme.colors.primary }}
                    thumbColor="#FFF"
                  />
                </View>
              ))}
            </View>
          ))}
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Selection Modal */}
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
                {selectionType === 'category' ? 'فئة التخصص' : t('auth.specialty')}
              </Text>
              <TouchableOpacity onPress={closeSelectionModal} style={styles.closeIcon}>
                <Ionicons name="close" size={24} color="#666" />
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
                  <Ionicons name="chevron-back" size={16} color="#CCC" />
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F9FC' },
  
  // Header
  header: {
    paddingTop: Platform.OS === 'android' ? 40 : 10,
    paddingBottom: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  backButton: { padding: 8 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#FFF' },
  saveButton: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 8 },
  saveButtonText: { color: '#FFF', fontWeight: 'bold', fontSize: 14 },

  content: { padding: 20 },
  scrollContent: { paddingBottom: 50 },

  // Image Section
  imageSection: { alignItems: 'center', marginBottom: 24 },
  imageWrapper: { position: 'relative' },
  profileImage: { width: 100, height: 100, borderRadius: 50, borderWidth: 3, borderColor: '#FFF' },
  placeholderImage: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#E0E0E0', justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: '#FFF' },
  editBadge: { position: 'absolute', bottom: 0, right: 0, backgroundColor: theme.colors.primary, width: 30, height: 30, borderRadius: 15, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#FFF' },
  imageHint: { fontSize: 12, color: '#888', marginTop: 8 },

  // Sections
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: theme.colors.textPrimary, marginBottom: 12, textAlign: 'right' },
  card: { backgroundColor: '#FFF', borderRadius: 16, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },

  // Inputs
  inputContainer: { marginBottom: 16 },
  inputLabel: { fontSize: 14, fontWeight: '600', color: '#444', marginBottom: 6, textAlign: 'right' },
  input: { backgroundColor: '#F9F9F9', borderRadius: 10, padding: 12, fontSize: 14, color: '#333', borderWidth: 1, borderColor: '#EEE', textAlign: 'right' },
  selectInput: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#F9F9F9', borderRadius: 10, padding: 12, borderWidth: 1, borderColor: '#EEE' },
  inputText: { fontSize: 14, color: '#333' },
  placeholderText: { color: '#999' },
  textArea: { height: 100, textAlignVertical: 'top' },
  rowInput: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  iconBtn: { padding: 10, backgroundColor: '#E3F2FD', borderRadius: 10 },

  // Settings
  settingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12 },
  borderBottom: { borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  settingTitle: { fontSize: 15, fontWeight: '600', color: '#333', textAlign: 'right' },
  settingDesc: { fontSize: 12, color: '#888', marginTop: 2, textAlign: 'right' },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#FFF', borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '70%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#EEE' },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  closeIcon: { padding: 4 },
  modalList: { paddingHorizontal: 20 },
  modalItem: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#F5F5F5' },
  modalItemText: { fontSize: 16, color: '#333' },
});

export default DoctorProfileEditScreen;