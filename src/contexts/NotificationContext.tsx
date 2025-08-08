import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import * as Notifications from 'expo-notifications';
import NotificationService, { NotificationData } from '../services/NotificationService';
import { useAuth } from './AuthContext';

interface NotificationContextType {
  notifications: NotificationData[];
  scheduledNotifications: Notifications.NotificationRequest[];
  registerForNotifications: () => Promise<void>;
  registerForDoctorNotifications: () => Promise<void>;
  sendNotification: (notification: Omit<NotificationData, 'id'>) => Promise<void>;
  scheduleAppointmentReminder: (
    appointmentId: string,
    appointmentDate: Date,
    doctorName: string,
    patientName: string
  ) => Promise<void>;
  scheduleMedicineReminder: (
    medicineId: string,
    medicineName: string,
    dosage: string,
    time: Date,
    frequency: 'daily' | 'twice_daily' | 'thrice_daily' | 'custom'
  ) => Promise<void>;
  sendDoctorNotification: (
    doctorId: string,
    doctorName: string,
    message: string,
    type: 'appointment_update' | 'prescription' | 'general'
  ) => Promise<void>;
  cancelNotification: (notificationId: string) => Promise<void>;
  cancelAllNotifications: () => Promise<void>;
  refreshScheduledNotifications: () => Promise<void>;
  isNotificationEnabled: boolean;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [scheduledNotifications, setScheduledNotifications] = useState<Notifications.NotificationRequest[]>([]);
  const [isNotificationEnabled, setIsNotificationEnabled] = useState(false);
  const { user, profile } = useAuth();

  // تسجيل الإشعارات عند بدء التطبيق
  const registerForNotifications = async () => {
    try {
      console.log('🔔 بدء تسجيل إشعارات المستخدم...');
      const token = await NotificationService.registerForUserNotifications(user?.id || '');
      
      if (token) {
        setIsNotificationEnabled(true);
        console.log('✅ تم تفعيل إشعارات المستخدم بنجاح');
        
        // تحميل الإشعارات المجدولة
        await refreshScheduledNotifications();
      } else {
        setIsNotificationEnabled(false);
        console.log('❌ فشل في تفعيل إشعارات المستخدم');
      }
    } catch (error) {
      console.error('❌ خطأ في تسجيل إشعارات المستخدم:', error);
      setIsNotificationEnabled(false);
    }
  };

  // تسجيل إشعارات الطبيب
  const registerForDoctorNotifications = async () => {
    try {
      console.log('🔔 بدء تسجيل إشعارات الطبيب...');
      const token = await NotificationService.registerForDoctorNotifications(profile?._id || '');
      
      if (token) {
        setIsNotificationEnabled(true);
        console.log('✅ تم تفعيل إشعارات الطبيب بنجاح');
        
        // تحميل الإشعارات المجدولة
        await refreshScheduledNotifications();
      } else {
        setIsNotificationEnabled(false);
        console.log('❌ فشل في تفعيل إشعارات الطبيب');
      }
    } catch (error) {
      console.error('❌ خطأ في تسجيل إشعارات الطبيب:', error);
      setIsNotificationEnabled(false);
    }
  };

  // إرسال إشعار فوري
  const sendNotification = async (notification: Omit<NotificationData, 'id'>) => {
    try {
      const notificationId = await NotificationService.sendImmediateNotification(notification);
      
      const newNotification: NotificationData = {
        id: notificationId,
        ...notification,
      };
      
      setNotifications(prev => [newNotification, ...prev]);
      console.log('✅ تم إرسال الإشعار:', notificationId);
    } catch (error) {
      console.error('❌ خطأ في إرسال الإشعار:', error);
      throw error;
    }
  };

  // جدولة تذكير بالموعد
  const scheduleAppointmentReminder = async (
    appointmentId: string,
    appointmentDate: Date,
    doctorName: string,
    patientName: string
  ) => {
    try {
      const notificationId = await NotificationService.scheduleAppointmentReminder(
        appointmentId,
        appointmentDate,
        doctorName,
        patientName
      );
      
      console.log('✅ تم جدولة تذكير الموعد:', notificationId);
      await refreshScheduledNotifications();
    } catch (error) {
      console.error('❌ خطأ في جدولة تذكير الموعد:', error);
      throw error;
    }
  };

  // جدولة تذكير بالدواء
  const scheduleMedicineReminder = async (
    medicineId: string,
    medicineName: string,
    dosage: string,
    time: Date,
    frequency: 'daily' | 'twice_daily' | 'thrice_daily' | 'custom'
  ) => {
    try {
      const notificationId = await NotificationService.scheduleMedicineReminder(
        medicineId,
        medicineName,
        dosage,
        time,
        frequency
      );
      
      console.log('✅ تم جدولة تذكير الدواء:', notificationId);
      await refreshScheduledNotifications();
    } catch (error) {
      console.error('❌ خطأ في جدولة تذكير الدواء:', error);
      throw error;
    }
  };

