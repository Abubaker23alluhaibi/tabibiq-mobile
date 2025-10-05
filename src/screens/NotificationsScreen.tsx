import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
  StatusBar,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../utils/theme';
import { useNotifications } from '../contexts/NotificationContext';
import { useAuth } from '../contexts/AuthContext';

const NotificationsScreen = () => {
  const navigation = useNavigation();
  const { t } = useTranslation();
  const { user, profile } = useAuth();
  const {
    notifications,
    scheduledNotifications,
    isNotificationEnabled,
    registerForNotifications,
    cancelNotification,
    refreshScheduledNotifications,
    refreshDoctorNotifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    getTimeAgo,
    syncNotificationsWithServer,
    sendNotification,
    clearDuplicateNotifications,
  } = useNotifications();

  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // عند فتح الشاشة نحدد جميع الإشعارات كمقروءة لتصفير العداد فوراً
  useFocusEffect(
    useCallback(() => {
      const run = async () => {
        try {

          const unreadNotifications = notifications.filter(n => !n.isRead);

          
          if (unreadNotifications.length > 0) {

            await markAllNotificationsAsRead();

          }
        } catch (e) {
          // خطأ في تحديد الإشعارات كمقروءة
        }
      };
      run();
    }, [notifications, markAllNotificationsAsRead])
  );

  useEffect(() => {
    if (!isNotificationEnabled) {
      registerForNotifications();
    }
    refreshScheduledNotifications();
    // تنظيف الإشعارات المكررة عند تحميل الصفحة
    if (notifications.length > 0) {
      clearDuplicateNotifications();
    }
  }, []);

  // تحديد جميع الإشعارات كمقروءة عند فتح الصفحة
  useEffect(() => {
    const markAllAsReadOnOpen = async () => {
      const unreadNotifications = notifications.filter(n => !n.isRead);
      if (unreadNotifications.length > 0) {
        await markAllNotificationsAsRead();
      }
    };

    markAllAsReadOnOpen();
  }, [notifications, markAllNotificationsAsRead]);

  const onRefresh = async () => {
    setRefreshing(true);
    try {


      // تحديث الإشعارات المجدولة
      await refreshScheduledNotifications();

      // تحديث إشعارات الطبيب
      if (profile?._id) {
        await refreshDoctorNotifications(profile._id);
      }

      // مزامنة مع الخادم - استخدام معرف المستخدم أو الطبيب
      const userId = user?.id || profile?._id;
      if (userId) {
        await syncNotificationsWithServer(userId, !!profile?._id);
      } else {

      }

      // تنظيف الإشعارات المكررة بعد التحديث
      if (notifications.length > 0) {
        await clearDuplicateNotifications();
      }


    } catch (error) {
      // خطأ في تحديث الإشعارات
    } finally {
      setRefreshing(false);
    }
  };

  const handleNotificationPress = async (notification: any) => {

    
    // تحديد الإشعار كمقروء إذا لم يكن مقروءاً
    if (!notification.isRead) {
      try {
        await markNotificationAsRead(notification.id);

        
        // تحديث فوري للواجهة
        setRefreshing(true);
        setTimeout(() => {
          setRefreshing(false);
        }, 500);
      } catch (error) {
        // فشل في تحديد الإشعار كمقروء
      }
    }

    const { type, appointmentId, doctorId, medicineId } =
      notification.data || {};

    switch (type) {
      case 'appointment':
        navigation.navigate('MyAppointments' as never);
        break;
      case 'medicine':
        navigation.navigate('MedicineReminder' as never);
        break;
      case 'doctor':
        if (doctorId) {
          // @ts-ignore
          navigation.navigate('DoctorDetails', { doctorId });
        }
        break;
      default:

    }
  };

  const handleDeleteNotification = async (notificationId: string) => {
    try {
      await cancelNotification(notificationId);
      Alert.alert('تم الحذف', 'تم حذف الإشعار بنجاح');
    } catch (error) {
      Alert.alert('خطأ', 'فشل في حذف الإشعار');
    }
  };



  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'appointment':
        return 'calendar';
      case 'medicine':
        return 'medical';
      case 'doctor':
        return 'person';
      case 'system':
        return 'settings';
      default:
        return 'notifications';
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'appointment':
        return theme.colors.primary;
      case 'medicine':
        return theme.colors.warning;
      case 'doctor':
        return theme.colors.success;
      case 'system':
        return theme.colors.textSecondary;
      default:
        return theme.colors.primary;
    }
  };

  // دالة محسنة لحساب الوقت المنقضي
  const formatNotificationTime = (timestamp: number | string) => {
    try {
      let date: Date;

      if (typeof timestamp === 'string') {
        // إذا كان التاريخ بصيغة ISO string
        if (timestamp.includes('T') || timestamp.includes('Z')) {
          date = new Date(timestamp);
        } else {
          // إذا كان التاريخ بصيغة أخرى، استخدم getTimeAgo
          return getTimeAgo(timestamp);
        }
      } else {
        date = new Date(timestamp);
      }

      const now = new Date();
      const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

      if (diffInSeconds < 60) {
        return 'الآن';
      } else if (diffInSeconds < 3600) {
        const minutes = Math.floor(diffInSeconds / 60);
        return `منذ ${minutes} دقيقة`;
      } else if (diffInSeconds < 86400) {
        const hours = Math.floor(diffInSeconds / 3600);
        return `منذ ${hours} ساعة`;
      } else {
        const days = Math.floor(diffInSeconds / 86400);
        if (days < 7) {
          return `منذ ${days} يوم`;
        } else {
          return date.toLocaleDateString('ar-EG');
        }
      }
    } catch (error) {
      return 'وقت غير محدد';
    }
  };

  const renderNotificationItem = (notification: any, index: number) => {
    
    return (
    <TouchableOpacity
      key={`${notification.id || 'local'}_${index}_${Date.now()}`}
      style={[
        styles.notificationItem,
        !notification.isRead && styles.unreadNotification,
      ]}
      onPress={() => handleNotificationPress(notification)}
    >
      <View style={styles.notificationIcon}>
        <Ionicons
          name={getNotificationIcon(notification.type) as any}
          size={24}
          color={getNotificationColor(notification.type)}
        />
        {!notification.isRead && <View style={styles.unreadIndicator} />}
      </View>

      <View style={styles.notificationContent}>
        <Text
          style={[
            styles.notificationTitle,
            !notification.isRead && styles.unreadTitle,
          ]}
        >
          {notification.title || notification.content?.title || 'إشعار جديد'}
        </Text>
        <Text style={styles.notificationBody}>
          {notification.body ||
            notification.content?.body ||
            notification.message ||
            'لا يوجد محتوى'}
        </Text>
        <Text style={styles.notificationTime}>
          {formatNotificationTime(
            notification.createdAt ||
              notification.timestamp ||
              notification.created_at ||
              Date.now()
          )}
        </Text>
      </View>

      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => handleDeleteNotification(notification.id)}
      >
        <Ionicons name="trash-outline" size={20} color={theme.colors.error} />
      </TouchableOpacity>
    </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons
        name="notifications-off"
        size={64}
        color={theme.colors.textSecondary}
      />
      <Text style={styles.emptyTitle}>
        {t('notifications.no_notifications')}
      </Text>
      <Text style={styles.emptySubtitle}>
        ستظهر هنا الإشعارات الجديدة عند وصولها
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="light-content"
        backgroundColor={theme.colors.primary}
      />

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

          <Text style={styles.headerTitle}>{t('notifications.title')}</Text>

          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.refreshButton}
              onPress={onRefresh}
              disabled={refreshing}
            >
              <Ionicons
                name={refreshing ? 'hourglass' : 'refresh'}
                size={20}
                color={theme.colors.white}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.markAllReadButton}
              onPress={() => markAllNotificationsAsRead()}
            >
              <Ionicons
                name="checkmark-done"
                size={20}
                color={theme.colors.white}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.settingsButton}
              onPress={() =>
                navigation.navigate('NotificationSettings' as never)
              }
            >
              <Ionicons
                name="settings-outline"
                size={20}
                color={theme.colors.white}
              />
            </TouchableOpacity>


          </View>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* تمت إزالة إحصائيات الإشعارات ومعلومات التصحيح بناءً على الطلب */}

        {/* حالة الإشعارات */}
        <View style={styles.statusContainer}>
          <View style={styles.statusCard}>
            <View style={styles.statusIcon}>
              <Ionicons
                name={
                  isNotificationEnabled ? 'notifications' : 'notifications-off'
                }
                size={32}
                color={
                  isNotificationEnabled
                    ? theme.colors.success
                    : theme.colors.error
                }
              />
            </View>

            <View style={styles.statusContent}>
              <Text style={styles.statusTitle}>
                {isNotificationEnabled
                  ? t('notifications.enable')
                  : t('notifications.disable')}
              </Text>
              <Text style={styles.statusDescription}>
                {isNotificationEnabled
                  ? t('notifications.enable_description')
                  : t('notifications.disable_description')}
              </Text>
            </View>
          </View>

          {!isNotificationEnabled && (
            <TouchableOpacity
              style={styles.enableButton}
              onPress={() => registerForNotifications()}
            >
              <Text style={styles.enableButtonText}>
                {t('notifications.enable')}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* قائمة الإشعارات */}
        <View style={styles.notificationsSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              {t('notifications.recent_notifications')}
            </Text>
          </View>

          {notifications.length > 0
            ? notifications.map(renderNotificationItem)
            : renderEmptyState()}
        </View>

        {/* الإشعارات المجدولة */}
        {false}
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
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.white,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  refreshButton: {
    padding: 8,
    marginRight: 8,
  },
  markAllReadButton: {
    padding: 8,
    marginRight: 8,
  },

  settingsButton: {
    padding: 8,
    marginLeft: 8,
  },
  testButton: {
    padding: 8,
    marginLeft: 8,
  },
  content: {
    flex: 1,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: theme.colors.white,
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 4,
    alignItems: 'center',
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginTop: 4,
  },
  statusContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
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
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 12,
  },
  enableButtonText: {
    color: theme.colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  notificationsSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  scheduledSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
  },
  sectionCount: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  notificationItem: {
    backgroundColor: theme.colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  unreadNotification: {
    backgroundColor: theme.colors.background,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.primary,
  },
  scheduledNotificationItem: {
    backgroundColor: theme.colors.background,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  notificationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    position: 'relative',
  },
  unreadIndicator: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: theme.colors.primary,
    borderWidth: 2,
    borderColor: theme.colors.white,
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
    marginBottom: 4,
  },
  unreadTitle: {
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  notificationBody: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginBottom: 4,
  },
  notificationTime: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  deleteButton: {
    padding: 8,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },

});

export default NotificationsScreen;
