import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../utils/theme';
import { api } from '../services/api';

const HealthCentersScreen: React.FC = () => {
  const navigation = useNavigation();
  const { t } = useTranslation();
  const [centers, setCenters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCenters();
  }, []);

  const fetchCenters = async () => {
    try {
      setLoading(true);
      const response = await api.get('/health-centers');
      setCenters(response.data);
    } catch (error) {
      console.error('Error fetching centers:', error);
      Alert.alert('خطأ', 'فشل في جلب المراكز الصحية');
    } finally {
      setLoading(false);
    }
  };

  const viewCenterDetails = (centerId: string) => {
    Alert.alert('تفاصيل المركز', 'سيتم إضافة هذه الميزة قريباً');
  };

  const contactCenter = (phone: string) => {
    Alert.alert('اتصال', `هل تريد الاتصال بـ ${phone}؟`, [
      { text: 'إلغاء', style: 'cancel' },
      { text: 'اتصال', onPress: () => Alert.alert('اتصال', 'سيتم الاتصال قريباً') },
    ]);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>جاري تحميل المراكز الصحية...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>المراكز الصحية</Text>
      </View>

      <ScrollView style={styles.content}>
        {centers.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="business" size={64} color={theme.colors.textSecondary} />
            <Text style={styles.emptyTitle}>لا توجد مراكز صحية</Text>
            <Text style={styles.emptySubtitle}>سيتم إضافة المراكز الصحية قريباً</Text>
          </View>
        ) : (
          centers.map((center, index) => (
            <View key={center.id || index} style={styles.centerCard}>
              <View style={styles.centerHeader}>
                <View style={styles.centerInfo}>
                  {center.image ? (
                    <Image source={{ uri: center.image }} style={styles.centerImage} />
                  ) : (
                    <View style={styles.centerImagePlaceholder}>
                      <Ionicons name="business" size={32} color={theme.colors.textSecondary} />
                    </View>
                  )}
                  <View style={{ marginLeft: 12, flex: 1 }}>
                    <Text style={styles.centerName}>{center.name}</Text>
                    <Text style={styles.centerType}>{center.type}</Text>
                  </View>
                </View>
                <TouchableOpacity
                  onPress={() => viewCenterDetails(center.id)}
                  style={styles.detailsButton}
                >
                  <Ionicons name="information-circle" size={20} color={theme.colors.primary} />
                </TouchableOpacity>
              </View>

              <View style={styles.centerDetails}>
                {center.address && (
                  <View style={styles.detailRow}>
                    <Ionicons name="location" size={16} color={theme.colors.textSecondary} />
                    <Text style={styles.detailText}>{center.address}</Text>
                  </View>
                )}
                {center.phone && (
                  <View style={styles.detailRow}>
                    <Ionicons name="call" size={16} color={theme.colors.textSecondary} />
                    <Text style={styles.detailText}>{center.phone}</Text>
                  </View>
                )}
                {center.description && (
                  <View style={styles.detailRow}>
                    <Ionicons name="document-text" size={16} color={theme.colors.textSecondary} />
                    <Text style={styles.detailText} numberOfLines={2}>{center.description}</Text>
                  </View>
                )}
              </View>

              <View style={styles.centerActions}>
                <TouchableOpacity
                  style={[styles.actionButton, styles.callButton]}
                  onPress={() => contactCenter(center.phone)}
                >
                  <Ionicons name="call" size={16} color={theme.colors.white} />
                  <Text style={styles.actionButtonText}>اتصال</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionButton, styles.directionsButton]}
                  onPress={() => Alert.alert('اتجاهات', 'سيتم إضافة الاتجاهات قريباً')}
                >
                  <Ionicons name="navigate" size={16} color={theme.colors.white} />
                  <Text style={styles.actionButtonText}>اتجاهات</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
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
  },
  centerCard: {
    backgroundColor: theme.colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
  },
  centerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  centerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  centerImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
  },
  centerImagePlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: theme.colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
  },
  centerType: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  detailsButton: {
    padding: 8,
  },
  centerDetails: {
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
  centerActions: {
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
  callButton: {
    backgroundColor: theme.colors.success,
  },
  directionsButton: {
    backgroundColor: theme.colors.primary,
  },
  actionButtonText: {
    color: theme.colors.white,
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 4,
  },
});

export default HealthCentersScreen; 