import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../utils/theme';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const AppointmentDurationEditorScreen: React.FC = () => {
  const { t } = useTranslation();
  const { profile, updateProfile } = useAuth();
  const [duration, setDuration] = useState('30');
  const [saving, setSaving] = useState(false);

  const durationOptions = [
    { value: '5', label: t('appointment_duration.options.5') },
    { value: '10', label: t('appointment_duration.options.10') },
    { value: '15', label: t('appointment_duration.options.15') },
    { value: '20', label: t('appointment_duration.options.20') },
    { value: '30', label: t('appointment_duration.options.30') },
    { value: '45', label: t('appointment_duration.options.45') },
    { value: '60', label: t('appointment_duration.options.60') },
  ];

  useEffect(() => {
    if (profile?.appointmentDuration) {
      setDuration(profile.appointmentDuration.toString());
    }
  }, [profile]);

  const handleSubmit = async () => {
    if (!profile?._id) {
      Alert.alert(t('common.error'), t('appointment_duration.login_required'));
      return;
    }

    setSaving(true);
    try {
      const result = await updateProfile({ appointmentDuration: Number(duration) });

      if (result.error) {
        Alert.alert(t('common.error'), result.error);
      } else {
        Alert.alert(t('common.success'), t('appointment_duration.success_message'));
      }
    } catch (error) {
      Alert.alert(t('common.error'), t('appointment_duration.connection_error'));
    } finally {
      setSaving(false);
    }
  };

  const getTimeSlotsExample = () => {
    const durationNum = parseInt(duration);
    const slots = [];
    for (let hour = 9; hour < 17; hour++) {
      for (let minute = 0; minute < 60; minute += durationNum) {
        const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        slots.push(time);
      }
    }
    return slots.slice(0, 6); // عرض أول 6 أوقات فقط
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t('appointment_duration.title')}</Text>
        <Text style={styles.headerSubtitle}>{t('appointment_duration.subtitle')}</Text>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.infoCard}>
          <Ionicons name="information-circle" size={24} color={theme.colors.primary} />
          <Text style={styles.infoText}>
            {t('appointment_duration.help')}
          </Text>
        </View>

        <View style={styles.durationCard}>
          <Text style={styles.durationTitle}>{t('appointment_duration.choose_duration')}</Text>
          
          {durationOptions.map((option) => (
            <TouchableOpacity
              key={option.value}
              style={[
                styles.durationOption,
                duration === option.value && styles.durationOptionSelected,
              ]}
              onPress={() => setDuration(option.value)}
            >
              <View style={styles.durationOptionContent}>
                <Text style={[
                  styles.durationOptionText,
                  duration === option.value && styles.durationOptionTextSelected,
                ]}>
                  {option.label}
                </Text>
                {duration === option.value && (
                  <Ionicons name="checkmark-circle" size={24} color={theme.colors.primary} />
                )}
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.exampleCard}>
          <Text style={styles.exampleTitle}>{t('appointment_duration.example')}</Text>
          <Text style={styles.exampleSubtitle}>
            {t('appointment_duration.example_text').replace('{duration}', duration)}
          </Text>
          
          <View style={styles.timeSlotsContainer}>
            {getTimeSlotsExample().map((time, index) => (
              <View key={index} style={styles.timeSlot}>
                <Text style={styles.timeSlotText}>{time}</Text>
              </View>
            ))}
            <Text style={styles.moreText}>{t('appointment_duration.more_text')}</Text>
          </View>
        </View>

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
            {saving ? t('appointment_duration.saving') : t('appointment_duration.save_duration')}
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
  durationCard: {
    backgroundColor: theme.colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  durationTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 16,
  },
  durationOption: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 8,
    marginBottom: 8,
    padding: 16,
  },
  durationOptionSelected: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primaryLight,
  },
  durationOptionContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  durationOptionText: {
    fontSize: 16,
    color: theme.colors.text,
  },
  durationOptionTextSelected: {
    color: theme.colors.primary,
    fontWeight: 'bold',
  },
  exampleCard: {
    backgroundColor: theme.colors.successLight,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: theme.colors.success,
  },
  exampleTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.success,
    marginBottom: 8,
  },
  exampleSubtitle: {
    fontSize: 14,
    color: theme.colors.success,
    marginBottom: 16,
  },
  timeSlotsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  timeSlot: {
    backgroundColor: theme.colors.white,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: theme.colors.success,
  },
  timeSlotText: {
    fontSize: 12,
    color: theme.colors.success,
    fontWeight: '600',
  },
  moreText: {
    fontSize: 12,
    color: theme.colors.success,
    fontStyle: 'italic',
    alignSelf: 'center',
    marginTop: 8,
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

export default AppointmentDurationEditorScreen;


