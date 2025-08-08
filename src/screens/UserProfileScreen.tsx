import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  StatusBar,
  SafeAreaView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../utils/theme';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const UserProfileScreen: React.FC = () => {
  const navigation = useNavigation();
  const { t } = useTranslation();
  const { user, profile: authProfile, signOut } = useAuth();
  const [loading, setLoading] = useState(false);
  const [edit, setEdit] = useState(false);
  const [form, setForm] = useState({
    first_name: '',
    email: '',
    phone: '',
    profileImage: ''
  });

  // استخدام البيانات الشخصية من AuthContext مباشرة
  const profile = authProfile || user;

  useEffect(() => {
    // تحديث النموذج بالبيانات الشخصية
    if (profile) {
      setForm({
        first_name: profile.first_name || profile.name || '',
        email: profile.email || '',
        phone: profile.phone || '',
        profileImage: profile.profileImage || profile.avatar || profile.image || ''
      });
    }
  }, [profile]);

  const handleLogout = () => {
    Alert.alert(
      t('auth.logout'),
      t('auth.logout_confirm'),
      [
        {
          text: t('common.cancel'),
          style: 'cancel',
        },
        {
          text: t('common.confirm'),
          onPress: signOut,
        },
      ]
    );
  };

  const handleEditProfile = () => {
    navigation.navigate('UserProfileEdit' as never);
  };

  const handleSaveProfile = async () => {
    try {
      setLoading(true);
      // هنا يمكن إضافة منطق حفظ البيانات
      // await api.put('/user/:id', form);
      setEdit(false);
      Alert.alert('نجح', 'تم حفظ البيانات بنجاح');
    } catch (error) {
      console.error('Error saving profile:', error);
      Alert.alert('خطأ', 'فشل في حفظ البيانات');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setEdit(false);
    // إعادة تعيين النموذج للبيانات الأصلية
    if (profile) {
      setForm({
        first_name: profile.first_name || profile.name || '',
        email: profile.email || '',
        phone: profile.phone || '',
        profileImage: profile.profileImage || profile.avatar || profile.image || ''
      });
    }
  };

  if (loading && !profile && !user) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <StatusBar backgroundColor={theme.colors.gradientStart} barStyle="light-content" />
        <View style={styles.loadingContent}>
          <Text style={styles.loadingIcon}>⏳</Text>
          <Text style={styles.loadingTitle}>جاري تحميل البيانات...</Text>
          <Text style={styles.loadingSubtitle}>يرجى الانتظار قليلاً</Text>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>العودة للصفحة الرئيسية</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor={theme.colors.gradientStart} barStyle="light-content" />
      
      {/* خلفية التدرج */}
      <LinearGradient
        colors={[theme.colors.gradientStart, theme.colors.gradientEnd]}
        style={styles.backgroundGradient}
      />
      
      {/* زر العودة */}
      <TouchableOpacity 
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <Ionicons name="arrow-back" size={20} color={theme.colors.purple} />
        <Text style={styles.backButtonText}>العودة للصفحة الرئيسية</Text>
      </TouchableOpacity>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* البطاقة الرئيسية */}
        <View style={styles.mainCard}>
          {/* Header مع التدرج */}
          <LinearGradient
            colors={[theme.colors.buttonGradientStart, theme.colors.buttonGradientEnd]}
            style={styles.headerGradient}
          >
            <View style={styles.headerContent}>
              {/* صورة المستخدم */}
              <View style={styles.imageContainer}>
                {form.profileImage ? (
                  <Image source={{ uri: form.profileImage }} style={styles.userImage} />
                ) : (
                  <View style={styles.placeholderImage}>
                    <Text style={styles.placeholderText}>👤</Text>
                  </View>
                )}
                
                {/* زر تعديل الصورة */}
                {edit && (
                  <TouchableOpacity style={styles.editImageButton}>
                    <Ionicons name="camera" size={16} color={theme.colors.white} />
                  </TouchableOpacity>
                )}
              </View>
              
              <Text style={styles.headerTitle}>الملف الشخصي</Text>
            </View>
          </LinearGradient>

          {/* محتوى البطاقة */}
          <View style={styles.cardContent}>
            {/* معلومات المستخدم */}
            <View style={styles.infoSection}>
              {/* الاسم */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>الاسم الكامل *</Text>
                <View style={[
                  styles.inputContainer,
                  edit ? styles.inputContainerEdit : styles.inputContainerDisabled
                ]}>
                  <Text style={[
                    styles.inputText,
                    edit ? styles.inputTextEdit : styles.inputTextDisabled
                  ]}>
                    {form.first_name || 'غير محدد'}
                  </Text>
                </View>
              </View>

              {/* البريد الإلكتروني */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>البريد الإلكتروني *</Text>
                <View style={[
                  styles.inputContainer,
                  edit ? styles.inputContainerEdit : styles.inputContainerDisabled
                ]}>
                  <Text style={[
                    styles.inputText,
                    edit ? styles.inputTextEdit : styles.inputTextDisabled
                  ]}>
                    {form.email || 'غير محدد'}
                  </Text>
                </View>
              </View>

              {/* رقم الهاتف */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>رقم الهاتف *</Text>
                <View style={[
                  styles.inputContainer,
                  edit ? styles.inputContainerEdit : styles.inputContainerDisabled
                ]}>
                  <Text style={[
                    styles.inputText,
                    edit ? styles.inputTextEdit : styles.inputTextDisabled
                  ]}>
                    {form.phone || 'غير محدد'}
                  </Text>
                </View>
              </View>
            </View>

            {/* أزرار التحكم */}
            <View style={styles.buttonGroup}>
              {!edit ? (
                <>
                  {/* زر التعديل */}
                  <TouchableOpacity 
                    style={styles.editButton}
                    onPress={handleEditProfile}
                  >
                    <LinearGradient
                      colors={[theme.colors.buttonGradientStart, theme.colors.buttonGradientEnd]}
                      style={styles.gradientButton}
                    >
                      <Ionicons name="create" size={20} color={theme.colors.white} />
                      <Text style={styles.buttonText}>✏️ تعديل البيانات</Text>
                    </LinearGradient>
                  </TouchableOpacity>

                  {/* زر تغيير كلمة المرور */}
                  <TouchableOpacity 
                    style={styles.passwordButton}
                    onPress={() => Alert.alert('قريباً', 'سيتم إضافة هذه الميزة قريباً')}
                  >
                    <LinearGradient
                      colors={[theme.colors.buttonOrange, theme.colors.buttonOrangeDark]}
                      style={styles.gradientButton}
                    >
                      <Ionicons name="lock-closed" size={20} color={theme.colors.white} />
                      <Text style={styles.buttonText}>🔒 تغيير كلمة المرور</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  {/* زر الحفظ */}
                  <TouchableOpacity 
                    style={styles.saveButton}
                    onPress={handleSaveProfile}
                    disabled={loading}
                  >
                    <LinearGradient
                      colors={loading ? ['#ccc', '#ccc'] : [theme.colors.teal, theme.colors.tealDark]}
                      style={styles.gradientButton}
                    >
                      <Text style={styles.buttonText}>
                        {loading ? 'جاري الحفظ...' : '💾 حفظ التغييرات'}
                      </Text>
                    </LinearGradient>
                  </TouchableOpacity>

                  {/* زر الإلغاء */}
                  <TouchableOpacity 
                    style={styles.cancelButton}
                    onPress={handleCancelEdit}
                  >
                    <View style={styles.cancelButtonContent}>
                      <Ionicons name="close" size={20} color={theme.colors.textSecondary} />
                      <Text style={styles.cancelButtonText}>❌ إلغاء</Text>
                    </View>
                  </TouchableOpacity>
                </>
              )}
            </View>

            {/* خيارات إضافية */}
            <View style={styles.optionsSection}>
              <TouchableOpacity 
                style={styles.optionButton}
                onPress={() => navigation.navigate('MyAppointments' as never)}
              >
                <Ionicons name="calendar" size={24} color={theme.colors.purple} />
                <Text style={styles.optionText}>مواعيدي</Text>
                <Ionicons name="chevron-forward" size={20} color={theme.colors.textSecondary} />
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.optionButton}
                onPress={() => navigation.navigate('MedicineReminder' as never)}
              >
                <Ionicons name="medical" size={24} color={theme.colors.purple} />
                <Text style={styles.optionText}>تذكيرات الأدوية</Text>
                <Ionicons name="chevron-forward" size={20} color={theme.colors.textSecondary} />
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.optionButton}
                onPress={() => navigation.navigate('HealthCenters' as never)}
              >
                <Ionicons name="business" size={24} color={theme.colors.purple} />
                <Text style={styles.optionText}>المراكز الصحية</Text>
                <Ionicons name="chevron-forward" size={20} color={theme.colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* زر تسجيل الخروج */}
            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
              <Ionicons name="log-out" size={20} color={theme.colors.white} />
              <Text style={styles.logoutButtonText}>تسجيل الخروج</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  backgroundGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  loadingContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
  },
  loadingIcon: {
    fontSize: 48,
    color: theme.colors.purple,
    marginBottom: theme.spacing.md,
  },
  loadingTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.sm,
  },
  loadingSubtitle: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xl,
  },
  backButton: {
    position: 'absolute',
    top: 18,
    left: 18,
    backgroundColor: 'rgba(255,255,255,0.9)',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 10,
  },
  backButtonText: {
    color: theme.colors.purple,
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: theme.spacing.sm,
  },
  scrollView: {
    flex: 1,
    padding: theme.spacing.md,
  },
  mainCard: {
    backgroundColor: theme.colors.white,
    borderRadius: 20,
    overflow: 'hidden',
    marginTop: theme.spacing.xl,
    ...theme.shadows.large,
  },
  headerGradient: {
    padding: theme.spacing.xl,
    alignItems: 'center',
  },
  headerContent: {
    alignItems: 'center',
  },
  imageContainer: {
    position: 'relative',
    marginBottom: theme.spacing.md,
  },
  userImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  placeholderImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  placeholderText: {
    fontSize: 32,
  },
  editImageButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: theme.colors.purple,
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: theme.colors.white,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.white,
  },
  cardContent: {
    padding: theme.spacing.xl,
  },
  infoSection: {
    marginBottom: theme.spacing.xl,
  },
  inputGroup: {
    marginBottom: theme.spacing.lg,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: theme.colors.purple,
    marginBottom: theme.spacing.sm,
  },
  inputContainer: {
    borderRadius: 12,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    borderWidth: 2,
  },
  inputContainerEdit: {
    borderColor: theme.colors.purple,
    backgroundColor: theme.colors.white,
  },
  inputContainerDisabled: {
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.inputBackground,
  },
  inputText: {
    fontSize: 16,
  },
  inputTextEdit: {
    color: theme.colors.textPrimary,
  },
  inputTextDisabled: {
    color: theme.colors.textSecondary,
  },
  buttonGroup: {
    marginBottom: theme.spacing.xl,
    gap: theme.spacing.md,
  },
  editButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  passwordButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  saveButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  cancelButton: {
    borderRadius: 12,
    borderWidth: 2,
    borderColor: theme.colors.border,
  },
  gradientButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.xl,
  },
  buttonText: {
    color: theme.colors.white,
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: theme.spacing.sm,
  },
  cancelButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.xl,
    backgroundColor: theme.colors.buttonGray,
  },
  cancelButtonText: {
    color: theme.colors.buttonGrayText,
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: theme.spacing.sm,
  },
  optionsSection: {
    marginBottom: theme.spacing.xl,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    backgroundColor: theme.colors.white,
    borderRadius: 12,
    marginBottom: theme.spacing.sm,
    ...theme.shadows.small,
  },
  optionText: {
    fontSize: 16,
    color: theme.colors.textPrimary,
    marginLeft: theme.spacing.md,
    flex: 1,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.xl,
    backgroundColor: theme.colors.error,
    borderRadius: 12,
  },
  logoutButtonText: {
    color: theme.colors.white,
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: theme.spacing.sm,
  },
});

export default UserProfileScreen; 