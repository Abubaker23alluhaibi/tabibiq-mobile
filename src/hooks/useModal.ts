import { useState, useCallback } from 'react';

interface ModalState {
  visible: boolean;
  title: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info' | 'confirm';
  buttons: Array<{
    text: string;
    onPress: () => void;
    style?: 'default' | 'cancel' | 'destructive';
  }>;
  showCloseButton: boolean;
}

export const useModal = () => {
  const [modal, setModal] = useState<ModalState>({
    visible: false,
    title: '',
    message: '',
    type: 'info',
    buttons: [],
    showCloseButton: true,
  });

  const showModal = useCallback((
    title: string,
    message: string,
    type: 'success' | 'error' | 'warning' | 'info' | 'confirm' = 'info',
    buttons: Array<{
      text: string;
      onPress: () => void;
      style?: 'default' | 'cancel' | 'destructive';
    }> = [],
    showCloseButton: boolean = true
  ) => {
    setModal({
      visible: true,
      title,
      message,
      type,
      buttons,
      showCloseButton,
    });
  }, []);

  const hideModal = useCallback(() => {
    setModal(prev => ({ ...prev, visible: false }));
  }, []);

  const showAlert = useCallback((
    title: string,
    message: string,
    onPress?: () => void
  ) => {
    showModal(
      title,
      message,
      'info',
      [
        {
          text: 'حسناً',
          onPress: onPress || (() => {}),
          style: 'default',
        },
      ],
      true
    );
  }, [showModal]);

  const showConfirm = useCallback((
    title: string,
    message: string,
    onConfirm: () => void,
    onCancel?: () => void
  ) => {
    showModal(
      title,
      message,
      'confirm',
      [
        {
          text: 'إلغاء',
          onPress: onCancel || (() => {}),
          style: 'cancel',
        },
        {
          text: 'تأكيد',
          onPress: onConfirm,
          style: 'default',
        },
      ],
      true
    );
  }, [showModal]);

  const showError = useCallback((
    title: string,
    message: string,
    onPress?: () => void
  ) => {
    showModal(
      title,
      message,
      'error',
      [
        {
          text: 'حسناً',
          onPress: onPress || (() => {}),
          style: 'default',
        },
      ],
      true
    );
  }, [showModal]);

  const showSuccess = useCallback((
    title: string,
    message: string,
    onPress?: () => void
  ) => {
    showModal(
      title,
      message,
      'success',
      [
        {
          text: 'حسناً',
          onPress: onPress || (() => {}),
          style: 'default',
        },
      ],
      true
    );
  }, [showModal]);

  return {
    modal,
    showModal,
    hideModal,
    showAlert,
    showConfirm,
    showError,
    showSuccess,
  };
};
