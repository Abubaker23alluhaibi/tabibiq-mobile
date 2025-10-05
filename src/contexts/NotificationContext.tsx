import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AppState, Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NotificationService, { NotificationData } from '../services/NotificationService';
import { api } from '../services/api';
import { logger, logError, logWarn, logInfo, logDebug, logNotificationEvent, logApiCall, logApiResponse } from '../utils/logger';

// إعداد الإشعارات
Notifications.setNotificationHandler({
  handleNotification: async (notification) => {
    logNotificationEvent('استقبال إشعار في Context', { 
      id: notification.request.identifier,
      title: notification.request.content.title 
    });
    
    // إعدادات خاصة للإشعارات العاجلة
    const isUrgent = notification.request.content.data?.urgent || 
                    notification.request.content.data?.type === 'appointment_cancelled';
    
    if (isUrgent) {
      logDebug('إشعار عاجل - إعدادات قصوى');
    }
    
    // إظهار إشعار فوري مع صوت واهتزاز قوي
    return {
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
      shouldShowBanner: true,
      shouldShowList: true,
    };
  },
});

interface NotificationProviderProps {
  children: ReactNode;
}

interface NotificationContextType {
  notifications: NotificationData[];
  scheduledNotifications: any[];
  isNotificationEnabled: boolean;
  registerForNotifications: () => Promise<void>;
  registerForDoctorNotifications: (doctorId: string) => Promise<string | null>;
  sendNotification: (notification: Omit<NotificationData, 'id'>) => Promise<string>;
  scheduleAppointmentReminder: (
    appointmentId: string,
    appointmentDate: Date,
    doctorName: string,
    patientName: string,
    leadMinutes?: number
  ) => Promise<string>;
  scheduleMedicineReminder: (
    medicineId: string,
    medicineName: string,
    dosage: string,
    reminderTime: Date,
    frequency?: 'once' | 'daily' | 'twice_daily' | 'thrice_daily' | 'custom'
  ) => Promise<string>;
  rescheduleAllMedicineNotifications: () => Promise<void>;
  scheduleMedicineNotificationsIfNeeded: () => Promise<void>;
  syncNotificationsWithServer: (userId?: string, isDoctor?: boolean) => Promise<void>;
  sendDoctorNotification: (notification: Omit<NotificationData, 'id'>) => Promise<string>;
  sendAppointmentNotificationToDoctor: (
    doctorId: string,
    appointmentId: string,
    patientName: string,
    appointmentDate: Date,
    appointmentTime: string
  ) => Promise<boolean>;
  sendAppointmentCancellationNotification: (
    patientId: string,
    patientName: string,
    doctorName: string,
    appointmentDate: Date,
    appointmentTime: string,
    appointmentId: string,
    isBookingForOther?: boolean,
    bookerName?: string
  ) => Promise<void>;
  cancelNotification: (notificationId: string) => Promise<void>;
  cancelAllNotifications: () => Promise<void>;
  clearNotificationsOnLogout: () => Promise<void>;
  refreshScheduledNotifications: () => Promise<void>;
  refreshDoctorNotifications: (doctorId: string) => Promise<void>;
  markNotificationAsRead: (notificationId: string) => Promise<void>;
  markAllNotificationsAsRead: () => Promise<void>;
  getTimeAgo: (date: string) => string;
  loadNotificationsFromStorage: () => Promise<void>;
  serverStatus: 'connected' | 'disconnected' | 'checking';
  lastSyncAttempt: Date | null;
  checkNotificationStatus: () => Promise<boolean>;
  showAlternativeNotification: (title: string, body: string) => void;
  testUrgentNotification: () => Promise<void>;
  checkAndRescheduleMissingNotifications: () => Promise<void>;
  loadNotificationsForUser: () => Promise<void>;
  rescheduleAllNotificationsOnAppStart: () => Promise<void>;
  clearDuplicateNotifications: () => Promise<void>;
  startAutoRefresh: () => ReturnType<typeof setInterval>;
  stopAutoRefresh: (interval: ReturnType<typeof setInterval>) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [scheduledNotifications, setScheduledNotifications] = useState<any[]>([]);
  const [isNotificationEnabled, setIsNotificationEnabled] = useState(false);
  const [serverStatus, setServerStatus] = useState<'connected' | 'disconnected' | 'checking'>('checking');
  const [lastSyncAttempt, setLastSyncAttempt] = useState<Date | null>(null);

