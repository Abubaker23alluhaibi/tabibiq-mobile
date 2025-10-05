import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Platform } from 'react-native';
import { AuthProvider } from './src/contexts/AuthContext';
import { NotificationProvider, useNotifications } from './src/contexts/NotificationContext';
import { AppProvider } from './src/contexts/AppContext';
import AppNavigator from './src/navigation/AppNavigator';
import AccountStatusChecker from './src/components/AccountStatusChecker';
import { I18nextProvider } from 'react-i18next';
import i18n from './src/locales';
import { initNotifications } from './src/utils/notifications';
import { registerBackgroundTasks } from './src/utils/backgroundTasks';
import DeepLinkingService from './src/services/DeepLinkingService';
import * as Notifications from 'expo-notifications';

// مكون لإدارة التحديث التلقائي للإشعارات
const NotificationAutoRefresh = () => {
  const { startAutoRefresh, stopAutoRefresh } = useNotifications();
  
  useEffect(() => {
    // بدء التحديث التلقائي عند تحميل التطبيق
    const interval = startAutoRefresh();
    
    // إيقاف التحديث التلقائي عند إغلاق التطبيق
    return () => {
      stopAutoRefresh(interval);
    };
  }, [startAutoRefresh, stopAutoRefresh]);
  
  return null;
};

export default function App() {
  useEffect(() => {
    initNotifications();
    registerBackgroundTasks();
    
    // إعداد مستمع للإشعارات
    const notificationListener = Notifications.addNotificationReceivedListener(notification => {
      // فقط للـ push notifications من الخادم
      if (notification.request.content.data?.isPushNotification) {
        // إظهار إشعار فوري مع صوت واهتزاز قوي
        Notifications.scheduleNotificationAsync({
          content: {
            title: notification.request.content.title,
            body: notification.request.content.body,
            sound: 'default',
            priority: Notifications.AndroidNotificationPriority.MAX,
            vibrate: [0, 1000, 500, 1000, 500, 1000],
            badge: 1,
            data: {
              ...notification.request.content.data,
              urgent: true,
              fromServer: true
            },
            ...(Platform.OS === 'android' && {
              channelId: 'appointment_cancellation',
              color: '#FF0000',
              smallIcon: 'ic_notification',
              largeIcon: 'ic_launcher',
              categoryId: 'appointment_cancellation',
              autoCancel: false,
              ongoing: false,
              visibility: Notifications.AndroidNotificationVisibility.PUBLIC,
              showTimestamp: true,
              when: Date.now(),
              // إعدادات إضافية للأندرويد
              lights: true,
              lightColor: '#FF0000',
              localOnly: false,
              sticky: false,
              tag: 'appointment_cancellation_' + Date.now()
            }),
          },
          trigger: null,
        }).catch(error => {
          // Silent error handling
        });
      }
    });

    // إعداد مستمع للنقر على الإشعارات
    const responseListener = Notifications.addNotificationResponseReceivedListener(response => {
      // Handle notification response
    });
    
    DeepLinkingService.getInstance().initialize().catch(error => {
      // Silent error handling
    });

    // تنظيف المستمعين عند إغلاق التطبيق
    return () => {
      notificationListener.remove();
      responseListener.remove();
    };
  }, []);

  return (
    <I18nextProvider i18n={i18n}>
      <AppProvider>
        <AuthProvider>
          <NotificationProvider>
            <NotificationAutoRefresh />
            <AccountStatusChecker>
              <AppNavigator />
              <StatusBar style="auto" />
            </AccountStatusChecker>
          </NotificationProvider>
        </AuthProvider>
      </AppProvider>
    </I18nextProvider>
  );
}
