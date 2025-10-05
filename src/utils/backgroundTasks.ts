import * as BackgroundFetch from 'expo-background-fetch';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as TaskManager from 'expo-task-manager';

export const appointmentReminderTask = async () => {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const reminderKeys = keys.filter(key =>
      key.startsWith('appointment_reminders_')
    );

    let processedCount = 0;

    for (const key of reminderKeys) {
      try {
        const reminderData = await AsyncStorage.getItem(key);
        if (reminderData) {
          let reminder;
          try {
            reminder = JSON.parse(reminderData);
          } catch (parseError) {
            continue;
          }

          if (!reminder || typeof reminder !== 'object') {
            continue;
          }

          const reminderTime = new Date(reminder.reminderTime);
          const now = new Date();

          if (reminderTime <= now) {
            // فحص حالة الموعد قبل إرسال التذكير
            try {
              const { api } = require('../services/api');
              const appointmentResponse = await api.get(`/appointments/${reminder.appointmentId}`);
              
              if (appointmentResponse && appointmentResponse.data) {
                const appointment = appointmentResponse.data;
                
                // إذا كان الموعد ملغياً، لا نرسل التذكير
                if (appointment.status === 'cancelled' || appointment.status === 'completed') {

                  await AsyncStorage.removeItem(key);
                  processedCount++;
                  continue;
                }
              }
            } catch (error) {

            }

            await Notifications.scheduleNotificationAsync({
              content: {
                title: 'تذكير بالموعد الطبي',
                body: `موعدك مع د. ${reminder.doctorName} بعد ساعة. إذا تم إلغاء الموعد تجاهل التذكير يرجى التأكد من تاريخ الموعد في قائمة المواعيد.`,
                data: {
                  type: 'appointment',
                  appointmentId: reminder.appointmentId,
                  doctorName: reminder.doctorName,
                  patientName: reminder.patientName,
                  appointmentDate: reminder.appointmentDate,
                },
                sound: 'default',
                priority: Notifications.AndroidNotificationPriority.HIGH,
              },
              trigger: { seconds: 60 } as any,
            });

            await AsyncStorage.removeItem(key);
            processedCount++;
          }
        }
      } catch (error) {
        // خطأ في معالجة التذكير
      }
    }

    if (processedCount > 0) {
      return BackgroundFetch.BackgroundFetchResult.NewData;
    } else {
      return BackgroundFetch.BackgroundFetchResult.NoData;
    }
  } catch (error) {
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
};

export const registerBackgroundTasks = async () => {
  try {
    // تعطيل مؤقت لـ expo-background-fetch deprecated

    return true;
    
    // الكود الأصلي معطل مؤقتاً
    // await BackgroundFetch.registerTaskAsync('appointment-reminders', {
    //   minimumInterval: 15 * 60,
    //   stopOnTerminate: false,
    //   startOnBoot: true,
    // });
    // await BackgroundFetch.setMinimumIntervalAsync(15 * 60);
    // return true;
  } catch (error) {
    return false;
  }
};

export const unregisterBackgroundTasks = async () => {
  try {
    await BackgroundFetch.unregisterTaskAsync('appointment-reminders');
    return true;
  } catch (error) {
    return false;
  }
};

export const getBackgroundFetchStatus = async () => {
  try {
    return await BackgroundFetch.getStatusAsync();
  } catch (error) {
    return BackgroundFetch.BackgroundFetchStatus.Restricted;
  }
};

// تعريف المهمة في TaskManager
TaskManager.defineTask('appointment-reminders', appointmentReminderTask);
