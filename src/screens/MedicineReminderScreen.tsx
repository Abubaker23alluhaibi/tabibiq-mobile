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
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../utils/theme';
import { api } from '../services/api';
import { useNotifications } from '../contexts/NotificationContext';

const MedicineReminderScreen: React.FC = () => {
  const { t } = useTranslation();
  const { scheduleMedicineReminder } = useNotifications();
  const [reminders, setReminders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newReminder, setNewReminder] = useState({
    medicineName: '',
    dosage: '',
    time: new Date(),
    frequency: 'daily' as 'daily' | 'twice_daily' | 'thrice_daily' | 'custom',
  });

  useEffect(() => {
    fetchReminders();
  }, []);

  const fetchReminders = async () => {
    try {
      setLoading(true);
      const response = await api.get('/medicine-reminders');
      setReminders(response.data);
    } catch (error) {
      console.error('Error fetching reminders:', error);
      Alert.alert('خطأ', 'فشل في جلب التذكيرات');
    } finally {
      setLoading(false);
    }
  };

  const addReminder = () => {
    setShowAddModal(true);
  };

  const handleAddReminder = async () => {
    if (!newReminder.medicineName || !newReminder.dosage) {
      Alert.alert('خطأ', 'يرجى ملء جميع الحقول المطلوبة');
      return;
    }

    try {
      // إنشاء معرف فريد للتذكير
      const reminderId = Date.now().toString();
      
      // جدولة الإشعار
      await scheduleMedicineReminder(
        reminderId,
        newReminder.medicineName,
        newReminder.dosage,
        newReminder.time,
        newReminder.frequency
      );

      // إضافة التذكير إلى القائمة المحلية
      const reminder = {
        id: reminderId,
        medicineName: newReminder.medicineName,
        dosage: newReminder.dosage,
        time: newReminder.time,
        frequency: newReminder.frequency,
        active: true,
      };

      setReminders(prev => [...prev, reminder]);
      
      // إعادة تعيين النموذج
      setNewReminder({
        medicineName: '',
        dosage: '',
        time: new Date(),
        frequency: 'daily',
      });
      
      setShowAddModal(false);
      Alert.alert('نجح', 'تم إضافة تذكير الدواء بنجاح');
    } catch (error) {
      console.error('Error adding reminder:', error);
      Alert.alert('خطأ', 'فشل في إضافة تذكير الدواء');
    }
  };

  const markAsTaken = async (reminderId: string) => {
    try {
      await api.put(`/medicine-reminders/${reminderId}/taken`);
      fetchReminders();
      Alert.alert('نجح', 'تم تسجيل تناول الدواء');
    } catch (error) {
      Alert.alert('خطأ', 'فشل في تسجيل تناول الدواء');
    }
  };

  const deleteReminder = async (reminderId: string) => {
    Alert.alert(
      'حذف التذكير',
      'هل أنت متأكد من حذف هذا التذكير؟',
      [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'حذف',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/medicine-reminders/${reminderId}`);
              fetchReminders();
              Alert.alert('نجح', 'تم حذف التذكير');
            } catch (error) {
              Alert.alert('خطأ', 'فشل في حذف التذكير');
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>جاري تحميل التذكيرات...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>تذكير الأدوية</Text>
        <TouchableOpacity style={styles.addButton} onPress={addReminder}>
          <Ionicons name="add" size={24} color={theme.colors.white} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {reminders.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="medical" size={64} color={theme.colors.textSecondary} />
            <Text style={styles.emptyTitle}>لا توجد تذكيرات</Text>
            <Text style={styles.emptySubtitle}>أضف تذكيرات للأدوية لتتبع مواعيد تناولها</Text>
            <TouchableOpacity style={styles.addReminderButton} onPress={addReminder}>
              <Ionicons name="add" size={20} color={theme.colors.white} />
              <Text style={styles.addReminderButtonText}>إضافة تذكير</Text>
            </TouchableOpacity>
          </View>
        ) : (
          reminders.map((reminder, index) => (
            <View key={reminder.id || index} style={styles.reminderCard}>
              <View style={styles.reminderHeader}>
                <View style={styles.medicineInfo}>
                  <Ionicons name="medical" size={24} color={theme.colors.primary} />
                  <View style={{ marginLeft: 12 }}>
                    <Text style={styles.medicineName}>{reminder.medicine_name}</Text>
                    <Text style={styles.medicineDosage}>{reminder.dosage}</Text>
                  </View>
                </View>
                <TouchableOpacity
                  onPress={() => deleteReminder(reminder.id)}
                  style={styles.deleteButton}
                >
                  <Ionicons name="trash" size={20} color={theme.colors.error} />
                </TouchableOpacity>
              </View>

              <View style={styles.reminderDetails}>
                <View style={styles.detailRow}>
                  <Ionicons name="time" size={16} color={theme.colors.textSecondary} />
                  <Text style={styles.detailText}>{reminder.time}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Ionicons name="calendar" size={16} color={theme.colors.textSecondary} />
                  <Text style={styles.detailText}>{reminder.frequency}</Text>
                </View>
                {reminder.notes && (
                  <View style={styles.detailRow}>
                    <Ionicons name="document-text" size={16} color={theme.colors.textSecondary} />
                    <Text style={styles.detailText}>{reminder.notes}</Text>
                  </View>
                )}
              </View>

              <View style={styles.reminderActions}>
                <TouchableOpacity
                  style={[styles.actionButton, styles.takenButton]}
                  onPress={() => markAsTaken(reminder.id)}
                >
                  <Ionicons name="checkmark" size={16} color={theme.colors.white} />
                  <Text style={styles.actionButtonText}>تم التناول</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionButton, styles.skipButton]}
                  onPress={() => Alert.alert('تخطي', 'تم تخطي هذا التذكير')}
                >
                  <Ionicons name="close" size={16} color={theme.colors.white} />
                  <Text style={styles.actionButtonText}>تخطي</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* Modal لإضافة تذكير جديد */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>إضافة تذكير دواء جديد</Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <Ionicons name="close" size={24} color={theme.colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>اسم الدواء</Text>
                <TextInput
                  style={styles.textInput}
                  value={newReminder.medicineName}
                  onChangeText={(text) => setNewReminder(prev => ({ ...prev, medicineName: text }))}
                  placeholder="أدخل اسم الدواء"
                  placeholderTextColor={theme.colors.textSecondary}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>الجرعة</Text>
                <TextInput
                  style={styles.textInput}
                  value={newReminder.dosage}
                  onChangeText={(text) => setNewReminder(prev => ({ ...prev, dosage: text }))}
                  placeholder="مثال: حبة واحدة"
                  placeholderTextColor={theme.colors.textSecondary}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>الوقت</Text>
                <TextInput
                  style={styles.textInput}
                  value={newReminder.time.toLocaleTimeString('ar-EG', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                  placeholder="اختر الوقت"
                  placeholderTextColor={theme.colors.textSecondary}
                  editable={false}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>التكرار</Text>
                <View style={styles.frequencyButtons}>
                  {[
                    { key: 'daily', label: 'يومياً' },
                    { key: 'twice_daily', label: 'مرتين يومياً' },
                    { key: 'thrice_daily', label: 'ثلاث مرات يومياً' },
                  ].map((freq) => (
                    <TouchableOpacity
                      key={freq.key}
                      style={[
                        styles.frequencyButton,
                        newReminder.frequency === freq.key && styles.frequencyButtonActive
                      ]}
                      onPress={() => setNewReminder(prev => ({ ...prev, frequency: freq.key as any }))}
                    >
                      <Text style={[
                        styles.frequencyButtonText,
                        newReminder.frequency === freq.key && styles.frequencyButtonTextActive
                      ]}>
                        {freq.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowAddModal(false)}
              >
                <Text style={styles.cancelButtonText}>إلغاء</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleAddReminder}
              >
                <Text style={styles.saveButtonText}>حفظ</Text>
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
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: theme.colors.white,
    borderRadius: 16,
    width: '90%',
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
  },
  modalBody: {
    padding: 20,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  inputGroup: {
    marginBottom: 20,
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
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: theme.colors.textPrimary,
  },
  frequencyButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  frequencyButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  frequencyButtonActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  frequencyButtonText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  frequencyButtonTextActive: {
    color: theme.colors.white,
    fontWeight: 'bold',
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
    marginRight: 8,
  },
  cancelButtonText: {
    fontSize: 16,
    color: theme.colors.textSecondary,
  },
  saveButton: {
    flex: 1,
    backgroundColor: theme.colors.primary,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginLeft: 8,
  },
  saveButtonText: {
    fontSize: 16,
    color: theme.colors.white,
    fontWeight: 'bold',
  },
});

export default MedicineReminderScreen; 