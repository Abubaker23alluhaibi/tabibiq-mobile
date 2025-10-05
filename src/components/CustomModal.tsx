import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Animated,
  Dimensions,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../utils/theme';

interface CustomModalProps {
  visible: boolean;
  title: string;
  message: string;
  type?: 'success' | 'error' | 'warning' | 'info' | 'confirm';
  buttons?: Array<{
    text: string;
    onPress: () => void;
    style?: 'default' | 'cancel' | 'destructive';
  }>;
  onClose: () => void;
  showCloseButton?: boolean;
}

const CustomModal: React.FC<CustomModalProps> = ({
  visible,
  title,
  message,
  type = 'info',
  buttons = [],
  onClose,
  showCloseButton = true,
}) => {
  const scale = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scale, {
          toValue: 1,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(scale, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const getIcon = () => {
    switch (type) {
      case 'success':
        return 'checkmark-circle';
      case 'error':
        return 'close-circle';
      case 'warning':
        return 'warning';
      case 'confirm':
        return 'help-circle';
      default:
        return 'information-circle';
    }
  };

  const getIconColor = () => {
    switch (type) {
      case 'success':
        return theme.colors.success;
      case 'error':
        return theme.colors.error;
      case 'warning':
        return theme.colors.warning;
      case 'confirm':
        return theme.colors.primary;
      default:
        return theme.colors.primary;
    }
  };

  const getButtonStyle = (buttonStyle?: string) => {
    switch (buttonStyle) {
      case 'destructive':
        return styles.destructiveButton;
      case 'cancel':
        return styles.cancelButton;
      default:
        return styles.defaultButton;
    }
  };

  const getButtonTextStyle = (buttonStyle?: string) => {
    switch (buttonStyle) {
      case 'destructive':
        return styles.destructiveButtonText;
      case 'cancel':
        return styles.cancelButtonText;
      default:
        return styles.defaultButtonText;
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <Animated.View
        style={[
          styles.overlay,
          {
            opacity,
          },
        ]}
      >
        <Animated.View
          style={[
            styles.modal,
            {
              transform: [{ scale }],
            },
          ]}
        >
          <View style={styles.header}>
            <View style={styles.iconContainer}>
              <Ionicons
                name={getIcon()}
                size={32}
                color={getIconColor()}
              />
            </View>
            <Text style={styles.title}>{title}</Text>
            {showCloseButton && (
              <TouchableOpacity
                style={styles.closeButton}
                onPress={onClose}
              >
                <Ionicons name="close" size={24} color={theme.colors.textSecondary} />
              </TouchableOpacity>
            )}
          </View>

          <ScrollView style={styles.content}>
            <Text style={styles.message}>{message}</Text>
          </ScrollView>

          {buttons.length > 0 && (
            <View style={styles.footer}>
              {buttons.map((button, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.button,
                    getButtonStyle(button.style),
                    buttons.length === 1 && styles.singleButton,
                  ]}
                  onPress={() => {
                    button.onPress();
                    onClose();
                  }}
                >
                  <Text style={getButtonTextStyle(button.style)}>
                    {button.text}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modal: {
    backgroundColor: theme.colors.white,
    borderRadius: 16,
    width: '100%',
    maxWidth: 400,
    maxHeight: '80%',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  iconContainer: {
    marginRight: 12,
  },
  title: {
    flex: 1,
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
  },
  closeButton: {
    padding: 4,
  },
  content: {
    padding: 20,
  },
  message: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    lineHeight: 24,
    textAlign: 'center',
  },
  footer: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  singleButton: {
    flex: 1,
  },
  defaultButton: {
    backgroundColor: theme.colors.primary,
  },
  cancelButton: {
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  destructiveButton: {
    backgroundColor: theme.colors.error,
  },
  defaultButtonText: {
    color: theme.colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  cancelButtonText: {
    color: theme.colors.textPrimary,
    fontSize: 16,
    fontWeight: '500',
  },
  destructiveButtonText: {
    color: theme.colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default CustomModal;
