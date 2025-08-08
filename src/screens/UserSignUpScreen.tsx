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
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import CSSScrollView from '../components/web/CSSScrollView';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../utils/theme';
import { useAuth } from '../contexts/AuthContext';

const { width, height } = Dimensions.get('window');

interface FormData {
  name: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
}

interface FormErrors {
  [key: string]: string;
}

const UserSignUpScreen = () => {
  const navigation = useNavigation();
  const { t } = useTranslation();
  const { signUp } = useAuth();
  
  const [form, setForm] = useState<FormData>({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});

  // استخدام useRef لمنع إعادة الرندر
  const formRef = useRef<FormData>(form);
  formRef.current = form;

  const handleChange = useCallback((field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  }, []);

  const validateForm = useCallback(() => {
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

  const handleSignUp = useCallback(async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      await signUp({
        ...form,
        user_type: 'user',
      });
      Alert.alert(
        t('auth.signup_success') || 'تم التسجيل بنجاح',
        t('auth.signup_success_message') || 'تم إنشاء حسابك بنجاح',
        [{ text: t('common.ok') || 'حسناً', onPress: () => navigation.navigate('UserHome' as never) }]
      );
    } catch (error: any) {
      Alert.alert(
        t('auth.signup_error') || 'خطأ في التسجيل', 
        error.message || t('auth.signup_error_message') || 'حدث خطأ أثناء التسجيل'
      );
    } finally {
      setLoading(false);
    }
  }, [form, validateForm, signUp, t, navigation]);

  const InputField = useMemo(() => React.memo(({ 
    label, 
    field, 
    value, 
    placeholder, 
    secureTextEntry = false,
    keyboardType = 'default',
    icon,
    returnKeyType = 'next',
    onSubmitEditing 
  }: {
    label: string;
    field: string;
    value: string;
    placeholder: string;
    secureTextEntry?: boolean;
    keyboardType?: string;
    icon: keyof typeof Ionicons.glyphMap;
    returnKeyType?: 'next' | 'done' | 'go' | 'search' | 'send';
    onSubmitEditing?: () => void;
  }) => {
    const handleTextChange = useCallback((text: string) => {
      handleChange(field, text);
    }, [field]);

    return (
      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>{label}</Text>
        <View style={[styles.inputWrapper, errors[field] && styles.inputError]}>
          <Ionicons name={icon} size={20} color={theme.colors.textSecondary} style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            value={value}
            onChangeText={handleTextChange}
            placeholder={placeholder}
            placeholderTextColor={theme.colors.textSecondary}
            secureTextEntry={secureTextEntry}
            keyboardType={keyboardType as any}
            returnKeyType={returnKeyType}
            blurOnSubmit={false}
            autoCorrect={false}
            autoCapitalize="none"
            textAlign="right"
            onSubmitEditing={onSubmitEditing}
            editable={!loading}
            contextMenuHidden={true}
            textContentType="none"
            autoComplete="off"
            spellCheck={false}
            importantForAutofill="no"
            passwordRules=""
          />
        </View>
        {errors[field] && <Text style={styles.errorText}>{errors[field]}</Text>}
      </View>
    );
  }), [handleChange, errors, loading]);

  const handleBackPress = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const handleLoginPress = useCallback(() => {
    navigation.navigate('Login' as never);
  }, [navigation]);

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
          onPress={handleBackPress}
        >
          <Ionicons name="arrow-back" size={24} color={theme.colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('auth.signup')}</Text>
      </LinearGradient>

      <CSSScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="always"
        keyboardDismissMode="none"
        contentContainerStyle={styles.scrollContent}
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
            <Text style={styles.logoTitle}>{t('auth.create_account')}</Text>
            <Text style={styles.logoSubtitle}>{t('auth.join_tabibiq')}</Text>
          </View>

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

          <InputField
            label={t('auth.password') || 'كلمة المرور'}
            field="password"
            value={form.password}
            placeholder={t('auth.enter_password') || 'أدخل كلمة المرور'}
            icon="lock-closed"
            secureTextEntry={false}
            returnKeyType="next"
          />

          <InputField
            label={t('auth.confirm_password') || 'تأكيد كلمة المرور'}
            field="confirmPassword"
            value={form.confirmPassword}
            placeholder={t('auth.confirm_password') || 'أعد إدخال كلمة المرور'}
            icon="lock-closed"
            secureTextEntry={false}
            returnKeyType="done"
            onSubmitEditing={handleSignUp}
          />

          <TouchableOpacity
            style={[styles.signUpButton, loading && styles.signUpButtonDisabled]}
            onPress={handleSignUp}
            disabled={loading}
          >
            <Text style={styles.signUpButtonText}>
              {loading ? t('auth.creating_account') : t('auth.signup')}
            </Text>
          </TouchableOpacity>

          <View style={styles.loginContainer}>
            <Text style={styles.loginText}>{t('auth.already_have_account')}</Text>
            <TouchableOpacity onPress={handleLoginPress}>
              <Text style={styles.loginLink}>{t('auth.login')}</Text>
            </TouchableOpacity>
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
  content: {
    flex: 1,
    paddingBottom: 100, // إضافة مساحة في الأسفل للتمرير
  },
  scrollContent: {
    flexGrow: 1,
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
    borderColor: theme.colors.error,
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
  errorText: {
    color: theme.colors.error,
    fontSize: 14,
    marginTop: 4,
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
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 30,
  },
  loginText: {
    fontSize: 16,
    color: theme.colors.textSecondary,
  },
  loginLink: {
    fontSize: 16,
    color: '#009688',
    fontWeight: 'bold',
    marginLeft: 8,
  },
});

export default UserSignUpScreen; 