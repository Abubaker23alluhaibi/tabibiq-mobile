import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { accountManagementAPI } from '../services/api';
import { theme } from '../utils/theme';
import { Ionicons } from '@expo/vector-icons';

interface AccountStatusCheckerProps {
  children: React.ReactNode;
}

const AccountStatusChecker: React.FC<AccountStatusCheckerProps> = ({ children }) => {
  const { profile, signOut } = useAuth();
  const { t } = useTranslation();
  const [isChecking, setIsChecking] = useState(false);
  const [accountDisabled, setAccountDisabled] = useState(false);

  useEffect(() => {
    if (profile?._id) {
      checkAccountStatus();
    }
  }, [profile?._id]);

  const checkAccountStatus = async () => {
    if (!profile?._id) return;

    try {
      setIsChecking(true);
      const userType = profile.user_type || 'user';
      const response = await accountManagementAPI.getAccountStatus(profile._id, userType);
      
      if (response.success && response.data) {
        setAccountDisabled(response.data.disabled || false);
        
        if (response.data.disabled) {
          showDisabledAccountAlert();
        }
      }
    } catch (error) {
      // خطأ في فحص حالة الحساب
    } finally {
      setIsChecking(false);
    }
  };

  const showDisabledAccountAlert = () => {
    Alert.alert(
      t('account_disabled'),
      t('account_disabled_message'),
      [
        {
          text: t('logout'),
          onPress: () => signOut(),
          style: 'destructive'
        }
      ],
      { cancelable: false }
    );
  };

  if (accountDisabled) {
    return (
      <View style={styles.disabledContainer}>
        <View style={styles.disabledContent}>
          <Ionicons name="lock-closed" size={80} color={theme.colors.error} />
          <Text style={styles.disabledTitle}>{t('account_disabled')}</Text>
          <Text style={styles.disabledMessage}>
            {t('account_disabled_message')}
          </Text>
          <TouchableOpacity style={styles.signOutButton} onPress={() => signOut()}>
            <Text style={styles.signOutButtonText}>{t('logout')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (isChecking) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>{t('common.loading')}</Text>
      </View>
    );
  }

  return <>{children}</>;
};

const styles = StyleSheet.create({
  disabledContainer: {
    flex: 1,
    backgroundColor: theme.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  disabledContent: {
    alignItems: 'center',
    maxWidth: 300,
  },
  disabledTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
    marginTop: 20,
    marginBottom: 10,
    textAlign: 'center',
  },
  disabledMessage: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 30,
  },
  signOutButton: {
    backgroundColor: theme.colors.error,
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 8,
  },
  signOutButtonText: {
    color: theme.colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: theme.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
});

export default AccountStatusChecker;

