import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  Linking,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { colors } from '../utils/theme';

interface PrivacyPolicyButtonProps {
  variant?: 'primary' | 'secondary' | 'text';
  size?: 'small' | 'medium' | 'large';
  showIcon?: boolean;
  style?: any;
  textStyle?: any;
}

const PrivacyPolicyButton: React.FC<PrivacyPolicyButtonProps> = ({
  variant = 'primary',
  size = 'medium',
  showIcon = true,
  style,
  textStyle,
}) => {
  const { t } = useTranslation();

  const handleOpenPrivacyPolicy = async () => {
    try {
      const url = 'https://www.tabib-iq.com/privacy';
      const supported = await Linking.canOpenURL(url);
      
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert(
          t('common.error'),
          t('common.privacy_policy_open_error') || 'لا يمكن فتح سياسة الخصوصية',
          [{ text: t('common.ok') }]
        );
      }
    } catch (error) {
      Alert.alert(
        t('common.error'),
        t('common.privacy_policy_open_error') || 'حدث خطأ في فتح سياسة الخصوصية',
        [{ text: t('common.ok') }]
      );
    }
  };

  const getButtonStyle = () => {
    const baseStyle: any[] = [styles.button, styles[size]];
    
    switch (variant) {
      case 'primary':
        baseStyle.push(styles.primary);
        break;
      case 'secondary':
        baseStyle.push(styles.secondary);
        break;
      case 'text':
        baseStyle.push(styles.textButton);
        break;
    }
    
    return baseStyle;
  };

  const getTextStyle = () => {
    const baseTextStyle: any[] = [styles.textBase, styles[`${size}Text`]];
    
    switch (variant) {
      case 'primary':
        baseTextStyle.push(styles.primaryText);
        break;
      case 'secondary':
        baseTextStyle.push(styles.secondaryText);
        break;
      case 'text':
        baseTextStyle.push(styles.textButtonText);
        break;
    }
    
    return baseTextStyle;
  };

  return (
    <TouchableOpacity
      style={[getButtonStyle(), style]}
      onPress={handleOpenPrivacyPolicy}
      activeOpacity={0.7}
    >
      {showIcon && (
        <Ionicons
          name="shield-checkmark-outline"
          size={getIconSize()}
          color={getIconColor()}
          style={styles.icon}
        />
      )}
      <Text style={[getTextStyle(), textStyle]}>
        {t('common.privacy_policy')}
      </Text>
    </TouchableOpacity>
  );

  function getIconSize() {
    switch (size) {
      case 'small': return 16;
      case 'large': return 24;
      default: return 20;
    }
  }

  function getIconColor() {
    switch (variant) {
      case 'primary': return colors.white;
      case 'secondary': return colors.primary;
      case 'text': return colors.primary;
      default: return colors.white;
    }
  }
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  
  // Sizes
  small: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  medium: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  large: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  
  // Variants
  primary: {
    backgroundColor: colors.primary,
    borderWidth: 0,
  },
  secondary: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  textButton: {
    backgroundColor: 'transparent',
    borderWidth: 0,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  
  // Text styles
  textBase: {
    fontWeight: '500',
    textAlign: 'center',
  },
  smallText: {
    fontSize: 12,
  },
  mediumText: {
    fontSize: 14,
  },
  largeText: {
    fontSize: 16,
  },
  
  // Text colors
  primaryText: {
    color: colors.white,
  },
  secondaryText: {
    color: colors.primary,
  },
  textButtonText: {
    color: colors.primary,
  },
  
  // Icon
  icon: {
    marginRight: 8,
  },
});

export default PrivacyPolicyButton;


