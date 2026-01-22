import React, { useState, useCallback } from 'react';
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
  ScrollView,
  ActivityIndicator,
  I18nManager,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../utils/theme';
import { useAuth } from '../contexts/AuthContext';
import { useApp } from '../contexts/AppContext';

const { width } = Dimensions.get('window');

// ✅ الحل: تعريف المكون خارج الدالة الرئيسية لمنع إعادة إنشائه مع كل تحديث
const InputField = ({ 
  label, 
  value, 
  onChangeText, 
  placeholder, 
  icon, 
  error, 
  secureTextEntry = false, 
  keyboardType = 'default' 
}: any) => (
  <View style={styles.inputContainer}>
    <Text style={styles.inputLabel}>{label}</Text>
    <View style={[styles.inputWrapper, error && styles.inputError]}>
      <Ionicons name={icon} size={20} color={theme.colors.primary} style={styles.inputIcon} />
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.colors.textSecondary}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        textAlign={I18nManager.isRTL ? 'right' : 'left'}
        autoCapitalize="none"
      />
    </View>
    {error ? <Text style={styles.errorText}>{error}</Text> : null}
  </View>
);

const UserSignUpScreen = () => {
  const navigation = useNavigation();
  const { t } = useTranslation();
  const { signUp } = useAuth();
  const { markAppAsLaunched } = useApp();
  
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{[key: string]: string}>({});

  const handleChange = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
    // مسح الخطأ عند الكتابة
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};

    if (!form.name.trim()) newErrors.name = t('validation.name_required');
    if (!form.email.trim()) newErrors.email = t('validation.email_required');
    else if (!/\S+@\S+\.\S+/.test(form.email)) newErrors.email = t('validation.email_invalid');
    
    if (!form.phone.trim()) newErrors.phone = t('validation.phone_required');
    
    if (!form.password) newErrors.password = t('validation.password_required');
    else if (form.password.length < 6) newErrors.password = t('validation.password_length');

    if (form.password !== form.confirmPassword) newErrors.confirmPassword = t('validation.password_mismatch');

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignUp = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const result = await signUp({
        ...form,
        user_type: 'user',
      });
      
      if (result.error) {
        throw new Error(result.error);
      }
      
      if (result.success) {
        await markAppAsLaunched();
        
        if (result.autoLogin) {
          // التوجيه التلقائي سيحدث عبر AuthContext
          console.log('تم التسجيل والدخول تلقائياً');
        } else {
           Alert.alert(
            t('auth.signup_success'),
            t('auth.signup_success_message'),
            [{ text: t('common.ok'), onPress: () => (navigation as any).navigate('Login') }]
          );
        }
      }
    } catch (error: any) {
      Alert.alert(t('common.error'), error.message || t('auth.signup_error_message'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.primary} />
      
      {/* Header */}
      <LinearGradient
        colors={[theme.colors.primary, theme.colors.primaryDark]}
        style={styles.header}
      >
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name={I18nManager.isRTL ? "arrow-forward" : "arrow-back"} size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('auth.create_account')}</Text>
      </LinearGradient>

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView 
          style={styles.content} 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled" // مهم لإخفاء الكيبورد عند الضغط خارج الحقول
        >
          {/* Logo Section */}
          <View style={styles.logoContainer}>
            <View style={styles.logoCircle}>
              <Image 
                source={require('../../assets/icon.png')} 
                style={styles.logoImage}
                resizeMode="contain"
              />
            </View>
            <Text style={styles.welcomeText}>{t('auth.join_tabibiq')}</Text>
          </View>

          {/* Form Section */}
          <View style={styles.formCard}>
            <InputField 
              label={t('auth.full_name')} 
              value={form.name}
              onChangeText={(text: string) => handleChange('name', text)}
              error={errors.name}
              placeholder={t('auth.enter_full_name')} 
              icon="person-outline" 
            />
            
            <InputField 
              label={t('auth.email')} 
              value={form.email}
              onChangeText={(text: string) => handleChange('email', text)}
              error={errors.email}
              placeholder={t('auth.enter_email')} 
              icon="mail-outline" 
              keyboardType="email-address" 
            />
            
            <InputField 
              label={t('auth.phone')} 
              value={form.phone}
              onChangeText={(text: string) => handleChange('phone', text)}
              error={errors.phone}
              placeholder={t('auth.enter_phone')} 
              icon="call-outline" 
              keyboardType="phone-pad" 
            />
            
            <InputField 
              label={t('auth.password')} 
              value={form.password}
              onChangeText={(text: string) => handleChange('password', text)}
              error={errors.password}
              placeholder={t('auth.enter_password')} 
              icon="lock-closed-outline" 
              secureTextEntry 
            />
            
            <InputField 
              label={t('auth.confirm_password')} 
              value={form.confirmPassword}
              onChangeText={(text: string) => handleChange('confirmPassword', text)}
              error={errors.confirmPassword}
              placeholder={t('auth.confirm_password')} 
              icon="shield-checkmark-outline" 
              secureTextEntry 
            />

            <TouchableOpacity 
              style={styles.signUpButton} 
              onPress={handleSignUp}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.signUpButtonText}>{t('auth.signup')}</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Login Link */}
          <View style={styles.loginContainer}>
            <Text style={styles.loginText}>{t('auth.already_have_account')}</Text>
            <TouchableOpacity onPress={() => (navigation as any).navigate('Login')}>
              <Text style={styles.loginLink}>{t('auth.login')}</Text>
            </TouchableOpacity>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  header: {
    paddingTop: Platform.OS === 'android' ? 40 : 60,
    paddingBottom: 30,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButton: {
    position: 'absolute',
    left: 20,
    top: Platform.OS === 'android' ? 40 : 60,
    padding: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: -30,
    marginBottom: 20,
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    marginBottom: 10,
  },
  logoImage: {
    width: 50,
    height: 50,
  },
  welcomeText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
  },
  formCard: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    marginBottom: 8,
    textAlign: 'right',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9F9F9',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#EEEEEE',
    paddingHorizontal: 12,
    height: 50,
  },
  inputError: {
    borderColor: theme.colors.error,
    backgroundColor: '#FFF5F5',
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: theme.colors.textPrimary,
    height: '100%',
  },
  errorText: {
    color: theme.colors.error,
    fontSize: 12,
    marginTop: 4,
    textAlign: 'right',
  },
  signUpButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: 12,
    height: 54,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  signUpButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  loginText: {
    color: theme.colors.textSecondary,
    fontSize: 14,
  },
  loginLink: {
    color: theme.colors.primary,
    fontWeight: 'bold',
    fontSize: 14,
    marginLeft: 6,
  },
});

export default UserSignUpScreen;