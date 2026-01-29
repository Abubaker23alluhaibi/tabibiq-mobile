import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import * as BackgroundFetch from 'expo-background-fetch';
import { API_CONFIG } from '../config/api';
import { APP_CONFIG } from '../config/constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import i18n from '../locales/index';
import { logError, logWarn, logInfo, logNotificationEvent, logApiCall, logApiResponse } from '../utils/logger';



export interface NotificationData {
  id: string;
  title: string;
  body: string;
  data?: any;
  scheduledDate?: Date;
  type: 'doctor' | 'medicine' | 'appointment' | 'general' | 'appointment_cancelled';
  createdAt?: string; // وقت إنشاء الإشعار
  isRead?: boolean; // حالة القراءة
  readAt?: string; // وقت القراءة
  isLocal?: boolean; // إشعار محلي أم من الخادم
}

export class NotificationService {
  private static instance: NotificationService;
  private expoPushToken: string | null = null;

  private constructor() {
    // إعداد معالج الإشعارات عند إنشاء الخدمة
    this.setupNotificationHandler();
  }

  // إعداد معالج الإشعارات
  private setupNotificationHandler(): void {
    Notifications.setNotificationHandler({
      handleNotification: async (notification) => {
        logNotificationEvent('استقبال إشعار', { 
          id: notification.request.identifier,
          title: notification.request.content.title 
        });
        
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
  }

  public static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  // حساب أقرب موعد مستقبلي لوقت معين
  private static getNextOccurrence(hour: number, minute: number): Date {
    const now = new Date();
    const target = new Date();
    target.setHours(hour, minute, 0, 0);

    if (target <= now) {
      target.setDate(target.getDate() + 1);
    }

    return target;
  }

  // تحويل الأرقام العربية إلى إنجليزية
  private toWesternDigits(input: string): string {
    const easternArabicDigits = [
      '٠',
      '١',
      '٢',
      '٣',
      '٤',
      '٥',
      '٦',
      '٧',
      '٨',
      '٩',
    ];
    return input.replace(/[٠-٩]/g, d =>
      easternArabicDigits.indexOf(d).toString()
    );
  }

  // استخراج الساعة والدقيقة من نص
  private parseTimeString(input: string): { hour: number; minute: number } | null {
    try {
      if (!input || typeof input !== 'string') return null;
      let s = this.toWesternDigits(input).trim();
      s = s.replace(/[\s\u202A\u202B\u202C\u200F\u200E]/g, '');
      s = s.replace(/(ص|صباحاً|م|مساءً|AM|PM|am|pm)/g, '');
      const match = /^(\d{1,2}):(\d{2})$/.exec(s);
      if (!match) return null;
      const hour = Math.max(0, Math.min(23, parseInt(match[1], 10)));
      const minute = Math.max(0, Math.min(59, parseInt(match[2], 10)));
      if (isNaN(hour) || isNaN(minute)) return null;
      return { hour, minute };
    } catch {
      return null;
    }
  }

  // تسجيل الجهاز للحصول على رمز الإشعارات (FCM device token بدلاً من Expo push token)
  async registerForPushNotifications(): Promise<string | null> {
    if (!Device.isDevice) {
      logWarn('يجب تشغيل التطبيق على جهاز حقيقي');
      return null;
    }

    try {
      const { status: existingStatus } =
        await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        logError('لم يتم منح إذن الإشعارات');
        return null;
      }

      const deviceToken = await Notifications.getDevicePushTokenAsync();

      const token =
        (deviceToken as any)?.data?.token ||
        (deviceToken as any)?.data ||
        (deviceToken as any)?.token;

      if (!token) {
        logError('فشل في الحصول على FCM device token');
        return null;
      }

      this.expoPushToken = token;
      logInfo('تم تسجيل رمز الإشعارات (FCM device token)', { token: this.expoPushToken });

      // إرسال الرمز إلى الخادم (سيتم اعتباره FCM token)
      await this.sendTokenToServer(this.expoPushToken);

      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.DEFAULT,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
        });
        await Notifications.setNotificationChannelAsync('appointments', {
          name: 'Appointments',
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
          sound: 'default',
          lockscreenVisibility:
            Notifications.AndroidNotificationVisibility.PUBLIC,
        });
      }

      return this.expoPushToken;
    } catch (error) {
      logError('خطأ في تسجيل الإشعارات', error);
      return null;
    }
  }

  // إرسال رمز الإشعارات إلى الخادم
  private async sendTokenToServer(
    token: string,
    userId?: string,
    doctorId?: string
  ): Promise<void> {
    try {
      logApiCall('/notifications/register', 'POST', { 
        platform: Platform.OS, 
        userId, 
        doctorId 
      });

      const response = await fetch(
        `${API_CONFIG.BASE_URL}/notifications/register`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            token,
            platform: Platform.OS,
            userId: userId,
            doctorId: doctorId,
          }),
        }
      );

      if (response.ok) {
        logApiResponse('/notifications/register', response.status);
        logInfo('🔔 [FCM] تم إرسال التوكن للسيرفر بنجاح — تحقق من مجموعة notificationtokens في MongoDB');
      } else {
        const errBody = await response.text();
        logWarn('🔔 [FCM] فشل إرسال التوكن إلى الخادم', {
          status: response.status,
          statusText: response.statusText,
          body: errBody?.slice(0, 200),
        });
      }
    } catch (error: any) {
      logError('🔔 [FCM] خطأ في إرسال رمز الإشعارات', error?.message || error);
    }
  }

  // تسجيل الجهاز للحصول على رمز الإشعارات (للمستخدمين)
  async registerForUserNotifications(userId: string): Promise<string | null> {
    logInfo('🔔 [FCM] محاولة تسجيل التوكن للمستخدم', { userId });

    if (!Device.isDevice) {
      logWarn('🔔 [FCM] يجب تشغيل التطبيق على جهاز حقيقي (Expo Go لا يدعم FCM في SDK 53)');
      return null;
    }

    try {
      const { status: existingStatus } =
        await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        logError('🔔 [FCM] لم يتم منح إذن الإشعارات — لن يُسجّل التوكن');
        return null;
      }

      let deviceToken: any;
      try {
        deviceToken = await Notifications.getDevicePushTokenAsync();
      } catch (tokenError: any) {
        logError('🔔 [FCM] فشل getDevicePushTokenAsync (غالباً Expo Go أو محاكي)', tokenError?.message || tokenError);
        return null;
      }

      const token =
        (deviceToken as any)?.data?.token ||
        (deviceToken as any)?.data ||
        (deviceToken as any)?.token;

      if (!token) {
        logError('🔔 [FCM] فشل في الحصول على FCM device token — قد تكون تستخدم Expo Go');
        return null;
      }

      this.expoPushToken = token;
      logInfo('🔔 [FCM] تم الحصول على التوكن، جاري الإرسال للسيرفر', { userId });

      // إرسال الرمز إلى الخادم
      await this.sendTokenToServer(this.expoPushToken, userId);

      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.DEFAULT,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
        });
        await Notifications.setNotificationChannelAsync('appointments', {
          name: 'Appointments',
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
          sound: 'default',
          lockscreenVisibility:
            Notifications.AndroidNotificationVisibility.PUBLIC,
        });
      }

      return this.expoPushToken;
    } catch (error: any) {
      logError('🔔 [FCM] خطأ في registerForUserNotifications', error?.message || error);
      return null;
    }
  }

  // تسجيل الجهاز للحصول على رمز الإشعارات (للأطباء)
  async registerForDoctorNotifications(
    doctorId: string
  ): Promise<string | null> {
    if (!Device.isDevice) {
      logWarn('يجب تشغيل التطبيق على جهاز حقيقي');
      return null;
    }

    try {
      const { status: existingStatus } =
        await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        logError('لم يتم منح إذن الإشعارات');
        return null;
      }

      const deviceToken = await Notifications.getDevicePushTokenAsync();

      const token =
        (deviceToken as any)?.data?.token ||
        (deviceToken as any)?.data ||
        (deviceToken as any)?.token;

      if (!token) {
        logError('فشل في الحصول على FCM device token للطبيب');
        return null;
      }

      this.expoPushToken = token;
      logInfo('تم تسجيل رمز الإشعارات للطبيب (FCM device token)', {
        token: this.expoPushToken,
        doctorId,
      });

      // إرسال الرمز إلى الخادم
      await this.sendTokenToServer(this.expoPushToken, undefined, doctorId);

      if (Platform.OS === 'android') {
        // إنشاء قناة خاصة بالأطباء
        await Notifications.setNotificationChannelAsync('doctor', {
          name: 'Doctor Notifications',
          importance: Notifications.AndroidImportance.HIGH,
          sound: 'default',
          vibrationPattern: [0, 250, 250, 250],
          lockscreenVisibility:
            Notifications.AndroidNotificationVisibility.PUBLIC,
          enableVibrate: true,
          enableLights: true,
          lightColor: '#FF231F7C',
        });

        // إنشاء قناة افتراضية
        await Notifications.setNotificationChannelAsync('default', {
          name: 'Default',
          importance: Notifications.AndroidImportance.HIGH,
          sound: 'default',
          vibrationPattern: [0, 250, 250, 250],
          lockscreenVisibility:
            Notifications.AndroidNotificationVisibility.PUBLIC,
          enableVibrate: true,
          enableLights: true,
          lightColor: '#FF231F7C',
        });

        // إنشاء قناة المواعيد
        await Notifications.setNotificationChannelAsync('appointments', {
          name: 'Appointments',
          importance: Notifications.AndroidImportance.HIGH,
          sound: 'default',
          vibrationPattern: [0, 250, 250, 250],
          lockscreenVisibility:
            Notifications.AndroidNotificationVisibility.PUBLIC,
          enableVibrate: true,
          enableLights: true,
          lightColor: '#FF231F7C',
        });
      }

      return this.expoPushToken;
    } catch (error) {
      return null;
    }
  }


  // جدولة إشعار للموعد (ساعة قبل الموعد) - محدثة ومحسنة
  async scheduleAppointmentReminder(
    appointmentId: string,
    appointmentDate: Date,
    doctorName: string,
    patientName: string,
    leadMinutes = 60
  ): Promise<string> {
    logNotificationEvent('جدولة تذكير الموعد', {
      appointmentId,
      appointmentDate: appointmentDate.toISOString(),
      doctorName,
      patientName,
      leadMinutes
    });

    const now = new Date();

    // التأكد من أن تاريخ الموعد صحيح
    if (isNaN(appointmentDate.getTime())) {
      throw new Error('تاريخ الموعد غير صحيح');
    }

    // التأكد من أن الموعد في المستقبل
    if (appointmentDate <= now) {
      throw new Error('لا يمكن جدولة تذكير لموعد في الماضي');
    }

    // وقت التذكير - إصلاح الحساب
    let fireAt = new Date(appointmentDate.getTime() - leadMinutes * 60 * 1000);

    // التأكد من أن وقت التذكير في المستقبل
    if (fireAt <= now) {
      // إذا كان وقت التذكير في الماضي، نجعله بعد دقيقة واحدة من الآن
      fireAt = new Date(now.getTime() + 60 * 1000);
      logWarn('تم تعديل وقت التذكير لأنه كان في الماضي');
    }


    // إنشاء قناة الإشعارات للأندرويد
    if (Platform.OS === 'android') {
      try {
        await Notifications.setNotificationChannelAsync('appointments', {
          name: 'Appointments',
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
          sound: 'default',
          lockscreenVisibility:
            Notifications.AndroidNotificationVisibility.PUBLIC,
        });

        // إنشاء قناة افتراضية أيضاً
        await Notifications.setNotificationChannelAsync('default', {
          name: 'Default',
          importance: Notifications.AndroidImportance.HIGH,
          sound: 'default',
          vibrationPattern: [0, 250, 250, 250],
          lockscreenVisibility:
            Notifications.AndroidNotificationVisibility.PUBLIC,
        });
      } catch (error) {
        logWarn('فشل في إنشاء قناة الإشعارات', error);
      }
    }

    // استخدام trigger.date بدلاً من trigger.seconds لضمان الظهور في getAllScheduledNotificationsAsync
    let trigger: Notifications.NotificationTriggerInput = {
      type: 'date',
      date: fireAt,
      ...(Platform.OS === 'android' && {
        channelId: 'appointments',
        allowWhileIdle: true, // يسمح بالإشعارات حتى عندما يكون الجهاز في وضع السكون
        allowInForeground: true, // يسمح بالإشعارات في المقدمة
        allowInBackground: true, // يسمح بالإشعارات في الخلفية
      }),
    } as any;


    // التحقق من صحة trigger.date
    if (fireAt <= now) {
      logWarn('وقت التذكير في الماضي، سيتم تعديله');
      const fallbackTime = new Date(now.getTime() + 60 * 1000); // بعد دقيقة واحدة
      trigger = {
        type: 'date',
        date: fallbackTime,
        ...(Platform.OS === 'android' && {
          channelId: 'appointments',
          allowWhileIdle: true,
        }),
      } as any;
    }

    try {
      // فحص حالة الموعد قبل جدولة التذكير
      try {
        const { api } = require('./api');
        const appointmentResponse = await api.get(`/appointments/${appointmentId}`);
        
        if (appointmentResponse && appointmentResponse.data) {
          const appointment = appointmentResponse.data;
          
          // إذا كان الموعد ملغياً، لا نجدول التذكير
          if (appointment.status === 'cancelled' || appointment.status === 'completed') {
            logWarn('تم تجاهل جدولة التذكير - الموعد ملغي أو مكتمل', { appointmentId });
            return '';
          }
        }
      } catch (error) {
        logWarn('فشل في فحص حالة الموعد، سيتم جدولة التذكير', error);
      }

      const reminderTitle = i18n.t('notifications.appointment_reminder_title');
      let reminderBody = i18n.t('notifications.appointment_reminder_body', { doctorName });
      
      // إذا لم يتم استبدال المتغير، استبدله يدوياً
      if (reminderBody.includes('{doctorName}')) {
        reminderBody = reminderBody.replace('{doctorName}', doctorName);
      }
      
      const id = await Notifications.scheduleNotificationAsync({
        content: {
          title: reminderTitle,
          body: reminderBody,
          data: {
            type: 'appointment',
            appointmentId,
            appointmentIso: appointmentDate.toISOString(),
            reminderIso: fireAt.toISOString(),
            createdAt: new Date().toISOString(),
            scheduledAt: fireAt.toISOString(),
          },
          sound: 'default',
          priority: Notifications.AndroidNotificationPriority.HIGH,
          ...(Platform.OS === 'android' && {
            channelId: 'appointments',
            sticky: false,
            autoDismiss: true,
            allowWhileIdle: true,
            allowInForeground: true,
            allowInBackground: true,
            visibility: Notifications.AndroidNotificationVisibility.PUBLIC,
            showTimestamp: true,
            when: fireAt.getTime(),
            lights: true,
            lightColor: '#4CAF50',
            vibrate: [0, 250, 250, 250],
          }),
        },
        trigger,
      });

      logInfo('تم جدولة الإشعار بنجاح', {
        id,
        trigger: JSON.stringify(trigger),
        reminderTime: fireAt.toLocaleString('ar-EG'),
        minutesFromNow: Math.ceil((fireAt.getTime() - now.getTime()) / (1000 * 60))
      });

      // التحقق من نجاح الجدولة
      const scheduledNotifications =
        await Notifications.getAllScheduledNotificationsAsync();
      const ourNotification = scheduledNotifications.find(
        n => n.identifier === id
      );

      if (ourNotification) {
        logInfo('تم تأكيد جدولة الإشعار', {
          id: ourNotification.identifier,
          title: ourNotification.content.title,
          trigger: ourNotification.trigger,
        });
      } else {
        logWarn('الإشعار غير موجود في القائمة المجدولة - يجب أن يظهر مع trigger.date');
        logInfo('trigger.date يجب أن يظهر في getAllScheduledNotificationsAsync');
      }

      // فحص سريع للتأكد من نجاح الجدولة (بدون تأخيرات طويلة)
      try {
        const scheduledNotifications =
          await Notifications.getAllScheduledNotificationsAsync();
        const ourNotification = scheduledNotifications.find(
          n => n.identifier === id
        );

        if (ourNotification) {
          logInfo('تم تأكيد جدولة الإشعار', {
            id: ourNotification.identifier,
            title: ourNotification.content.title,
          });
        } else {
          logInfo('الإشعار تم جدولته بنجاح (قد لا يظهر في getAllScheduledNotificationsAsync فوراً)');
        }
      } catch (checkError) {
        logWarn('فشل في فحص الإشعارات المجدولة', checkError);
        // لا نوقف العملية إذا فشل الفحص
      }

      return id;
    } catch (error) {
      logError('فشل في جدولة الإشعار', { error, trigger: JSON.stringify(trigger) });
      throw error;
    }
  }


  // جدولة دواء ثلاث مرات يومياً
  private async scheduleThriceDailyMedicine(
    medicineId: string,
    medicineName: string,
    dosage: string,
    time: Date
  ): Promise<string[]> {
    let hour = time.getHours();
    let minute = time.getMinutes();
    
    if (isNaN(hour) || isNaN(minute)) {
      const ts = (time as any)?.__timeString || (time as any)?.timeString || '';
      const parsed = this.parseTimeString(ts);
      if (parsed) {
        hour = parsed.hour;
        minute = parsed.minute;
      } else {
        hour = 9;
        minute = 0;
      }
    }

    if (hour < 0 || hour > 23 || minute < 0 || minute > 59) {
      hour = 9;
      minute = 0;
    }

    const times = [
      { hour: hour, label: 'الصباح' },
      { hour: (hour + 6) % 24, label: 'الظهر' },
      { hour: (hour + 12) % 24, label: 'المساء' },
    ];

    const notificationIds: string[] = [];

    for (let i = 0; i < times.length; i++) {
      const doseId = await Notifications.scheduleNotificationAsync({
        content: {
          title: 'تذكير بالدواء',
          body: `عزيزي، حان الآن وقت تناول دواء ${medicineName} - ${dosage}`,
          data: {
            type: 'medicine',
            medicineId,
            medicineName,
            dosage,
            frequency: 'thrice_daily',
            time: `dose_${i + 1}`,
            label: times[i].label,
            isRecurring: true,
            isAutoRecurring: true,
            createdAt: new Date().toISOString(),
          },
          sound: 'default',
          priority: Notifications.AndroidNotificationPriority.HIGH,
          categoryIdentifier: 'medicine-reminder',
          ...(Platform.OS === 'android' && {
            channelId: 'meds',
            sticky: false,
            autoDismiss: true,
          }),
        },
        trigger: {
          type: 'daily',
          hour: times[i].hour,
          minute: minute,
          repeats: true,
        } as any,
      });

      notificationIds.push(doseId);
    }

    return notificationIds;
  }

  // جدولة دواء مرتين يومياً
  private async scheduleTwiceDailyMedicine(
    medicineId: string,
    medicineName: string,
    dosage: string,
    time: Date
  ): Promise<string[]> {
    let hour = time.getHours();
    let minute = time.getMinutes();
    
    if (isNaN(hour) || isNaN(minute)) {
      const ts = (time as any)?.__timeString || (time as any)?.timeString || '';
      const parsed = this.parseTimeString(ts);
      if (parsed) {
        hour = parsed.hour;
        minute = parsed.minute;
      } else {
        hour = 9;
        minute = 0;
      }
    }

    if (hour < 0 || hour > 23 || minute < 0 || minute > 59) {
      hour = 9;
      minute = 0;
    }

    const morningHour = hour;
    const eveningHour = (hour + 12) % 24;

    const morningId = await Notifications.scheduleNotificationAsync({
      content: {
        title: 'تذكير بالدواء',
        body: `عزيزي، صباح الخير! حان الآن وقت تناول دواء ${medicineName}`,
        data: {
          type: 'medicine',
          medicineId,
          medicineName,
          dosage,
          frequency: 'twice_daily',
          time: 'morning',
          isRecurring: true,
          isAutoRecurring: true,
          createdAt: new Date().toISOString(),
        },
        sound: 'default',
        priority: Notifications.AndroidNotificationPriority.HIGH,
        categoryIdentifier: 'medicine-reminder',
        ...(Platform.OS === 'android' && {
          channelId: 'meds',
          sticky: false,
          autoDismiss: true,
        }),
      },
      trigger: {
        type: 'daily',
        hour: morningHour,
        minute: minute,
        repeats: true,
      } as any,
    });

    const eveningId = await Notifications.scheduleNotificationAsync({
      content: {
        title: 'تذكير بالدواء',
        body: `عزيزي، مساء الخير! حان الآن وقت تناول دواء ${medicineName}`,
        data: {
          type: 'medicine',
          medicineId,
          medicineName,
          dosage,
          frequency: 'twice_daily',
          time: 'evening',
          isRecurring: true,
          isAutoRecurring: true,
          createdAt: new Date().toISOString(),
        },
        sound: 'default',
        priority: Notifications.AndroidNotificationPriority.HIGH,
        categoryIdentifier: 'medicine-reminder',
        ...(Platform.OS === 'android' && {
          channelId: 'meds',
          sticky: false,
          autoDismiss: true,
        }),
      },
      trigger: {
        type: 'daily',
        hour: eveningHour,
        minute: minute,
        repeats: true,
      } as any,
    });

    return [morningId, eveningId];
  }

  // جدولة دواء يومي
  private async scheduleDailyMedicine(
    medicineId: string,
    medicineName: string,
    dosage: string,
    time: Date
  ): Promise<string> {
    let hour = time.getHours();
    let minute = time.getMinutes();
    
    if (isNaN(hour) || isNaN(minute)) {
      const ts = (time as any)?.__timeString || (time as any)?.timeString || '';
      const parsed = this.parseTimeString(ts);
      if (parsed) {
        hour = parsed.hour;
        minute = parsed.minute;
      } else {
        hour = 9;
        minute = 0;
      }
    }

    if (hour < 0 || hour > 23 || minute < 0 || minute > 59) {
      hour = 9;
      minute = 0;
    }

    return await Notifications.scheduleNotificationAsync({
      content: {
        title: 'تذكير بالدواء',
        body: `عزيزي، حان الآن وقت تناول دواء ${medicineName} - ${dosage}`,
        data: {
          type: 'medicine',
          medicineId,
          medicineName,
          dosage,
          frequency: 'daily',
          time: `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`,
          isRecurring: true,
          isAutoRecurring: true,
          createdAt: new Date().toISOString(),
        },
        sound: 'default',
        priority: Notifications.AndroidNotificationPriority.HIGH,
        categoryIdentifier: 'medicine-reminder',
        ...(Platform.OS === 'android' && {
          channelId: 'meds',
          sticky: false,
          autoDismiss: true,
        }),
      },
      trigger: {
        type: 'daily',
        hour: hour,
        minute: minute,
        repeats: true,
      } as any,
    });
  }

  // جدولة دواء مرة واحدة
  private async scheduleOnceMedicine(
    medicineId: string,
    medicineName: string,
    dosage: string,
    time: Date
  ): Promise<string> {
    let hour = time.getHours();
    let minute = time.getMinutes();
    
    if (isNaN(hour) || isNaN(minute)) {
      const ts = (time as any)?.__timeString || (time as any)?.timeString || '';
      const parsed = this.parseTimeString(ts);
      if (parsed) {
        hour = parsed.hour;
        minute = parsed.minute;
      } else {
        hour = 9;
        minute = 0;
      }
    }

    // التحقق من صحة الوقت
    if (hour < 0 || hour > 23 || minute < 0 || minute > 59) {
      hour = 9;
      minute = 0;
    }

    // حساب الوقت الصحيح
    const now = new Date();
    let targetTime = new Date(now);
    targetTime.setHours(hour, minute, 0, 0);

    if (targetTime <= now) {
      targetTime.setDate(targetTime.getDate() + 1);
    }

    return await Notifications.scheduleNotificationAsync({
      content: {
        title: 'تذكير بالدواء',
        body: `حان وقت تناول ${medicineName} - الجرعة: ${dosage}`,
        data: {
          type: 'medicine',
          medicineId,
          medicineName,
          dosage,
          frequency: 'once',
          time: `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`,
          createdAt: new Date().toISOString(),
          scheduledAt: targetTime.toISOString(),
        },
        sound: 'default',
        priority: Notifications.AndroidNotificationPriority.HIGH,
        categoryIdentifier: 'medicine-reminder',
        ...(Platform.OS === 'android' && {
          channelId: 'meds',
          sticky: false,
          autoDismiss: true,
        }),
      },
      trigger: {
        type: 'date',
        date: targetTime,
      } as any,
    });
  }

  // جدولة تذكير بالدواء
  async scheduleMedicineReminder(
    medicineId: string,
    medicineName: string,
    dosage: string,
    time: Date,
    frequency: 'once' | 'daily' | 'twice_daily' | 'thrice_daily' | 'custom'
  ): Promise<string> {
    try {
      if (!(time instanceof Date)) {
        throw new Error('time parameter يجب أن يكون Date object');
      }

      // إنشاء قناة الإشعارات للأندرويد
      if (Platform.OS === 'android') {
        try {
          await Notifications.setNotificationChannelAsync('meds', {
            name: 'Medicine Reminders',
            importance: Notifications.AndroidImportance.HIGH,
            vibrationPattern: [0, 250, 250, 250],
            sound: 'default',
            lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
          });
        } catch (error) {
          // فشل في إنشاء قناة meds
        }
      }

      // التحقق من وجود إشعارات مجدولة بالفعل لهذا الدواء
      const existingNotifications = await this.getMedicineNotificationIds(medicineId);
      if (existingNotifications && existingNotifications.length > 0) {
        return existingNotifications[0];
      }

      // إلغاء أي إشعارات قديمة لهذا الدواء
      await this.cancelMedicineNotifications(medicineId);

      const notificationIds: string[] = [];

      switch (frequency) {
        case 'once':
        case 'custom':
          const onceId = await this.scheduleOnceMedicine(medicineId, medicineName, dosage, time);
          notificationIds.push(onceId);
          break;

        case 'daily':
          const dailyId = await this.scheduleDailyMedicine(medicineId, medicineName, dosage, time);
          notificationIds.push(dailyId);
          break;

        case 'twice_daily':
          const twiceIds = await this.scheduleTwiceDailyMedicine(medicineId, medicineName, dosage, time);
          notificationIds.push(...twiceIds);
          break;

        case 'thrice_daily':
          const thriceIds = await this.scheduleThriceDailyMedicine(medicineId, medicineName, dosage, time);
          notificationIds.push(...thriceIds);
          break;

        default:
          const customId = await this.scheduleOnceMedicine(medicineId, medicineName, dosage, time);
          notificationIds.push(customId);
          break;
      }

      // حفظ معرفات الإشعارات في التخزين المحلي
      await this.saveMedicineNotificationIds(medicineId, notificationIds);

      const resultId =
        notificationIds.length === 1
          ? notificationIds[0]
          : notificationIds.join(',');
      // فحص الإشعارات المجدولة بعد الجدولة
      const scheduledAfter =
        await Notifications.getAllScheduledNotificationsAsync();
      const medicineNotificationsAfter = scheduledAfter.filter(
        notification =>
          notification.content.data?.type === 'medicine' &&
          notification.content.data?.medicineId === medicineId
      );

      // فحص الإشعارات المجدولة بعد الجدولة

      return resultId;
    } catch (error) {
      throw error;
    }
  }

  // إلغاء إشعارات دواء محدد
  async cancelMedicineNotifications(medicineId: string): Promise<void> {
    try {
      const notificationIds = await this.getMedicineNotificationIds(medicineId);

      for (const id of notificationIds) {
        try {
          await Notifications.cancelScheduledNotificationAsync(id);
          // تم إلغاء إشعار الدواء
        } catch (error) {
          // إشعار غير موجود
        }
      }

      // حذف المعرفات من التخزين المحلي
      await this.removeMedicineNotificationIds(medicineId);
    } catch (error) {
      // خطأ في إلغاء إشعارات الدواء
    }
  }

  // حفظ معرفات إشعارات الدواء
  private async saveMedicineNotificationIds(
    medicineId: string,
    notificationIds: string[]
  ): Promise<void> {
    try {
      const key = `medicine_notifications_${medicineId}`;
      await AsyncStorage.setItem(key, JSON.stringify(notificationIds));
      // تم حفظ معرفات إشعارات الدواء
    } catch (error) {
      // خطأ في حفظ معرفات إشعارات الدواء
    }
  }

  // استرجاع معرفات إشعارات الدواء
  private async getMedicineNotificationIds(
    medicineId: string
  ): Promise<string[]> {
    try {
      const key = `medicine_notifications_${medicineId}`;
      const stored = await AsyncStorage.getItem(key);

      if (!stored || stored.trim() === '') {
        return [];
      }

      try {
        return JSON.parse(stored);
      } catch (parseError) {
        // خطأ في تحليل JSON للمفتاح
        return [];
      }
    } catch (error) {
      // خطأ في استرجاع معرفات إشعارات الدواء
      return [];
    }
  }

  // حذف معرفات إشعارات الدواء
  private async removeMedicineNotificationIds(
    medicineId: string
  ): Promise<void> {
    try {
      const key = `medicine_notifications_${medicineId}`;
      await AsyncStorage.removeItem(key);
      // تم حذف معرفات إشعارات الدواء
    } catch (error) {
      // خطأ في حذف معرفات إشعارات الدواء
    }
  }

  // دالة ذكية لفحص الحاجة لإعادة الجدولة
  private async shouldRescheduleMedicine(
    medicineId: string,
    medicineName: string,
    time: string,
    frequency: string
  ): Promise<boolean> {
    try {
      // فحص الإشعارات الموجودة
      const existingNotifications = await this.getMedicineNotificationIds(
        medicineId
      );
      if (existingNotifications.length === 0) {
        return true; // لا توجد إشعارات، نحتاج للجدولة
      }

      // فحص الإشعارات المجدولة حالياً
      const scheduledNotifications =
        await Notifications.getAllScheduledNotificationsAsync();
      const medicineNotifications = scheduledNotifications.filter(
        notification =>
          notification.content.data?.type === 'medicine' &&
          notification.content.data?.medicineId === medicineId
      );

      if (medicineNotifications.length === 0) {
        return true; // لا توجد إشعارات مجدولة، نحتاج للجدولة
      }

      // فحص أن الوقت والتردد متطابقان
      for (const notification of medicineNotifications) {
        const data = notification.content.data;
        if (
          data &&
          data.medicineName === medicineName &&
          data.frequency === frequency &&
          data.time === time
        ) {
          return false; // نفس البيانات، لا حاجة لإعادة الجدولة
        }
      }

      return true; // البيانات مختلفة، نحتاج لإعادة الجدولة
    } catch (error) {
      // خطأ في فحص الحاجة لإعادة الجدولة
      return true; // في حالة الخطأ، نعيد الجدولة
    }
  }






  // إرسال إشعار من الطبيب - تم إعادة تفعيله
  async sendDoctorNotification(
    doctorId: string,
    doctorName: string,
    title: string,
    message: string,
    type: 'appointment_update' | 'prescription' | 'general'
  ): Promise<string> {
    try {
      // إرسال إشعار طبيب

      // إنشاء إشعار محلي للدكتور
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: title,
          body: message,
          data: {
            type: 'doctor_notification',
            doctorId,
            doctorName,
            messageType: type,
            createdAt: new Date().toISOString(),
          },
          sound: 'default',
          priority: Notifications.AndroidNotificationPriority.HIGH,
        },
        trigger: null, // إرسال فوري
      });

      // تم إرسال إشعار الطبيب
      return notificationId;
    } catch (error) {
      // خطأ في إرسال إشعار الطبيب
      throw error;
    }
  }

  // إلغاء إشعار محدد
  async cancelNotification(notificationId: string): Promise<void> {
    try {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
      // تم إلغاء الإشعار
    } catch (error) {
      // خطأ في إلغاء الإشعار
      throw error;
    }
  }

  // إلغاء جميع الإشعارات
  async cancelAllNotifications(): Promise<void> {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      // تنظيف معرفات الدواء المخزنة لتجنّب إعادة الجدولة الفورية من بيانات قديمة
      const keys = await AsyncStorage.getAllKeys();
      const medicineIds = keys.filter(k =>
        k.startsWith('medicine_notifications_')
      );
      for (const key of medicineIds) {
        try {
          await AsyncStorage.removeItem(key);
        } catch {}
      }
      // تم إلغاء جميع الإشعارات
    } catch (error) {
      // خطأ في إلغاء جميع الإشعارات
      throw error;
    }
  }

  // دالة فارغة - تم إزالة حذف التذكيرات
  async cancelAppointmentReminders(appointmentId: string): Promise<void> {
    // تم إزالة دالة حذف التذكيرات - التذكيرات ستبقى كما هي
  }

  // الحصول على جميع الإشعارات المجدولة
  async getScheduledNotifications(): Promise<
    Notifications.NotificationRequest[]
  > {
    try {
      const notifications =
        await Notifications.getAllScheduledNotificationsAsync();
      // عدد الإشعارات المجدولة
      return notifications;
    } catch (error) {
      // خطأ في الحصول على الإشعارات المجدولة
      throw error;
    }
  }

  // دالة مساعدة لفحص الإشعارات المجدولة
  async checkScheduledNotifications(): Promise<void> {
    try {
      const scheduled = await Notifications.getAllScheduledNotificationsAsync();
      // عدد الإشعارات المجدولة

      if (scheduled.length > 0) {
        // الإشعارات المجدولة
        scheduled.forEach((notification, index) => {
          // إشعار مجدول
          // تفاصيل الإشعار
        });
      } else {
        // لا توجد إشعارات مجدولة
      }
    } catch (error) {
      // خطأ في فحص الإشعارات المجدولة
    }
  }



  // إعداد مستمع للإشعارات
  addNotificationListener(
    callback: (notification: Notifications.Notification) => void
  ): Notifications.Subscription {
    return Notifications.addNotificationReceivedListener(callback);
  }

  // إعداد مستمع لتفاعل المستخدم مع الإشعار
  addNotificationResponseListener(
    callback: (response: Notifications.NotificationResponse) => void
  ): Notifications.Subscription {
    return Notifications.addNotificationResponseReceivedListener(callback);
  }

  // إزالة مستمع الإشعارات
  removeNotificationListener(subscription: Notifications.Subscription): void {
    subscription.remove();
  }

  // الحصول على رمز الإشعارات الحالي
  getExpoPushToken(): string | null {
    return this.expoPushToken;
  }

  // دالة لفحص حالة الإشعارات
  async checkNotificationStatus(): Promise<any> {
    try {
      const scheduledNotifications =
        await Notifications.getAllScheduledNotificationsAsync();
      const currentTime = new Date();

      // فحص حالة الإشعارات

      const status = {
        totalScheduled: scheduledNotifications.length,
        currentTime: currentTime.toLocaleString('ar-EG'),
        notifications: scheduledNotifications.map(notification => ({
          id: notification.identifier,
          title: notification.content.title,
          type: notification.content.data?.type || 'unknown',
          trigger: notification.trigger,
          scheduledFor: this.getScheduledTime(notification.trigger),
        })),
      };

      // تفاصيل الإشعارات المجدولة
      return status;
    } catch (error) {
      // خطأ في فحص حالة الإشعارات
      throw error;
    }
  }


  // دالة مساعدة لحساب وقت الإشعار المجدول
  private getScheduledTime(trigger: any): string {
    try {
      if (trigger.date) {
        return new Date(trigger.date).toLocaleString('ar-EG');
      } else if (trigger.seconds) {
        const scheduledTime = new Date(Date.now() + trigger.seconds * 1000);
        return scheduledTime.toLocaleString('ar-EG');
      } else if (trigger.hour !== undefined && trigger.minute !== undefined) {
        const now = new Date();
        const scheduledTime = new Date(now);
        scheduledTime.setHours(trigger.hour, trigger.minute, 0, 0);

        // إذا كان الوقت قد مر اليوم، جدوله للغد
        if (scheduledTime <= now) {
          scheduledTime.setDate(scheduledTime.getDate() + 1);
        }

        return scheduledTime.toLocaleString('ar-EG');
      }
      return 'غير محدد';
    } catch (error) {
      return 'خطأ في الحساب';
    }
  }


  // إرسال إشعار push للدكتور عبر الخادم
  async sendPushNotificationToDoctor(
    doctorId: string,
    title: string,
    body: string,
    data?: any
  ): Promise<boolean> {
    try {
      // إرسال إشعار push للدكتور

      // إرسال الإشعار إلى الخادم لإرساله كـ push notification
      const response = await fetch(`${API_CONFIG.BASE_URL}/notifications/send-push`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          doctorId,
          title,
          body,
          data: data || {},
          timestamp: new Date().toISOString(),
        }),
      });

      if (response.ok) {
        const result = await response.json();
        // تم إرسال إشعار push للدكتور
        return true;
      } else {
        // فشل في إرسال إشعار push
        return false;
      }
    } catch (error) {
      // خطأ في إرسال إشعار push للدكتور
      return false;
    }
  }

  // إرسال إشعار push للمريض عبر الخادم
  async sendPushNotificationToUser(
    userId: string,
    title: string,
    body: string,
    data?: any
  ): Promise<boolean> {
    try {
      // إرسال إشعار push للمريض

      // إرسال الإشعار إلى الخادم لإرساله كـ push notification
      const response = await fetch(`${API_CONFIG.BASE_URL}/notifications/send-push-user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          title,
          body,
          data: data || {},
          timestamp: new Date().toISOString(),
        }),
      });

      if (response.ok) {
        const result = await response.json();
        // تم إرسال إشعار push للمريض
        return true;
      } else {
        // فشل في إرسال إشعار push للمريض
        return false;
      }
    } catch (error) {
      // خطأ في إرسال إشعار push للمريض
      return false;
    }
    }

  // إرسال إشعار موعد جديد للدكتور
  async sendNewAppointmentNotificationToDoctor(
    doctorId: string,
    patientName: string,
    appointmentDate: string,
    appointmentTime: string,
    appointmentId: string
  ): Promise<boolean> {
    try {
      // إرسال إشعار موعد جديد للدكتور

      // تنسيق التاريخ والوقت للعرض
      const formattedDate = new Date(appointmentDate).toLocaleDateString('ar-EG', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      
      const formattedTime = appointmentTime || new Date(appointmentDate).toLocaleTimeString('ar-EG', {
        hour: '2-digit',
        minute: '2-digit'
      });

      // 1. إرسال إشعار محلي فوري أولاً - إضافة الإشعارات الفورية
      let localNotificationSuccess = false;
      try {
        // إنشاء قناة إشعارات خاصة للمواعيد الجديدة
        if (Platform.OS === 'android') {
          try {
            await Notifications.setNotificationChannelAsync('new_appointment', {
              name: 'مواعيد جديدة',
              importance: Notifications.AndroidImportance.HIGH,
              vibrationPattern: [0, 300, 200, 300], // اهتزاز متوسط
              sound: 'default',
              lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
              enableVibrate: true,
              enableLights: true,
              lightColor: '#4CAF50', // لون أخضر للمواعيد الجديدة
            });
          } catch (channelError) {
            // خطأ في إنشاء قناة المواعيد الجديدة
          }
        }

        // إرسال إشعار محلي فوري مع صوت واهتزاز
        const localNotificationId = await Notifications.scheduleNotificationAsync({
          content: {
            title: i18n.t('notifications.new_appointment_title'),
            body: i18n.t('notifications.new_appointment_body', { patientName, date: formattedDate, time: formattedTime }),
            sound: 'default',
            priority: Notifications.AndroidNotificationPriority.HIGH,
            vibrate: [0, 300, 200, 300], // اهتزاز متوسط
            badge: 1,
            data: {
              type: 'new_appointment',
              appointmentId,
              patientName,
              date: formattedDate,
              time: formattedTime,
              createdAt: new Date().toISOString(),
            },
            // خيارات إضافية للأندرويد
            ...(Platform.OS === 'android' && {
              channelId: 'new_appointment',
              color: '#4CAF50', // لون أخضر للمواعيد الجديدة
              smallIcon: 'ic_notification',
              largeIcon: 'ic_launcher',
            }),
          },
          trigger: null, // إرسال فوري
        });

        localNotificationSuccess = true;
      } catch (localError) {
        // فشل في إرسال الإشعار المحلي الفوري
        
        // طريقة بديلة: استخدام sendDoctorNotification
        try {
          const fallbackNotificationId = await this.sendDoctorNotification(
            doctorId,
            'نظام المواعيد',
            i18n.t('notifications.new_appointment_title'),
            i18n.t('notifications.new_appointment_body', { patientName, date: formattedDate, time: formattedTime }),
            'appointment_update'
          );
          localNotificationSuccess = true;
        } catch (fallbackError) {
          // فشل في الطريقتين للإشعار المحلي
        }
      }

      // 2. إرسال إشعار push
      const pushSuccess = await this.sendPushNotificationToDoctor(
        doctorId,
        i18n.t('notifications.new_appointment_title'),
        i18n.t('notifications.new_appointment_body', { patientName, date: formattedDate, time: formattedTime }),
        {
          type: 'new_appointment',
          appointmentId,
          patientName,
          date: formattedDate,
          time: formattedTime,
        }
      );

      return pushSuccess || localNotificationSuccess;
    } catch (error) {
      return false;
    }
  }

  // إرسال إشعار إلغاء الموعد للمريض
  async sendAppointmentCancellationNotification(
    patientId: string,
    patientName: string,
    doctorName: string,
    appointmentDate: string,
    appointmentTime: string,
    appointmentId: string
  ): Promise<boolean> {
    try {

      // تنسيق التاريخ والوقت للعرض
      const formattedDate = new Date(appointmentDate).toLocaleDateString('ar-EG', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      
      const formattedTime = appointmentTime || new Date(appointmentDate).toLocaleTimeString('ar-EG', {
        hour: '2-digit',
        minute: '2-digit'
      });

      // 1. إرسال إشعار محلي فوري أولاً - إضافة الإشعارات الفورية
      let localNotificationSuccess = false;
      try {
        // إنشاء قناة إشعارات خاصة لإلغاء المواعيد
        if (Platform.OS === 'android') {
          try {
            await Notifications.setNotificationChannelAsync('appointment_cancellation', {
              name: 'إلغاء المواعيد',
              importance: Notifications.AndroidImportance.HIGH,
              vibrationPattern: [0, 500, 200, 500, 200, 500], // اهتزاز قوي ومتكرر
              sound: 'default',
              lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
              enableVibrate: true,
              enableLights: true,
              lightColor: '#FF0000',
            });
          } catch (channelError) {
            // خطأ في إنشاء قناة إلغاء المواعيد
          }
        }

        // إرسال إشعار محلي فوري مع صوت واهتزاز قوي
        const localNotificationId = await Notifications.scheduleNotificationAsync({
          content: {
            title: i18n.t('notifications.appointment_cancelled_title'),
            body: i18n.t('notifications.appointment_cancelled_by_doctor'),
            sound: 'default', // صوت عالي
            priority: Notifications.AndroidNotificationPriority.MAX, // أولوية عالية جداً
            vibrate: [0, 1000, 500, 1000, 500, 1000], // اهتزاز قوي ومتكرر
            badge: 1, // شارة
            data: {
              type: 'appointment_cancelled',
              appointmentId,
              patientName,
              doctorName,
              date: formattedDate,
              time: formattedTime,
              createdAt: new Date().toISOString(),
            },
            // خيارات إضافية للأندرويد
            ...(Platform.OS === 'android' && {
              channelId: 'appointment_cancellation',
              color: '#FF0000', // لون أحمر للتنبيه
              smallIcon: 'ic_notification',
              largeIcon: 'ic_launcher',
              categoryId: 'appointment_cancellation',
              autoCancel: false, // لا يختفي تلقائياً
              ongoing: false, // ليس إشعار مستمر
              visibility: Notifications.AndroidNotificationVisibility.PUBLIC,
            }),
          },
          trigger: null, // إرسال فوري
        });

        localNotificationSuccess = true;
      } catch (localError) {
        // فشل في إرسال الإشعار المحلي الفوري
      }

      // 2. إرسال push notification للمريض
      const pushSuccess = await this.sendPushNotificationToUser(
        patientId,
        i18n.t('notifications.appointment_cancelled_title'),
        i18n.t('notifications.appointment_cancelled_by_doctor'),
        {
          type: 'appointment_cancelled',
          appointmentId,
          patientName,
          doctorName,
          date: formattedDate,
          time: formattedTime,
        }
      );

      return pushSuccess || localNotificationSuccess;
    } catch (error) {
      return false;
    }
  }

  // إرسال إشعار إلغاء موعد مع صوت واهتزاز قوي
  async sendAppointmentCancellationLocalNotification(
    title: string,
    body: string,
    data?: any
  ): Promise<string> {
    try {

      // إنشاء قناة إشعارات خاصة لإلغاء المواعيد
      if (Platform.OS === 'android') {
        try {
          await Notifications.setNotificationChannelAsync('appointment_cancellation', {
            name: 'إلغاء المواعيد',
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 1000, 500, 1000, 500, 1000], // اهتزاز قوي ومتكرر
            sound: 'default',
            lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
            enableVibrate: true,
            enableLights: true,
            lightColor: '#FF0000',
            showBadge: true,
            bypassDnd: true,
          });
        } catch (channelError) {
          // خطأ في إنشاء قناة إلغاء المواعيد
        }
      }

      // إعداد محتوى الإشعار مع صوت واهتزاز قوي
      const notificationContent = {
        title: title,
        body: body,
        sound: 'default', // صوت عالي
        priority: Notifications.AndroidNotificationPriority.MAX, // أولوية قصوى
        vibrate: [0, 1000, 500, 1000, 500, 1000], // اهتزاز قوي ومتكرر
        badge: 1, // شارة
        data: data || {},
        // خيارات إضافية للأندرويد
        ...(Platform.OS === 'android' && {
          channelId: 'appointment_cancellation',
          color: '#FF0000', // لون أحمر للتنبيه
          smallIcon: 'ic_notification',
          largeIcon: 'ic_launcher',
          categoryId: 'appointment_cancellation',
          autoCancel: false,
          ongoing: false,
          visibility: Notifications.AndroidNotificationVisibility.PUBLIC,
          showTimestamp: true,
          when: Date.now(),
        }),
      };

      const notificationId = await Notifications.scheduleNotificationAsync({
        content: notificationContent,
        trigger: null, // إرسال فوري
      });

      return notificationId;
    } catch (error) {
      throw error;
    }
  }

}

export default NotificationService.getInstance();
