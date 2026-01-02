import React, { useState } from 'react';
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
  ScrollView,
  Linking,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { useApp } from '../contexts/AppContext';
import { isValidEmail, isValidPhone } from '../utils/helpers';
import { theme } from '../utils/theme';
import PrivacyPolicyButton from '../components/PrivacyPolicyButton';
import TermsOfServiceButton from '../components/TermsOfServiceButton';

const DoctorLoginScreen = () => {
  const navigation = useNavigation();
  const { t } = useTranslation();
  const { signIn } = useAuth();
  const { markAppAsLaunched } = useApp();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    // التحقق من صحة البيانات
    if (!email.trim() || !password.trim()) {
      Alert.alert('خطأ', 'يرجى إدخال جميع البيانات المطلوبة');
      return;
    }

    // التحقق من صحة البريد الإلكتروني أو رقم الهاتف
    if (!isValidEmail(email) && !isValidPhone(email)) {
      Alert.alert('خطأ', 'يرجى إدخال بريد إلكتروني أو رقم هاتف صحيح');
      return;
    }

    setLoading(true);

    try {
      const result = await signIn(email.trim(), password, 'doctor');

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

  const navigateToDoctorSignUp = () => {
    Linking.openURL('https://www.tabib-iq.com/signup-doctor');
  };

  const navigateToLogin = () => {
    navigation.navigate('Login' as never);
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

      {/* Header */}
      <LinearGradient
        colors={[theme.colors.primary, theme.colors.primary]}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={navigateToLogin}
          >
            <Ionicons name="arrow-back" size={24} color={theme.colors.white} />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>{t('auth.doctor_login') || 'تسجيل دخول الطبيب'}</Text>

          {/* Logo in corner */}
          <Image 
            source={require('../../assets/icon.png')} 
            style={styles.headerLogo}
            resizeMode="contain"
          />
        </View>
      </LinearGradient>

      {/* Content */}
      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="always"
        keyboardDismissMode="none"
        contentContainerStyle={styles.scrollContent}
        nestedScrollEnabled={true}
        removeClippedSubviews={false}
      >
        {/* Welcome Section - خارج المربع */}
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeSubtitle}>{t('auth.doctor_login_subtitle') || 'سجل دخولك للوصول إلى حسابك الطبي'}</Text>
        </View>

        {/* Form Container - حقول الإدخال فقط */}
        <View style={styles.formContainer}>
          {/* Form */}
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
              <View style={styles.inputWrapper}>
                <Ionicons
                  name="lock-closed-outline"
                  size={22}
                  color={theme.colors.primary}
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
                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={22}
                    color={theme.colors.textSecondary}
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Forgot Password */}
            <TouchableOpacity style={styles.forgotPassword}>
              <Text style={styles.forgotPasswordText}>{t('auth.forgot_password')}</Text>
            </TouchableOpacity>

            {/* Login Button */}
            <TouchableOpacity
              style={[
                styles.loginButton,
                loading && styles.loginButtonDisabled,
              ]}
              onPress={handleLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={theme.colors.white} />
              ) : (
                <Text style={styles.loginButtonText}>{t('auth.login')}</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Sign Up Options - بدون مربع */}
        <View style={styles.signUpSection}>
          <TouchableOpacity
            style={styles.signUpButton}
            onPress={navigateToDoctorSignUp}
          >
            <Ionicons
              name="person-add"
              size={22}
              color={theme.colors.white}
            />
            <Text style={styles.signUpButtonText}>{t('auth.create_doctor_account')}</Text>
          </TouchableOpacity>
        </View>

        {/* سياسة الخصوصية وشروط الاستخدام - مبسطة */}
        <View style={styles.privacySection}>
          <View style={styles.privacyLinks}>
            <PrivacyPolicyButton 
              variant="text" 
              size="small"
              showIcon={false}
              style={styles.privacyButton}
            />
            <Text style={styles.privacySeparator}> • </Text>
            <TermsOfServiceButton 
              variant="text" 
              size="small"
              showIcon={false}
              style={styles.termsButton}
            />
          </View>
          <Text style={styles.disclaimerText}>
            {t('common.medical_disclaimer')}
          </Text>
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
    paddingBottom: 16,
    paddingHorizontal: 16,
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
  },
  headerLogo: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  content: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
  },
  welcomeSection: {
    alignItems: 'center',
    marginBottom: 12,
    paddingTop: 0,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
    marginBottom: 6,
    textAlign: 'center',
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  formContainer: {
    backgroundColor: theme.colors.white,
    borderRadius: 24,
    padding: 20,
    shadowColor: 'rgba(0, 0, 0, 0.1)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    width: '100%',
    marginBottom: 12,
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
    backgroundColor: theme.colors.background,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    paddingHorizontal: 16,
    paddingVertical: 0,
    minHeight: 48,
  },
  inputIcon: {
    marginLeft: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: theme.colors.textPrimary,
    textAlign: 'right',
    paddingVertical: 14,
    paddingHorizontal: 0,
    margin: 0,
  },
  passwordToggle: {
    marginRight: 8,
    padding: 4,
  },
  forgotPassword: {
    alignItems: 'flex-end',
    marginBottom: 16,
    marginTop: 4,
  },
  forgotPasswordText: {
    color: theme.colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  loginButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 18,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
    width: '100%',
    minHeight: 52,
  },
  loginButtonDisabled: {
    opacity: 0.6,
  },
  loginButtonText: {
    color: theme.colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  signUpSection: {
    width: '100%',
    marginBottom: 8,
  },
  signUpButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 18,
    width: '100%',
    justifyContent: 'center',
    minHeight: 52,
    shadowColor: theme.colors.primary,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  signUpButtonText: {
    color: theme.colors.white,
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  privacySection: {
    alignItems: 'center',
    marginTop: 8,
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
  privacySeparator: {
    color: theme.colors.textSecondary,
    fontSize: 12,
  },
  disclaimerText: {
    marginTop: 8,
    fontSize: 12,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 16,
  },
});

export default DoctorLoginScreen;
