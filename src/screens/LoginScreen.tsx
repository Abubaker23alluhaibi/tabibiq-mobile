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
  ImageBackground,
} from 'react-native';
import CSSScrollView from '../components/web/CSSScrollView';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { isValidEmail, isValidPhone } from '../utils/helpers';
import { getCurrentServerInfo, testEndpoints } from '../config/api';

const LoginScreen = () => {
  const navigation = useNavigation();
  const { t } = useTranslation();
  const { signIn, testConnection } = useAuth();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginType, setLoginType] = useState<'user' | 'doctor'>('user');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // الحصول على معلومات الخادم الحالي
  const serverInfo = getCurrentServerInfo();

  const testServerConnection = async () => {
    setLoading(true);
    try {
      const result = await testConnection();
      if (result.success) {
        Alert.alert('✅ نجح الاتصال', 'الخادم متاح ويعمل بشكل صحيح');
      } else {
        Alert.alert('❌ فشل الاتصال', `لا يمكن الاتصال بالخادم: ${result.error}`);
      }
    } catch (error) {
      Alert.alert('❌ خطأ', 'حدث خطأ أثناء اختبار الاتصال');
    } finally {
      setLoading(false);
    }
  };

  const testAllEndpoints = async () => {
    setLoading(true);
    try {
      await testEndpoints();
      Alert.alert('✅ تم الاختبار', 'تم اختبار جميع نقاط الاتصال. تحقق من Console للتفاصيل.');
    } catch (error) {
      Alert.alert('❌ خطأ', 'حدث خطأ أثناء اختبار نقاط الاتصال');
    } finally {
      setLoading(false);
    }
  };

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
      console.log('🔄 بدء عملية تسجيل الدخول...');
      const result = await signIn(email.trim(), password, loginType);
      
      if (result.error) {
        console.error('❌ خطأ في تسجيل الدخول:', result.error);
        Alert.alert('خطأ في تسجيل الدخول', result.error);
      } else {
        console.log('✅ تم تسجيل الدخول بنجاح');
        // سيتم التنقل تلقائياً من خلال AuthContext
      }
    } catch (error) {
      console.error('❌ خطأ غير متوقع:', error);
      Alert.alert('خطأ', 'حدث خطأ أثناء تسجيل الدخول');
    } finally {
      setLoading(false);
    }
  };

  const navigateToSignUp = () => {
    navigation.navigate('UserSignUp' as never);
  };

  const navigateToDoctorSignUp = () => {
    navigation.navigate('DoctorSignUp' as never);
  };

  const navigateToAdminLogin = () => {
    navigation.navigate('AdminLogin' as never);
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      enabled={true}
    >
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      {/* Background Gradient - مطابق للواجهة الأمامية */}
      <LinearGradient
        colors={['#009688', '#00796B', '#004D40']}
        style={styles.backgroundGradient}
      >
        {/* Back Button */}
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>

          {/* Test Connection Button */}
          <TouchableOpacity 
            style={styles.testButton}
            onPress={testServerConnection}
            disabled={loading}
          >
            <Ionicons name="wifi" size={20} color="#FFFFFF" />
            <Text style={styles.testButtonText}>اختبار الاتصال</Text>
          </TouchableOpacity>

          {/* Test Endpoints Button */}
          <TouchableOpacity 
            style={styles.testEndpointsButton}
            onPress={testAllEndpoints}
            disabled={loading}
          >
            <Ionicons name="list" size={20} color="#FFFFFF" />
            <Text style={styles.testButtonText}>اختبار النقاط</Text>
          </TouchableOpacity>

          {/* Server Info */}
          <View style={styles.serverInfo}>
            <Text style={styles.serverInfoText}>
              الخادم: {serverInfo.serverType}
            </Text>
            <Text style={styles.serverInfoText}>
              {serverInfo.baseUrl}
            </Text>
          </View>

          {/* Login Box - مطابق للواجهة الأمامية */}
          <CSSScrollView style={styles.loginBox} showsVerticalScrollIndicator={false}>
            {/* Logo */}
            <View style={styles.logoContainer}>
              <View style={styles.logoPlaceholder}>
                <Ionicons name="medical" size={50} color="#FFFFFF" />
              </View>
            </View>

            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.headerTitle}>تسجيل الدخول</Text>
              <Text style={styles.headerSubtitle}>مرحباً بك مرة أخرى</Text>
            </View>

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
                  size={16} 
                  color={loginType === 'user' ? '#FFFFFF' : '#757575'} 
                />
                <Text style={[
                  styles.typeButtonText,
                  loginType === 'user' && styles.typeButtonTextActive,
                ]}>
                  مريض
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
                  size={16} 
                  color={loginType === 'doctor' ? '#FFFFFF' : '#757575'} 
                />
                <Text style={[
                  styles.typeButtonText,
                  loginType === 'doctor' && styles.typeButtonTextActive,
                ]}>
                  طبيب
                </Text>
              </TouchableOpacity>
            </View>

            {/* Form */}
            <View style={styles.form}>
              {/* Email/Phone Input */}
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="البريد الإلكتروني أو رقم الهاتف"
                  placeholderTextColor="rgba(0, 150, 136, 0.7)"
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

              {/* Password Input */}
              <View style={styles.passwordContainer}>
                <TextInput
                  style={styles.passwordInput}
                  placeholder="كلمة المرور"
                  placeholderTextColor="rgba(0, 150, 136, 0.7)"
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
                    name={showPassword ? "eye-off" : "eye"} 
                    size={20} 
                    color="#757575" 
                  />
                </TouchableOpacity>
              </View>

              {/* Login Button */}
              <TouchableOpacity
                style={[styles.loginButton, loading && styles.loginButtonDisabled]}
                onPress={handleLogin}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <>
                    <Ionicons name="log-in" size={16} color="#FFFFFF" />
                    <Text style={styles.loginButtonText}>تسجيل الدخول</Text>
                  </>
                )}
              </TouchableOpacity>

              {/* Forgot Password */}
              <TouchableOpacity style={styles.forgotPassword}>
                <Text style={styles.forgotPasswordText}>نسيت كلمة المرور؟</Text>
              </TouchableOpacity>
            </View>

            {/* Divider */}
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>أو</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Sign Up Options */}
            <View style={styles.signUpSection}>
              <Text style={styles.signUpTitle}>ليس لديك حساب؟</Text>
              
              <TouchableOpacity style={styles.signUpButton} onPress={navigateToSignUp}>
                <Ionicons name="person-add" size={16} color="#009688" />
                <Text style={styles.signUpButtonText}>إنشاء حساب مريض</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.signUpButton} onPress={navigateToDoctorSignUp}>
                <Ionicons name="medical" size={16} color="#009688" />
                <Text style={styles.signUpButtonText}>إنشاء حساب طبيب</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.adminButton} onPress={navigateToAdminLogin}>
                <Ionicons name="settings" size={16} color="#757575" />
                <Text style={styles.adminButtonText}>تسجيل دخول الأدمن</Text>
              </TouchableOpacity>
            </View>

            {/* Additional Content for Scrolling */}
            <View style={styles.additionalContent}>
              <Text style={styles.additionalTitle}>معلومات إضافية</Text>
              <Text style={styles.additionalText}>
                منصة طبيب العراق تقدم خدمات طبية متكاملة
              </Text>
              
                             <View style={styles.featuresList}>
                 <View style={styles.featureItem}>
                   <Ionicons name="shield-checkmark" size={16} color="#009688" />
                   <Text style={styles.featureText}>أمان تام للبيانات</Text>
                 </View>
                 
                 <View style={styles.featureItem}>
                   <Ionicons name="time" size={16} color="#009688" />
                   <Text style={styles.featureText}>خدمة 24/7</Text>
                 </View>
                 
                 <View style={styles.featureItem}>
                   <Ionicons name="medical" size={16} color="#009688" />
                   <Text style={styles.featureText}>أطباء معتمدون</Text>
                 </View>
               </View>
            </View>
          </CSSScrollView>
        </LinearGradient>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingBottom: 50, // إضافة مساحة في الأسفل للتمرير
  },
  backgroundGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    height: '100%',
  },
  backButton: {
    position: 'absolute',
    top: 50,
    right: 16,
    zIndex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
    padding: 8,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  testButton: {
    position: 'absolute',
    top: 50,
    left: 16,
    zIndex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  testEndpointsButton: {
    position: 'absolute',
    top: 100,
    left: 16,
    zIndex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  testButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    marginLeft: 4,
  },
  serverInfo: {
    position: 'absolute',
    top: 150,
    left: 16,
    right: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    padding: 8,
    alignItems: 'center',
  },
  serverInfoText: {
    color: '#FFFFFF',
    fontSize: 12,
    textAlign: 'center',
  },
  loginBox: {
    backgroundColor: 'transparent',
    borderRadius: 0,
    padding: 20, // تقليل المساحة
    width: '100%',
    height: '100%',
    shadowColor: 'transparent',
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
    borderWidth: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 15, // تقليل المساحة
  },
  logo: {
    width: 100, // تصغير الشعار
    height: 100,
    borderRadius: 50,
  },
  logoPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  header: {
    alignItems: 'center',
    marginBottom: 20, // تقليل المساحة
  },
  headerTitle: {
    fontSize: 24, // تصغير الخط
    fontWeight: 'bold',
    color: '#009688',
    textAlign: 'center',
    marginBottom: 10, // تقليل المساحة
    textShadowColor: 'rgba(255, 255, 255, 0.9)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  },
  headerSubtitle: {
    fontSize: 16, // تصغير الخط
    color: '#009688',
    textAlign: 'center',
    textShadowColor: 'rgba(255, 255, 255, 0.9)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  typeSelector: {
    flexDirection: 'row',
    backgroundColor: 'transparent',
    borderRadius: 12,
    padding: 4,
    marginBottom: 20, // تقليل المساحة
  },
  typeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10, // تقليل المساحة
    borderRadius: 8,
  },
  typeButtonActive: {
    backgroundColor: 'transparent',
    borderColor: '#009688',
    borderWidth: 1,
  },
  typeButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#009688',
    marginLeft: 8,
    textShadowColor: 'rgba(255, 255, 255, 0.9)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  typeButtonTextActive: {
    color: '#009688',
    fontWeight: 'bold',
    textShadowColor: 'rgba(255, 255, 255, 0.9)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  form: {
    marginBottom: 20, // تقليل المساحة
    width: '100%',
  },
  inputContainer: {
    position: 'relative',
    marginBottom: 12, // تقليل المساحة
  },
  input: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#009688',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 10, // تقليل المساحة
    fontSize: 14, // تصغير الخط
    color: '#009688',
    textAlign: 'right',
    fontWeight: '600',
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  passwordContainer: {
    position: 'relative',
    marginBottom: 12, // تقليل المساحة
  },
  passwordInput: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#009688',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 10, // تقليل المساحة
    fontSize: 14, // تصغير الخط
    color: '#009688',
    textAlign: 'right',
    fontWeight: '600',
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  passwordToggle: {
    position: 'absolute',
    left: 16,
    top: 16,
    zIndex: 1,
  },
  loginButton: {
    backgroundColor: 'transparent',
    borderRadius: 8,
    paddingVertical: 14, // تقليل المساحة
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#009688',
  },
  loginButtonDisabled: {
    backgroundColor: '#CCCCCC',
    opacity: 0.7,
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 16, // تصغير الخط
    fontWeight: 'bold',
    marginRight: 8,
    letterSpacing: 1,
  },
  forgotPassword: {
    alignItems: 'center',
    marginTop: 16,
  },
  forgotPasswordText: {
    color: '#009688',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 16,
    fontWeight: '600',
    textShadowColor: 'rgba(255, 255, 255, 0.9)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E0E0E0',
  },
  dividerText: {
    color: '#757575',
    fontSize: 16,
    marginHorizontal: 16,
  },
  signUpSection: {
    alignItems: 'center',
  },
  signUpTitle: {
    fontSize: 16, // تصغير الخط
    fontWeight: '600',
    color: '#212121',
    marginBottom: 12, // تقليل المساحة
  },
  signUpButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'transparent',
    borderRadius: 12,
    paddingVertical: 10, // تقليل المساحة
    paddingHorizontal: 16,
    marginBottom: 10, // تقليل المساحة
    borderWidth: 1,
    borderColor: '#009688',
    width: '100%',
    justifyContent: 'center',
  },
  signUpButtonText: {
    color: '#009688',
    fontSize: 16, // تصغير الخط
    fontWeight: 'bold',
    marginLeft: 8,
    textShadowColor: 'rgba(255, 255, 255, 0.9)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  adminButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  adminButtonText: {
    color: '#757575',
    fontSize: 14,
    marginLeft: 8,
  },
  additionalContent: {
    marginTop: 30, // تقليل المساحة
    paddingHorizontal: 20,
    paddingBottom: 30, // تقليل المساحة
  },
  additionalTitle: {
    fontSize: 16, // تصغير الخط
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 10, // تقليل المساحة
  },
  additionalText: {
    fontSize: 12, // تصغير الخط
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 15, // تقليل المساحة
    opacity: 0.9,
  },
  featuresList: {
    gap: 8, // تقليل المساحة
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    padding: 10, // تقليل المساحة
  },
  featureText: {
    color: '#FFFFFF',
    fontSize: 12, // تصغير الخط
    marginLeft: 8,
  },
});

export default LoginScreen; 