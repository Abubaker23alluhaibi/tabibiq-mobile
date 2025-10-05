import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import i18n from '../locales/index';

type ReminderMeta = {
  notifId: string;
  appointmentIso?: string;
  reminderIso?: string;
  kind: 'appointment' | 'med';
};

const MAP_KEY = 'TABIBIQ__SCHEDULED_MAP';
let inMemoryMap = new Map<string, ReminderMeta>();

async function loadMap() {
  try {
    const raw = await AsyncStorage.getItem(MAP_KEY);
    if (raw) {
      try {
        const parsedData = JSON.parse(raw);
        inMemoryMap = new Map<string, ReminderMeta>(parsedData);
      } catch (parseError) {
        inMemoryMap = new Map<string, ReminderMeta>();
      }
    }
  } catch (error) {
    inMemoryMap = new Map<string, ReminderMeta>();
  }
}

async function saveMap() {
  try {
    const arr = Array.from(inMemoryMap.entries());
    await AsyncStorage.setItem(MAP_KEY, JSON.stringify(arr));
  } catch {
    // ignore
  }
}

export async function initNotifications() {
  await loadMap();

  try {
    const { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted') {
      await Notifications.requestPermissionsAsync();
    }
  } catch {
    // ignore
  }

  if (Platform.OS === 'android') {
    try {
      await Notifications.setNotificationChannelAsync('appointments', {
        name: 'Appointments',
        importance: Notifications.AndroidImportance.HIGH,
        sound: 'default',
        vibrationPattern: [0, 250, 250, 250],
        lockscreenVisibility:
          Notifications.AndroidNotificationVisibility.PUBLIC,
      });
      await Notifications.setNotificationChannelAsync('meds', {
        name: 'Medications',
        importance: Notifications.AndroidImportance.HIGH,
        sound: 'default',
        vibrationPattern: [0, 200, 200, 200],
        lockscreenVisibility:
          Notifications.AndroidNotificationVisibility.PUBLIC,
      });
      // قناة خاصة لإلغاء المواعيد مع صوت واهتزاز أقوى
      await Notifications.setNotificationChannelAsync('appointment_cancellation', {
        name: 'إلغاء المواعيد',
        description: 'إشعارات إلغاء المواعيد الطبية - أولوية قصوى',
        importance: Notifications.AndroidImportance.MAX,
        sound: 'default',
        vibrationPattern: [0, 1000, 500, 1000, 500, 1000],
        lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
        enableVibrate: true,
        enableLights: true,
        lightColor: '#FF0000',
        showBadge: true,
        bypassDnd: true, // تجاوز وضع عدم الإزعاج
        // enableSound: true, // غير مدعوم في هذا الإصدار
        // إعدادات إضافية للأندرويد
        // canShowBadge: true, // غير مدعوم في هذا الإصدار
        // canBypassDnd: true, // غير مدعوم في هذا الإصدار
        // canBubble: true, // غير مدعوم في هذا الإصدار
        // canShowLights: true, // غير مدعوم في هذا الإصدار
        // canVibrate: true, // غير مدعوم في هذا الإصدار
        // canShowSound: true, // غير مدعوم في هذا الإصدار
      });
      
      // قناة عامة للإشعارات العادية
      await Notifications.setNotificationChannelAsync('general_notifications', {
        name: 'الإشعارات العامة',
        importance: Notifications.AndroidImportance.HIGH,
        sound: 'default',
        vibrationPattern: [0, 500, 200, 500],
        lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
        enableVibrate: true,
        enableLights: true,
        lightColor: '#4CAF50',
        showBadge: true,
        // enableSound: true, // غير مدعوم في هذا الإصدار
      });
    } catch {
      // ignore
    }
  }

  Notifications.setNotificationHandler({
    handleNotification: async (notification) => {

      
      // إظهار إشعار فوري مع صوت واهتزاز
      return {
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true,
      };
    },
  });

  if (Platform.OS === 'android') {
    try {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Default',
        importance: Notifications.AndroidImportance.HIGH,
        sound: 'default',
        vibrationPattern: [0, 250, 250, 250],
        lockscreenVisibility:
          Notifications.AndroidNotificationVisibility.PUBLIC,
      });
    } catch (error) {
      // خطأ في إعداد قناة الإشعارات الافتراضية
    }
  }
}

