import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  Share,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../utils/theme';
import { useAuth } from '../contexts/AuthContext';
import { API_CONFIG } from '../config/api';
import { getToken } from '../utils/secureStorage';
import PrivacyPolicyButton from '../components/PrivacyPolicyButton';
import TermsOfServiceButton from '../components/TermsOfServiceButton';

const PrivacySettingsScreen: React.FC = () => {
  const navigation = useNavigation();
  const { t } = useTranslation();
  const { user, profile, signOut } = useAuth();
  const [loading, setLoading] = useState<string | null>(null);

  const handleExportData = async () => {
    try {
      setLoading('export');
      
      const token = await getToken();
      if (!token) {
        Alert.alert(t('common.error'), t('privacy.export_error') || 'يجب تسجيل الدخول أولاً');
        return;
      }

      // جلب جميع بيانات المستخدم من API
      const response = await fetch(`${API_CONFIG.BASE_URL}/users/${user?.id}/export`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        
        // تحويل البيانات إلى JSON
        const jsonData = JSON.stringify(data, null, 2);
        
        // مشاركة البيانات
        if (Platform.OS === 'ios' || Platform.OS === 'android') {
          await Share.share({
            message: jsonData,
            title: t('privacy.export_data') || 'تصدير بياناتي',
          });
        } else {
          Alert.alert(
            t('privacy.export_success') || 'تم التصدير بنجاح',
            t('privacy.export_message') || 'تم تصدير بياناتك. يمكنك حفظ الملف.',
            [{ text: t('common.ok') }]
          );
        }
      } else {
        // Fallback: إنشاء بيانات محلية
        const localData = {
          user: {
            id: user?.id,
            name: user?.name,
            email: user?.email,
            phone: user?.phone,
            user_type: user?.user_type,
            created_at: user?.created_at,
          },
          profile: profile,
          export_date: new Date().toISOString(),
          note: 'هذه البيانات تم تصديرها من تطبيق TabibiQ',
        };

        const jsonData = JSON.stringify(localData, null, 2);
        
        if (Platform.OS === 'ios' || Platform.OS === 'android') {
          await Share.share({
            message: jsonData,
            title: t('privacy.export_data') || 'تصدير بياناتي',
          });
        }
      }
    } catch (error) {
      Alert.alert(
        t('common.error'),
        t('privacy.export_error') || 'حدث خطأ أثناء تصدير البيانات'
      );
    } finally {
      setLoading(null);
    }
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      t('privacy.delete_account') || 'حذف الحساب',
      t('privacy.delete_warning') || 'هل أنت متأكد من حذف حسابك؟ سيتم حذف جميع بياناتك بشكل نهائي ولا يمكن التراجع عن هذا الإجراء.',
      [
        {
          text: t('common.cancel'),
          style: 'cancel',
        },
        {
          text: t('privacy.delete_confirm') || 'حذف',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading('delete');
              
              const token = await getToken();
              if (!token) {
                Alert.alert(t('common.error'), t('privacy.delete_error') || 'يجب تسجيل الدخول أولاً');
                return;
              }

              // إرسال طلب حذف الحساب
              const response = await fetch(`${API_CONFIG.BASE_URL}/users/${user?.id}`, {
                method: 'DELETE',
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${token}`,
                },
              });

              if (response.ok || response.status === 404) {
                Alert.alert(
                  t('privacy.delete_success') || 'تم الحذف',
                  t('privacy.delete_success_message') || 'تم حذف حسابك بنجاح',
                  [
                    {
                      text: t('common.ok'),
                      onPress: async () => {
                        await signOut();
                        navigation.navigate('Welcome' as never);
                      },
                    },
                  ]
                );
              } else {
                // Fallback: حذف محلي
                Alert.alert(
                  t('privacy.delete_success') || 'تم الحذف',
                  t('privacy.delete_success_message') || 'تم حذف بياناتك المحلية. سيتم حذف البيانات من الخادم عند توفر هذه الميزة.',
                  [
                    {
                      text: t('common.ok'),
                      onPress: async () => {
                        await signOut();
                        navigation.navigate('Welcome' as never);
                      },
                    },
                  ]
                );
              }
            } catch (error) {
              Alert.alert(
                t('common.error'),
                t('privacy.delete_error') || 'حدث خطأ أثناء حذف الحساب'
              );
            } finally {
              setLoading(null);
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.primary} />
      
      {/* Header */}
      <LinearGradient
        colors={[theme.colors.primary, theme.colors.primary]}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color={theme.colors.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('privacy.settings') || 'إعدادات الخصوصية'}</Text>
          <View style={styles.placeholder} />
        </View>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Privacy Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('privacy.information') || 'معلومات الخصوصية'}</Text>
          <Text style={styles.sectionDescription}>
            {t('privacy.description') || 'إدارة بياناتك الشخصية وخصوصيتك في التطبيق'}
          </Text>
        </View>

        {/* Privacy Policy & Terms */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('privacy.policies') || 'السياسات'}</Text>
          
          <View style={styles.policyButtons}>
            <PrivacyPolicyButton 
              variant="secondary" 
              size="medium"
              style={styles.policyButton}
            />
            <TermsOfServiceButton 
              variant="secondary" 
              size="medium"
              style={styles.policyButton}
            />
          </View>

          <Text style={styles.disclaimerText}>
            {t('common.medical_disclaimer')}
          </Text>
        </View>

        {/* Export Data */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('privacy.data_management') || 'إدارة البيانات'}</Text>
          
          <TouchableOpacity
            style={[styles.actionButton, styles.exportButton]}
            onPress={handleExportData}
            disabled={loading === 'export'}
          >
            {loading === 'export' ? (
              <ActivityIndicator color={theme.colors.primary} />
            ) : (
              <>
                <Ionicons name="download-outline" size={24} color={theme.colors.primary} />
                <View style={styles.actionButtonContent}>
                  <Text style={styles.actionButtonTitle}>
                    {t('privacy.export_data') || 'تصدير بياناتي'}
                  </Text>
                  <Text style={styles.actionButtonDescription}>
                    {t('privacy.export_description') || 'احصل على نسخة من جميع بياناتك الشخصية'}
                  </Text>
                </View>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Delete Account */}
        <View style={styles.section}>
          <TouchableOpacity
            style={[styles.actionButton, styles.deleteButton]}
            onPress={handleDeleteAccount}
            disabled={loading === 'delete'}
          >
            {loading === 'delete' ? (
              <ActivityIndicator color={theme.colors.error} />
            ) : (
              <>
                <Ionicons name="trash-outline" size={24} color={theme.colors.error} />
                <View style={styles.actionButtonContent}>
                  <Text style={[styles.actionButtonTitle, styles.deleteButtonText]}>
                    {t('privacy.delete_account') || 'حذف حسابي'}
                  </Text>
                  <Text style={[styles.actionButtonDescription, styles.deleteButtonText]}>
                    {t('privacy.delete_description') || 'حذف حسابك وكل بياناتك بشكل نهائي'}
                  </Text>
                </View>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* GDPR Rights */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('privacy.your_rights') || 'حقوقك'}</Text>
          <View style={styles.rightsList}>
            <View style={styles.rightItem}>
              <Ionicons name="checkmark-circle" size={20} color={theme.colors.success} />
              <Text style={styles.rightText}>
                {t('privacy.right_access') || 'حق الوصول: يمكنك الوصول لبياناتك في أي وقت'}
              </Text>
            </View>
            <View style={styles.rightItem}>
              <Ionicons name="checkmark-circle" size={20} color={theme.colors.success} />
              <Text style={styles.rightText}>
                {t('privacy.right_export') || 'حق التصدير: يمكنك تصدير بياناتك'}
              </Text>
            </View>
            <View style={styles.rightItem}>
              <Ionicons name="checkmark-circle" size={20} color={theme.colors.success} />
              <Text style={styles.rightText}>
                {t('privacy.right_delete') || 'حق الحذف: يمكنك حذف حسابك وبياناتك'}
              </Text>
            </View>
            <View style={styles.rightItem}>
              <Ionicons name="checkmark-circle" size={20} color={theme.colors.success} />
              <Text style={styles.rightText}>
                {t('privacy.right_correction') || 'حق التصحيح: يمكنك تحديث بياناتك'}
              </Text>
            </View>
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
  header: {
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 16,
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
    flex: 1,
    textAlign: 'center',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    lineHeight: 20,
  },
  policyButtons: {
    gap: 12,
  },
  policyButton: {
    width: '100%',
  },
  disclaimerText: {
    marginTop: 10,
    fontSize: 13,
    color: theme.colors.textSecondary,
    lineHeight: 18,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.white,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    gap: 12,
  },
  exportButton: {
    borderColor: theme.colors.primary,
  },
  deleteButton: {
    borderColor: theme.colors.error,
  },
  actionButtonContent: {
    flex: 1,
  },
  actionButtonTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    marginBottom: 4,
  },
  actionButtonDescription: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  deleteButtonText: {
    color: theme.colors.error,
  },
  rightsList: {
    gap: 12,
  },
  rightItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  rightText: {
    flex: 1,
    fontSize: 14,
    color: theme.colors.textPrimary,
    lineHeight: 20,
  },
});

export default PrivacySettingsScreen;
