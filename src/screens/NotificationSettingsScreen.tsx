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
import PrivacyPolicyButton from '../components/PrivacyPolicyButton';

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
        t('common.success'),
        t('notifications.notification_settings.enable_success'),
        [{ text: t('notifications.notification_settings.ok_button') }]
      );
    } catch (error) {
      Alert.alert(
        t('common.error'),
        t('notifications.notification_settings.enable_error'),
        [{ text: t('notifications.notification_settings.ok_button') }]
      );
    }
  };

  const handleClearAllNotifications = () => {
    Alert.alert(
      t('notifications.notification_settings.clear_confirm_title'),
      t('notifications.notification_settings.clear_confirm_message'),
      [
        { text: t('notifications.notification_settings.cancel_button'), style: 'cancel' },
        {
          text: t('notifications.notification_settings.clear_button'),
          style: 'destructive',
          onPress: async () => {
            try {
              await cancelAllNotifications();
              Alert.alert(t('common.success'), t('notifications.notification_settings.clear_success'));
            } catch (error) {
              Alert.alert(t('common.error'), t('notifications.notification_settings.clear_error'));
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
          
          <Text style={styles.headerTitle}>{t('notifications.notification_settings.title')}</Text>
          
          <View style={styles.headerSpacer} />
        </View>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* حالة الإشعارات */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('notifications.notification_settings.status')}</Text>
          
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
                {isNotificationEnabled 
                  ? t('notifications.notification_settings.notifications_enabled_status')
                  : t('notifications.notification_settings.notifications_disabled_status')
                }
              </Text>
              <Text style={styles.statusDescription}>
                {isNotificationEnabled 
                  ? t('notifications.enable_description')
                  : t('notifications.disable_description')
                }
              </Text>
            </View>
          </View>
          
          {!isNotificationEnabled && (
            <TouchableOpacity
              style={styles.enableButton}
              onPress={handleEnableNotifications}
            >
              <Text style={styles.enableButtonText}>{t('notifications.notification_settings.enable_notifications')}</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* إعدادات الإشعارات */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('notifications.notification_settings.notification_types')}</Text>
          
          {renderSettingItem(
            'person',
            t('notifications.notification_settings.doctor_notifications'),
            t('notifications.notification_settings.doctor_notifications_desc'),
            'doctorNotifications'
          )}
          
          {renderSettingItem(
            'calendar',
            t('notifications.notification_settings.appointment_reminders_settings'),
            t('notifications.notification_settings.appointment_reminders_desc'),
            'appointmentReminders'
          )}
          
          {renderSettingItem(
            'medical',
            t('notifications.notification_settings.medicine_reminders_settings'),
            t('notifications.notification_settings.medicine_reminders_desc'),
            'medicineReminders'
          )}
          
          {renderSettingItem(
            'notifications',
            t('notifications.notification_settings.general_notifications'),
            t('notifications.notification_settings.general_notifications_desc'),
            'generalNotifications'
          )}
        </View>

        {/* إعدادات الصوت والاهتزاز */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('notifications.notification_settings.sound_vibration')}</Text>
          
          {renderSettingItem(
            'volume-high',
            t('notifications.notification_settings.sound_enabled'),
            t('notifications.notification_settings.sound_enabled_desc'),
            'soundEnabled'
          )}
          
          {renderSettingItem(
            'phone-portrait',
            t('notifications.notification_settings.vibration_enabled'),
            t('notifications.notification_settings.vibration_enabled_desc'),
            'vibrationEnabled'
          )}
        </View>

        {/* الإحصائيات */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('notifications.notification_settings.statistics')}</Text>
          
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{notifications.length}</Text>
              <Text style={styles.statLabel}>{t('notifications.notification_settings.received_notifications')}</Text>
            </View>
            
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>
                {scheduledNotifications.filter(n => n.content.data?.type === 'medicine').length}
              </Text>
              <Text style={styles.statLabel}>{t('notifications.notification_settings.medicine_reminders_count')}</Text>
            </View>
            
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>
                {scheduledNotifications.filter(n => n.content.data?.type === 'appointment').length}
              </Text>
              <Text style={styles.statLabel}>{t('notifications.notification_settings.appointment_reminders_count')}</Text>
            </View>
          </View>
        </View>

        {/* الإشعارات المجدولة */}
        {scheduledNotifications.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{t('notifications.notification_settings.scheduled_notifications')}</Text>
              <TouchableOpacity onPress={handleClearAllNotifications}>
                <Text style={styles.clearButton}>{t('notifications.notification_settings.clear_all_button')}</Text>
              </TouchableOpacity>
            </View>
            
            {scheduledNotifications.map(renderNotificationItem)}
          </View>
        )}

        {/* سياسة الخصوصية */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{t('common.privacy_policy')}</Text>
          </View>
          <View style={styles.privacySection}>
            <PrivacyPolicyButton 
              variant="secondary" 
              size="medium"
              style={styles.privacyButton}
            />
            <Text style={styles.privacyDescription}>
              {t('notifications.notification_settings.privacy_description') || 'اقرأ سياسة الخصوصية الخاصة بنا لفهم كيفية استخدام بياناتك'}
            </Text>
          </View>
        </View>
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
  privacySection: {
    backgroundColor: theme.colors.white,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  privacyButton: {
    marginBottom: 12,
  },
  privacyDescription: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default NotificationSettingsScreen;
