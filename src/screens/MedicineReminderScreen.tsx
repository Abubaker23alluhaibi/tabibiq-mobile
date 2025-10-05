import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  TextInput,
  Modal,
  Platform,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { theme } from '../utils/theme';

import { useNotifications } from '../contexts/NotificationContext';
import { useAuth } from '../contexts/AuthContext';
import NotificationService from '../services/NotificationService';

const MedicineReminderScreen: React.FC = () => {
  const { t } = useTranslation();
  const {
    scheduleMedicineReminder,
    scheduleMedicineNotificationsIfNeeded,
    cancelNotification,
  } = useNotifications();
  const { user, profile } = useAuth();
  const [reminders, setReminders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newReminder, setNewReminder] = useState({
    medicineName: '',
    dosage: '',
    time: new Date(),
    frequency: 'once' as
      | 'once'
      | 'daily'
      | 'twice_daily'
      | 'thrice_daily'
      | 'custom',
  });
  const [newReminderTimes, setNewReminderTimes] = useState<string[]>([]);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedHour, setSelectedHour] = useState(new Date().getHours());
  const [selectedMinute, setSelectedMinute] = useState(new Date().getMinutes());

  useEffect(() => {
    fetchReminders();
  }, []);

  // مزامنة البيانات عند تغيير المستخدم
  useEffect(() => {
    if (user?.id || profile?._id) {
      fetchReminders();
    }
  }, [user?.id, profile?._id]);

  // حفظ الأدوية في AsyncStorage
  const saveRemindersToStorage = async (remindersList: any[]) => {
    try {
      const userId = user?.id || profile?._id || 'anonymous';
      const key = `medicine_reminders_user_${userId}`; // توحيد المفتاح مع NotificationContext
      await AsyncStorage.setItem(key, JSON.stringify(remindersList));

      // لا حاجة لإعادة جدولة تلقائية - الإشعارات ستُجدول عند الحاجة
    } catch (error) {
      // خطأ في حفظ الأدوية
    }
  };

  // استرجاع الأدوية من AsyncStorage
  const loadRemindersFromStorage = async () => {
    try {
      const userId = user?.id || profile?._id || 'anonymous';
      const key = `medicine_reminders_user_${userId}`; // توحيد المفتاح مع NotificationContext
      const storedReminders = await AsyncStorage.getItem(key);

      if (storedReminders) {
        let parsedReminders;
        try {
          parsedReminders = JSON.parse(storedReminders);
        } catch (parseError) {
          // خطأ في تحليل JSON
          setReminders([]);
          return [];
        }

        // التأكد من أن البيانات مصفوفة
        if (!Array.isArray(parsedReminders)) {
          setReminders([]);
          return [];
        }

        setReminders(parsedReminders);
        return parsedReminders;
      } else {
        setReminders([]);
        return [];
      }
    } catch (error) {
      setReminders([]);
      return [];
    }
  };

  const fetchReminders = async () => {
    try {
      setLoading(true);

      // استخدام البيانات المحلية فقط - لا مزامنة مع الخادم
      const localReminders = await loadRemindersFromStorage();
      setReminders(localReminders);

      // فحص الإشعارات المحلية فقط - لا جدولة تلقائية

    } catch (error) {
      setReminders([]);
    } finally {
      setLoading(false);
    }
  };

  // دالة محسنة لحفظ البيانات المحلية فقط
  const saveLocalDataOnly = async (localReminders: any[]) => {
    try {

      if (localReminders.length === 0) {
        return;
      }

      // حفظ في التخزين المحلي فقط
      await saveRemindersToStorage(localReminders);

    } catch (error) {
      // خطأ في حفظ البيانات المحلية
    }
  };

  const addReminder = () => {
    setShowAddModal(true);
  };

  // تنسيق وقت HH:mm الآتي من الخادم
  const formatReminderTime = (time: any) => {
    if (!time) return '';
    if (typeof time === 'string' && /^\d{2}:\d{2}$/.test(time)) return time;
    try {
      const d = new Date(time);
      const hh = String(d.getHours()).padStart(2, '0');
      const mm = String(d.getMinutes()).padStart(2, '0');
      return `${hh}:${mm}`;
    } catch {
      return String(time);
    }
  };

  // تنسيق الجرعة
  const formatDosage = (dose: any) => {
    try {
      if (dose === null || dose === undefined) return '';
      const s = String(dose).trim();
      if (/^\d+(\.\d+)?$/.test(s)) {
        return `${s} ${t('medicine_reminder.pill')}`;
      }
      return s;
    } catch {
      return String(dose || '');
    }
  };

  const getFrequencyText = (freq: string) => {
    switch (freq) {
      case 'daily':
        return t('medicine_reminder.daily');
      case 'twice_daily':
        return t('medicine_reminder.twice_daily');
      case 'thrice_daily':
        return t('medicine_reminder.thrice_daily');
      case 'three_times_daily':
        return t('medicine_reminder.thrice_daily');
      case 'once':
        return t('medicine_reminder.once');
      case 'custom':
        return t('medicine_reminder.once');
      default:
        return freq || '';
    }
  };

  // دالة لاختيار الوقت
  const handleTimeChange = (hour: number, minute: number) => {
    const newTime = new Date(newReminder.time);
    newTime.setHours(hour);
    newTime.setMinutes(minute);
    setNewReminder(prev => ({ ...prev, time: newTime }));
    setShowTimePicker(false);
    // إعادة فتح Modal الإضافة
    setShowAddModal(true);
    // إضافة الوقت المختار إلى قائمة الأوقات (كـ HH:mm) مع إزالة التكرار
    const hhStr = String(hour).padStart(2, '0');
    const mmStr = String(minute).padStart(2, '0');
    const t = `${hhStr}:${mmStr}`;
    setNewReminderTimes(prev => Array.from(new Set([...(prev || []), t])));
  };

  // دالة لاختيار التاريخ
  const handleDateChange = (daysToAdd: number) => {
    const newDate = new Date();
    newDate.setDate(newDate.getDate() + daysToAdd);
    const currentTime = newReminder.time;
    newDate.setHours(currentTime.getHours());
    newDate.setMinutes(currentTime.getMinutes());
    setNewReminder(prev => ({ ...prev, time: newDate }));
    setShowDatePicker(false);
    // إعادة فتح Modal الإضافة
    setShowAddModal(true);
  };

  // دالة لعرض اختيار الوقت
  const showTimePickerModal = () => {
    setSelectedHour(newReminder.time.getHours());
    setSelectedMinute(newReminder.time.getMinutes());
    setShowTimePicker(true);
    // إغلاق Modal الإضافة مؤقتاً
    setShowAddModal(false);
  };

  // دالة لعرض اختيار التاريخ
  const showDatePickerModal = () => {
    setShowDatePicker(true);
    // إغلاق Modal الإضافة مؤقتاً
    setShowAddModal(false);
  };

  // دالة محسنة لإضافة تذكير الدواء (تدعم أوقات متعددة)
  const handleAddReminder = async () => {
    if (!newReminder.medicineName || !newReminder.dosage) {
      Alert.alert(t('common.error'), t('medicine_reminder.fill_required_fields'));
      return;
    }

    try {
      const primaryHH = String(newReminder.time.getHours()).padStart(2, '0');
      const primaryMM = String(newReminder.time.getMinutes()).padStart(2, '0');
      const timesToSave: string[] =
        newReminderTimes && newReminderTimes.length > 0
          ? Array.from(new Set(newReminderTimes))
          : [`${primaryHH}:${primaryMM}`];

      // فرض عدد الأوقات حسب التكرار
      const requiredCount =
        newReminder.frequency === 'twice_daily'
          ? 2
          : newReminder.frequency === 'thrice_daily'
          ? 3
          : 1;
      if (timesToSave.length !== requiredCount) {
        const msg =
          requiredCount === 1
            ? 'يرجى اختيار وقت واحد'
            : `يرجى اختيار ${requiredCount} أوقات (حسب التكرار المختار)`;
        Alert.alert('عدد الأوقات غير صحيح', msg);
        setShowAddModal(true);
        return;
      }

      const userId = user?.id || profile?._id;
      if (!userId) {
        Alert.alert('خطأ', 'لا يوجد مستخدم محدد');
        return;
      }

      // حساب startDate و endDate (مثل الويب: أسبوع افتراضياً)
      const toYmd = (d: Date) => {
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const da = String(d.getDate()).padStart(2, '0');
        return `${y}-${m}-${da}`;
      };
      const start = new Date(newReminder.time);
      const end = new Date(start);
      end.setDate(end.getDate() + 7);
      const startDate = toYmd(start);
      const endDate = toYmd(end);

      // إنشاء عناصر محلية فقط - لا مزامنة مع الخادم
      const createdLocally: any[] = [];
      for (const t of timesToSave) {
        const reminderId = `local_${Date.now()}_${Math.random()
          .toString(36)
          .substr(2, 9)}`;
        createdLocally.push({
          id: reminderId,
          medicine_name: newReminder.medicineName,
          dosage: newReminder.dosage,
          time: t,
          date: startDate,
          frequency: newReminder.frequency,
          active: true,
          created_at: new Date().toISOString(),
          user_id: userId || 'anonymous',
        });
      }

      // جدولة إشعار لكل وقت
      for (const item of createdLocally) {
        try {
          const t = String(item.time);
          const [hh, mm] = t.split(':').map((n: string) => parseInt(n, 10));
          const medicineTime = new Date();
          medicineTime.setHours(hh, mm, 0, 0);
          const now = new Date();
          if (medicineTime <= now)
            medicineTime.setDate(medicineTime.getDate() + 1);
          
          
          await scheduleMedicineReminder(
            item.id,
            item.medicine_name,
            item.dosage,
            medicineTime,
            item.frequency
          );
        } catch (notificationError) {
          // خطأ في جدولة الوقت
        }
      }

      // عرض رسالة تأكيد بعد إنشاء جميع الأوقات
      Alert.alert(
        'تم إضافة التذكير بنجاح',
        `تمت إضافة ${createdLocally.length} وقت(ات)`,
        [{ text: 'حسناً' }]
      );

      // إضافة التذكيرات إلى القائمة المحلية
      const updatedReminders = [...reminders, ...createdLocally];
      setReminders(updatedReminders);
      await saveRemindersToStorage(updatedReminders);

      // إعادة تعيين النموذج
      setNewReminder({
        medicineName: '',
        dosage: '',
        time: new Date(),
        frequency: 'once',
      });
      setNewReminderTimes([]);

      setShowAddModal(false);

      // تحديث القائمة مرة أخرى للتأكد
      setTimeout(async () => {
        await fetchReminders();
      }, 800);
    } catch (error) {
      Alert.alert('خطأ', 'فشل في إضافة تذكير الدواء');
    }
  };

  const markAsTaken = async (reminderId: string) => {
    try {

      // تحديث القائمة المحلية فقط بدون حفظ فوري
      setReminders(prev => {
        const updatedReminders = prev.map(reminder =>
          reminder.id === reminderId
            ? { ...reminder, taken: true, taken_at: new Date().toISOString() }
            : reminder
        );
        return updatedReminders;
      });

      // تحديث الواجهة فوراً بدون إعادة رسم

      // حفظ التغييرات في الخلفية بدون منع المستخدم
      setTimeout(async () => {
        try {
          const currentReminders = reminders.map(reminder =>
            reminder.id === reminderId
              ? { ...reminder, taken: true, taken_at: new Date().toISOString() }
              : reminder
          );
          await saveRemindersToStorage(currentReminders);
        } catch (error) {
          // خطأ في حفظ حالة الدواء
        }
      }, 100);

      // عرض رسالة تأكيد بدون Alert.alert
    } catch (error) {
      // خطأ في تسجيل تناول الدواء
    }
  };

  const deleteReminder = async (reminderId: string) => {
    Alert.alert(t('medicine_reminder.delete_reminder'), t('medicine_reminder.confirm_delete'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: async () => {
          try {

            // إلغاء إشعارات الدواء المرتبطة بمعرف الدواء
            try {
              await NotificationService.cancelMedicineNotifications(reminderId);
            } catch (notificationError) {
              // خطأ في إلغاء إشعارات الدواء
            }

            // حذف من القائمة المحلية
            setReminders(prev => {
              const updatedReminders = prev.filter(
                reminder => reminder.id !== reminderId
              );
              return updatedReminders;
            });

            // حفظ التغييرات في الخلفية
            setTimeout(async () => {
              try {
                const currentReminders = reminders.filter(
                  reminder => reminder.id !== reminderId
                );
                await saveRemindersToStorage(currentReminders);
              } catch (error) {
                // خطأ في حفظ حذف الدواء
              }
            }, 100);

          } catch (error) {
            Alert.alert(t('common.error'), t('medicine_reminder.delete_failed'));
          }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>{t('medicine_reminder.loading_reminders')}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t('medicine_reminder.title')}</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.rescheduleButton}
            onPress={scheduleMedicineNotificationsIfNeeded}
          >
            <Ionicons name="refresh" size={18} color={theme.colors.white} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.addButton} onPress={addReminder}>
            <Ionicons name="add" size={20} color={theme.colors.white} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.content}>

        {reminders.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons
              name="medical"
              size={64}
              color={theme.colors.textSecondary}
            />
            <Text style={styles.emptyTitle}>{t('medicine_reminder.no_reminders')}</Text>
            <Text style={styles.emptySubtitle}>
              {t('medicine_reminder.add_reminders_subtitle')}
            </Text>
            <TouchableOpacity
              style={styles.addReminderButton}
              onPress={addReminder}
            >
              <Ionicons name="add" size={18} color={theme.colors.white} />
              <Text style={styles.addReminderButtonText}>{t('medicine_reminder.add_reminder')}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          reminders.map((reminder, index) => (
            <View key={reminder.id || index} style={styles.reminderCard}>
              <View style={styles.reminderHeader}>
                <View style={styles.medicineInfo}>
                  <Ionicons
                    name="medical"
                    size={24}
                    color={theme.colors.primary}
                  />
                  <View style={{ marginLeft: 12 }}>
                    <Text style={styles.medicineName}>
                      {reminder.medicine_name}
                    </Text>
                    <Text style={styles.medicineDosage}>
                      {formatDosage(reminder.dosage)}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  onPress={() => deleteReminder(reminder.id)}
                  style={styles.deleteButton}
                >
                  <Ionicons name="trash" size={18} color={theme.colors.error} />
                </TouchableOpacity>
              </View>

              <View style={styles.reminderDetails}>
                <View style={styles.detailRow}>
                  <Ionicons
                    name="time"
                    size={16}
                    color={theme.colors.textSecondary}
                  />
                  <Text style={styles.detailText}>
                    {formatReminderTime(reminder.time)}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Ionicons
                    name="calendar"
                    size={16}
                    color={theme.colors.textSecondary}
                  />
                  <Text style={styles.detailText}>
                    {getFrequencyText(reminder.frequency)}
                  </Text>
                </View>
                {reminder.notes && (
                  <View style={styles.detailRow}>
                    <Ionicons
                      name="document-text"
                      size={16}
                      color={theme.colors.textSecondary}
                    />
                    <Text style={styles.detailText}>{reminder.notes}</Text>
                  </View>
                )}
              </View>

              <View style={styles.reminderActions}>
                <TouchableOpacity
                  style={[styles.actionButton, styles.takenButton]}
                  onPress={() => markAsTaken(reminder.id)}
                >
                  <Ionicons
                    name="checkmark"
                    size={14}
                    color={theme.colors.white}
                  />
                  <Text style={styles.actionButtonText}>{t('medicine_reminder.taken')}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => Alert.alert(t('medicine_reminder.skip'), t('medicine_reminder.skipped_message'))}
                >
                  <Ionicons name="close" size={14} color={theme.colors.white} />
                  <Text style={styles.actionButtonText}>{t('medicine_reminder.skip')}</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* Modal لإضافة تذكير جديد */}
      <Modal
        visible={showAddModal}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowAddModal(false)}
        statusBarTranslucent={true}
        style={{ zIndex: 99999 }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('medicine_reminder.add_new_reminder')}</Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <Ionicons
                  name="close"
                  size={20}
                  color={theme.colors.textPrimary}
                />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.modalBody}
              showsVerticalScrollIndicator={true}
            >
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>{t('medicine_reminder.medicine_name')}</Text>
                <TextInput
                  style={styles.textInput}
                  value={newReminder.medicineName}
                  onChangeText={text =>
                    setNewReminder(prev => ({ ...prev, medicineName: text }))
                  }
                  placeholder={t('medicine_reminder.enter_medicine_name')}
                  placeholderTextColor={theme.colors.textSecondary}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>{t('medicine_reminder.dosage')}</Text>
                <TextInput
                  style={styles.textInput}
                  value={newReminder.dosage}
                  onChangeText={text =>
                    setNewReminder(prev => ({ ...prev, dosage: text }))
                  }
                  placeholder={t('medicine_reminder.dosage_example')}
                  placeholderTextColor={theme.colors.textSecondary}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>{t('common.date')}</Text>
                <View style={styles.simpleButtonContainer}>
                  <TouchableOpacity
                    style={styles.simpleButton}
                    onPress={() => {
                      showDatePickerModal();
                    }}
                    activeOpacity={0.7}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Ionicons
                      name="calendar"
                      size={16}
                      color={theme.colors.white}
                    />
                    <Text style={styles.simpleButtonText}>
                      {newReminder.time.toLocaleDateString('ar-EG')}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>{t('common.time')}</Text>
                <View style={styles.simpleButtonContainer}>
                  <TouchableOpacity
                    style={styles.simpleButton}
                    onPress={() => {
                      showTimePickerModal();
                    }}
                    activeOpacity={0.7}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Ionicons
                      name="time"
                      size={16}
                      color={theme.colors.white}
                    />
                    <Text style={styles.simpleButtonText}>
                      {newReminder.time.toLocaleTimeString('ar-EG', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* عرض الأوقات المختارة */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>{t('medicine_reminder.selected_times')}</Text>
                <View style={styles.timesChipsContainer}>
                  {newReminderTimes.length === 0 ? (
                    <Text style={styles.detailText}>
                      {t('medicine_reminder.no_additional_times')}
                    </Text>
                  ) : (
                    newReminderTimes.map(t => (
                      <View key={t} style={styles.timeChip}>
                        <Text style={styles.timeChipText}>{t}</Text>
                        <TouchableOpacity
                          onPress={() =>
                            setNewReminderTimes(prev =>
                              prev.filter(x => x !== t)
                            )
                          }
                          style={styles.timeChipRemove}
                        >
                          <Ionicons
                            name="close"
                            size={12}
                            color={theme.colors.white}
                          />
                        </TouchableOpacity>
                      </View>
                    ))
                  )}
                  <TouchableOpacity
                    onPress={() => showTimePickerModal()}
                    style={[styles.timeChip, styles.timeChipAdd]}
                  >
                    <Ionicons name="add" size={12} color={theme.colors.white} />
                    <Text style={[styles.timeChipText, { marginLeft: 4 }]}>
                      {t('medicine_reminder.add_time')}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>{t('medicine_reminder.frequency')}</Text>
                <View style={styles.frequencyButtons}>
                  {[
                    { key: 'once', label: t('medicine_reminder.once'), icon: 'time-outline' },
                    { key: 'daily', label: t('medicine_reminder.daily'), icon: 'calendar-outline' },
                    {
                      key: 'twice_daily',
                      label: t('medicine_reminder.twice_daily'),
                      icon: 'time-outline',
                    },
                    {
                      key: 'thrice_daily',
                      label: t('medicine_reminder.thrice_daily'),
                      icon: 'time-outline',
                    },
                  ].map(freq => (
                    <TouchableOpacity
                      key={freq.key}
                      style={[
                        styles.frequencyButton,
                        newReminder.frequency === freq.key &&
                          styles.frequencyButtonActive,
                      ]}
                      onPress={() =>
                        setNewReminder(prev => ({
                          ...prev,
                          frequency: freq.key as any,
                        }))
                      }
                    >
                      <Ionicons
                        name={freq.icon as any}
                        size={12}
                        color={
                          newReminder.frequency === freq.key
                            ? theme.colors.white
                            : theme.colors.textSecondary
                        }
                        style={{ marginRight: 6 }}
                      />
                      <Text
                        style={[
                          styles.frequencyButtonText,
                          newReminder.frequency === freq.key &&
                            styles.frequencyButtonTextActive,
                        ]}
                      >
                        {freq.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* أزرار الحفظ والإلغاء - تم نقلها إلى نهاية المحتوى */}
              <View style={styles.modalFooter}>
                <TouchableOpacity
                  style={styles.saveButton}
                  onPress={handleAddReminder}
                >
                  <Text style={styles.saveButtonText}>{t('common.save')}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => setShowAddModal(false)}
                >
                  <Text style={styles.cancelButtonText}>{t('common.cancel')}</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Modal لاختيار الوقت - يجب أن يكون خارج Modal الإضافة مع zIndex أعلى */}
      <Modal
        visible={showTimePicker}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowTimePicker(false)}
        statusBarTranslucent={true}
        presentationStyle="overFullScreen"
        hardwareAccelerated={true}
      >
        <View style={[styles.simpleModalOverlay, { zIndex: 999999 }]}>
          <View style={[styles.simpleModalContent, { zIndex: 1000000 }]}>
            <View style={styles.simpleModalHeader}>
              <Text style={styles.simpleModalTitle}>{t('medicine_reminder.choose_time')}</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => {
                  setShowTimePicker(false);
                  setShowAddModal(true);
                }}
              >
                <Ionicons name="close" size={18} color={theme.colors.white} />
              </TouchableOpacity>
            </View>

            <View style={styles.simpleTimeContainer}>
              <View style={styles.timeDisplay}>
                <Text style={styles.timeDisplayText}>
                  {selectedHour.toString().padStart(2, '0')} :{' '}
                  {selectedMinute.toString().padStart(2, '0')}
                </Text>
                <Text style={styles.timeDisplayPeriod}>
                  {selectedHour < 12 ? t('medicine_reminder.am') : t('medicine_reminder.pm')}
                </Text>
              </View>

              <View style={styles.timeControls}>
                <View style={styles.timeControlColumn}>
                  <Text style={styles.timeControlLabel}>{t('medicine_reminder.hour')}</Text>
                  <View style={styles.timeControlButtons}>
                    <TouchableOpacity
                      style={styles.timeControlButton}
                      onPress={() => {
                        const newHour =
                          selectedHour === 0 ? 23 : selectedHour - 1;
                        setSelectedHour(newHour);
                      }}
                    >
                      <Ionicons
                        name="chevron-up"
                        size={24}
                        color={theme.colors.primary}
                      />
                    </TouchableOpacity>
                    <Text style={styles.timeControlValue}>
                      {selectedHour.toString().padStart(2, '0')}
                    </Text>
                    <TouchableOpacity
                      style={styles.timeControlButton}
                      onPress={() => {
                        const newHour =
                          selectedHour === 23 ? 0 : selectedHour + 1;
                        setSelectedHour(newHour);
                      }}
                    >
                      <Ionicons
                        name="chevron-down"
                        size={24}
                        color={theme.colors.primary}
                      />
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.timeControlColumn}>
                  <Text style={styles.timeControlLabel}>{t('medicine_reminder.minute')}</Text>
                  <View style={styles.timeControlButtons}>
                    <TouchableOpacity
                      style={styles.timeControlButton}
                      onPress={() => {
                        const newMinute =
                          selectedMinute === 0 ? 59 : selectedMinute - 1;
                        setSelectedMinute(newMinute);
                      }}
                    >
                      <Ionicons
                        name="chevron-up"
                        size={24}
                        color={theme.colors.primary}
                      />
                    </TouchableOpacity>
                    <Text style={styles.timeControlValue}>
                      {selectedMinute.toString().padStart(2, '0')}
                    </Text>
                    <TouchableOpacity
                      style={styles.timeControlButton}
                      onPress={() => {
                        const newMinute =
                          selectedMinute === 59 ? 0 : selectedMinute + 1;
                        setSelectedMinute(newMinute);
                      }}
                    >
                      <Ionicons
                        name="chevron-down"
                        size={24}
                        color={theme.colors.primary}
                      />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>

              <View style={styles.quickTimeButtons}>
                <TouchableOpacity
                  style={styles.quickTimeButton}
                  onPress={() => {
                    setSelectedHour(8);
                    setSelectedMinute(0);
                  }}
                >
                  <Text style={styles.quickTimeButtonText}>8:00 {t('medicine_reminder.am')}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.quickTimeButton}
                  onPress={() => {
                    setSelectedHour(12);
                    setSelectedMinute(0);
                  }}
                >
                  <Text style={styles.quickTimeButtonText}>12:00 {t('medicine_reminder.noon')}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.quickTimeButton}
                  onPress={() => {
                    setSelectedHour(18);
                    setSelectedMinute(0);
                  }}
                >
                  <Text style={styles.quickTimeButtonText}>6:00 {t('medicine_reminder.pm')}</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.simpleModalFooter}>
              <TouchableOpacity
                style={styles.simpleCancelButton}
                onPress={() => {
                  setShowTimePicker(false);
                  setShowAddModal(true);
                }}
              >
                <Text style={styles.simpleCancelButtonText}>{t('common.cancel')}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.simpleConfirmButton}
                onPress={() => {
                  handleTimeChange(selectedHour, selectedMinute);
                }}
              >
                <Text style={styles.simpleConfirmButtonText}>{t('common.confirm')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal لاختيار التاريخ - يجب أن يكون خارج Modal الإضافة مع zIndex أعلى */}
      <Modal
        visible={showDatePicker}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowDatePicker(false)}
        statusBarTranslucent={true}
        presentationStyle="overFullScreen"
        hardwareAccelerated={true}
      >
        <View style={[styles.simpleModalOverlay, { zIndex: 999999 }]}>
          <View style={[styles.simpleModalContent, { zIndex: 1000000 }]}>
            <View style={styles.simpleModalHeader}>
              <Text style={styles.simpleModalTitle}>{t('medicine_reminder.choose_date')}</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => {
                  setShowDatePicker(false);
                  setShowAddModal(true);
                }}
              >
                <Ionicons name="close" size={18} color={theme.colors.white} />
              </TouchableOpacity>
            </View>

            <View style={styles.simpleDateContainer}>
              {[
                { days: 0, label: t('medicine_reminder.today') },
                { days: 1, label: t('medicine_reminder.tomorrow') },
                { days: 2, label: t('medicine_reminder.day_after_tomorrow') },
                { days: 3, label: t('medicine_reminder.after_3_days') },
                { days: 7, label: t('medicine_reminder.after_week') },
              ].map(option => (
                <TouchableOpacity
                  key={option.days}
                  style={styles.simpleDateItem}
                  onPress={() => {
                    handleDateChange(option.days);
                  }}
                >
                  <Ionicons
                    name="calendar"
                    size={18}
                    color={theme.colors.primary}
                  />
                  <Text style={styles.simpleDateItemText}>{option.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.simpleModalFooter}>
              <TouchableOpacity
                style={styles.simpleCancelButton}
                onPress={() => {
                  setShowDatePicker(false);
                  setShowAddModal(true);
                }}
              >
                <Text style={styles.simpleCancelButtonText}>إلغاء</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: theme.colors.textSecondary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: theme.colors.white,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rescheduleButton: {
    backgroundColor: theme.colors.warning,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    marginTop: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
  },
  addButton: {
    backgroundColor: theme.colors.primary,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  addReminderButton: {
    backgroundColor: theme.colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  addReminderButtonText: {
    color: theme.colors.white,
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  reminderCard: {
    backgroundColor: theme.colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
  },
  reminderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  medicineInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  medicineName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
  },
  medicineDosage: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  deleteButton: {
    padding: 8,
  },
  reminderDetails: {
    marginBottom: 16,
  },
  timesChipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
  },
  timeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 16,
    marginRight: 6,
    marginBottom: 6,
  },
  timeChipAdd: {
    backgroundColor: theme.colors.success,
  },
  timeChipText: {
    color: theme.colors.white,
    fontSize: 12,
    fontWeight: '600',
  },
  timeChipRemove: {
    marginLeft: 8,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginLeft: 8,
    flex: 1,
  },
  reminderActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    flex: 1,
    marginHorizontal: 4,
  },
  takenButton: {
    backgroundColor: theme.colors.success,
  },
  skipButton: {
    backgroundColor: theme.colors.warning,
  },
  actionButtonText: {
    color: theme.colors.white,
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modalContent: {
    backgroundColor: theme.colors.white,
    borderRadius: 16,
    width: '90%',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
  },
  modalBody: {
    padding: 16,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    backgroundColor: theme.colors.white,
  },
  inputGroup: {
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 16,
    color: theme.colors.textPrimary,
  },
  frequencyButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  frequencyButton: {
    flex: 1,
    paddingVertical: 6,
    paddingHorizontal: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginHorizontal: 3,
    alignItems: 'center',
  },
  frequencyButtonActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  frequencyButtonText: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  frequencyButtonTextActive: {
    color: theme.colors.white,
    fontWeight: 'bold',
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
    marginRight: 8,
    minHeight: 32,
  },
  cancelButtonText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  saveButton: {
    flex: 1,
    backgroundColor: theme.colors.primary,
    paddingVertical: 6,
    borderRadius: 6,
    alignItems: 'center',
    marginLeft: 8,
    minHeight: 32,
  },
  saveButtonText: {
    fontSize: 14,
    color: theme.colors.white,
    fontWeight: 'bold',
  },
  dateTimeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: theme.colors.primary,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: theme.colors.white,
    minHeight: 56,
    justifyContent: 'space-between',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
  },
  dateTimeButtonText: {
    fontSize: 18,
    color: theme.colors.primary,
    marginLeft: 12,
    flex: 1,
    fontWeight: '600',
  },
  // Picker Modal styles
  pickerModalContent: {
    backgroundColor: theme.colors.white,
    borderRadius: 16,
    width: '90%',
    maxHeight: '80%',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    zIndex: 1001,
  },
  pickerModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  pickerModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  pickerModalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  pickerCancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
    marginRight: 8,
  },
  pickerCancelButtonText: {
    fontSize: 16,
    color: theme.colors.textSecondary,
  },
  pickerConfirmButton: {
    flex: 1,
    backgroundColor: theme.colors.primary,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginLeft: 8,
  },
  pickerConfirmButtonText: {
    fontSize: 16,
    color: theme.colors.white,
    fontWeight: 'bold',
  },
  // Time Picker styles
  timePickerContainer: {
    flexDirection: 'row',
    padding: 20,
    height: 300,
    backgroundColor: theme.colors.white,
    borderRadius: 12,
    margin: 10,
  },
  timePickerColumn: {
    flex: 1,
    alignItems: 'center',
  },
  timePickerLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.primary,
    marginBottom: 15,
  },
  timePickerScroll: {
    flex: 1,
    width: '100%',
  },
  timePickerItem: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    alignItems: 'center',
    borderRadius: 12,
    marginVertical: 4,
    minHeight: 50,
    minWidth: 70,
    borderWidth: 2,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.background,
  },
  timePickerItemSelected: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  timePickerItemText: {
    fontSize: 18,
    color: theme.colors.textPrimary,
    fontWeight: '600',
  },
  timePickerItemTextSelected: {
    color: theme.colors.white,
    fontWeight: 'bold',
    fontSize: 20,
  },
  // Date Picker styles
  datePickerContainer: {
    padding: 20,
    backgroundColor: theme.colors.white,
    borderRadius: 12,
    margin: 10,
  },
  datePickerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    minHeight: 64,
    borderRadius: 8,
    marginVertical: 4,
    backgroundColor: theme.colors.background,
  },
  datePickerItemText: {
    fontSize: 18,
    color: theme.colors.textPrimary,
    marginLeft: 16,
    fontWeight: '600',
  },
  // Simple Button styles
  simpleButtonContainer: {
    marginTop: 8,
  },
  simpleButton: {
    backgroundColor: theme.colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  simpleButtonText: {
    color: theme.colors.white,
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  // Simple Modal styles
  simpleModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 999999,
  },
  simpleModalContent: {
    backgroundColor: theme.colors.white,
    borderRadius: 20,
    width: '85%',
    maxHeight: '70%',
    elevation: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    position: 'relative',
    zIndex: 1000000,
  },
  simpleModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: theme.colors.primary,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  simpleModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.white,
  },
  closeButton: {
    padding: 5,
  },
  simpleModalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  simpleCancelButton: {
    flex: 1,
    paddingVertical: 15,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: theme.colors.border,
    alignItems: 'center',
    marginRight: 10,
    backgroundColor: theme.colors.background,
  },
  simpleCancelButtonText: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    fontWeight: 'bold',
  },
  simpleConfirmButton: {
    flex: 1,
    backgroundColor: theme.colors.primary,
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginLeft: 10,
  },
  simpleConfirmButtonText: {
    fontSize: 16,
    color: theme.colors.white,
    fontWeight: 'bold',
  },
  // Simple Time Picker styles
  simpleTimeContainer: {
    padding: 20,
    alignItems: 'center',
  },
  timeDisplay: {
    alignItems: 'center',
    marginBottom: 30,
    padding: 20,
    backgroundColor: theme.colors.background,
    borderRadius: 15,
    width: '100%',
  },
  timeDisplayText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: theme.colors.primary,
    marginBottom: 5,
  },
  timeDisplayPeriod: {
    fontSize: 18,
    color: theme.colors.textSecondary,
    fontWeight: '600',
  },
  timeControls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 30,
  },
  timeControlColumn: {
    alignItems: 'center',
  },
  timeControlLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.primary,
    marginBottom: 10,
  },
  timeControlButtons: {
    alignItems: 'center',
  },
  timeControlButton: {
    padding: 10,
    backgroundColor: theme.colors.white,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginVertical: 5,
  },
  timeControlValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
    marginVertical: 10,
  },
  quickTimeButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  quickTimeButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginHorizontal: 5,
  },
  quickTimeButtonText: {
    color: theme.colors.white,
    fontSize: 14,
    fontWeight: 'bold',
  },
  // Simple Date Picker styles
  simpleDateContainer: {
    padding: 20,
  },
  simpleDateItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    backgroundColor: theme.colors.background,
    marginVertical: 2,
    borderRadius: 8,
  },
  simpleDateItemText: {
    fontSize: 18,
    color: theme.colors.textPrimary,
    marginLeft: 15,
    fontWeight: '600',
  },
  // أنماط أزرار إضافة الوقت
  addTimeButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  addTimeButton: {
    flex: 1,
    backgroundColor: theme.colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  addTimeButtonText: {
    color: theme.colors.white,
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 6,
  },
});

export default MedicineReminderScreen;
