import React, { useState, useCallback, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  Dimensions,
  StatusBar,
  Image,
  Linking,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import CSSScrollView from '../components/web/CSSScrollView';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { theme } from '../utils/theme';
import { useAuth } from '../contexts/AuthContext';
import { mapSpecialtyToEnglish, getArabicSpecialties } from '../utils/specialtyMapper';

const { width, height } = Dimensions.get('window');

interface FormData {
  name: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  specialty: string;
  province: string;
  area: string;
  clinicLocation: string;
  mapLocation: string;
  about: string;
  experienceYears: string;
  appointmentDuration: string;
  workTimes: WorkTime[];
}

interface FormErrors {
  [key: string]: string;
}

interface WorkTime {
  day: string;
  from: string;
  to: string;
}

const DoctorSignUpScreen = () => {
  const navigation = useNavigation();
  const { t } = useTranslation();
  const { signUp } = useAuth();
  
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormData>({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    specialty: '',
    province: '',
    area: '',
    clinicLocation: '',
    mapLocation: '',
    about: '',
    experienceYears: '',
    appointmentDuration: '30',
    workTimes: [],
  });
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});

  // استخدام useRef لمنع إعادة الرندر
  const formRef = useRef<FormData>(form);
  formRef.current = form;

  const provinces = (t('provinces', { returnObjects: true }) as string[]) || [];
  const specialties = getArabicSpecialties();
  const weekdays = [
    t('work_times.sunday'),
    t('work_times.monday'),
    t('work_times.tuesday'),
    t('work_times.wednesday'),
    t('work_times.thursday'),
    t('work_times.friday'),
    t('work_times.saturday'),
  ];

  const handleChange = useCallback((field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  }, []);

  const pickImage = useCallback(async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  }, []);

  const validateStep1 = useCallback(() => {
    const newErrors: FormErrors = {};

    if (!form.name.trim()) {
      newErrors.name = t('validation.name_required');
    }

    if (!form.email.trim()) {
      newErrors.email = t('validation.email_required');
    } else if (!/\S+@\S+\.\S+/.test(form.email)) {
      newErrors.email = t('validation.email_invalid');
    }

    if (!form.phone.trim()) {
      newErrors.phone = t('validation.phone_required');
    }

    if (!form.password) {
      newErrors.password = t('validation.password_required');
    } else if (form.password.length < 6) {
      newErrors.password = t('validation.password_length');
    }

    if (form.password !== form.confirmPassword) {
      newErrors.confirmPassword = t('validation.password_mismatch');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [form, t]);

  const validateStep2 = useCallback(() => {
    const newErrors: FormErrors = {};

    if (!form.specialty) {
      newErrors.specialty = t('validation.specialty_required');
    }

    if (!form.province) {
      newErrors.province = t('validation.province_required');
    }

    if (!form.area) {
      newErrors.area = t('validation.area_required');
    }

    if (!form.clinicLocation) {
      newErrors.clinicLocation = t('validation.clinic_location_required');
    }

    // سنوات الخبرة اختيارية - لا نحتاج للتحقق منها
    // if (!form.experienceYears) {
    //   newErrors.experienceYears = t('validation.experience_years_required');
    // }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [form, t]);

  const handleNext = useCallback(() => {
    if (step === 1 && validateStep1()) {
      setStep(2);
    } else if (step === 2 && validateStep2()) {
      setStep(3);
    }
  }, [step, validateStep1, validateStep2]);

  const handleBack = useCallback(() => {
    if (step > 1) {
      setStep(step - 1);
    }
  }, [step]);

  const handleSignUp = useCallback(async () => {
    if (!validateStep1() || !validateStep2()) return;

    setLoading(true);
    try {
      // تحويل التخصص من العربية إلى الإنجليزية قبل الإرسال
      const englishSpecialty = mapSpecialtyToEnglish(form.specialty);
      
      const result = await signUp({
        ...form,
        specialty: englishSpecialty,
        user_type: 'doctor',
        image,
      });
      
      // إذا كان التسجيل ناجح وكان هناك رابط واتساب
      if (result && result.whatsappLink) {
        Alert.alert(
          t('auth.signup_success') || 'تم التسجيل بنجاح',
          t('whatsapp_documents.message') || 'تم إنشاء حساب الطبيب بنجاح! يرجى إرسال الوثائق المطلوبة على الواتساب للموافقة على الحساب.',
          [
            { 
              text: t('whatsapp_documents.button') || 'إرسال الوثائق على الواتساب', 
              onPress: () => {
                // فتح رابط الواتساب
                Linking.openURL(result.whatsappLink);
              }
            },
            { 
              text: t('common.ok') || 'حسناً', 
              onPress: () => navigation.navigate('DoctorDashboard' as never) 
            }
          ]
        );
      } else {
        Alert.alert(
          t('auth.signup_success') || 'تم التسجيل بنجاح',
          t('auth.doctor_signup_success_message') || 'تم إنشاء حساب الطبيب بنجاح',
          [{ text: t('common.ok') || 'حسناً', onPress: () => navigation.navigate('DoctorDashboard' as never) }]
        );
      }
    } catch (error: any) {
      Alert.alert(
        t('auth.signup_error') || 'خطأ في التسجيل', 
        error.message || t('auth.signup_error_message') || 'حدث خطأ أثناء التسجيل'
      );
    } finally {
      setLoading(false);
    }
  }, [form, image, validateStep1, validateStep2, signUp, t, navigation]);

  const InputField = useMemo(() => React.memo(({ 
    label, 
    field, 
    value, 
    placeholder, 
    secureTextEntry = false,
    keyboardType = 'default',
    icon,
    multiline = false,
    numberOfLines = 1,
    returnKeyType = 'next',
    onSubmitEditing,
    onPress,
    editable = true,
  }: {
    label: string;
    field: string;
    value: string;
    placeholder: string;
    secureTextEntry?: boolean;
    keyboardType?: string;
    icon: keyof typeof Ionicons.glyphMap;
    multiline?: boolean;
    numberOfLines?: number;
    returnKeyType?: 'next' | 'done' | 'go' | 'search' | 'send';
    onSubmitEditing?: () => void;
    onPress?: () => void;
    editable?: boolean;
  }) => {
    const handleTextChange = useCallback((text: string) => {
      handleChange(field, text);
    }, [field]);

    return (
      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>{label}</Text>
        {onPress ? (
          <TouchableOpacity 
            style={[styles.inputWrapper, errors[field] && styles.inputError]} 
            onPress={onPress}
            disabled={!editable}
          >
            <Ionicons name={icon} size={20} color={theme.colors.textSecondary} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, multiline && styles.multilineInput]}
              value={value}
              onChangeText={handleTextChange}
              placeholder={placeholder}
              placeholderTextColor={theme.colors.textSecondary}
              secureTextEntry={secureTextEntry}
              keyboardType={keyboardType as any}
              multiline={multiline}
              numberOfLines={numberOfLines}
              returnKeyType={multiline ? "default" : returnKeyType}
              blurOnSubmit={false}
              autoCorrect={false}
              autoCapitalize="none"
              textAlign="right"
              onSubmitEditing={onSubmitEditing}
              editable={false} // لا يمكن الكتابة في الحقول التي تحتاج onPress
              contextMenuHidden={true}
              textContentType="none"
              autoComplete="off"
              spellCheck={false}
              importantForAutofill="no"
              passwordRules=""
            />
          </TouchableOpacity>
        ) : (
          <View style={[styles.inputWrapper, errors[field] && styles.inputError]}>
            <Ionicons name={icon} size={20} color={theme.colors.textSecondary} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, multiline && styles.multilineInput]}
              value={value}
              onChangeText={handleTextChange}
              placeholder={placeholder}
              placeholderTextColor={theme.colors.textSecondary}
              secureTextEntry={secureTextEntry}
              keyboardType={keyboardType as any}
              multiline={multiline}
              numberOfLines={numberOfLines}
              returnKeyType={multiline ? "default" : returnKeyType}
              blurOnSubmit={false}
              autoCorrect={false}
              autoCapitalize="none"
              textAlign="right"
              onSubmitEditing={onSubmitEditing}
              editable={editable}
              contextMenuHidden={true}
              textContentType="none"
              autoComplete="off"
              spellCheck={false}
              importantForAutofill="no"
              passwordRules=""
            />
          </View>
        )}
        {errors[field] && <Text style={styles.errorText}>{errors[field]}</Text>}
      </View>
    );
  }), [handleChange, errors, loading]);

  const renderStep1 = () => (
    <View>
      <InputField
        label={t('auth.full_name')}
        field="name"
        value={form.name}
        placeholder={t('auth.enter_full_name')}
        icon="person"
      />

      <InputField
        label={t('auth.email')}
        field="email"
        value={form.email}
        placeholder={t('auth.enter_email')}
        icon="mail"
        keyboardType="email-address"
      />

      <InputField
        label={t('auth.phone')}
        field="phone"
        value={form.phone}
        placeholder={t('auth.enter_phone')}
        icon="call"
        keyboardType="phone-pad"
      />

      <InputField
        label={t('auth.password')}
        field="password"
        value={form.password}
        placeholder={t('auth.enter_password')}
        icon="lock-closed"
        secureTextEntry={false}
      />

      <InputField
        label={t('auth.confirm_password')}
        field="confirmPassword"
        value={form.confirmPassword}
        placeholder={t('auth.confirm_password')}
        icon="lock-closed"
        secureTextEntry={false}
      />
    </View>
  );

  const renderStep2 = () => (
    <View>
      <InputField
        label={t('auth.specialty')}
        field="specialty"
        value={form.specialty}
        placeholder={t('auth.select_specialty')}
        icon="medical"
        onPress={() => {
          Alert.alert(
            t('auth.specialty'),
            '',
            specialties.map(specialty => ({
              text: specialty,
              onPress: () => handleChange('specialty', specialty)
            }))
          );
        }}
        editable={false}
      />

      <InputField
        label={t('auth.province')}
        field="province"
        value={form.province}
        placeholder={t('auth.select_province')}
        icon="location"
        onPress={() => {
          Alert.alert(
            t('auth.province'),
            '',
            provinces.map(province => ({
              text: province,
              onPress: () => handleChange('province', province)
            }))
          );
        }}
        editable={false}
      />

      <InputField
        label={t('auth.area')}
        field="area"
        value={form.area}
        placeholder={t('auth.enter_area')}
        icon="location-outline"
      />

      <InputField
        label={t('auth.clinic_location')}
        field="clinicLocation"
        value={form.clinicLocation}
        placeholder={t('auth.enter_clinic_location')}
        icon="business"
      />

      <InputField
        label={t('auth.map_location')}
        field="mapLocation"
        value={form.mapLocation}
        placeholder={t('location.placeholder')}
        icon="map"
      />

      <InputField
        label={t('auth.experience_years')}
        field="experienceYears"
        value={form.experienceYears}
        placeholder={t('auth.enter_experience_years')}
        icon="time"
        keyboardType="numeric"
        editable={true}
      />

      <InputField
        label={t('auth.about')}
        field="about"
        value={form.about}
        placeholder={t('auth.enter_about')}
        icon="document-text"
        multiline
        numberOfLines={4}
      />

      {/* إدارة أوقات الدوام */}
      <View style={styles.workTimesContainer}>
        <Text style={styles.sectionTitle}>{t('work_times.title')}</Text>
        <Text style={styles.sectionSubtitle}>{t('work_times.subtitle')}</Text>
        
        {form.workTimes.length === 0 ? (
          <View style={styles.emptyWorkTimes}>
            <Ionicons name="time-outline" size={40} color={theme.colors.textSecondary} />
            <Text style={styles.emptyWorkTimesText}>{t('work_times.empty')}</Text>
          </View>
        ) : (
          form.workTimes.map((workTime, index) => (
            <View key={index} style={styles.workTimeItem}>
              <View style={styles.workTimeHeader}>
                <Text style={styles.workTimeDay}>{workTime.day}</Text>
                <TouchableOpacity
                  style={styles.removeWorkTimeButton}
                  onPress={() => {
                    const newWorkTimes = [...form.workTimes];
                    newWorkTimes.splice(index, 1);
                    setForm(prev => ({ ...prev, workTimes: newWorkTimes }));
                  }}
                >
                  <Ionicons name="close-circle" size={20} color={theme.colors.error} />
                </TouchableOpacity>
              </View>
              <View style={styles.workTimeTimes}>
                <Text style={styles.workTimeText}>{workTime.from} - {workTime.to}</Text>
              </View>
            </View>
          ))
        )}
        
        <TouchableOpacity
          style={styles.addWorkTimeButton}
          onPress={() => {
            Alert.alert(
              t('work_times.select_day'),
              '',
              weekdays.map(day => ({
                text: day,
                onPress: () => {
                  const newWorkTime: WorkTime = {
                    day,
                    from: '09:00',
                    to: '17:00'
                  };
                  setForm(prev => ({
                    ...prev,
                    workTimes: [...prev.workTimes, newWorkTime]
                  }));
                }
              }))
            );
          }}
        >
          <Ionicons name="add-circle" size={20} color={theme.colors.primary} />
          <Text style={styles.addWorkTimeText}>{t('work_times.add')}</Text>
        </TouchableOpacity>
      </View>

      {/* إدارة مدة المواعيد */}
      <View style={styles.appointmentDurationContainer}>
        <Text style={styles.sectionTitle}>{t('appointment_duration.title')}</Text>
        <Text style={styles.sectionSubtitle}>{t('appointment_duration.subtitle')}</Text>
        
        <View style={styles.durationOptions}>
          {Object.entries(t('appointment_duration.options', { returnObjects: true })).map(([value, label]) => (
            <TouchableOpacity
              key={value}
              style={[
                styles.durationOption,
                form.appointmentDuration === value && styles.durationOptionActive
              ]}
              onPress={() => handleChange('appointmentDuration', value)}
            >
              <Text style={[
                styles.durationOptionText,
                form.appointmentDuration === value && styles.durationOptionTextActive
              ]}>
                {label}
              </Text>
              {form.appointmentDuration === value && (
                <Ionicons name="checkmark-circle" size={20} color={theme.colors.primary} />
              )}
            </TouchableOpacity>
          ))}
        </View>
        
        <View style={styles.durationInfo}>
          <Ionicons name="information-circle" size={20} color={theme.colors.primary} />
          <Text style={styles.durationInfoText}>
            {t('appointment_duration.help')}
          </Text>
        </View>
      </View>
    </View>
  );

  const renderStep3 = () => (
    <View>
      <View style={styles.imageContainer}>
        <Text style={styles.inputLabel}>{t('auth.profile_image')}</Text>
        <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
          {image ? (
            <Image source={{ uri: image }} style={styles.selectedImage} />
          ) : (
            <View style={styles.imagePlaceholder}>
              <Ionicons name="camera" size={40} color={theme.colors.textSecondary} />
              <Text style={styles.imagePlaceholderText}>{t('auth.select_image')}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.summaryContainer}>
        <Text style={styles.summaryTitle}>{t('auth.registration_summary')}</Text>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>{t('auth.name')}:</Text>
          <Text style={styles.summaryValue}>{form.name}</Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>{t('auth.email')}:</Text>
          <Text style={styles.summaryValue}>{form.email}</Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>{t('auth.specialty')}:</Text>
          <Text style={styles.summaryValue}>{form.specialty}</Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>{t('auth.location')}:</Text>
          <Text style={styles.summaryValue}>{form.province}, {form.area}</Text>
        </View>
      </View>
    </View>
  );

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
        <Text style={styles.headerTitle}>{t('auth.doctor_signup')}</Text>
        <View style={styles.stepIndicator}>
          <View style={[styles.step, step >= 1 && styles.stepActive]} />
          <View style={[styles.step, step >= 2 && styles.stepActive]} />
          <View style={[styles.step, step >= 3 && styles.stepActive]} />
        </View>
      </LinearGradient>

      <CSSScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="always"
        keyboardDismissMode="none"
        nestedScrollEnabled={true}
        removeClippedSubviews={false}
      >
        <View style={styles.formContainer}>
          <View style={styles.logoContainer}>
            <Image 
              source={require('../../assets/icon.png')} 
              style={styles.logoImage}
              resizeMode="contain"
            />
            <Text style={styles.logoTitle}>{t('auth.doctor_registration')}</Text>
            <Text style={styles.logoSubtitle}>{t('auth.step')} {step}/3</Text>
          </View>

          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}

          <View style={styles.buttonContainer}>
            {step > 1 && (
              <TouchableOpacity style={styles.backButtonStyle} onPress={handleBack}>
                <Text style={styles.backButtonText}>{t('common.back')}</Text>
              </TouchableOpacity>
            )}
            
            {step < 3 ? (
              <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
                <Text style={styles.nextButtonText}>{t('common.next')}</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[styles.signUpButton, loading && styles.signUpButtonDisabled]}
                onPress={handleSignUp}
                disabled={loading}
              >
                <Text style={styles.signUpButtonText}>
                  {loading ? t('auth.creating_account') : t('auth.complete_registration')}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </CSSScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  headerGradient: {
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    zIndex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#009688',
    textAlign: 'center',
    marginBottom: 10,
  },
  stepIndicator: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  step: {
    width: 30,
    height: 4,
    backgroundColor: theme.colors.white + '40',
    marginHorizontal: 5,
    borderRadius: 2,
  },
  stepActive: {
    backgroundColor: theme.colors.white,
  },
  content: {
    flex: 1,
    paddingBottom: 100, // إضافة مساحة في الأسفل للتمرير
  },
  formContainer: {
    padding: 20,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 16,
  },
  logoTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
    marginBottom: 8,
  },
  logoSubtitle: {
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
    marginBottom: 8,
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
  },
  inputError: {
    borderColor: '#ff6b6b', // لون أحمر بدلاً من الأصفر
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
  multilineInput: {
    textAlignVertical: 'top',
    minHeight: 80,
  },
  errorText: {
    color: theme.colors.error,
    fontSize: 14,
    marginTop: 4,
  },
  imageContainer: {
    marginBottom: 20,
  },
  imagePicker: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: theme.colors.border,
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 20,
  },
  selectedImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  imagePlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  imagePlaceholderText: {
    marginTop: 10,
    fontSize: 16,
    color: theme.colors.textSecondary,
  },
  summaryContainer: {
    backgroundColor: theme.colors.white,
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
    marginBottom: 16,
  },
  summaryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 16,
    color: theme.colors.textSecondary,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.textPrimary,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  backButtonStyle: {
    backgroundColor: theme.colors.textSecondary,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 30,
    alignItems: 'center',
  },
  backButtonText: {
    color: theme.colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  nextButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 30,
    alignItems: 'center',
  },
  nextButtonText: {
    color: theme.colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  signUpButton: {
    backgroundColor: '#009688',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: '#009688',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  signUpButtonDisabled: {
    opacity: 0.6,
  },
  signUpButtonText: {
    color: theme.colors.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
  specialtyScrollView: {
    flexGrow: 0,
    paddingVertical: 8,
  },
  specialtyChip: {
    backgroundColor: theme.colors.background,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  specialtyChipActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  specialtyChipText: {
    fontSize: 14,
    color: theme.colors.textPrimary,
  },
  specialtyChipTextActive: {
    color: theme.colors.white,
    fontWeight: '600',
  },
  workTimesContainer: {
    marginTop: 20,
    padding: 15,
    backgroundColor: theme.colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginBottom: 15,
  },
  workTimeItem: {
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    paddingBottom: 10,
    marginBottom: 10,
  },
  workTimeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  workTimeDay: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.textPrimary,
  },
  removeWorkTimeButton: {
    padding: 5,
  },
  workTimeTimes: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  workTimeText: {
    fontSize: 16,
    color: theme.colors.textPrimary,
  },
  addWorkTimeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 15,
    paddingVertical: 10,
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
  emptyWorkTimes: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  emptyWorkTimesText: {
    marginTop: 10,
    fontSize: 16,
    color: theme.colors.textSecondary,
  },
  appointmentDurationContainer: {
    marginTop: 20,
    padding: 15,
    backgroundColor: theme.colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  durationOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    marginBottom: 15,
  },
  durationOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginVertical: 5,
    marginHorizontal: 8,
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
    marginRight: 8,
  },
  durationOptionTextActive: {
    color: theme.colors.white,
    fontWeight: '600',
  },
  durationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
    borderRadius: 12,
    padding: 15,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  durationInfoText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginLeft: 10,
  },
});

export default DoctorSignUpScreen; 