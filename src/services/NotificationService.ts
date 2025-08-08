import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { API_CONFIG } from '../config/api';

// تكوين الإشعارات
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export interface NotificationData {
  id: string;
  title: string;
  body: string;
  data?: any;
  scheduledDate?: Date;
  type: 'doctor' | 'medicine' | 'appointment' | 'general';
}

export class NotificationService {
  private static instance: NotificationService;
  private expoPushToken: string | null = null;

  private constructor() {}

  public static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  // تسجيل الجهاز للحصول على رمز الإشعارات
  async registerForPushNotifications(): Promise<string | null> {
    if (!Device.isDevice) {
      console.log('❌ يجب تشغيل التطبيق على جهاز حقيقي');
      return null;
    }

    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.log('❌ لم يتم منح إذن الإشعارات');
        return null;
      }

                        const token = await Notifications.getExpoPushTokenAsync({
                    projectId: 'tabibiq-mobile', // معرف مشروع Expo
                  });

      this.expoPushToken = token.data;
      console.log('✅ تم تسجيل رمز الإشعارات:', this.expoPushToken);

      // إرسال الرمز إلى الخادم
      await this.sendTokenToServer(this.expoPushToken);

      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
        });
      }

      return this.expoPushToken;
    } catch (error) {
      console.error('❌ خطأ في تسجيل الإشعارات:', error);
      return null;
    }
  }

  // إرسال رمز الإشعارات إلى الخادم
  private async sendTokenToServer(token: string, userId?: string, doctorId?: string): Promise<void> {
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/notifications/register`, {
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
      });

      if (response.ok) {
        console.log('✅ تم إرسال رمز الإشعارات إلى الخادم');
      } else {
        console.log('❌ فشل في إرسال رمز الإشعارات إلى الخادم');
      }
    } catch (error) {
      console.error('❌ خطأ في إرسال رمز الإشعارات:', error);
    }
  }

  // تسجيل الجهاز للحصول على رمز الإشعارات (للمستخدمين)
  async registerForUserNotifications(userId: string): Promise<string | null> {
    if (!Device.isDevice) {
      console.log('❌ يجب تشغيل التطبيق على جهاز حقيقي');
      return null;
    }

    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.log('❌ لم يتم منح إذن الإشعارات');
        return null;
      }

      const token = await Notifications.getExpoPushTokenAsync({
        projectId: 'tabibiq-mobile',
      });

      this.expoPushToken = token.data;
      console.log('✅ تم تسجيل رمز الإشعارات للمستخدم:', this.expoPushToken);

      // إرسال الرمز إلى الخادم
      await this.sendTokenToServer(this.expoPushToken, userId);

      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
        });
      }

      return this.expoPushToken;
    } catch (error) {
      console.error('❌ خطأ في تسجيل إشعارات المستخدم:', error);
      return null;
    }
  }

  // تسجيل الجهاز للحصول على رمز الإشعارات (للأطباء)
  async registerForDoctorNotifications(doctorId: string): Promise<string | null> {
    if (!Device.isDevice) {
      console.log('❌ يجب تشغيل التطبيق على جهاز حقيقي');
      return null;
    }

    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.log('❌ لم يتم منح إذن الإشعارات');
        return null;
      }

      const token = await Notifications.getExpoPushTokenAsync({
        projectId: 'tabibiq-mobile',
      });

      this.expoPushToken = token.data;
      console.log('✅ تم تسجيل رمز الإشعارات للطبيب:', this.expoPushToken);

      // إرسال الرمز إلى الخادم
      await this.sendTokenToServer(this.expoPushToken, undefined, doctorId);

      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
        });
      }

      return this.expoPushToken;
    } catch (error) {
      console.error('❌ خطأ في تسجيل إشعارات الطبيب:', error);
      return null;
    }
  }

  // إرسال إشعار فوري
  async sendImmediateNotification(notification: Omit<NotificationData, 'id'>): Promise<string> {
    try {
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: notification.title,
          body: notification.body,
          data: notification.data || {},
          sound: 'default',
          priority: Notifications.AndroidNotificationPriority.HIGH,
        },
        trigger: null, // إرسال فوري
      });

      console.log('✅ تم إرسال الإشعار الفوري:', notificationId);
      return notificationId;
    } catch (error) {
      console.error('❌ خطأ في إرسال الإشعار الفوري:', error);
      throw error;
    }
  }

  // جدولة إشعار للموعد (ساعة قبل الموعد)
  async scheduleAppointmentReminder(
    appointmentId: string,
    appointmentDate: Date,
    doctorName: string,
    patientName: string
  ): Promise<string> {
    try {
      // إشعار قبل ساعة من الموعد
      const reminderDate = new Date(appointmentDate.getTime() - 60 * 60 * 1000);
      
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: 'تذكير بالموعد الطبي',
          body: `موعدك مع ${doctorName} بعد ساعة واحدة. تأكد من الحضور في الوقت المحدد.`,
          data: {
            type: 'appointment',
            appointmentId,
            doctorName,
            patientName,
            appointmentDate: appointmentDate.toISOString(),
          },
          sound: 'default',
          priority: Notifications.AndroidNotificationPriority.HIGH,
        },
        trigger: {
          date: reminderDate,
        },
      });

      console.log('✅ تم جدولة تذكير الموعد:', notificationId);
      return notificationId;
    } catch (error) {
      console.error('❌ خطأ في جدولة تذكير الموعد:', error);
      throw error;
    }
  }

  // جدولة تذكير بالدواء
  async scheduleMedicineReminder(
    medicineId: string,
    medicineName: string,
    dosage: string,
    time: Date,
    frequency: 'daily' | 'twice_daily' | 'thrice_daily' | 'custom'
  ): Promise<string> {
    try {
      let trigger: any;

      switch (frequency) {
        case 'daily':
          trigger = {
            hour: time.getHours(),
            minute: time.getMinutes(),
            repeats: true,
          };
          break;
        case 'twice_daily':
          // جدولة مرتين يومياً
          const morningTime = new Date(time);
          const eveningTime = new Date(time);
          eveningTime.setHours(time.getHours() + 12);
          
          await Notifications.scheduleNotificationAsync({
            content: {
              title: 'تذكير بالدواء - الصباح',
              body: `حان وقت تناول ${medicineName} - ${dosage}`,
              data: {
                type: 'medicine',
                medicineId,
                medicineName,
                dosage,
                time: 'morning',
              },
              sound: 'default',
              priority: Notifications.AndroidNotificationPriority.HIGH,
            },
            trigger: {
              hour: morningTime.getHours(),
              minute: morningTime.getMinutes(),
              repeats: true,
            },
          });

          trigger = {
            hour: eveningTime.getHours(),
            minute: eveningTime.getMinutes(),
            repeats: true,
          };
          break;
        case 'thrice_daily':
          // جدولة ثلاث مرات يومياً
          const times = [
            { hour: time.getHours(), minute: time.getMinutes() },
            { hour: time.getHours() + 6, minute: time.getMinutes() },
            { hour: time.getHours() + 12, minute: time.getMinutes() },
          ];

          for (let i = 0; i < times.length; i++) {
            await Notifications.scheduleNotificationAsync({
              content: {
                title: `تذكير بالدواء - الجرعة ${i + 1}`,
                body: `حان وقت تناول ${medicineName} - ${dosage}`,
                data: {
                  type: 'medicine',
                  medicineId,
                  medicineName,
                  dosage,
                  time: `dose_${i + 1}`,
                },
                sound: 'default',
                priority: Notifications.AndroidNotificationPriority.HIGH,
              },
              trigger: {
                hour: times[i].hour,
                minute: times[i].minute,
                repeats: true,
              },
            });
          }
          return 'multiple';
        default:
          trigger = {
            date: time,
          };
      }

      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: 'تذكير بالدواء',
          body: `حان وقت تناول ${medicineName} - ${dosage}`,
          data: {
            type: 'medicine',
            medicineId,
            medicineName,
            dosage,
          },
          sound: 'default',
          priority: Notifications.AndroidNotificationPriority.HIGH,
        },
        trigger,
      });

      console.log('✅ تم جدولة تذكير الدواء:', notificationId);
      return notificationId;
    } catch (error) {
      console.error('❌ خطأ في جدولة تذكير الدواء:', error);
      throw error;
    }
  }

  // إرسال إشعار من الطبيب
  async sendDoctorNotification(
    doctorId: string,
    doctorName: string,
    message: string,
    type: 'appointment_update' | 'prescription' | 'general'
  ): Promise<string> {
    try {
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: `رسالة من ${doctorName}`,
          body: message,
          data: {
            type: 'doctor',
            doctorId,
            doctorName,
            messageType: type,
          },
          sound: 'default',
          priority: Notifications.AndroidNotificationPriority.HIGH,
        },
        trigger: null, // إرسال فوري
      });

      console.log('✅ تم إرسال إشعار الطبيب:', notificationId);
      return notificationId;
    } catch (error) {
      console.error('❌ خطأ في إرسال إشعار الطبيب:', error);
      throw error;
    }
  }

  // إلغاء إشعار محدد
  async cancelNotification(notificationId: string): Promise<void> {
    try {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
      console.log('✅ تم إلغاء الإشعار:', notificationId);
    } catch (error) {
      console.error('❌ خطأ في إلغاء الإشعار:', error);
      throw error;
    }
  }

  // إلغاء جميع الإشعارات
  async cancelAllNotifications(): Promise<void> {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      console.log('✅ تم إلغاء جميع الإشعارات');
    } catch (error) {
      console.error('❌ خطأ في إلغاء جميع الإشعارات:', error);
      throw error;
    }
  }

  // الحصول على جميع الإشعارات المجدولة
  async getScheduledNotifications(): Promise<Notifications.NotificationRequest[]> {
    try {
      const notifications = await Notifications.getAllScheduledNotificationsAsync();
      console.log('📋 عدد الإشعارات المجدولة:', notifications.length);
      return notifications;
    } catch (error) {
      console.error('❌ خطأ في الحصول على الإشعارات المجدولة:', error);
      throw error;
    }
  }

  // إعداد مستمع للإشعارات
  addNotificationListener(callback: (notification: Notifications.Notification) => void): Notifications.Subscription {
    return Notifications.addNotificationReceivedListener(callback);
  }

  // إعداد مستمع لتفاعل المستخدم مع الإشعار
  addNotificationResponseListener(callback: (response: Notifications.NotificationResponse) => void): Notifications.Subscription {
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
}

export default NotificationService.getInstance();
