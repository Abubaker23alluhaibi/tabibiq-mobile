import React, { useEffect, useRef } from 'react';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useAuth } from '../contexts/AuthContext';
import { useApp } from '../contexts/AppContext';
import DeepLinkingService, { DeepLinkData } from '../services/DeepLinkingService';
import { RootStackParamList } from '../types';

type NavigationProp = StackNavigationProp<RootStackParamList>;

interface DeepLinkHandlerProps {
  children: React.ReactNode;
}

const DeepLinkHandler: React.FC<DeepLinkHandlerProps> = ({ children }) => {
  const navigation = useNavigation<NavigationProp>();
  const { user, loading: authLoading } = useAuth();
  const { isFirstLaunch, loading: appLoading } = useApp();
  const pendingDeepLink = useRef<DeepLinkData | null>(null);
  const isAppReady = useRef(false);

  useEffect(() => {
    // تحديد ما إذا كان التطبيق جاهزاً للتنقل
    const checkAppReady = () => {
      return !authLoading && !appLoading && user !== null;
    };

    const handleDeepLink = (data: DeepLinkData | null) => {
      if (!data) return;

      // إذا كان التطبيق غير جاهز، احفظ الرابط للتنقل لاحقاً
      if (!checkAppReady()) {
        pendingDeepLink.current = data;
        return;
      }

      // تأخير قصير لضمان تحميل التطبيق بالكامل
      setTimeout(() => {
        try {
          switch (data.type) {
            case 'doctor':
              if (data.id) {
                // التأكد من أن المستخدم مسجل دخول قبل التنقل
                if (user) {
                  navigation.navigate('DoctorDetails', { doctorId: data.id });
                } else {
                  // إذا لم يكن مسجل دخول، احفظ الرابط للتنقل بعد تسجيل الدخول
                  pendingDeepLink.current = data;
                }
              }
              break;

            case 'appointment':
              if (data.id && user) {
                if (user.user_type === 'doctor') {
                  navigation.navigate('DoctorAppointments');
                } else {
                  navigation.navigate('MyAppointments');
                }
              }
              break;

            case 'profile':
              if (user) {
                if (user.user_type === 'doctor') {
                  navigation.navigate('DoctorProfile');
                } else {
                  navigation.navigate('UserProfile');
                }
              }
              break;

            case 'notification':
              if (user) {
                navigation.navigate('Notifications');
              }
              break;

            default:
              // Unknown Deep Link type
          }
        } catch (error) {
          if (__DEV__) {
            console.error('Error handling deep link:', error);
          }
        }
      }, 1000); // تأخير ثانية واحدة لضمان تحميل التطبيق
    };

    const unsubscribe = DeepLinkingService.getInstance().addListener(handleDeepLink);

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [navigation, user, authLoading, appLoading]);

  // معالج للتنقل المؤجل بعد تسجيل الدخول
  useEffect(() => {
    if (!authLoading && !appLoading && user && pendingDeepLink.current) {
      const data = pendingDeepLink.current;
      pendingDeepLink.current = null;

      // تأخير إضافي لضمان تحميل التطبيق بالكامل
      setTimeout(() => {
        try {
          switch (data.type) {
            case 'doctor':
              if (data.id) {
                navigation.navigate('DoctorDetails', { doctorId: data.id });
              }
              break;
            case 'appointment':
              if (data.id) {
                if (user.user_type === 'doctor') {
                  navigation.navigate('DoctorAppointments');
                } else {
                  navigation.navigate('MyAppointments');
                }
              }
              break;
            case 'profile':
              if (user.user_type === 'doctor') {
                navigation.navigate('DoctorProfile');
              } else {
                navigation.navigate('UserProfile');
              }
              break;
            case 'notification':
              navigation.navigate('Notifications');
              break;
          }
        } catch (error) {
          if (__DEV__) {
            console.error('Error handling pending deep link:', error);
          }
        }
      }, 1500);
    }
  }, [user, authLoading, appLoading, navigation]);

  return <>{children}</>;
};

export default DeepLinkHandler;


