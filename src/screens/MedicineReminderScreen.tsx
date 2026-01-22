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
  StatusBar,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../utils/theme';

import { useNotifications } from '../contexts/NotificationContext';
import { useAuth } from '../contexts/AuthContext';
import NotificationService from '../services/NotificationService';

const MedicineReminderScreen: React.FC = () => {
  const { t } = useTranslation();
  const { scheduleMedicineReminder, cancelNotification } = useNotifications();
  const { user, profile } = useAuth();
  const [reminders, setReminders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newReminder, setNewReminder] = useState({
    medicineName: '',
    time: new Date(),
    frequency: 'once' as 'once' | 'daily' | 'twice_daily' | 'thrice_daily' | 'custom',
  });
  const [newReminderTimes, setNewReminderTimes] = useState<string[]>([]);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [selectedHour, setSelectedHour] = useState(new Date().getHours());
  const [selectedMinute, setSelectedMinute] = useState(new Date().getMinutes());

  useEffect(() => {
    fetchReminders();
  }, []);

  useEffect(() => {
    if (user?.id || profile?._id) {
      fetchReminders();
    }
  }, [user?.id, profile?._id]);

  const saveRemindersToStorage = async (remindersList: any[]) => {
    try {
      const userId = user?.id || profile?._id || 'anonymous';
      const key = `medicine_reminders_user_${userId}`;
      await AsyncStorage.setItem(key, JSON.stringify(remindersList));
    } catch (error) {
      // Error handling
    }
  };

  const loadRemindersFromStorage = async () => {
    try {
      const userId = user?.id || profile?._id || 'anonymous';
      const key = `medicine_reminders_user_${userId}`;
      const storedReminders = await AsyncStorage.getItem(key);

      if (storedReminders) {
        try {
          const parsedReminders = JSON.parse(storedReminders);
          if (Array.isArray(parsedReminders)) {
            setReminders(parsedReminders);
            return parsedReminders;
          }
        } catch (parseError) {
          setReminders([]);
          return [];
        }
      }
      setReminders([]);
      return [];
    } catch (error) {
      setReminders([]);
      return [];
    }
  };

  const fetchReminders = async () => {
    try {
      setLoading(true);
      await loadRemindersFromStorage();
    } catch (error) {
      setReminders([]);
    } finally {
      setLoading(false);
    }
  };

  const addReminder = () => {
    setShowAddModal(true);
  };

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

  const getFrequencyText = (freq: string) => {
    switch (freq) {
      case 'daily': return t('medicine_reminder.daily');
      case 'twice_daily': return t('medicine_reminder.twice_daily');
      case 'thrice_daily': return t('medicine_reminder.thrice_daily');
      case 'three_times_daily': return t('medicine_reminder.thrice_daily');
      case 'once': return t('medicine_reminder.once');
      case 'custom': return t('medicine_reminder.once');
      default: return freq || '';
    }
  };

  const handleTimeChange = (hour: number, minute: number) => {
    const newTime = new Date(newReminder.time);
    newTime.setHours(hour);
    newTime.setMinutes(minute);
    setNewReminder(prev => ({ ...prev, time: newTime }));
    setShowTimePicker(false);
    setShowAddModal(true);
    
    const hhStr = String(hour).padStart(2, '0');
    const mmStr = String(minute).padStart(2, '0');
    const t = `${hhStr}:${mmStr}`;
    setNewReminderTimes(prev => Array.from(new Set([...(prev || []), t])));
  };

  const showTimePickerModal = () => {
    setSelectedHour(newReminder.time.getHours());
    setSelectedMinute(newReminder.time.getMinutes());
    setShowTimePicker(true);
    setShowAddModal(false);
  };

  const handleAddReminder = async () => {
    if (!newReminder.medicineName) {
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

      const requiredCount =
        newReminder.frequency === 'twice_daily' ? 2 :
        newReminder.frequency === 'thrice_daily' ? 3 : 1;

      if (timesToSave.length !== requiredCount) {
        const msg = requiredCount === 1
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

      const createdLocally: any[] = [];
      for (const t of timesToSave) {
        const reminderId = `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        createdLocally.push({
          id: reminderId,
          medicine_name: newReminder.medicineName,
          time: t,
          frequency: newReminder.frequency,
          active: true,
          created_at: new Date().toISOString(),
          user_id: userId || 'anonymous',
        });
      }

      for (const item of createdLocally) {
        try {
          const t = String(item.time);
          const [hh, mm] = t.split(':').map((n: string) => parseInt(n, 10));
          const medicineTime = new Date();
          medicineTime.setHours(hh, mm, 0, 0);
          const now = new Date();
          if (medicineTime <= now) medicineTime.setDate(medicineTime.getDate() + 1);
          
          await scheduleMedicineReminder(
            item.id,
            item.medicine_name,
            '',
            medicineTime,
            item.frequency
          );
        } catch (error) {}
      }

      Alert.alert(
        'تم إضافة التذكير بنجاح',
        `تمت إضافة ${createdLocally.length} وقت(ات)`,
        [{ text: 'حسناً' }]
      );

      const updatedReminders = [...reminders, ...createdLocally];
      setReminders(updatedReminders);
      await saveRemindersToStorage(updatedReminders);

      setNewReminder({
        medicineName: '',
        time: new Date(),
        frequency: 'once',
      });
      setNewReminderTimes([]);
      setShowAddModal(false);

      setTimeout(async () => {
        await fetchReminders();
      }, 800);
    } catch (error) {
      Alert.alert('خطأ', 'فشل في إضافة تذكير الدواء');
    }
  };

  const markAsTaken = async (reminderId: string) => {
    try {
      setReminders(prev => {
        const updatedReminders = prev.map(reminder =>
          reminder.id === reminderId
            ? { ...reminder, taken: true, taken_at: new Date().toISOString() }
            : reminder
        );
        return updatedReminders;
      });

      setTimeout(async () => {
        try {
          const currentReminders = reminders.map(reminder =>
            reminder.id === reminderId
              ? { ...reminder, taken: true, taken_at: new Date().toISOString() }
              : reminder
          );
          await saveRemindersToStorage(currentReminders);
        } catch (error) {}
      }, 100);
    } catch (error) {}
  };

  const deleteReminder = async (reminderId: string) => {
    Alert.alert(t('medicine_reminder.delete_reminder'), t('medicine_reminder.confirm_delete'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: async () => {
          try {
            try {
              await NotificationService.cancelMedicineNotifications(reminderId);
            } catch (error) {}

            setReminders(prev => prev.filter(reminder => reminder.id !== reminderId));

            setTimeout(async () => {
              try {
                const currentReminders = reminders.filter(reminder => reminder.id !== reminderId);
                await saveRemindersToStorage(currentReminders);
              } catch (error) {}
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
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.primary} />
      
      {/* Header Gradient */}
      <LinearGradient colors={[theme.colors.primary, theme.colors.primaryDark]} style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>{t('medicine_reminder.title')}</Text>
          <TouchableOpacity style={styles.addButton} onPress={addReminder}>
            <Ionicons name="add" size={24} color={theme.colors.white} />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        {reminders.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconContainer}>
                <Ionicons name="medical" size={64} color={theme.colors.primary + '80'} />
            </View>
            <Text style={styles.emptyTitle}>{t('medicine_reminder.no_reminders')}</Text>
            <Text style={styles.emptySubtitle}>{t('medicine_reminder.add_reminders_subtitle')}</Text>
            <TouchableOpacity style={styles.addReminderButton} onPress={addReminder}>
              <Ionicons name="add-circle" size={20} color={theme.colors.white} />
              <Text style={styles.addReminderButtonText}>{t('medicine_reminder.add_reminder')}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          reminders.map((reminder, index) => (
            <View key={reminder.id || index} style={styles.reminderCard}>
              <View style={styles.reminderHeader}>
                <View style={styles.medicineInfo}>
                  <View style={styles.medicineIconBox}>
                    <Ionicons name="medkit" size={24} color={theme.colors.primary} />
                  </View>
                  <View style={{ marginLeft: 12 }}>
                    <Text style={styles.medicineName}>{reminder.medicine_name}</Text>
                    <Text style={styles.medicineDosage}>{getFrequencyText(reminder.frequency)}</Text>
                  </View>
                </View>
                <TouchableOpacity onPress={() => deleteReminder(reminder.id)} style={styles.deleteButton}>
                  <Ionicons name="trash-outline" size={20} color={theme.colors.error} />
                </TouchableOpacity>
              </View>

              <View style={styles.divider} />

              <View style={styles.reminderDetails}>
                <View style={styles.detailRow}>
                  <Ionicons name="time-outline" size={18} color={theme.colors.textSecondary} />
                  <Text style={styles.detailText}>{formatReminderTime(reminder.time)}</Text>
                </View>
                {reminder.notes && (
                  <View style={styles.detailRow}>
                    <Ionicons name="document-text-outline" size={18} color={theme.colors.textSecondary} />
                    <Text style={styles.detailText}>{reminder.notes}</Text>
                  </View>
                )}
              </View>

              <View style={styles.reminderActions}>
                <TouchableOpacity
                  style={[styles.actionButton, styles.takenButton, reminder.taken && styles.actionButtonDisabled]}
                  onPress={() => markAsTaken(reminder.id)}
                  disabled={reminder.taken}
                >
                  <Ionicons name="checkmark-circle" size={18} color={theme.colors.white} />
                  <Text style={styles.actionButtonText}>
                    {reminder.taken ? t('medicine_reminder.taken_already') : t('medicine_reminder.taken')}
                  </Text>
                </TouchableOpacity>
                
                {!reminder.taken && (
                    <TouchableOpacity
                    style={[styles.actionButton, styles.skipButton]}
                    onPress={() => Alert.alert(t('medicine_reminder.skip'), t('medicine_reminder.skipped_message'))}
                    >
                    <Ionicons name="close-circle" size={18} color={theme.colors.textPrimary} />
                    <Text style={[styles.actionButtonText, { color: theme.colors.textPrimary }]}>{t('medicine_reminder.skip')}</Text>
                    </TouchableOpacity>
                )}
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* Add Reminder Modal */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAddModal(false)}
        statusBarTranslucent={true}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('medicine_reminder.add_new_reminder')}</Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)} style={styles.closeModalButton}>
                <Ionicons name="close" size={24} color={theme.colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>{t('medicine_reminder.medicine_name')}</Text>
                <TextInput
                  style={styles.textInput}
                  value={newReminder.medicineName}
                  onChangeText={text => setNewReminder(prev => ({ ...prev, medicineName: text }))}
                  placeholder={t('medicine_reminder.enter_medicine_name')}
                  placeholderTextColor={theme.colors.textSecondary + '80'}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>{t('common.time')}</Text>
                <TouchableOpacity
                  style={styles.timeSelector}
                  onPress={showTimePickerModal}
                >
                  <Ionicons name="time" size={20} color={theme.colors.primary} />
                  <Text style={styles.timeSelectorText}>
                    {newReminder.time.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                  <Ionicons name="chevron-down" size={20} color={theme.colors.textSecondary} />
                </TouchableOpacity>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>{t('medicine_reminder.selected_times')}</Text>
                <View style={styles.timesChipsContainer}>
                  {newReminderTimes.length === 0 ? (
                    <Text style={styles.noTimesText}>{t('medicine_reminder.no_additional_times')}</Text>
                  ) : (
                    newReminderTimes.map(t => (
                      <View key={t} style={styles.timeChip}>
                        <Text style={styles.timeChipText}>{t}</Text>
                        <TouchableOpacity onPress={() => setNewReminderTimes(prev => prev.filter(x => x !== t))}>
                          <Ionicons name="close-circle" size={16} color={theme.colors.white} />
                        </TouchableOpacity>
                      </View>
                    ))
                  )}
                  <TouchableOpacity onPress={showTimePickerModal} style={styles.addTimeChip}>
                    <Ionicons name="add" size={16} color={theme.colors.primary} />
                    <Text style={styles.addTimeText}>{t('medicine_reminder.add_time')}</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>{t('medicine_reminder.frequency')}</Text>
                <View style={styles.frequencyContainer}>
                  {['once', 'daily', 'twice_daily', 'thrice_daily'].map((freq) => (
                    <TouchableOpacity
                      key={freq}
                      style={[
                        styles.frequencyOption,
                        newReminder.frequency === freq && styles.frequencyOptionActive
                      ]}
                      onPress={() => setNewReminder(prev => ({ ...prev, frequency: freq as any }))}
                    >
                      <Text style={[
                        styles.frequencyText,
                        newReminder.frequency === freq && styles.frequencyTextActive
                      ]}>
                        {getFrequencyText(freq)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.saveButton} onPress={handleAddReminder}>
                <Text style={styles.saveButtonText}>{t('common.save')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Time Picker Modal */}
      <Modal
        visible={showTimePicker}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowTimePicker(false)}
        statusBarTranslucent={true}
      >
        <View style={styles.simpleModalOverlay}>
          <View style={styles.simpleModalContent}>
            <View style={styles.simpleModalHeader}>
              <Text style={styles.simpleModalTitle}>{t('medicine_reminder.choose_time')}</Text>
              <TouchableOpacity onPress={() => { setShowTimePicker(false); setShowAddModal(true); }}>
                <Ionicons name="close" size={24} color={theme.colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <View style={styles.simpleTimeContainer}>
              <View style={styles.timeDisplay}>
                <Text style={styles.timeDisplayText}>
                  {selectedHour.toString().padStart(2, '0')}:{selectedMinute.toString().padStart(2, '0')}
                </Text>
                <Text style={styles.timeDisplayPeriod}>{selectedHour < 12 ? t('medicine_reminder.am') : t('medicine_reminder.pm')}</Text>
              </View>

              <View style={styles.timeControls}>
                {/* Hour Control */}
                <View style={styles.timeControlColumn}>
                  <TouchableOpacity onPress={() => setSelectedHour(h => h === 23 ? 0 : h + 1)}>
                    <Ionicons name="chevron-up" size={30} color={theme.colors.primary} />
                  </TouchableOpacity>
                  <Text style={styles.timeControlValue}>{selectedHour.toString().padStart(2, '0')}</Text>
                  <TouchableOpacity onPress={() => setSelectedHour(h => h === 0 ? 23 : h - 1)}>
                    <Ionicons name="chevron-down" size={30} color={theme.colors.primary} />
                  </TouchableOpacity>
                  <Text style={styles.timeControlLabel}>{t('medicine_reminder.hour')}</Text>
                </View>

                <Text style={styles.timeSeparator}>:</Text>

                {/* Minute Control */}
                <View style={styles.timeControlColumn}>
                  <TouchableOpacity onPress={() => setSelectedMinute(m => m === 59 ? 0 : m + 1)}>
                    <Ionicons name="chevron-up" size={30} color={theme.colors.primary} />
                  </TouchableOpacity>
                  <Text style={styles.timeControlValue}>{selectedMinute.toString().padStart(2, '0')}</Text>
                  <TouchableOpacity onPress={() => setSelectedMinute(m => m === 0 ? 59 : m - 1)}>
                    <Ionicons name="chevron-down" size={30} color={theme.colors.primary} />
                  </TouchableOpacity>
                  <Text style={styles.timeControlLabel}>{t('medicine_reminder.minute')}</Text>
                </View>
              </View>
            </View>

            <View style={styles.simpleModalFooter}>
              <TouchableOpacity
                style={styles.simpleConfirmButton}
                onPress={() => handleTimeChange(selectedHour, selectedMinute)}
              >
                <Text style={styles.simpleConfirmButtonText}>{t('common.confirm')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F8FA' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F7F8FA' },
  loadingText: { marginTop: 16, fontSize: 16, color: theme.colors.textSecondary },
  
  header: {
    paddingTop: Platform.OS === 'android' ? 40 : 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: theme.colors.white },
  addButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    width: 44, height: 44, borderRadius: 12,
    justifyContent: 'center', alignItems: 'center',
  },

  content: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 40 },

  emptyContainer: { alignItems: 'center', marginTop: 60 },
  emptyIconContainer: { 
    width: 120, height: 120, borderRadius: 60, 
    backgroundColor: theme.colors.primary + '10', 
    justifyContent: 'center', alignItems: 'center', marginBottom: 20 
  },
  emptyTitle: { fontSize: 20, fontWeight: 'bold', color: theme.colors.textPrimary, marginBottom: 8 },
  emptySubtitle: { fontSize: 14, color: theme.colors.textSecondary, textAlign: 'center', marginBottom: 30, paddingHorizontal: 40 },
  addReminderButton: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: theme.colors.primary, paddingVertical: 14, paddingHorizontal: 30,
    borderRadius: 12, elevation: 4, shadowColor: theme.colors.primary, shadowOpacity: 0.3, shadowOffset: {width:0, height:4}
  },
  addReminderButtonText: { color: theme.colors.white, fontSize: 16, fontWeight: 'bold', marginLeft: 8 },

  reminderCard: {
    backgroundColor: theme.colors.white, borderRadius: 16, padding: 16, marginBottom: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 3
  },
  reminderHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  medicineInfo: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  medicineIconBox: { 
    width: 48, height: 48, borderRadius: 12, 
    backgroundColor: theme.colors.primary + '10', 
    justifyContent: 'center', alignItems: 'center' 
  },
  medicineName: { fontSize: 17, fontWeight: 'bold', color: theme.colors.textPrimary },
  medicineDosage: { fontSize: 13, color: theme.colors.textSecondary, marginTop: 2 },
  deleteButton: { padding: 8 },
  
  divider: { height: 1, backgroundColor: '#F0F0F0', marginVertical: 14 },

  reminderDetails: { marginBottom: 16 },
  detailRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  detailText: { fontSize: 14, color: '#555', marginLeft: 8 },

  reminderActions: { flexDirection: 'row', gap: 10 },
  actionButton: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 10, borderRadius: 10,
  },
  takenButton: { backgroundColor: theme.colors.success },
  skipButton: { backgroundColor: '#F0F0F0', borderWidth: 1, borderColor: '#DDD' },
  actionButtonDisabled: { opacity: 0.6 },
  actionButtonText: { fontSize: 14, fontWeight: '600', color: theme.colors.white, marginLeft: 6 },

  // Add Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: theme.colors.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, height: '80%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#EEE' },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: theme.colors.textPrimary },
  closeModalButton: { padding: 4 },
  modalBody: { padding: 20 },
  
  inputGroup: { marginBottom: 20 },
  inputLabel: { fontSize: 14, fontWeight: '600', color: theme.colors.textPrimary, marginBottom: 8 },
  textInput: { 
    backgroundColor: '#F9F9F9', borderRadius: 12, padding: 14, fontSize: 16, 
    color: theme.colors.textPrimary, borderWidth: 1, borderColor: '#EEE' 
  },
  timeSelector: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#F9F9F9',
    borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#EEE'
  },
  timeSelectorText: { flex: 1, fontSize: 16, color: theme.colors.textPrimary, marginLeft: 10, fontWeight: '600' },
  
  timesChipsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  timeChip: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: theme.colors.primary,
    paddingVertical: 8, paddingHorizontal: 12, borderRadius: 20
  },
  timeChipText: { color: theme.colors.white, fontSize: 14, fontWeight: '600', marginRight: 6 },
  addTimeChip: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: theme.colors.primary + '15',
    paddingVertical: 8, paddingHorizontal: 12, borderRadius: 20, borderWidth: 1, borderColor: theme.colors.primary + '30'
  },
  addTimeText: { color: theme.colors.primary, fontSize: 14, fontWeight: '600', marginLeft: 4 },
  noTimesText: { color: theme.colors.textSecondary, fontSize: 13, fontStyle: 'italic' },

  frequencyContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  frequencyOption: {
    paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20,
    backgroundColor: '#F5F5F5', borderWidth: 1, borderColor: '#EEE'
  },
  frequencyOptionActive: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
  frequencyText: { color: theme.colors.textSecondary, fontSize: 13 },
  frequencyTextActive: { color: theme.colors.white, fontWeight: '600' },

  modalFooter: { padding: 20, borderTopWidth: 1, borderTopColor: '#EEE' },
  saveButton: { backgroundColor: theme.colors.primary, borderRadius: 12, paddingVertical: 16, alignItems: 'center' },
  saveButtonText: { color: theme.colors.white, fontSize: 16, fontWeight: 'bold' },

  // Time Picker Modal
  simpleModalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' },
  simpleModalContent: { backgroundColor: theme.colors.white, borderRadius: 24, width: '85%', padding: 24, alignItems: 'center' },
  simpleModalHeader: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginBottom: 20 },
  simpleModalTitle: { fontSize: 18, fontWeight: 'bold', color: theme.colors.textPrimary },
  
  simpleTimeContainer: { alignItems: 'center', width: '100%' },
  timeDisplay: { marginBottom: 20 },
  timeDisplayText: { fontSize: 48, fontWeight: 'bold', color: theme.colors.primary },
  timeDisplayPeriod: { fontSize: 16, color: theme.colors.textSecondary, textAlign: 'center', marginTop: 4 },
  
  timeControls: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 20 },
  timeControlColumn: { alignItems: 'center' },
  timeControlValue: { fontSize: 24, fontWeight: 'bold', color: theme.colors.textPrimary, marginVertical: 10 },
  timeControlLabel: { fontSize: 12, color: theme.colors.textSecondary, marginTop: 4 },
  timeSeparator: { fontSize: 30, fontWeight: 'bold', color: theme.colors.textSecondary, marginBottom: 20 },

  simpleModalFooter: { width: '100%', marginTop: 30 },
  simpleConfirmButton: { backgroundColor: theme.colors.primary, borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  simpleConfirmButtonText: { color: theme.colors.white, fontSize: 16, fontWeight: 'bold' },
});

export default MedicineReminderScreen;