  // إرسال إشعار من الطبيب
  const sendDoctorNotification = async (
    doctorId: string,
    doctorName: string,
    message: string,
    type: 'appointment_update' | 'prescription' | 'general'
  ) => {
    try {
      const notificationId = await NotificationService.sendDoctorNotification(
        doctorId,
        doctorName,
        message,
        type
      );
      
      console.log('✅ تم إرسال إشعار الطبيب:', notificationId);
    } catch (error) {
      console.error('❌ خطأ في إرسال إشعار الطبيب:', error);
      throw error;
    }
  };

  // إلغاء إشعار محدد
  const cancelNotification = async (notificationId: string) => {
    try {
      await NotificationService.cancelNotification(notificationId);
      
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      await refreshScheduledNotifications();
      
      console.log('✅ تم إلغاء الإشعار:', notificationId);
    } catch (error) {
      console.error('❌ خطأ في إلغاء الإشعار:', error);
      throw error;
    }
  };

  // إلغاء جميع الإشعارات
  const cancelAllNotifications = async () => {
    try {
      await NotificationService.cancelAllNotifications();
      
      setNotifications([]);
      setScheduledNotifications([]);
      
      console.log('✅ تم إلغاء جميع الإشعارات');
    } catch (error) {
      console.error('❌ خطأ في إلغاء جميع الإشعارات:', error);
      throw error;
    }
  };

  // تحديث الإشعارات المجدولة
  const refreshScheduledNotifications = async () => {
    try {
      const scheduled = await NotificationService.getScheduledNotifications();
      setScheduledNotifications(scheduled);
      console.log('📋 تم تحديث الإشعارات المجدولة:', scheduled.length);
    } catch (error) {
      console.error('❌ خطأ في تحديث الإشعارات المجدولة:', error);
    }
  };

  // إعداد مستمعي الإشعارات
  useEffect(() => {
    let notificationListener: Notifications.Subscription;
    let responseListener: Notifications.Subscription;

    const setupNotificationListeners = () => {
      // مستمع للإشعارات المستلمة
      notificationListener = NotificationService.addNotificationListener((notification) => {
        console.log('📱 تم استلام إشعار:', notification);
        
        const notificationData: NotificationData = {
          id: notification.request.identifier,
          title: notification.request.content.title || '',
          body: notification.request.content.body || '',
          data: notification.request.content.data,
          type: notification.request.content.data?.type || 'general',
        };
        
        setNotifications(prev => [notificationData, ...prev]);
      });

      // مستمع لتفاعل المستخدم مع الإشعار
      responseListener = NotificationService.addNotificationResponseListener((response) => {
        console.log('👆 تم التفاعل مع الإشعار:', response);
        
        const { type, appointmentId, doctorId, medicineId } = response.notification.request.content.data || {};
        
        // معالجة التفاعل حسب نوع الإشعار
        switch (type) {
          case 'appointment':
            // التنقل إلى صفحة المواعيد
            console.log('📅 إشعار موعد:', appointmentId);
            break;
          case 'medicine':
            // التنقل إلى صفحة تذكير الدواء
            console.log('💊 إشعار دواء:', medicineId);
            break;
          case 'doctor':
            // التنقل إلى صفحة الطبيب
            console.log('👨‍⚕️ إشعار طبيب:', doctorId);
            break;
          default:
            console.log('📱 إشعار عام');
        }
      });
    };

    setupNotificationListeners();

    // تنظيف المستمعين عند إزالة المكون
    return () => {
      if (notificationListener) {
        NotificationService.removeNotificationListener(notificationListener);
      }
      if (responseListener) {
        NotificationService.removeNotificationListener(responseListener);
      }
    };
  }, []);

  // تسجيل الإشعارات عند تسجيل الدخول
  useEffect(() => {
    if (user && !profile) {
      // تسجيل إشعارات المستخدم العادي
      registerForNotifications();
    } else if (profile) {
      // تسجيل إشعارات الطبيب
      registerForDoctorNotifications();
    }
  }, [user, profile]);

  const value: NotificationContextType = {
    notifications,
    scheduledNotifications,
    registerForNotifications,
    registerForDoctorNotifications,
    sendNotification,
    scheduleAppointmentReminder,
    scheduleMedicineReminder,
    sendDoctorNotification,
    cancelNotification,
    cancelAllNotifications,
    refreshScheduledNotifications,
    isNotificationEnabled,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};
