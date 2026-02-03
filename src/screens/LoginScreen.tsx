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
  I18nManager,
  Linking,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
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
import { isValidEmail, isValidPhone, normalizePhone } from '../utils/helpers';
import { API_CONFIG } from '../config/api';
import { theme } from '../utils/theme';
import PrivacyPolicyButton from '../components/PrivacyPolicyButton';
import TermsOfServiceButton from '../components/TermsOfServiceButton';
import { changeLanguage } from '../locales';

const { width } = Dimensions.get('window');

const AnimatedMedicalIcon = ({
  iconName,
  iconSize,
  style,
  rotation,
  scale,
}: any) => {
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

  const iconRotations = Array.from({ length: 3 }, () => useSharedValue(0));
  const iconScales = Array.from({ length: 3 }, () => useSharedValue(0));

  useEffect(() => {
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

  const checkUserExists = async (input: string) => {
    try {
      const trimmedInput = input.trim();
      const isEmail = isValidEmail(trimmedInput);
      const isPhone = isValidPhone(trimmedInput);
      
      if (!isEmail && !isPhone) return { exists: false };
      
      const queryParam = isEmail ? `email=${encodeURIComponent(trimmedInput)}` : `phone=${encodeURIComponent(trimmedInput)}`;
      const checkUrl = `${API_CONFIG.BASE_URL}/api/check-user-exists?${queryParam}`;
      
      const response = await fetch(checkUrl, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      if (response.ok) {
        return await response.json();
      }
      return { exists: false };
    } catch (error) {
      return { exists: false };
    }
  };

  const handleContinue = async () => {
    if (!emailOrPhone.trim()) {
      Alert.alert(t('common.error'), t('auth.enter_email_or_phone'));
      return;
    }

    if (!isValidEmail(emailOrPhone) && !isValidPhone(emailOrPhone)) {
      Alert.alert(t('common.error'), t('validation.email_invalid'));
      return;
    }

    setCheckingUser(true);

    try {
      const trimmedInput = emailOrPhone.trim();
      const checkResult = await checkUserExists(trimmedInput);
      
      if (checkResult.exists) {
        setUserType(checkResult.userType || 'user');
        setShowPasswordField(true);
      } else {
        Alert.alert(
          t('auth.account_not_found'),
          t('auth.account_not_found_message'),
          [
            { text: t('common.cancel'), style: 'cancel' },
            {
              text: t('auth.create_user_account'),
              onPress: () => {
                setShowPasswordField(false);
                setPassword('');
                navigation.navigate('UserSignUp' as never);
              },
            },
            {
              text: t('auth.create_doctor_account'),
              onPress: () => {
                setShowPasswordField(false);
                setPassword('');
                // التعديل هنا: التوجه لشاشة الـ WebView الداخلية
                navigation.navigate('WebViewScreen' as never);
              },
            },
          ]
        );
      }
    } catch (error) {
      Alert.alert(t('common.error'), t('common.error'));
    } finally {
      setCheckingUser(false);
    }
  };

  const handleLogin = async () => {
    if (!password.trim()) {
      Alert.alert(t('common.error'), t('auth.enter_password'));
      return;
    }

    setLoading(true);

    try {
      const loginType = userType || 'user';
      
      const result = await signIn(emailOrPhone.trim(), password, loginType);
      
      if (result.error) {
        Alert.alert(t('common.error'), t('auth.login_error_message') || 'كلمة المرور غير صحيحة');
      } else {
        await markAppAsLaunched();
      }
    } catch (error) {
      Alert.alert(t('common.error'), 'حدث خطأ غير متوقع');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.mainContainer}>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.primary} />

      <View style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.navigate('Welcome' as never)}>
            <Ionicons name={I18nManager.isRTL ? "arrow-forward" : "arrow-back"} size={24} color={theme.colors.white} />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>{t('auth.login_title')}</Text>

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

      <KeyboardAvoidingView
        style={styles.content}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.medicalIconsContainer}>
            <View style={styles.iconsGrid}>
              <AnimatedMedicalIcon iconName="heart" iconSize={40} style={styles.gridIcon} rotation={iconRotations[0]} scale={iconScales[0]} />
              <AnimatedMedicalIcon iconName="medkit" iconSize={45} style={styles.gridIcon} rotation={iconRotations[1]} scale={iconScales[1]} />
              <AnimatedMedicalIcon iconName="pulse" iconSize={40} style={styles.gridIcon} rotation={iconRotations[2]} scale={iconScales[2]} />
            </View>
            <Text style={styles.welcomeText}>{t('auth.welcome_back')}</Text>
            <Text style={styles.subWelcomeText}>{t('auth.login_subtitle')}</Text>
          </View>

          <View style={styles.formContainer}>
            <View style={styles.form}>
              <View style={styles.inputContainer}>
                <View style={styles.inputWrapper}>
                  <Ionicons name="mail-outline" size={22} color={theme.colors.primary} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder={t('auth.enter_email_or_phone')}
                    placeholderTextColor={theme.colors.textSecondary}
                    value={emailOrPhone}
                    onChangeText={setEmailOrPhone}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    textAlign={I18nManager.isRTL ? "right" : "left"}
                    returnKeyType="next"
                    editable={!checkingUser && !loading}
                    onSubmitEditing={handleContinue}
                  />
                </View>
              </View>

              {showPasswordField && (
                <View style={styles.inputContainer}>
                  <View style={styles.inputWrapper}>
                    <Ionicons name="lock-closed-outline" size={22} color={theme.colors.primary} style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder={t('auth.enter_password')}
                      placeholderTextColor={theme.colors.textSecondary}
                      value={password}
                      onChangeText={setPassword}
                      secureTextEntry={!showPassword}
                      textAlign={I18nManager.isRTL ? "right" : "left"}
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
                    {showPasswordField ? t('auth.login') : t('common.next')}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.privacySection}>
            <TouchableOpacity
              style={styles.doctorSignupButton}
              onPress={() => {
                // التعديل هنا: التوجه لشاشة الـ WebView الداخلية
                navigation.navigate('WebViewScreen' as never);
              }}
            >
              <Ionicons name="medical-outline" size={20} color={theme.colors.white} />
              <Text style={styles.doctorSignupButtonText}>
                {t('auth.create_doctor_account')}
              </Text>
            </TouchableOpacity>
            
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
              {t('common.medical_disclaimer')}
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
    paddingTop: Platform.OS === 'ios' ? 50 : 40,
    paddingBottom: 20,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.2)',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
    fontSize: 20,
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
    fontWeight: '600',
  },
  content: {
    flex: 1,
    backgroundColor: theme.colors.primary,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },
  medicalIconsContainer: {
    marginBottom: 30,
    alignItems: 'center',
    width: '100%',
  },
  iconsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 25,
    marginBottom: 20,
  },
  medicalIcon: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 20,
    padding: 12,
  },
  gridIcon: {
    width: 70,
    height: 70,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.white,
    marginTop: 10,
    textAlign: 'center',
  },
  subWelcomeText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 5,
    textAlign: 'center',
  },
  formContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 24,
    padding: 24,
    width: '100%',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
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
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 56,
  },
  inputIcon: {
    marginRight: 12,
    color: theme.colors.primary,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: theme.colors.textPrimary,
    textAlign: I18nManager.isRTL ? "right" : "left",
    height: '100%',
  },
  passwordToggle: {
    padding: 8,
  },
  continueButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderRadius: 25,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    marginTop: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  continueButtonDisabled: {
    opacity: 0.6,
  },
  continueButtonText: {
    color: theme.colors.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
  privacySection: {
    alignItems: 'center',
    marginTop: 'auto',
    paddingHorizontal: 20,
  },
  doctorSignupButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 25,
    paddingVertical: 12,
    paddingHorizontal: 24,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  doctorSignupButtonText: {
    color: theme.colors.white,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  privacyLinks: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  privacyButton: {
    marginBottom: 0,
  },
  termsButton: {
    marginBottom: 0,
  },
  privacyLinkText: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 13,
    textDecorationLine: 'underline',
  },
  privacySeparator: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 12,
    marginHorizontal: 5,
  },
  disclaimerText: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    lineHeight: 16,
  },
});

export default LoginScreen;