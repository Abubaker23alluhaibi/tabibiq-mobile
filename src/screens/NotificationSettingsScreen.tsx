import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  StatusBar,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../utils/theme';
import { useNotifications } from '../contexts/NotificationContext';

const NotificationSettingsScreen = () => {
  const navigation = useNavigation();
  const { t } = useTranslation();
  const {
    notifications,
    scheduledNotifications,
    isNotificationEnabled,
    registerForNotifications,
    cancelAllNotifications,
    refreshScheduledNotifications,
  } = useNotifications();

  const [settings, setSettings] = useState({
    doctorNotifications: true,
    appointmentReminders: true,
    medicineReminders: true,
    generalNotifications: true,
    soundEnabled: true,
    vibrationEnabled: true,
  });

  useEffect(() => {
    refreshScheduledNotifications();
  }, []);

  const handleSettingToggle = (setting: keyof typeof settings) => {
    setSettings(prev => ({
      ...prev,
      [setting]: !prev[setting],
    }));
  };

  const handleEnableNotifications = async () => {
    try {
      await registerForNotifications();
      Alert.alert(
        'تم التفعيل',
        'تم تفعيل الإشعارات بنجاح',
        [{ text: 'حسناً' }]
      );
    } catch (error) {
      Alert.alert(
        'خطأ',
        'فشل في تفعيل الإشعارات. تأكد من منح الأذونات المطلوبة.',
        [{ text: 'حسناً' }]
      );
    }
  };

  const handleClearAllNotifications = () => {
    Alert.alert(
      'مسح جميع الإشعارات',
      'هل أنت متأكد من رغبتك في مسح جميع الإشعارات؟',
      [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'مسح',
          style: 'destructive',
          onPress: async () => {
            try {
              await cancelAllNotifications();
              Alert.alert('تم المسح', 'تم مسح جميع الإشعارات بنجاح');
            } catch (error) {
              Alert.alert('خطأ', 'فشل في مسح الإشعارات');
            }
          },
        },
      ]
    );
  };

  const renderSettingItem = (
    icon: string,
    title: string,
    description: string,
    setting: keyof typeof settings,
    showSwitch: boolean = true
  ) => (
    <View style={styles.settingItem}>
      <View style={styles.settingIcon}>
        <Ionicons name={icon as any} size={24} color={theme.colors.primary} />
      </View>
      
      <View style={styles.settingContent}>
        <Text style={styles.settingTitle}>{title}</Text>
        <Text style={styles.settingDescription}>{description}</Text>
      </View>
      
      {showSwitch && (
        <Switch
          value={settings[setting]}
          onValueChange={() => handleSettingToggle(setting)}
          trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
          thumbColor={settings[setting] ? theme.colors.white : theme.colors.textSecondary}
        />
      )}
    </View>
  );

  const renderNotificationItem = (notification: any, index: number) => (
    <View key={index} style={styles.notificationItem}>
      <View style={styles.notificationIcon}>
        <Ionicons 
          name={
            notification.content.data?.type === 'medicine' ? 'medical' :
            notification.content.data?.type === 'appointment' ? 'calendar' :
            notification.content.data?.type === 'doctor' ? 'person' :
            'notifications'
          } 
          size={20} 
          color={theme.colors.primary} 
        />
      </View>
      
      <View style={styles.notificationContent}>
        <Text style={styles.notificationTitle}>
          {notification.content.title}
        </Text>
        <Text style={styles.notificationBody}>
          {notification.content.body}
        </Text>
        <Text style={styles.notificationTime}>
          {new Date(notification.trigger?.date || Date.now()).toLocaleString('ar-EG')}
        </Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.primary} />
      
      <LinearGradient
        colors={[theme.colors.primary, theme.colors.primaryDark]}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color={theme.colors.white} />
          </TouchableOpacity>
          
          <Text style={styles.headerTitle}>إعدادات الإشعارات</Text>
          
          <View style={styles.headerSpacer} />
        </View>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* حالة الإشعارات */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>حالة الإشعارات</Text>
          
          <View style={styles.statusCard}>
            <View style={styles.statusIcon}>
              <Ionicons 
                name={isNotificationEnabled ? 'notifications' : 'notifications-off'} 
                size={32} 
                color={isNotificationEnabled ? theme.colors.success : theme.colors.error} 
              />
            </View>
            
            <View style={styles.statusContent}>
              <Text style={styles.statusTitle}>
                {isNotificationEnabled ? 'الإشعارات مفعلة' : 'الإشعارات معطلة'}
              </Text>
              <Text style={styles.statusDescription}>
                {isNotificationEnabled 
                  ? 'ستتلقى إشعارات حول المواعيد والأدوية والرسائل من الأطباء'
                  : 'قم بتفعيل الإشعارات لتلقي التحديثات المهمة'
                }
              </Text>
            </View>
          </View>
          
          {!isNotificationEnabled && (
            <TouchableOpacity
              style={styles.enableButton}
              onPress={handleEnableNotifications}
            >
              <Text style={styles.enableButtonText}>تفعيل الإشعارات</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* إعدادات الإشعارات */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>أنواع الإشعارات</Text>
          
          {renderSettingItem(
            'person',
            'إشعارات الأطباء',
            'رسائل وتحديثات من الأطباء',
            'doctorNotifications'
          )}
          
          {renderSettingItem(
            'calendar',
            'تذكير المواعيد',
            'تذكير قبل ساعة من الموعد',
            'appointmentReminders'
          )}
          
          {renderSettingItem(
            'medical',
            'تذكير الأدوية',
            'تذكير بمواعيد تناول الأدوية',
            'medicineReminders'
          )}
          
          {renderSettingItem(
            'notifications',
            'الإشعارات العامة',
            'إشعارات النظام والتحديثات',
            'generalNotifications'
          )}
        </View>

        {/* إعدادات الصوت والاهتزاز */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>الصوت والاهتزاز</Text>
          
          {renderSettingItem(
            'volume-high',
            'صوت الإشعارات',
            'تشغيل صوت عند استلام الإشعارات',
            'soundEnabled'
          )}
          
          {renderSettingItem(
            'phone-portrait',
            'اهتزاز الجهاز',
            'اهتزاز الجهاز عند استلام الإشعارات',
            'vibrationEnabled'
          )}
        </View>

        {/* الإحصائيات */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>إحصائيات الإشعارات</Text>
          
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{notifications.length}</Text>
              <Text style={styles.statLabel}>الإشعارات المستلمة</Text>
            </View>
            
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>
                {scheduledNotifications.filter(n => n.content.data?.type === 'medicine').length}
              </Text>
              <Text style={styles.statLabel}>تذكيرات الأدوية</Text>
            </View>
            
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>
                {scheduledNotifications.filter(n => n.content.data?.type === 'appointment').length}
              </Text>
              <Text style={styles.statLabel}>تذكيرات المواعيد</Text>
            </View>
          </View>
        </View>

        {/* الإشعارات المجدولة */}
        {scheduledNotifications.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>الإشعارات المجدولة</Text>
              <TouchableOpacity onPress={handleClearAllNotifications}>
                <Text style={styles.clearButton}>مسح الكل</Text>
              </TouchableOpacity>
            </View>
            
            {scheduledNotifications.map(renderNotificationItem)}
          </View>
        )}
      </ScrollView>
    </View>
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
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.white + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.white,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  section: {
    margin: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  statusCard: {
    backgroundColor: theme.colors.white,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  statusIcon: {
    marginRight: 16,
  },
  statusContent: {
    flex: 1,
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
    marginBottom: 4,
  },
  statusDescription: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  enableButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 16,
  },
  enableButtonText: {
    color: theme.colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  settingItem: {
    backgroundColor: theme.colors.white,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  settingIcon: {
    marginRight: 16,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    flex: 1,
    backgroundColor: theme.colors.white,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginHorizontal: 4,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  notificationItem: {
    backgroundColor: theme.colors.white,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  notificationIcon: {
    marginRight: 12,
    marginTop: 2,
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    marginBottom: 4,
  },
  notificationBody: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginBottom: 8,
  },
  notificationTime: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  clearButton: {
    color: theme.colors.error,
    fontSize: 14,
    fontWeight: '600',
  },
});

export default NotificationSettingsScreen;
