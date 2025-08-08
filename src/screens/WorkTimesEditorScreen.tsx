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
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../utils/theme';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

interface WorkTime {
  day: string;
  from: string;
  to: string;
}

const WorkTimesEditorScreen: React.FC = () => {
  const { t } = useTranslation();
  const { profile, updateProfile } = useAuth();
  const [workTimes, setWorkTimes] = useState<WorkTime[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const weekdays = [
    'الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'
  ];

  useEffect(() => {
    if (profile?.workTimes) {
      setWorkTimes(profile.workTimes);
    }
  }, [profile]);

  const addWorkTime = () => {
    setWorkTimes([...workTimes, { day: '', from: '09:00', to: '17:00' }]);
  };

  const removeWorkTime = (index: number) => {
    setWorkTimes(workTimes.filter((_, i) => i !== index));
  };

  const updateWorkTime = (index: number, field: keyof WorkTime, value: string) => {
    const updated = [...workTimes];
    updated[index] = { ...updated[index], [field]: value };
    setWorkTimes(updated);
  };

  const handleSubmit = async () => {
    if (!profile?._id) {
      Alert.alert('خطأ', 'يجب تسجيل الدخول أولاً');
      return;
    }

    setSaving(true);
    try {
      console.log('🔍 WorkTimesEditorScreen - Saving work times...');
      console.log('🔍 WorkTimesEditorScreen - Profile ID:', profile._id);
      console.log('🔍 WorkTimesEditorScreen - Work times:', workTimes);

      const result = await updateProfile({ workTimes });

      if (result.error) {
        console.error('❌ WorkTimesEditorScreen - Error:', result.error);
        Alert.alert('خطأ', result.error);
      } else {
        console.log('✅ WorkTimesEditorScreen - Success:', result.data);
        Alert.alert('نجح', 'تم تحديث أوقات الدوام بنجاح!');
      }
    } catch (error) {
      console.error('❌ WorkTimesEditorScreen - Exception:', error);
      Alert.alert('خطأ', 'حدث خطأ في الاتصال');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>جاري التحميل...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>أوقات الدوام</Text>
        <Text style={styles.headerSubtitle}>تحرير أوقات العمل</Text>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.infoCard}>
          <Ionicons name="information-circle" size={24} color={theme.colors.primary} />
          <Text style={styles.infoText}>
            قم بتحديد أوقات الدوام لكل يوم من أيام الأسبوع
          </Text>
        </View>

        {workTimes.map((time, index) => (
          <View key={index} style={styles.workTimeCard}>
            <View style={styles.workTimeHeader}>
              <Text style={styles.workTimeTitle}>وقت العمل {index + 1}</Text>
              <TouchableOpacity
                onPress={() => removeWorkTime(index)}
                style={styles.removeButton}
              >
                <Ionicons name="trash" size={20} color={theme.colors.error} />
              </TouchableOpacity>
            </View>

            <View style={styles.inputRow}>
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>اليوم</Text>
                <View style={styles.pickerContainer}>
                  <TextInput
                    style={styles.pickerInput}
                    value={time.day}
                    placeholder="اختر اليوم"
                    editable={false}
                  />
                  <TouchableOpacity
                    style={styles.pickerButton}
                    onPress={() => {
                      Alert.alert(
                        'اختر اليوم',
                        '',
                        weekdays.map(day => ({
                          text: day,
                          onPress: () => updateWorkTime(index, 'day', day)
                        }))
                      );
                    }}
                  >
                    <Ionicons name="chevron-down" size={20} color={theme.colors.primary} />
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            <View style={styles.timeRow}>
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>من</Text>
                <TextInput
                  style={styles.timeInput}
                  value={time.from}
                  onChangeText={(value) => updateWorkTime(index, 'from', value)}
                  placeholder="09:00"
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>إلى</Text>
                <TextInput
                  style={styles.timeInput}
                  value={time.to}
                  onChangeText={(value) => updateWorkTime(index, 'to', value)}
                  placeholder="17:00"
                />
              </View>
            </View>
          </View>
        ))}

        <TouchableOpacity style={styles.addButton} onPress={addWorkTime}>
          <Ionicons name="add" size={24} color={theme.colors.white} />
          <Text style={styles.addButtonText}>إضافة وقت عمل</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.saveButton, saving && styles.saveButtonDisabled]}
          onPress={handleSubmit}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator size="small" color={theme.colors.white} />
          ) : (
            <Ionicons name="save" size={24} color={theme.colors.white} />
          )}
          <Text style={styles.saveButtonText}>
            {saving ? 'جاري الحفظ...' : 'حفظ أوقات الدوام'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
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
    backgroundColor: theme.colors.primary,
    padding: 20,
    paddingTop: 60,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.white,
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 16,
    color: theme.colors.white,
    textAlign: 'center',
    marginTop: 4,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  infoCard: {
    backgroundColor: theme.colors.primaryLight,
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoText: {
    marginLeft: 12,
    fontSize: 14,
    color: theme.colors.primary,
    flex: 1,
  },
  workTimeCard: {
    backgroundColor: theme.colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  workTimeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  workTimeTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  removeButton: {
    padding: 8,
  },
  inputRow: {
    marginBottom: 16,
  },
  inputContainer: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.textSecondary,
    marginBottom: 8,
  },
  pickerContainer: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 8,
    overflow: 'hidden',
  },
  pickerInput: {
    flex: 1,
    padding: 12,
    fontSize: 16,
    color: theme.colors.text,
    backgroundColor: theme.colors.white,
  },
  pickerButton: {
    padding: 12,
    backgroundColor: theme.colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timeRow: {
    flexDirection: 'row',
    gap: 12,
  },
  timeInput: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: theme.colors.text,
    backgroundColor: theme.colors.white,
  },
  addButton: {
    backgroundColor: theme.colors.success,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  addButtonText: {
    color: theme.colors.white,
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  saveButton: {
    backgroundColor: theme.colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: theme.colors.white,
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
});

export default WorkTimesEditorScreen;