  // دالة لتحميل الإشعارات من التخزين المحلي
  const loadNotificationsFromStorage = async () => {
    try {
      const stored = await AsyncStorage.getItem('notifications');
      if (stored) {
        const parsedNotifications = JSON.parse(stored);
        setNotifications(parsedNotifications);
        logInfo('تم تحميل الإشعارات من التخزين المحلي', { count: parsedNotifications.length });
      }
        } catch (error) {
      logError('خطأ في تحميل الإشعارات من التخزين المحلي', error);
    }
  };

  // دالة لحفظ الإشعارات في التخزين المحلي
  const saveNotificationsToStorage = async (notifications: NotificationData[]) => {
    try {
      await AsyncStorage.setItem('notifications', JSON.stringify(notifications));
    } catch (error) {
      logError('خطأ في حفظ الإشعارات في التخزين المحلي', error);
    }
  };

  // دالة لتسجيل الإشعارات
  const registerForNotifications = async () => {
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        logError('لم يتم منح إذن الإشعارات');
        return;
      }

      setIsNotificationEnabled(true);
      
      // تسجيل Push Token للتأكد من إرسال Push Notifications
      const pushToken = await NotificationService.registerForPushNotifications();
      if (pushToken) {
        logInfo('تم تسجيل Push Token', { token: pushToken });
      } else {
        logWarn('فشل في تسجيل Push Token');
      }
      
