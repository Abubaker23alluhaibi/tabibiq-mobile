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
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../utils/theme';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const CenterLoginScreen: React.FC = () => {
  const navigation = useNavigation();
  const { t } = useTranslation();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('خطأ', 'يرجى ملء جميع الحقول المطلوبة');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/center/login', {
        email,
        password,
      });

      if (response.data.success) {
        const userData = {
          ...response.data.user,
          user_type: 'center',
        };
        
        await login(email, password, 'center');
        Alert.alert('نجح', 'تم تسجيل الدخول بنجاح', [
          {
            text: 'حسناً',
            onPress: () => navigation.navigate('CenterHome' as never),
          },
        ]);
      } else {
        Alert.alert('خطأ', response.data.message || 'فشل في تسجيل الدخول');
      }
    } catch (error) {
      Alert.alert('خطأ', 'فشل في تسجيل الدخول. يرجى التحقق من البيانات والمحاولة مرة أخرى.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Ionicons name="business" size={64} color={theme.colors.primary} />
          <Text style={styles.title}>تسجيل دخول المركز الصحي</Text>
          <Text style={styles.subtitle}>أدخل بياناتك للوصول إلى لوحة التحكم</Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <Ionicons name="mail" size={20} color={theme.colors.textSecondary} />
            <TextInput
              style={styles.input}
              placeholder="البريد الإلكتروني"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={styles.inputContainer}>
            <Ionicons name="lock-closed" size={20} color={theme.colors.textSecondary} />
            <TextInput
              style={styles.input}
              placeholder="كلمة المرور"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
            />
            <TouchableOpacity
              onPress={() => setShowPassword(!showPassword)}
              style={styles.eyeButton}
            >
              <Ionicons 
                name={showPassword ? "eye-off" : "eye"} 
                size={20} 
                color={theme.colors.textSecondary} 
              />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.loginButton, loading && styles.loginButtonDisabled]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color={theme.colors.white} />
            ) : (
              <>
                <Ionicons name="log-in" size={20} color={theme.colors.white} />
                <Text style={styles.loginButtonText}>تسجيل الدخول</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <TouchableOpacity
            onPress={() => navigation.navigate('Landing' as never)}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={20} color={theme.colors.primary} />
            <Text style={styles.backButtonText}>العودة للصفحة الرئيسية</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
    marginTop: 16,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  form: {
    marginBottom: 40,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.white,
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  input: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 12,
    fontSize: 16,
    color: theme.colors.textPrimary,
  },
  eyeButton: {
    padding: 8,
  },
  loginButton: {
    backgroundColor: theme.colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 8,
  },
  loginButtonDisabled: {
    opacity: 0.6,
  },
  loginButtonText: {
    color: theme.colors.white,
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  footer: {
    alignItems: 'center',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  backButtonText: {
    color: theme.colors.primary,
    fontSize: 16,
    marginLeft: 8,
  },
});

export default CenterLoginScreen; 
