import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  ScrollView,
  Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import { useAuth } from '../contexts/AuthContext';
import { useApp } from '../contexts/AppContext';
import { isValidEmail, isValidPhone, formatPhone } from '../utils/helpers';
import { API_CONFIG } from '../config/api';
import { theme } from '../utils/theme';
import PrivacyPolicyButton from '../components/PrivacyPolicyButton';
import TermsOfServiceButton from '../components/TermsOfServiceButton';
import { isRTL, changeLanguage } from '../locales';

const { width, height } = Dimensions.get('window');

// Animated Icon Component
const AnimatedMedicalIcon = ({
  iconName,
  iconSize,
  style,
  rotation,
  scale,
}: {
  iconName: any;
  iconSize: number;
  style: any;
  rotation: Animated.SharedValue<number>;
  scale: Animated.SharedValue<number>;
}) => {
  const rotationStyle = useAnimatedStyle(() => ({
    transform: [
      { rotate: `${rotation.value}deg` },
      { scale: scale.value },
    ],
  }));

  return (
    <Animated.View style={[styles.medicalIcon, style, rotationStyle]}>
      <Ionicons name={iconName} size={iconSize} color={theme.colors.white} />
    </Animated.View>
  );
};

const LoginScreen = () => {
  const navigation = useNavigation();
  const { t, i18n } = useTranslation();
  const { signIn } = useAuth();
  const { markAppAsLaunched } = useApp();

  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checkingUser, setCheckingUser] = useState(false);
  const [showPasswordField, setShowPasswordField] = useState(false);
  const [userType, setUserType] = useState<'user' | 'doctor' | null>(null);

  // Animation values - 3 icons only
  const iconRotations = Array.from({ length: 3 }, () => useSharedValue(0));
  const iconScales = Array.from({ length: 3 }, () => useSharedValue(0));

  useEffect(() => {
    // Medical icons animations - 3 icons only
    iconRotations.forEach((rotation, index) => {
      setTimeout(() => {
        rotation.value = withSequence(
          withTiming(360, { duration: 1500 + index * 150, easing: Easing.out(Easing.quad) }),
          withTiming(0, { duration: 0 })
        );
        iconScales[index].value = withSpring(1, { damping: 8, stiffness: 50 });
      }, 400 + index * 100);
    });
  }, []);

  // دالة لتطبيع رقم الهاتف للمقارنة
  const normalizePhone = (phone: string): string => {
    if (!phone) return '';
    // إزالة المسافات والرموز
    let cleaned = phone.replace(/[\s\-\(\)]/g, '');
    // تنسيق الرقم
    cleaned = formatPhone(cleaned);
    // إزالة + إذا كان موجوداً للمقارنة
    return cleaned.replace(/^\+/, '');
  };

  // دالة للتحقق من وجود المستخدم ونوعه
  const checkUserExists = async (emailOrPhone: string): Promise<{ exists: boolean; userType?: 'user' | 'doctor' }> => {
    try {
      const trimmedInput = emailOrPhone.trim();
      const isEmail = isValidEmail(trimmedInput);
      const searchValue = isEmail ? trimmedInput.toLowerCase() : trimmedInput;
      
      // محاولة البحث في الأطباء أولاً (لأنهم أقل عدداً)
      try {
        const doctorsResponse = await fetch(`${API_CONFIG.DOCTORS}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (doctorsResponse.ok) {
          const doctorsData = await doctorsResponse.json();
          if (Array.isArray(doctorsData)) {
            const foundDoctor = doctorsData.find(
              (doctor: any) => {
                if (isEmail) {
                  const doctorEmail = doctor.email ? doctor.email.toLowerCase().trim() : '';
                  return doctorEmail === searchValue;
                } else {
                  // رقم هاتف - تطبيع ومقارنة
                  const doctorPhone = doctor.phone ? doctor.phone.trim() : '';
                  return normalizePhone(doctorPhone) === normalizePhone(trimmedInput);
                }
              }
            );
            if (foundDoctor) {
              return { exists: true, userType: 'doctor' };
            }
          }
        }
      } catch (e) {
        console.log('Error checking doctors:', e);
      }

      // محاولة البحث في المستخدمين
      try {
        const usersResponse = await fetch(`${API_CONFIG.USERS_PROFILE}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (usersResponse.ok) {
          const usersData = await usersResponse.json();
          if (Array.isArray(usersData)) {
            const foundUser = usersData.find(
              (user: any) => {
                if (isEmail) {
                  const userEmail = user.email ? user.email.toLowerCase().trim() : '';
                  return userEmail === searchValue;
                } else {
                  // رقم هاتف - تطبيع ومقارنة
                  const userPhone = user.phone ? user.phone.trim() : '';
                  return normalizePhone(userPhone) === normalizePhone(trimmedInput);
                }
              }
            );
            if (foundUser) {
              return { exists: true, userType: 'user' };
            }
          }
        }
      } catch (e) {
        console.log('Error checking users:', e);
      }

      // إذا لم نجد المستخدم
      return { exists: false };
    } catch (error) {
      console.error('Error checking user:', error);
      return { exists: false };
    }
  };

  const handleContinue = async () => {
    // التحقق من صحة المدخل
    if (!emailOrPhone.trim()) {
      Alert.alert('خطأ', 'يرجى إدخال البريد الإلكتروني أو رقم الهاتف');
      return;
    }

    if (!isValidEmail(emailOrPhone) && !isValidPhone(emailOrPhone)) {
      Alert.alert('خطأ', 'يرجى إدخال بريد إلكتروني أو رقم هاتف صحيح');
      return;
    }

    setCheckingUser(true);

    try {
      console.log('Checking user exists for:', emailOrPhone.trim());
      
      // فحص وجود المستخدم ونوعه
      const checkResult = await checkUserExists(emailOrPhone.trim());
      
      console.log('Check result:', checkResult);

      if (checkResult.exists) {
        // المستخدم موجود - عرض حقل كلمة المرور مع تحديد نوع المستخدم
        setUserType(checkResult.userType || 'user');
        setShowPasswordField(true);
        console.log('User exists, type:', checkResult.userType);
      } else {
        // المستخدم غير موجود - توجيه لإنشاء حساب
        console.log('User not found, showing signup option');
        Alert.alert(
          'حساب غير موجود',
          'لم يتم العثور على حساب بهذا البريد الإلكتروني أو رقم الهاتف. هل تريد إنشاء حساب جديد؟',
          [
            {
              text: 'إلغاء',
              style: 'cancel',
            },
            {
              text: 'إنشاء حساب',
              onPress: () => navigation.navigate('UserSignUp' as never),
            },
          ]
        );
      }
    } catch (error) {
      console.error('Error in handleContinue:', error);
      // في حالة الخطأ، نفترض أن المستخدم موجود ونطلب كلمة المرور
      setUserType('user');
      setShowPasswordField(true);
    } finally {
      setCheckingUser(false);
    }
  };

  const handleLogin = async () => {
    if (!password.trim()) {
      Alert.alert('خطأ', 'يرجى إدخال كلمة المرور');
      return;
    }

    setLoading(true);

    try {
      console.log('Attempting login with:', {
        emailOrPhone: emailOrPhone.trim(),
        userType: userType || 'user',
        isEmail: isValidEmail(emailOrPhone.trim()),
        isPhone: isValidPhone(emailOrPhone.trim()),
      });

      // استخدام نوع المستخدم الذي تم تحديده من checkUserExists
      const loginType = userType || 'user';
      
      const result = await signIn(emailOrPhone.trim(), password, loginType);
      
      console.log('Login result:', result);
      
      if (result.error) {
        console.log('Login failed with type:', loginType, 'Error:', result.error);
        
        // إذا فشل مع النوع المحدد، جرب النوع الآخر
        const alternativeType = loginType === 'user' ? 'doctor' : 'user';
        console.log('Trying alternative type:', alternativeType);
        
        const alternativeResult = await signIn(emailOrPhone.trim(), password, alternativeType);
        
        console.log('Alternative login result:', alternativeResult);
        
        if (alternativeResult.error) {
          // إذا فشل كلا النوعين، عرض خيار إنشاء حساب
          Alert.alert(
            'فشل تسجيل الدخول',
            result.error || 'البريد الإلكتروني أو كلمة المرور غير صحيحة. هل تريد إنشاء حساب جديد؟',
            [
              {
                text: 'إلغاء',
                style: 'cancel',
                onPress: () => {
                  setShowPasswordField(false);
                  setPassword('');
                  setUserType(null);
                },
              },
              {
                text: 'إنشاء حساب',
                onPress: () => {
                  setShowPasswordField(false);
                  setPassword('');
                  setUserType(null);
                  navigation.navigate('UserSignUp' as never);
                },
              },
            ]
          );
        } else {
          // نجح مع النوع البديل
          setUserType(alternativeType);
          await markAppAsLaunched();
        }
      } else {
        // نجح مع النوع المحدد
        console.log('Login successful with type:', loginType);
        await markAppAsLaunched();
      }
    } catch (error) {
      console.error('Login error:', error);
      Alert.alert('خطأ', `حدث خطأ أثناء تسجيل الدخول: ${error instanceof Error ? error.message : 'خطأ غير معروف'}`);
    } finally {
      setLoading(false);
    }
  };

  const navigateToSignUp = () => {
    navigation.navigate('UserSignUp' as never);
  };

  const navigateToWelcome = () => {
    navigation.navigate('Welcome' as never);
  };

  return (
    <View style={styles.mainContainer}>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.primary} />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity style={styles.backButton} onPress={navigateToWelcome}>
            <Ionicons name="arrow-back" size={24} color={theme.colors.white} />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>{t('auth.login') || 'تسجيل الدخول'}</Text>

          <TouchableOpacity
            style={styles.languageButton}
            onPress={() => {
              const next = i18n.language === 'ar' ? 'en' : i18n.language === 'en' ? 'ku' : 'ar';
              changeLanguage(next);
            }}
          >
            <Ionicons name="language" size={20} color="#FFFFFF" />
            <Text style={styles.languageText}>
              {i18n.language === 'ar' ? 'العربية' : i18n.language === 'en' ? 'English' : 'کوردی'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Content */}
      <KeyboardAvoidingView
        style={styles.content}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 100}
        enabled={true}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="always"
          contentContainerStyle={styles.scrollContent}
        >
        {/* Medical Icons Section - 3 icons only */}
        <View style={styles.medicalIconsContainer}>
          <View style={styles.iconsGrid}>
            <AnimatedMedicalIcon
              iconName="heart"
              iconSize={40}
              style={styles.gridIcon}
              rotation={iconRotations[0]}
              scale={iconScales[0]}
            />
            <AnimatedMedicalIcon
              iconName="medical"
              iconSize={45}
              style={styles.gridIcon}
              rotation={iconRotations[1]}
              scale={iconScales[1]}
            />
            <AnimatedMedicalIcon
              iconName="pulse"
              iconSize={40}
              style={styles.gridIcon}
              rotation={iconRotations[2]}
              scale={iconScales[2]}
            />
          </View>
        </View>

        {/* Form Container */}
        <View style={styles.formContainer}>
          <View style={styles.form}>
            {/* Email/Phone Input */}
            <View style={styles.inputContainer}>
              <View style={styles.inputWrapper}>
                <Ionicons
                  name="mail-outline"
                  size={22}
                  color={theme.colors.primary}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder={t('auth.enter_email_or_phone') || 'أدخل البريد الإلكتروني أو رقم الهاتف'}
                  placeholderTextColor={theme.colors.textSecondary}
                  value={emailOrPhone}
                  onChangeText={setEmailOrPhone}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  textAlign="right"
                  autoCorrect={false}
                  returnKeyType="next"
                  editable={!checkingUser && !loading}
                  onSubmitEditing={handleContinue}
                />
              </View>
            </View>

            {/* Password Input - يظهر فقط بعد التحقق من وجود المستخدم */}
            {showPasswordField && (
              <View style={styles.inputContainer}>
                <View style={styles.inputWrapper}>
                  <Ionicons
                    name="lock-closed-outline"
                    size={22}
                    color={theme.colors.primary}
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder={t('auth.enter_password') || 'أدخل كلمة المرور'}
                    placeholderTextColor={theme.colors.textSecondary}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                    textAlign="right"
                    returnKeyType="done"
                    onSubmitEditing={handleLogin}
                    editable={!loading}
                  />
                  <TouchableOpacity
                    style={styles.passwordToggle}
                    onPress={() => setShowPassword(!showPassword)}
                  >
                    <Ionicons
                      name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                      size={22}
                      color={theme.colors.textSecondary}
                    />
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Continue/Login Button */}
            <TouchableOpacity
              style={[
                styles.continueButton,
                (checkingUser || loading) && styles.continueButtonDisabled,
              ]}
              onPress={showPasswordField ? handleLogin : handleContinue}
              disabled={checkingUser || loading}
            >
              {checkingUser || loading ? (
                <ActivityIndicator color={theme.colors.white} />
              ) : (
                <Text style={styles.continueButtonText}>
                  {showPasswordField ? (t('auth.login') || 'تسجيل الدخول') : (t('common.continue') || 'متابعة')}
                </Text>
              )}
            </TouchableOpacity>

          </View>
        </View>

        {/* سياسة الخصوصية وشروط الاستخدام */}
        <View style={styles.privacySection}>
          <View style={styles.privacyLinks}>
            <PrivacyPolicyButton
              variant="text"
              size="small"
              showIcon={false}
              style={styles.privacyButton}
              textStyle={styles.privacyLinkText}
            />
            <Text style={styles.privacySeparator}> • </Text>
            <TermsOfServiceButton
              variant="text"
              size="small"
              showIcon={false}
              style={styles.termsButton}
              textStyle={styles.privacyLinkText}
            />
          </View>
          <Text style={styles.disclaimerText}>
            {t('common.medical_disclaimer') || 'هذا التطبيق للأغراض الطبية العامة ولا يغني عن استشارة الطبيب'}
          </Text>
        </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: theme.colors.primary,
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
    paddingBottom: 20,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.2)',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: theme.colors.white,
    textAlign: 'center',
    flex: 1,
  },
  languageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  languageText: {
    color: '#FFFFFF',
    marginLeft: 4,
    fontSize: 14,
  },
  content: {
    flex: 1,
    backgroundColor: theme.colors.primary,
  },
  scrollContent: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 40,
  },
  medicalIconsContainer: {
    marginTop: 20,
    marginBottom: 30,
    alignItems: 'center',
    width: '100%',
  },
  iconsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 20,
    width: '100%',
  },
  medicalIcon: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    borderRadius: 20,
    padding: 12,
    borderWidth: 0,
    shadowColor: 'transparent',
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  gridIcon: {
    width: 70,
    height: 70,
  },
  formContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 24,
    padding: 20,
    width: '100%',
    marginBottom: 20,
    borderWidth: 0,
  },
  form: {
    width: '100%',
  },
  inputContainer: {
    marginBottom: 16,
    width: '100%',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 12,
    borderWidth: 0,
    paddingHorizontal: 16,
    paddingVertical: 0,
    minHeight: 48,
  },
  inputIcon: {
    marginRight: 12,
    color: theme.colors.primary,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: theme.colors.textPrimary,
    textAlign: 'right',
    paddingVertical: 12,
    paddingHorizontal: 0,
    margin: 0,
  },
  passwordToggle: {
    marginLeft: 12,
    padding: 4,
  },
  continueButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 25,
    paddingVertical: 16,
    paddingHorizontal: 40,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    minHeight: 52,
    marginTop: 8,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  continueButtonDisabled: {
    opacity: 0.6,
  },
  continueButtonText: {
    color: theme.colors.white,
    fontSize: 18,
    fontWeight: '600',
  },
  privacySection: {
    alignItems: 'center',
    marginTop: 20,
    paddingHorizontal: 20,
  },
  privacyLinks: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  privacyButton: {
    marginBottom: 0,
  },
  termsButton: {
    marginBottom: 0,
  },
  privacyLinkText: {
    color: 'rgba(255, 255, 255, 0.9)',
  },
  privacySeparator: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
  },
  disclaimerText: {
    marginTop: 8,
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    lineHeight: 16,
  },
});

export default LoginScreen;