      logInfo('تم تسجيل الإشعارات بنجاح');
    } catch (error) {
      logError('خطأ في تسجيل الإشعارات', error);
    }
  };

  // دالة لتسجيل إشعارات الطبيب
  const registerForDoctorNotifications = async (doctorId: string): Promise<string | null> => {
    try {
      return await NotificationService.registerForDoctorNotifications(doctorId);
    } catch (error) {
      logError('خطأ في تسجيل إشعارات الطبيب', error);
      return null;
    }
  };

  // دالة للتحديث التلقائي للإشعارات
  const startAutoRefresh = () => {
    // تحديث الإشعارات كل 30 ثانية
    const interval = setInterval(async () => {
      try {
        const currentUser = await AsyncStorage.getItem('user');
        if (currentUser) {
          const user = JSON.parse(currentUser);
          const previousCount = notifications.length;
          
          // مزامنة الإشعارات مع الخادم
          await syncNotificationsWithServer(user.id, false);
          
          // فحص الإشعارات الجديدة بعد التحديث
          setTimeout(async () => {
            if (notifications.length > previousCount) {
              const newNotifications = notifications.slice(0, notifications.length - previousCount);
              for (const notification of newNotifications) {
                if (notification.type === 'appointment_cancelled' && !notification.isRead) {
                  logNotificationEvent('إشعار إلغاء موعد جديد - إرسال تنبيه فوري', notification);
                  
                  // إرسال Push Notification حقيقي من الخادم
                  try {
                    const pushSuccess = await NotificationService.sendPushNotificationToUser(
                      user.id,
                      'تم إلغاء الموعد',
                      notification.body,
                      {
                        ...notification.data,
                        urgent: true,
                        type: 'appointment_cancelled',
                        fromServer: true
                      }
                    );
                    
                    if (pushSuccess) {
                      logInfo('تم إرسال Push Notification لإلغاء الموعد');
                    } else {
                      logWarn('فشل في إرسال Push Notification، إرسال إشعار محلي بديل');
                      // إرسال إشعار محلي كبديل
                      Notifications.scheduleNotificationAsync({
                        content: {
                          title: 'تم إلغاء الموعد',
                          body: notification.body,
                          sound: 'default',
                          priority: Notifications.AndroidNotificationPriority.MAX,
                          vibrate: [0, 1000, 500, 1000, 500, 1000],
                          data: {
                            ...notification.data,
                            urgent: true,
                            type: 'appointment_cancelled'
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
                            lights: true,
                            lightColor: '#FF0000',
                            localOnly: false,
                            sticky: false,
                            tag: 'appointment_cancellation_' + Date.now()
                          }),
                        },
                        trigger: null,
                      });
                    }
                  } catch (error) {
                    logError('خطأ في إرسال إشعار إلغاء الموعد', error);
                  }
                }
              }
            }
          }, 1000); // انتظار ثانية واحدة للتأكد من تحديث الإشعارات
        }
      } catch (error) {
        logError('خطأ في التحديث التلقائي للإشعارات', error);
      }
    }, 30000); // 30 ثانية

    return interval;
  };

  // دالة لإيقاف التحديث التلقائي
  const stopAutoRefresh = (interval: ReturnType<typeof setInterval>) => {
    clearInterval(interval);
  };

  // دالة لإرسال إشعار
  const sendNotification = async (notification: Omit<NotificationData, 'id'>): Promise<string> => {
    try {
      const notificationId = `notification_${Date.now()}`;

      const newNotification: NotificationData = {
        id: notificationId,
        ...notification,
        createdAt: new Date().toISOString(),
        isRead: false,
      };

      setNotifications(prev => [newNotification, ...prev]);
      await saveNotificationsToStorage([newNotification, ...notifications]);

      return notificationId;
    } catch (error) {
      logError('خطأ في إرسال الإشعار', error);
      throw error;
    }
  };

  // دالة لجدولة تذكير الموعد
  const scheduleAppointmentReminder = async (
    appointmentId: string,
    appointmentDate: Date,
    doctorName: string,
    patientName: string,
    leadMinutes = 60
  ): Promise<string> => {
    try {
      return await NotificationService.scheduleAppointmentReminder(
          appointmentId,
          appointmentDate,
          doctorName,
        patientName,
        leadMinutes
      );
    } catch (error) {
      logError('خطأ في جدولة تذكير الموعد', error);
      throw error;
    }
  };

  // دالة لجدولة تذكير الدواء
  const scheduleMedicineReminder = async (
    medicineId: string,
    medicineName: string,
    dosage: string,
    reminderTime: Date,
    frequency: 'once' | 'daily' | 'twice_daily' | 'thrice_daily' | 'custom' = 'once'
  ): Promise<string> => {
    try {
      logNotificationEvent('جدولة تذكير دواء في NotificationContext', {
        medicineId,
        medicineName,
        dosage,
        reminderTime: reminderTime.toLocaleString('ar-EG'),
        frequency
      });
      
      return await NotificationService.scheduleMedicineReminder(
        medicineId,
        medicineName,
        dosage,
        reminderTime,
        frequency
      );
    } catch (error) {
      logError('خطأ في جدولة تذكير الدواء', error);
      throw error;
    }
  };

  // دالة لإعادة جدولة جميع إشعارات الأدوية
  const rescheduleAllMedicineNotifications = async () => {
    try {
      // await NotificationService.rescheduleAllMedicineNotifications();
    } catch (error) {
      logError('خطأ في إعادة جدولة إشعارات الأدوية', error);
    }
  };

  // دالة لجدولة إشعارات الأدوية إذا لزم الأمر
  const scheduleMedicineNotificationsIfNeeded = async () => {
    try {
      // تم حذف هذه الدالة من NotificationService
      logInfo('تم تعطيل جدولة إشعارات الأدوية التلقائية');
    } catch (error) {
      logError('خطأ في جدولة إشعارات الأدوية', error);
    }
  };

  // دالة لتحميل الإشعارات المحلية المجدولة
  const loadLocalScheduledNotifications = async () => {
    try {
      logDebug('تحميل الإشعارات المحلية المجدولة');
      const scheduled = await Notifications.getAllScheduledNotificationsAsync();
      logDebug('عدد الإشعارات المحلية المجدولة', { count: scheduled.length });
      
      const localNotifications = scheduled.map((notification: any) => {
        // استخدام وقت إنشاء الإشعار الأصلي من data إذا كان متوفراً
        let createdAt = new Date().toISOString();
        
        logDebug('فحص بيانات الإشعار المحلي', {
          id: notification.identifier,
          title: notification.content?.title,
          data: notification.content?.data,
          trigger: notification.trigger
        });
        
        // محاولة استخراج وقت الإنشاء الأصلي من data
        if (notification.content?.data?.createdAt) {
          createdAt = notification.content.data.createdAt;
          logDebug('تم العثور على createdAt في data', { createdAt });
        } else if (notification.content?.data?.scheduledAt) {
          createdAt = notification.content.data.scheduledAt;
          logDebug('تم العثور على scheduledAt في data', { createdAt });
        } else if (notification.trigger?.date) {
          // استخدام trigger date كوقت إنشاء إذا لم يكن هناك وقت محفوظ
          const triggerDate = new Date(notification.trigger.date);
          createdAt = triggerDate.toISOString();
          logDebug('تم استخدام trigger date', { createdAt });
        } else {
          // للإشعارات القديمة، استخدم وقت ثابت بناءً على معرف الإشعار
          // هذا يضمن أن الإشعارات القديمة تحتفظ بنفس الوقت في كل مرة
          const notificationId = notification.identifier || '';
          const hash = notificationId.split('').reduce((a: number, b: string) => {
            a = ((a << 5) - a) + b.charCodeAt(0);
            return a & a;
          }, 0);
          const hoursAgo = Math.abs(hash) % 24; // 0-23 ساعة مضت
          const oldTime = new Date(Date.now() - hoursAgo * 60 * 60 * 1000);
          createdAt = oldTime.toISOString();
          logWarn('لم يتم العثور على وقت إنشاء، استخدام وقت ثابت', { 
            createdAt, 
            hoursAgo 
          });
        }
        
        return {
          id: notification.identifier || `local_${Date.now()}_${Math.random()}`,
          title: notification.content?.title || 'تذكير محلي',
          body: notification.content?.body || '',
          type: notification.content?.data?.type || 'local',
          data: notification.content?.data || {},
          createdAt: createdAt,
          isRead: false,
          isLocal: true, // علامة للإشعارات المحلية
          triggerDate: notification.trigger?.date || null,
        };
      });
      
      logDebug('الإشعارات المحلية المحولة', { count: localNotifications.length });
      return localNotifications;
    } catch (error) {
      logError('خطأ في تحميل الإشعارات المحلية', error);
      return [];
    }
  };

  // دالة لمزامنة الإشعارات مع الخادم
  const syncNotificationsWithServer = async (userId?: string, isDoctor?: boolean) => {
    try {
      if (!userId) {
        logWarn('syncNotificationsWithServer: لا يوجد userId');
        return;
      }

      logDebug('syncNotificationsWithServer: بدء مزامنة الإشعارات', { userId, isDoctor });
      setLastSyncAttempt(new Date());
      setServerStatus('checking');

      // تحميل الإشعارات المحلية أولاً
      const localNotifications = await loadLocalScheduledNotifications();
      logDebug('الإشعارات المحلية المحملة', { count: localNotifications.length });

      const params = {
        userId: userId, // إضافة userId للبحث عن إشعارات المستخدم المحدد
        limit: 50,
        since: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // آخر 24 ساعة
      };
      
      logApiCall('/notifications', 'GET', params);
      
      const response = await api.get('/notifications', {
        params: params
      });

      logApiResponse('/notifications', response?.status || 200);
      
      // معالجة الاستجابة - قد تكون array مباشرة أو object يحتوي على data
      const notificationsData = Array.isArray(response) ? response : (response?.data || []);
      
      logDebug('بيانات الإشعارات المستخرجة', { 
        notificationsDataLength: notificationsData.length, 
        isArray: Array.isArray(notificationsData),
        firstNotification: notificationsData[0] 
      });

      // معالجة إشعارات الخادم
      let serverNotifications: any[] = [];
      if (notificationsData && notificationsData.length > 0) {
        serverNotifications = notificationsData.map((n: any) => ({
          id: n._id || n.id,
          title: n.title || n.type || 'إشعار', // استخدام type كـ title إذا لم يكن title موجود
          body: n.body || n.message || '', // استخدام message كـ body إذا لم يكن body موجود
          type: n.type || 'general',
          data: n.data || {},
          createdAt: n.createdAt || n.created_at || new Date().toISOString(),
          isRead: n.isRead || n.is_read || false,
          isLocal: false, // علامة لإشعارات الخادم
        }));

        logDebug('إشعارات الخادم المعالجة', { count: serverNotifications.length });
        setServerStatus('connected');
      } else {
        logWarn('لا توجد إشعارات في الاستجابة أو الاستجابة فارغة');
        setServerStatus('disconnected');
      }

      // دمج الإشعارات المحلية مع إشعارات الخادم
      // الحفاظ على حالة الإشعارات المقروءة الموجودة
      const existingNotificationsMap = new Map(notifications.map(n => [n.id, n]));
      
      // تحديث الإشعارات الموجودة مع الحفاظ على حالة القراءة
      const updatedServerNotifications = serverNotifications.map(serverNotification => {
        const existing = existingNotificationsMap.get(serverNotification.id);
        if (existing) {
          // الحفاظ على حالة القراءة الموجودة
          return {
            ...serverNotification,
            isRead: existing.isRead,
            readAt: existing.readAt || undefined
          };
        }
        return serverNotification;
      });
      
      // إضافة الإشعارات الجديدة فقط
      const newServerNotifications = updatedServerNotifications.filter(n => !existingNotificationsMap.has(n.id));
      
      logDebug('إشعارات الخادم الجديدة', {
        total: serverNotifications.length,
        new: newServerNotifications.length,
        existing: serverNotifications.length - newServerNotifications.length
      });
      
      const allNotifications = [...localNotifications, ...updatedServerNotifications];
      
      // ترتيب الإشعارات حسب التاريخ (الأحدث أولاً)
      allNotifications.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      logDebug('الإشعارات المدمجة', {
        total: allNotifications.length,
        local: localNotifications.length,
        server: serverNotifications.length,
        types: allNotifications.map(n => n.type),
        titles: allNotifications.map(n => n.title)
      });

      setNotifications(allNotifications);
      await saveNotificationsToStorage(allNotifications);
      
      // فحص الإشعارات الجديدة وإرسال تنبيهات فورية
      if (newServerNotifications.length > 0) {
        logInfo('فحص الإشعارات الجديدة لإرسال التنبيهات', { count: newServerNotifications.length });
        for (const notification of newServerNotifications) {
          if (notification.type === 'appointment_cancelled' && !notification.isRead) {
            logNotificationEvent('إشعار إلغاء موعد جديد من الخادم - إرسال تنبيه فوري', notification);
            
            // حذف التذكيرات المحلية للموعد الملغي
            const appointmentId = notification.data?.appointmentId || notification.data?.appointment_id;
            if (appointmentId) {
              try {
                logDebug('حذف التذكيرات المحلية للموعد الملغي', { appointmentId });
                await NotificationService.cancelAppointmentReminders(appointmentId);
                logInfo('تم حذف التذكيرات المحلية للموعد الملغي');
              } catch (reminderError) {
                logError('فشل في حذف التذكيرات المحلية للموعد الملغي', reminderError);
              }
            } else {
              logWarn('لم يتم العثور على معرف الموعد في بيانات الإشعار', { data: notification.data });
              // محاولة استخراج معرف الموعد من نص الإشعار إذا كان متاحاً
              const bodyText = notification.body || '';
              const appointmentIdMatch = bodyText.match(/موعدك مع.*?في.*?الساعة/);
              if (appointmentIdMatch) {
                logDebug('تم العثور على نص الموعد في الإشعار، لكن لا يمكن استخراج معرف الموعد');
              }
            }
            
            // إرسال Push Notification حقيقي من الخادم
            try {
              const pushSuccess = await NotificationService.sendPushNotificationToUser(
                userId,
                'تم إلغاء الموعد',
                notification.body,
                {
                  ...notification.data,
                  urgent: true,
                  type: 'appointment_cancelled',
                  fromServer: true
                }
              );
              
              if (pushSuccess) {
                logInfo('تم إرسال Push Notification لإلغاء الموعد');
              } else {
                logWarn('فشل في إرسال Push Notification، إرسال إشعار محلي بديل');
                // إرسال إشعار محلي كبديل
                Notifications.scheduleNotificationAsync({
                  content: {
                    title: 'تم إلغاء الموعد',
                    body: notification.body,
                    sound: 'default',
                    priority: Notifications.AndroidNotificationPriority.MAX,
                    vibrate: [0, 1000, 500, 1000, 500, 1000],
                    data: {
                      ...notification.data,
                      urgent: true,
                      type: 'appointment_cancelled',
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
                      lights: true,
                      lightColor: '#FF0000',
                      localOnly: false,
                      sticky: false,
                      tag: 'appointment_cancellation_' + Date.now()
                    }),
                  },
                  trigger: null,
                });
              }
            } catch (error) {
              logError('خطأ في إرسال إشعار إلغاء الموعد', error);
            }
          }
        }
      }
      
      logInfo('تم مزامنة الإشعارات مع الخادم', { count: allNotifications.length });
    } catch (error) {
      logError('خطأ في مزامنة الإشعارات مع الخادم', error);
      setServerStatus('disconnected');
    }
  };

  // دالة لإرسال إشعار للطبيب
  const sendDoctorNotification = async (notification: Omit<NotificationData, 'id'>): Promise<string> => {
    try {
      return await sendNotification(notification);
    } catch (error) {
      logError('خطأ في إرسال إشعار للطبيب', error);
      throw error;
    }
  };

  // دالة لإرسال إشعار موعد للطبيب
  const sendAppointmentNotificationToDoctor = async (
    doctorId: string,
    appointmentId: string,
    patientName: string,
    appointmentDate: Date,
    appointmentTime: string
  ): Promise<boolean> => {
    try {
      return await NotificationService.sendNewAppointmentNotificationToDoctor(
        doctorId,
        patientName,
        appointmentDate.toISOString(),
        appointmentTime,
        appointmentId
      );
    } catch (error) {
      logError('خطأ في إرسال إشعار الموعد للطبيب', error);
      throw error;
    }
  };

  // دالة لإرسال إشعار إلغاء الموعد
  const sendAppointmentCancellationNotification = async (
    patientId: string,
    patientName: string,
    doctorName: string,
    appointmentDate: Date,
    appointmentTime: string,
    appointmentId: string,
    isBookingForOther = false,
    bookerName?: string
  ): Promise<void> => {
    try {
      // إرسال الإشعار عبر NotificationService
      await NotificationService.sendAppointmentCancellationNotification(
        patientId,
        patientName,
        doctorName,
        appointmentDate.toISOString(),
        appointmentTime,
        appointmentId
      );
      
      // إضافة الإشعار مباشرة إلى القائمة المحلية
      const cancellationNotification: NotificationData = {
        id: `cancellation_${appointmentId}_${Date.now()}`,
        title: 'تم إلغاء الموعد',
        body: `تم إلغاء موعدك مع ${doctorName} في ${appointmentDate.toLocaleDateString('ar-EG')} الساعة ${appointmentTime}`,
        type: 'appointment_cancelled',
        data: {
          appointmentId,
          patientName,
          doctorName,
          appointmentDate: appointmentDate.toISOString(),
          appointmentTime,
          isBookingForOther,
          bookerName
        },
        createdAt: new Date().toISOString(),
        isRead: false,
        isLocal: false,
      };
      
      setNotifications(prev => {
        const updated = [cancellationNotification, ...prev];
        // ترتيب حسب التاريخ
        updated.sort((a, b) => new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime());
        return updated;
      });
      
      // حفظ في التخزين
      await saveNotificationsToStorage(notifications);
      
      logInfo('تم إضافة إشعار إلغاء الموعد إلى القائمة', { notification: cancellationNotification });
      
    } catch (error) {
      logError('خطأ في إرسال إشعار إلغاء الموعد', error);
      throw error;
    }
  };

  // دالة لإلغاء إشعار
  const cancelNotification = async (notificationId: string) => {
    try {
      await NotificationService.cancelNotification(notificationId);
      setScheduledNotifications(prev => 
        prev.filter(n => n.id !== notificationId)
      );
    } catch (error) {
      logError('خطأ في إلغاء الإشعار', error);
    }
  };

  // دالة لإلغاء جميع الإشعارات
  const cancelAllNotifications = async () => {
    try {
      await NotificationService.cancelAllNotifications();
      setScheduledNotifications([]);
    } catch (error) {
      logError('خطأ في إلغاء جميع الإشعارات', error);
    }
  };

  // دالة لمسح الإشعارات عند تسجيل الخروج
  const clearNotificationsOnLogout = async () => {
    try {
      setNotifications([]);
      setScheduledNotifications([]);
      await AsyncStorage.removeItem('notifications');
    } catch (error) {
      logError('خطأ في مسح الإشعارات', error);
    }
  };

  // دالة لفحص وإعادة جدولة الإشعارات المفقودة
  const checkAndRescheduleMissingNotifications = async () => {
    try {
      logDebug('فحص الإشعارات المفقودة');
      // يمكن إضافة منطق فحص الإشعارات المفقودة هنا
      logInfo('تم فحص الإشعارات المفقودة');
    } catch (error) {
      logError('خطأ في فحص الإشعارات المفقودة', error);
    }
  };

  // دالة لتحميل إشعارات المستخدم
  const loadNotificationsForUser = async () => {
    try {
      logDebug('تحميل إشعارات المستخدم');
      
      // تحميل الإشعارات المحلية المجدولة
      const localNotifications = await loadLocalScheduledNotifications();
      logDebug('الإشعارات المحلية المحملة', { count: localNotifications.length });
      
      // تحميل الإشعارات المحفوظة من التخزين
      await loadNotificationsFromStorage();
      
      // إذا لم تكن هناك إشعارات محفوظة، احفظ الإشعارات المحلية
      if (notifications.length === 0 && localNotifications.length > 0) {
        setNotifications(localNotifications);
        await saveNotificationsToStorage(localNotifications);
        logInfo('تم حفظ الإشعارات المحلية في التخزين');
      }
      
      logInfo('تم تحميل إشعارات المستخدم');
    } catch (error) {
      logError('خطأ في تحميل إشعارات المستخدم', error);
    }
  };

  // دالة لإعادة جدولة جميع الإشعارات عند بدء التطبيق
  const rescheduleAllNotificationsOnAppStart = async () => {
    try {
      logDebug('إعادة جدولة جميع الإشعارات عند بدء التطبيق');
      // يمكن إضافة منطق إعادة جدولة الإشعارات هنا
      logInfo('تم إعادة جدولة جميع الإشعارات');
    } catch (error) {
      logError('خطأ في إعادة جدولة الإشعارات', error);
    }
  };

  // دالة لتنظيف الإشعارات المكررة
  const clearDuplicateNotifications = async () => {
    try {
      logDebug('تنظيف الإشعارات المكررة');
      
      // إزالة الإشعارات المكررة بناءً على المعرف
      const uniqueNotifications = notifications.filter((notification, index, self) => 
        index === self.findIndex(n => n.id === notification.id)
      );
      
      if (uniqueNotifications.length !== notifications.length) {
        const removedCount = notifications.length - uniqueNotifications.length;
        logInfo('تم إزالة إشعارات مكررة', { removedCount });
        setNotifications(uniqueNotifications);
        await saveNotificationsToStorage(uniqueNotifications);
      } else {
        logInfo('لا توجد إشعارات مكررة');
      }
    } catch (error) {
      logError('خطأ في تنظيف الإشعارات المكررة', error);
    }
  };

  // دالة لتحديث الإشعارات المجدولة
  const refreshScheduledNotifications = async () => {
    try {
      const scheduled = await Notifications.getAllScheduledNotificationsAsync();
      setScheduledNotifications(scheduled);
      logInfo('تم تحديث الإشعارات المجدولة', { count: scheduled.length });
      
      // تحديث الإشعارات المحلية في القائمة
      const localNotifications = await loadLocalScheduledNotifications();
      if (localNotifications.length > 0) {
        // دمج الإشعارات المحلية مع الإشعارات الموجودة
        const currentNotifications = notifications.filter(n => !(n as any).isLocal);
        const allNotifications = [...localNotifications, ...currentNotifications];
        allNotifications.sort((a, b) => new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime());
        
        setNotifications(allNotifications);
        await saveNotificationsToStorage(allNotifications);
        logInfo('تم تحديث الإشعارات المحلية في القائمة', { count: localNotifications.length });
      }
    } catch (error) {
      logError('خطأ في تحديث الإشعارات المجدولة', error);
    }
  };

  // دالة لتحديث إشعارات الطبيب
  const refreshDoctorNotifications = async (doctorId: string) => {
    try {
      // تم حذف هذه الدالة من NotificationService
      logInfo('تم تعطيل تحديث إشعارات الطبيب التلقائي');
    } catch (error) {
      logError('خطأ في تحديث إشعارات الطبيب', error);
    }
  };

  // دالة لتحديد الإشعار كمقروء
  const markNotificationAsRead = async (notificationId: string) => {
    try {
      logDebug('تحديد الإشعار كمقروء', { notificationId });
      
      // تحديث الإشعارات المحلية
      const updatedNotifications = notifications.map(n => 
        n.id === notificationId ? { ...n, isRead: true, readAt: new Date().toISOString() } : n
      );
      
      setNotifications(updatedNotifications);
      await saveNotificationsToStorage(updatedNotifications);
      
      // تحديث الإشعار في الخادم إذا كان من الخادم
      const notification = notifications.find(n => n.id === notificationId);
      if (notification && !(notification as any).isLocal) {
        try {
          await api.post(`/notifications/${notificationId}/mark-read`);
          logInfo('تم تحديث حالة الإشعار في الخادم');
        } catch (serverError) {
          logWarn('فشل في تحديث حالة الإشعار في الخادم', serverError);
        }
      }
      
      logInfo('تم تحديد الإشعار كمقروء بنجاح');
    } catch (error) {
      logError('خطأ في تحديد الإشعار كمقروء', error);
    }
  };

  // دالة لتحديد جميع الإشعارات كمقروءة
  const markAllNotificationsAsRead = async () => {
    try {
      logDebug('تحديد جميع الإشعارات كمقروءة');
      
      const updatedNotifications = notifications.map(n => ({ 
        ...n, 
        isRead: true, 
        readAt: new Date().toISOString() 
      }));
      
      setNotifications(updatedNotifications);
      await saveNotificationsToStorage(updatedNotifications);
      
      // تحديث الإشعارات في الخادم
      const serverNotifications = notifications.filter(n => !(n as any).isLocal);
      for (const notification of serverNotifications) {
        try {
          await api.post(`/notifications/${notification.id}/mark-read`);
        } catch (serverError) {
          logWarn('فشل في تحديث إشعار في الخادم', { notificationId: notification.id });
        }
      }
      
      logInfo('تم تحديد جميع الإشعارات كمقروءة');
    } catch (error) {
      logError('خطأ في تحديد جميع الإشعارات كمقروءة', error);
    }
  };

  // دالة لحساب الوقت المنقضي
  const getTimeAgo = (date: string): string => {
              const now = new Date();
    const notificationDate = new Date(date);
    const diffInSeconds = Math.floor((now.getTime() - notificationDate.getTime()) / 1000);

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
      return `منذ ${days} يوم`;
    }
  };

  // دالة لفحص حالة الإشعارات
  const checkNotificationStatus = async () => {
    try {
      const status = await NotificationService.checkNotificationStatus();

      return status;
    } catch (error) {
      logError('خطأ في فحص حالة الإشعارات', error);
      throw error;
    }
  };

  // دالة بديلة للإشعارات (معطلة)
  const showAlternativeNotification = (title: string, body: string) => {

  };

  // دالة لاختبار الإشعارات (معطلة)
  const testUrgentNotification = async () => {

  };



  // تحميل الإشعارات عند بدء التطبيق
  useEffect(() => {
    const initializeNotifications = async () => {
      await loadNotificationsFromStorage();
      
      // تسجيل Push Token للتأكد من إرسال Push Notifications
      try {
        const pushToken = await NotificationService.registerForPushNotifications();
        if (pushToken) {

        }
      } catch (error) {
        logError('خطأ في تسجيل Push Token', error);
      }
      
      // فحص الإشعارات الجديدة من الخادم عند بدء التطبيق
      try {
        const currentUser = await AsyncStorage.getItem('user');
        if (currentUser) {
          const user = JSON.parse(currentUser);

          await syncNotificationsWithServer(user.id, false);
        }
      } catch (error) {
        logError('خطأ في فحص الإشعارات عند بدء التطبيق', error);
      }
    };
    
    initializeNotifications();
  }, []);

  // فحص دوري للإشعارات كل 30 ثانية
  useEffect(() => {
    const checkExistingNotifications = async () => {
      try {
        // فحص الإشعارات من الخادم - نحتاج معرف المستخدم
        // سيتم استدعاء هذا من الشاشات التي لديها معرف المستخدم

    } catch (error) {

      }
    };
    
    // فحص الإشعارات عند بدء التطبيق
    checkExistingNotifications();
    
    // فحص دوري كل 30 ثانية
    const intervalId = setInterval(checkExistingNotifications, 30000);
    
    return () => {
      clearInterval(intervalId);
    };
  }, []);

  const value: NotificationContextType = {
    notifications,
    scheduledNotifications,
    isNotificationEnabled,
    registerForNotifications,
    registerForDoctorNotifications,
    sendNotification,
    scheduleAppointmentReminder,
    scheduleMedicineReminder,
    rescheduleAllMedicineNotifications,
    scheduleMedicineNotificationsIfNeeded,
    syncNotificationsWithServer,
    sendDoctorNotification,
    sendAppointmentNotificationToDoctor,
    sendAppointmentCancellationNotification,
    cancelNotification,
    cancelAllNotifications,
    clearNotificationsOnLogout,
    refreshScheduledNotifications,
    refreshDoctorNotifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    getTimeAgo,
    loadNotificationsFromStorage,
    serverStatus,
    lastSyncAttempt,
    checkNotificationStatus,
    showAlternativeNotification,
    testUrgentNotification,
    checkAndRescheduleMissingNotifications,
    loadNotificationsForUser,
    rescheduleAllNotificationsOnAppStart,
    clearDuplicateNotifications,
    startAutoRefresh,
    stopAutoRefresh,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
