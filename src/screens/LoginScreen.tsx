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
  Image,
  ImageBackground,
  ScrollView,
  Linking,
} from 'react-native';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { useApp } from '../contexts/AppContext';
import { isValidEmail, isValidPhone } from '../utils/helpers';
import { getCurrentServerInfo } from '../config/api';
import { theme } from '../utils/theme';
import PrivacyPolicyButton from '../components/PrivacyPolicyButton';
import TermsOfServiceButton from '../components/TermsOfServiceButton';

const LoginScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { t } = useTranslation();
  const { signIn } = useAuth();
  const { markAppAsLaunched } = useApp();

  // الحصول على البيانات المحفوظة من التسجيل
  const prefilledData = route.params as {
    prefilledEmail?: string;
    prefilledPassword?: string;
    prefilledLoginType?: 'user' | 'doctor';
  } | undefined;

  const [email, setEmail] = useState(prefilledData?.prefilledEmail || '');
  const [password, setPassword] = useState(prefilledData?.prefilledPassword || '');
  const [loginType, setLoginType] = useState<'user' | 'doctor'>(prefilledData?.prefilledLoginType || 'user');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // الحصول على معلومات الخادم الحالي
  const serverInfo = getCurrentServerInfo();

  // تحديث البيانات عند تغيير المعاملات
  useEffect(() => {
    if (prefilledData) {
      
      if (prefilledData.prefilledEmail) {
        setEmail(prefilledData.prefilledEmail);
      }
      if (prefilledData.prefilledPassword) {
        setPassword(prefilledData.prefilledPassword);
      }
      if (prefilledData.prefilledLoginType) {
        setLoginType(prefilledData.prefilledLoginType);
      }
    }
  }, [prefilledData]);

  // تحديث البيانات عند التركيز على الشاشة
  useFocusEffect(
    React.useCallback(() => {
      const params = route.params as any;
      if (params?.prefilledEmail) {
        setEmail(params.prefilledEmail);
        setPassword(params.prefilledPassword || '');
        setLoginType(params.prefilledLoginType || 'user');
      }
    }, [route.params])
  );

  const handleLogin = async () => {
    // التحقق من صحة البيانات
    if (!email.trim() || !password.trim()) {
      Alert.alert('خطأ', 'يرجى إدخال جميع البيانات المطلوبة');
      return;
    }

    // إذا كانت البيانات محفوظة من التسجيل، عرض رسالة ترحيبية

    // التحقق من صحة البريد الإلكتروني أو رقم الهاتف
    if (!isValidEmail(email) && !isValidPhone(email)) {
      Alert.alert('خطأ', 'يرجى إدخال بريد إلكتروني أو رقم هاتف صحيح');
      return;
    }

    setLoading(true);

    try {
      const result = await signIn(email.trim(), password, loginType);

      if (result.error) {
        Alert.alert('خطأ في تسجيل الدخول', result.error);
      } else {
        // سيتم التنقل تلقائياً من خلال AuthContext
        await markAppAsLaunched();
      }
    } catch (error) {
      Alert.alert('خطأ', 'حدث خطأ أثناء تسجيل الدخول');
    } finally {
      setLoading(false);
    }
  };

  const navigateToSignUp = () => {
    navigation.navigate('UserSignUp' as never);
  };

  const navigateToDoctorSignUp = () => {
    Linking.openURL('https://www.tabib-iq.com/signup-doctor');
  };


  const navigateToWelcome = () => {
    navigation.navigate('Welcome' as never);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 100}
      enabled={true}
    >
      <StatusBar
        barStyle="light-content"
        backgroundColor={theme.colors.primary}
      />

      {/* Header - الهيدر الثابت */}
      <LinearGradient
        colors={['rgba(0, 150, 136, 0.1)', 'rgba(0, 150, 136, 0.9)']}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          {/* Back Button - زر الرجوع */}
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={navigateToWelcome}
          >
            <Ionicons name="arrow-back" size={24} color={theme.colors.white} />
          </TouchableOpacity>

          {/* Logo Container - حاوية اللوجو */}
          <View style={styles.logoContainer}>
            <Image 
              source={require('../../assets/icon.png')} 
              style={styles.logoImage}
              resizeMode="contain"
            />
            <View style={styles.logoText}>
              <Text style={styles.logoTitle}>{t('auth.platform_title')}</Text>
              <Text style={styles.logoSubtitle}>{t('auth.platform_subtitle')}</Text>
            </View>
          </View>

          {/* Empty View for balance */}
          <View style={styles.headerSpacer} />
        </View>
      </LinearGradient>

      {/* Content - مطابق لصفحة إنشاء الحساب */}
      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="always"
        keyboardDismissMode="none"
        contentContainerStyle={styles.scrollContent}
        nestedScrollEnabled={true}
        removeClippedSubviews={false}
      >
        <View style={styles.formContainer}>
          {/* Logo Section - قسم اللوجو */}
          <View style={styles.logoSection}>
            <Image 
              source={require('../../assets/icon.png')} 
              style={styles.formLogoImage}
              resizeMode="contain"
            />
            <Text style={styles.formLogoTitle}>{t('auth.platform_title')}</Text>
            <Text style={styles.formLogoSubtitle}>{t('auth.platform_subtitle')}</Text>
          </View>

          {/* Login Title - عنوان تسجيل الدخول */}
          <Text style={styles.loginTitle}>{t('auth.login_title')}</Text>

          {/* Login Type Selector */}
          <View style={styles.typeSelector}>
            <TouchableOpacity
              style={[
                styles.typeButton,
                loginType === 'user' && styles.typeButtonActive,
              ]}
              onPress={() => setLoginType('user')}
            >
              <Ionicons
                name="person"
                size={22}
                color={
                  loginType === 'user'
                    ? theme.colors.white
                    : theme.colors.textSecondary
                }
              />
              <Text
                style={[
                  styles.typeButtonText,
                  loginType === 'user' && styles.typeButtonTextActive,
                ]}
              >
                {t('auth.patient')}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.typeButton,
                loginType === 'doctor' && styles.typeButtonActive,
              ]}
              onPress={() => setLoginType('doctor')}
            >
              <Ionicons
                name="medical"
                size={22}
                color={
                  loginType === 'doctor'
                    ? theme.colors.white
                    : theme.colors.textSecondary
                }
              />
              <Text
                style={[
                  styles.typeButtonText,
                  loginType === 'doctor' && styles.typeButtonTextActive,
                ]}
              >
                {t('auth.doctor')}
              </Text>
            </TouchableOpacity>
          </View>

          {/* رسالة ترحيبية للمستخدمين الجدد */}
          {prefilledData?.prefilledEmail && prefilledData?.prefilledPassword && (
            <View style={styles.welcomeMessage}>
              <Ionicons name="checkmark-circle" size={24} color={theme.colors.success} />
              <Text style={styles.welcomeText}>
{t('auth.welcome_saved_data')}
              </Text>
            </View>
          )}

          {/* Form */}
          <View style={styles.form}>
            {/* Email/Phone Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>
                {t('auth.email_or_phone')}
              </Text>
              <View style={styles.inputWrapper}>
                <Ionicons
                  name="mail"
                  size={20}
                  color={theme.colors.textSecondary}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder={t('auth.enter_email_or_phone')}
                  placeholderTextColor={theme.colors.textSecondary}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  textAlign="right"
                  autoCorrect={false}
                  returnKeyType="next"
                  blurOnSubmit={false}
                  editable={!loading}
                />
              </View>
            </View>

            {/* Password Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>{t('auth.password')}</Text>
              <View style={styles.inputWrapper}>
                <Ionicons
                  name="lock-closed"
                  size={20}
                  color={theme.colors.textSecondary}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder={t('auth.enter_password')}
                  placeholderTextColor={theme.colors.textSecondary}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  textAlign="right"
                  returnKeyType="done"
                  blurOnSubmit={false}
                  onSubmitEditing={handleLogin}
                  editable={!loading}
                />
                <TouchableOpacity
                  style={styles.passwordToggle}
                  onPress={() => setShowPassword(!showPassword)}
                >
                  <Ionicons
                    name={showPassword ? 'eye-off' : 'eye'}
                    size={22}
                    color={theme.colors.textSecondary}
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Login Button */}
            <TouchableOpacity
              style={[
                styles.loginButton,
                loading && styles.loginButtonDisabled,
              ]}
              onPress={handleLogin}
              disabled={loading}
            >
              <Text style={styles.loginButtonText}>
                {loading ? t('auth.logging_in') : t('auth.login')}
              </Text>
            </TouchableOpacity>

            {/* Forgot Password */}
            <TouchableOpacity style={styles.forgotPassword}>
              <Text style={styles.forgotPasswordText}>{t('auth.forgot_password')}</Text>
            </TouchableOpacity>
          </View>

          {/* Divider */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>{t('auth.or')}</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Sign Up Options */}
          <View style={styles.signUpSection}>
            <Text style={styles.signUpTitle}>{t('auth.no_account')}</Text>

            <TouchableOpacity
              style={styles.signUpButton}
              onPress={navigateToSignUp}
            >
              <Ionicons
                name="person-add"
                size={22}
                color={theme.colors.white}
              />
              <Text style={styles.signUpButtonText}>{t('auth.create_patient_account')}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.signUpButton}
              onPress={navigateToDoctorSignUp}
            >
              <Ionicons name="open-outline" size={22} color={theme.colors.white} />
              <Text style={styles.signUpButtonText}>{t('auth.create_doctor_account')} ({t('common.website')})</Text>
            </TouchableOpacity>

          </View>

          {/* سياسة الخصوصية وشروط الاستخدام */}
          <View style={styles.privacySection}>
            <PrivacyPolicyButton 
              variant="text" 
              size="small"
              showIcon={false}
              style={styles.privacyButton}
            />
            <TermsOfServiceButton 
              variant="text" 
              size="small"
              showIcon={false}
              style={styles.termsButton}
            />
            <Text style={styles.privacyText}>
              {t('auth.privacy_notice') || 'باستخدام التطبيق، فإنك توافق على سياسة الخصوصية وشروط الاستخدام الخاصة بنا'}
            </Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    paddingTop: 50,
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
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
    padding: 8,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.6)',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: theme.colors.white,
    textAlign: 'center',
    marginTop: 10,
    textShadowColor: 'rgba(0, 0, 0, 0.6)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
    letterSpacing: 1,
  },
  headerSpacer: {
    width: 60, // Same width as back button for balance
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 12,
  },
  logoText: {
    flexDirection: 'column',
  },
  logoTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  logoSubtitle: {
    fontSize: 16,
    color: 'rgba(0, 150, 136, 0.8)',
    textAlign: 'center',
    marginTop: 8,
  },
  content: {
    flex: 1,
    backgroundColor: theme.colors.background,
    paddingBottom: 150, // إضافة مساحة في الأسفل للتمرير
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  formContainer: {
    backgroundColor: theme.colors.white,
    borderRadius: 20,
    padding: 25,
    shadowColor: 'rgba(0, 0, 0, 0.1)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 10,
    width: '100%',
    alignItems: 'center',
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  formLogoImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 4,
    borderColor: theme.colors.primaryLight,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  formLogoTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
    marginTop: 15,
    textAlign: 'center',
  },
  formLogoSubtitle: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    marginTop: 5,
    textAlign: 'center',
  },
  loginTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
    marginBottom: 20,
    textAlign: 'center',
  },
  typeSelector: {
    flexDirection: 'row',
    backgroundColor: theme.colors.white,
    borderRadius: 16,
    padding: 6,
    marginBottom: 25,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  typeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    marginHorizontal: 2,
  },
  typeButtonActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.white,
    borderWidth: 2,
    shadowColor: theme.colors.shadow,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  typeButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.textSecondary,
    marginLeft: 10,
  },
  typeButtonTextActive: {
    color: theme.colors.white,
    fontWeight: 'bold',
  },
  welcomeMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.success + '20',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: theme.colors.success + '40',
  },
  welcomeText: {
    color: theme.colors.success,
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
    flex: 1,
    textAlign: 'right',
  },
  form: {
    marginBottom: 20,
    width: '100%',
  },
  inputContainer: {
    marginBottom: 20,
    width: '100%',
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    marginBottom: 8,
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
  passwordToggle: {
    marginLeft: 12,
    padding: 4,
  },
  loginButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
    width: '100%',
  },
  loginButtonDisabled: {
    opacity: 0.6,
  },
  loginButtonText: {
    color: theme.colors.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
  forgotPassword: {
    alignItems: 'center',
    marginTop: 16,
  },
  forgotPasswordText: {
    color: theme.colors.primary,
    fontSize: 14,
    textAlign: 'center',
    fontWeight: '600',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
    width: '100%',
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: theme.colors.border,
  },
  dividerText: {
    color: theme.colors.textSecondary,
    fontSize: 16,
    marginHorizontal: 16,
  },
  signUpSection: {
    alignItems: 'center',
    width: '100%',
  },
  signUpTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    marginBottom: 12,
  },
  signUpButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 18,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: theme.colors.primary,
    width: '100%',
    justifyContent: 'center',
    shadowColor: theme.colors.shadow,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 3,
  },
  signUpButtonText: {
    color: theme.colors.white,
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  privacySection: {
    alignItems: 'center',
    marginTop: 20,
    paddingHorizontal: 20,
  },
  privacyButton: {
    marginBottom: 8,
  },
  termsButton: {
    marginBottom: 8,
  },
  privacyText: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 16,
  },
});

export default LoginScreen;
