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
  Modal,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../utils/theme';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';

const UserProfileEditScreen: React.FC = () => {
  const navigation = useNavigation();
  const { t } = useTranslation();
  const { user, updateProfile } = useAuth();
  
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    profileImage: '',
  });



  useEffect(() => {
    if (user) {
      setForm({
        name: user.name || user.firstName || user.first_name || '',
        email: user.email || '',
        phone: user.phone || '',
        profileImage: user.profileImage || user.profile_image || '',
      });
    }
  }, [user]);

  const handleChange = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };





  const handlePickImage = async () => {
    Alert.alert('تنبيه', 'لا يمكن رفع الصور من التطبيق. يرجى إضافة الصورة من موقع الويب.');
  };

  const handleSave = async () => {
    if (!user?.id) {
      Alert.alert('خطأ', 'يجب تسجيل الدخول أولاً');
      return;
    }

    setSaving(true);
    try {
      const updatedData = {
        ...form,
      };

      const result = await updateProfile(updatedData);
      
      if (result.error) {
        Alert.alert('خطأ', result.error);
      } else {
        Alert.alert('نجح', 'تم تحديث البيانات بنجاح');
        navigation.goBack();
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

  const InputField = useMemo(() => React.memo(({ 
    label, 
    field, 
    value, 
    placeholder, 
    keyboardType = 'default',
    icon,
    multiline = false,
    numberOfLines = 1,
    returnKeyType = 'next',
    onSubmitEditing 
  }: {
    label: string;
    field: string;
    value: string;
    placeholder: string;
    keyboardType?: string;
    icon: keyof typeof Ionicons.glyphMap;
    multiline?: boolean;
    numberOfLines?: number;
    returnKeyType?: 'next' | 'done' | 'go' | 'search' | 'send';
    onSubmitEditing?: () => void;
  }) => {
    const handleTextChange = useCallback((text: string) => {
      handleChange(field, text);
    }, [field]);

    return (
      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>{label}</Text>
        <View style={styles.inputWrapper}>
          <Ionicons name={icon} size={20} color={theme.colors.textSecondary} style={styles.inputIcon} />
          <TextInput
            style={[styles.input, multiline && styles.textArea]}
            value={value}
            onChangeText={handleTextChange}
            placeholder={placeholder}
            placeholderTextColor={theme.colors.textSecondary}
            keyboardType={keyboardType as any}
            returnKeyType={returnKeyType}
            blurOnSubmit={false}
            autoCorrect={false}
            autoCapitalize="none"
            textAlign="right"
            multiline={multiline}
            numberOfLines={numberOfLines}
            onSubmitEditing={onSubmitEditing}
            editable={!saving}
            contextMenuHidden={true}
            textContentType="none"
            autoComplete="off"
            spellCheck={false}
            importantForAutofill="no"
          />
        </View>
      </View>
    );
  }), [handleChange, saving]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>{t('common.loading')}</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      enabled={true}
    >
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.primary} />
      
      <LinearGradient
        colors={['rgba(0, 150, 136, 0.9)', 'rgba(0, 105, 92, 0.9)']}
        style={styles.headerGradient}
      >
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
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
                  <Ionicons name="person" size={50} color={theme.colors.textSecondary} />
                </View>
              )}
              <View style={styles.imageOverlay}>
                <Ionicons name="information-circle" size={24} color={theme.colors.white} />
              </View>
            </View>
            <Text style={styles.imageHint}>الصورة متاحة من موقع الويب فقط</Text>
          </View>
        ))}

        {/* المعلومات الأساسية */}
        {renderSection(t('profile.basic_info'), (
          <View>
            <InputField
              label={t('auth.full_name') || 'الاسم الكامل'}
              field="name"
              value={form.name}
              placeholder={t('auth.enter_full_name') || 'أدخل اسمك الكامل'}
              icon="person"
              returnKeyType="next"
            />
            <InputField
              label={t('auth.email') || 'البريد الإلكتروني'}
              field="email"
              value={form.email}
              placeholder={t('auth.enter_email') || 'أدخل بريدك الإلكتروني'}
              icon="mail"
              keyboardType="email-address"
              returnKeyType="next"
            />
            <InputField
              label={t('auth.phone') || 'رقم الهاتف'}
              field="phone"
              value={form.phone}
              placeholder={t('auth.enter_phone') || 'أدخل رقم هاتفك'}
              icon="call"
              keyboardType="phone-pad"
              returnKeyType="next"
            />

          </View>
        ))}
      </ScrollView>


    </KeyboardAvoidingView>
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
    backgroundColor: theme.colors.white + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.white,
    flex: 1,
    textAlign: 'center',
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
    color: theme.colors.textPrimary,
    marginBottom: 20,
    textAlign: 'right',
  },
  imageSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  imageContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: theme.colors.primary,
  },
  imagePlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: theme.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: theme.colors.primary,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  imageHint: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    marginBottom: 10,
    textAlign: 'right',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 3,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: theme.colors.textPrimary,
    textAlign: 'right',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
    minHeight: 80,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: theme.colors.white,
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
    color: theme.colors.textPrimary,
    marginBottom: 6,
    textAlign: 'right',
  },
  settingDescription: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    textAlign: 'right',
  },
  // DatePicker styles
  datePickerContainer: {
    marginBottom: 20,
  },
  datePickerLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    marginBottom: 10,
    textAlign: 'right',
  },
  datePickerInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 3,
  },
  datePickerIcon: {
    marginRight: 12,
  },
  datePickerText: {
    flex: 1,
    fontSize: 16,
    color: theme.colors.textPrimary,
    textAlign: 'right',
  },
  datePickerPlaceholder: {
    color: theme.colors.textSecondary,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: theme.colors.white,
    borderRadius: 16,
    width: '90%',
    maxWidth: 400,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: theme.colors.primary,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.white,
  },
  closeButton: {
    padding: 4,
  },
  datePickerContent: {
    padding: 20,
  },
  pickerRow: {
    marginBottom: 20,
  },
  pickerLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
    marginBottom: 10,
    textAlign: 'right',
  },
  pickerScrollView: {
    height: 50,
  },
  pickerItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 4,
    borderRadius: 8,
    backgroundColor: theme.colors.background,
    minWidth: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pickerItemSelected: {
    backgroundColor: theme.colors.primary,
  },
  pickerItemText: {
    fontSize: 14,
    color: theme.colors.textPrimary,
  },
  pickerItemTextSelected: {
    color: theme.colors.white,
    fontWeight: 'bold',
  },
  modalFooter: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  confirmButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  confirmButtonText: {
    color: theme.colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default UserProfileEditScreen;