export async function scheduleAppointmentReminder(
  appointmentId: string,
  appointmentDate: string,
  reminderMinutes: number = 30
) {
  try {
    const appointmentTime = new Date(appointmentDate);
    const reminderTime = new Date(appointmentTime.getTime() - reminderMinutes * 60 * 1000);
    
    if (reminderTime <= new Date()) {
      return null;
    }

    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: i18n.t('notifications.appointmentReminder.title'),
        body: i18n.t('notifications.appointmentReminder.body'),
        data: { appointmentId, type: 'appointment' },
      },
      trigger: {
        date: reminderTime,
      } as any,
    });

    inMemoryMap.set(notificationId, {
      notifId: notificationId,
      appointmentIso: appointmentDate,
      kind: 'appointment',
    });
    await saveMap();

    return notificationId;
  } catch (error) {
    return null;
  }
}

export async function scheduleMedicationReminder(
  reminderId: string,
  reminderTime: string,
  medicineName: string,
  dosage: string
) {
  try {
    const [hours, minutes] = reminderTime.split(':').map(Number);
    const now = new Date();
    const reminderDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes);
    
    if (reminderDate <= now) {
      reminderDate.setDate(reminderDate.getDate() + 1);
    }

    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: i18n.t('notifications.medicationReminder.title'),
        body: i18n.t('notifications.medicationReminder.body', { medicine: medicineName, dosage }),
        data: { reminderId, type: 'medication' },
      },
      trigger: {
        date: reminderDate,
        repeats: true,
      } as any,
    });

    inMemoryMap.set(notificationId, {
      notifId: notificationId,
      reminderIso: reminderTime,
      kind: 'med',
    });
    await saveMap();

    return notificationId;
  } catch (error) {
    return null;
  }
}

export async function cancelNotification(notificationId: string) {
  try {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
    inMemoryMap.delete(notificationId);
    await saveMap();
    return true;
  } catch (error) {
    return false;
  }
}

export async function cancelAllNotifications() {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
    inMemoryMap.clear();
    await saveMap();
    return true;
  } catch (error) {
    return false;
  }
}

export async function getScheduledNotifications() {
  try {
    return await Notifications.getAllScheduledNotificationsAsync();
  } catch (error) {
    return [];
  }
}

export async function sendLocalNotification(
  title: string,
  body: string,
  data?: any
) {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
      },
      trigger: null,
    });
    return true;
  } catch (error) {
    return false;
  }
}

export async function requestPermissions() {
  try {
    const { status } = await Notifications.requestPermissionsAsync();
    return status === 'granted';
  } catch (error) {
    return false;
  }
}

export async function getPermissionsStatus() {
  try {
    const { status } = await Notifications.getPermissionsAsync();
    return status;
  } catch (error) {
    return 'undetermined';
  }
}

export function addNotificationReceivedListener(
  listener: (notification: Notifications.Notification) => void
) {
  return Notifications.addNotificationReceivedListener(listener);
}

export function addNotificationResponseReceivedListener(
  listener: (response: Notifications.NotificationResponse) => void
) {
  return Notifications.addNotificationResponseReceivedListener(listener);
}

export async function setBadgeCountAsync(count: number) {
  try {
    await Notifications.setBadgeCountAsync(count);
    return true;
  } catch (error) {
    return false;
  }
}

export async function getBadgeCountAsync(): Promise<number> {
  try {
    return await Notifications.getBadgeCountAsync();
  } catch (error) {
    return 0;
  }
}

export async function clearBadgeCountAsync() {
  try {
    await Notifications.setBadgeCountAsync(0);
    return true;
  } catch (error) {
    return false;
  }
}
