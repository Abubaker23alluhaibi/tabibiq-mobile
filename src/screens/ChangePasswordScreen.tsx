import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  SafeAreaView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../utils/theme';
import { useAuth } from '../contexts/AuthContext';
import { authAPI, doctorsAPI } from '../services/api';
import { isStrongPassword, getPasswordStrength } from '../utils/helpers';

const ChangePasswordScreen: React.FC = () => {
  const navigation = useNavigation();
  const { t } = useTranslation();
  const { user, signOut } = useAuth();
  
  const [loading, setLoading] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [form, setForm] = useState({
    newPassword: '',
    confirmPassword: '',
  });

  const [errors, setErrors] = useState({
    newPassword: '',
    confirmPassword: '',
  });

  const handleChange = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
    // مسح الخطأ عند الكتابة
    if (errors[field as keyof typeof errors]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {
      newPassword: '',
      confirmPassword: '',
    };

    if (!form.newPassword.trim()) {
      newErrors.newPassword = t('auth.new_password_required');
    } else if (!isStrongPassword(form.newPassword)) {
      newErrors.newPassword = 'كلمة المرور يجب أن تحتوي على 6 أحرف على الأقل';
    }

    if (!form.confirmPassword.trim()) {
      newErrors.confirmPassword = t('auth.confirm_password_required');
    } else if (form.newPassword !== form.confirmPassword) {
      newErrors.confirmPassword = t('auth.passwords_not_match');
    }

    setErrors(newErrors);
    return !Object.values(newErrors).some(error => error);
  };

  const handleChangePassword = async () => {
    if (!validateForm() || !user?.id) {
      return;
    }

    setLoading(true);
    try {
      const userType = (user as any).user_type || 'user';

      // تغيير كلمة المرور على السيرفر (المستخدم مسجل دخول — التوكن يثبت هويته)
      let response: { success?: boolean; error?: string } | null = null;
      if (userType === 'doctor') {
        response = await doctorsAPI.changePassword(user.id, form.newPassword);
      } else {
        response = await authAPI.updatePassword(user.id, form.newPassword);
      }

      if (!response?.success) {
        Alert.alert(t('common.error'), response?.error || t('auth.password_change_failed'));
        setLoading(false);
        return;
      }

      // تسجيل الخروج فوراً حتى لا يبقى توكن قديم — المستخدم يسجّل الدخول لاحقاً بالكلمة الجديدة فقط
      await signOut();

      Alert.alert(
        t('common.success'),
        t('auth.password_changed_success') + '\n\n' + (t('auth.re_login_with_new_password') || 'سجّل الدخول الآن باستخدام نفس البريد أو رقم الهاتف وكلمة المرور الجديدة فقط.'),
        [{ text: t('common.ok'), onPress: () => navigation.getParent()?.goBack?.() || navigation.goBack() }]
      );
    } catch (error: any) {
      const errorMessage = error?.message || t('auth.password_change_failed');
      Alert.alert(t('common.error'), errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const passwordStrength = getPasswordStrength(form.newPassword);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={theme.colors.background} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={theme.colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('auth.change_password')}</Text>
        <View style={styles.placeholder} />
      </View>

      <KeyboardAvoidingView
        style={styles.content}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.formContainer}>
          {/* كلمة المرور الجديدة */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>{t('auth.new_password')}</Text>
            <View style={styles.inputWrapper}>
              <Ionicons
                name="lock-closed"
                size={20}
                color={theme.colors.textSecondary}
                style={styles.inputIcon}
              />
              <TextInput
                style={[styles.input, errors.newPassword && styles.inputError]}
                placeholder={t('auth.enter_new_password')}
                placeholderTextColor={theme.colors.textSecondary}
                value={form.newPassword}
                onChangeText={(value) => handleChange('newPassword', value)}
                secureTextEntry={!showNewPassword}
                autoCapitalize="none"
                autoCorrect={false}
                textAlign="right"
              />
              <TouchableOpacity
                style={styles.passwordToggle}
                onPress={() => setShowNewPassword(!showNewPassword)}
              >
                <Ionicons
                  name={showNewPassword ? 'eye-off' : 'eye'}
                  size={22}
                  color={theme.colors.textSecondary}
                />
              </TouchableOpacity>
            </View>
            
            {/* مؤشر قوة كلمة المرور */}
            {form.newPassword.length > 0 && (
              <View style={styles.passwordStrengthContainer}>
                <View style={styles.strengthBar}>
                  <View
                    style={[
                      styles.strengthFill,
                      { width: `${(passwordStrength.score / 4) * 100}%`, backgroundColor: passwordStrength.color }
                    ]}
                  />
                </View>
                <Text style={[styles.strengthText, { color: passwordStrength.color }]}>
                  {passwordStrength.text}
                </Text>
              </View>
            )}
            
            {errors.newPassword ? (
              <Text style={styles.errorText}>{errors.newPassword}</Text>
            ) : null}
          </View>

          {/* تأكيد كلمة المرور */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>{t('auth.confirm_new_password')}</Text>
            <View style={styles.inputWrapper}>
              <Ionicons
                name="lock-closed"
                size={20}
                color={theme.colors.textSecondary}
                style={styles.inputIcon}
              />
              <TextInput
                style={[styles.input, errors.confirmPassword && styles.inputError]}
                placeholder={t('auth.enter_confirm_password')}
                placeholderTextColor={theme.colors.textSecondary}
                value={form.confirmPassword}
                onChangeText={(value) => handleChange('confirmPassword', value)}
                secureTextEntry={!showConfirmPassword}
                autoCapitalize="none"
                autoCorrect={false}
                textAlign="right"
              />
              <TouchableOpacity
                style={styles.passwordToggle}
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                <Ionicons
                  name={showConfirmPassword ? 'eye-off' : 'eye'}
                  size={22}
                  color={theme.colors.textSecondary}
                />
              </TouchableOpacity>
            </View>
            {errors.confirmPassword ? (
              <Text style={styles.errorText}>{errors.confirmPassword}</Text>
            ) : null}
          </View>

          {/* زر تغيير كلمة المرور */}
          <TouchableOpacity
            style={[styles.changePasswordButton, loading && styles.buttonDisabled]}
            onPress={handleChangePassword}
            disabled={loading}
          >
            <LinearGradient
              colors={[theme.colors.primary, theme.colors.primaryDark || theme.colors.primary]}
              style={styles.gradientButton}
            >
              {loading ? (
                <ActivityIndicator size="small" color={theme.colors.white} />
              ) : (
                <>
                  <Ionicons name="checkmark-circle" size={20} color={theme.colors.white} />
                  <Text style={styles.buttonText}>{t('auth.change_password')}</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>

          {/* نصائح لكلمة المرور */}
          <View style={styles.tipsContainer}>
            <Text style={styles.tipsTitle}>{t('auth.password_tips_title')}</Text>
            <Text style={styles.tipText}>{t('auth.password_tip_length')}</Text>
            <Text style={styles.tipText}>{t('auth.password_tip_case')}</Text>
            <Text style={styles.tipText}>{t('auth.password_tip_numbers')}</Text>
            <Text style={styles.tipText}>{t('auth.password_tip_personal')}</Text>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    backgroundColor: theme.colors.white,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  formContainer: {
    padding: 20,
  },
  inputContainer: {
    marginBottom: 20,
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
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 12,
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
  inputError: {
    borderColor: theme.colors.error,
  },
  passwordToggle: {
    marginLeft: 12,
    padding: 4,
  },
  errorText: {
    color: theme.colors.error,
    fontSize: 14,
    marginTop: 4,
    textAlign: 'right',
  },
  passwordStrengthContainer: {
    marginTop: 8,
    alignItems: 'center',
  },
  strengthBar: {
    width: '100%',
    height: 4,
    backgroundColor: theme.colors.border,
    borderRadius: 2,
    overflow: 'hidden',
  },
  strengthFill: {
    height: '100%',
    borderRadius: 2,
  },
  strengthText: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
  changePasswordButton: {
    marginTop: 20,
    marginBottom: 30,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  gradientButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
  },
  buttonText: {
    color: theme.colors.white,
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  tipsContainer: {
    backgroundColor: theme.colors.white,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
    marginBottom: 12,
    textAlign: 'right',
  },
  tipText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginBottom: 6,
    textAlign: 'right',
  },
});

export default ChangePasswordScreen;
