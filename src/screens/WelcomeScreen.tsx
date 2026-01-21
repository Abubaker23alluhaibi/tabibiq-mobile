import React, { useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  StatusBar,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withRepeat,
  withTiming,
  withSequence,
  interpolate,
  Easing,
  SharedValue,
} from 'react-native-reanimated';
import { theme } from '../utils/theme';
import { isRTL, changeLanguage } from '../locales';
import { useAuth } from '../contexts/AuthContext';

const { width, height } = Dimensions.get('window');

// Animated Icon Component
const AnimatedMedicalIcon = ({
  iconName,
  iconSize,
  style,
  rotation,
  scale,
}: {
  iconName: any;
  iconSize: number;
  style: any;
  rotation: SharedValue<number>;
  scale: SharedValue<number>;
}) => {
  const rotationStyle = useAnimatedStyle(() => ({
    transform: [
      { rotate: `${rotation.value}deg` },
      { scale: scale.value },
    ],
  }));

  return (
    <Animated.View style={[styles.medicalIcon, style, rotationStyle]}>
      <Ionicons name={iconName} size={iconSize} color={theme.colors.white} />
    </Animated.View>
  );
};

const WelcomeScreen = () => {
  const navigation = useNavigation();
  const { t, i18n } = useTranslation();
  const { user } = useAuth();

  // Animation values
  const titleTranslateY = useSharedValue(50);
  const titleOpacity = useSharedValue(0);
  const subtitleTranslateY = useSharedValue(50);
  const subtitleOpacity = useSharedValue(0);
  const buttonScale = useSharedValue(0);
  const buttonOpacity = useSharedValue(0);
  const iconRotations = Array.from({ length: 3 }, () => useSharedValue(0));
  const iconScales = Array.from({ length: 3 }, () => useSharedValue(0));

  useEffect(() => {
    // Title animation
    titleTranslateY.value = withSpring(0, { damping: 12, stiffness: 100 });
    titleOpacity.value = withTiming(1, { duration: 600 });

    // Subtitle animation
    setTimeout(() => {
      subtitleTranslateY.value = withSpring(0, { damping: 12, stiffness: 100 });
      subtitleOpacity.value = withTiming(1, { duration: 600 });
    }, 200);

    // Medical icons animations
    iconRotations.forEach((rotation, index) => {
      setTimeout(() => {
        // Rotate once from 0 to 360 and then stop at 0
        rotation.value = withSequence(
          withTiming(360, { duration: 1500 + index * 150, easing: Easing.out(Easing.quad) }),
          withTiming(0, { duration: 0 })
        );
        iconScales[index].value = withSpring(1, { damping: 8, stiffness: 50 });
      }, 400 + index * 100);
    });

    // Buttons animation
    setTimeout(() => {
      buttonScale.value = withSpring(1, { damping: 10, stiffness: 100 });
      buttonOpacity.value = withTiming(1, { duration: 600 });
    }, 600);

  }, []);

  // التحقق من حالة تسجيل الدخول عند فتح الصفحة أو العودة إليها
  useFocusEffect(
    useCallback(() => {
      // التحويل التلقائي المباشر للصفحة الرئيسية دائماً
      // إذا كان المستخدم مسجل دخول كدكتور، أنقله لصفحة الطبيب
      if (user && user.user_type === 'doctor') {
        navigation.navigate('DoctorDashboard' as never);
      } else {
        // في جميع الحالات الأخرى (مسجل دخول كمستخدم أو غير مسجل)، أنقله للصفحة الرئيسية
        navigation.navigate('UserHomeStack' as never);
      }
    }, [user, navigation])
  );

  const navigateToNext = () => {
    // التحويل دائماً للصفحة الرئيسية
    // إذا كان المستخدم مسجل دخول كدكتور، أنقله لصفحة الطبيب
    if (user && user.user_type === 'doctor') {
      navigation.navigate('DoctorDashboard' as never);
    } else {
      // في جميع الحالات الأخرى، أنقله للصفحة الرئيسية
      navigation.navigate('UserHomeStack' as never);
    }
  };

  const navigateToLogin = () => {
    navigation.navigate('Login' as never);
  };

  return (
    <View style={styles.mainContainer}>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.primary} />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.logoContainer}>
            <View style={styles.logoText}>
              <Text style={styles.logoTitle}>{t('landing.platform_title')}</Text>
              <Text style={styles.logoSubtitle}>{t('landing.platform_subtitle')}</Text>
            </View>
          </View>
          
          <TouchableOpacity style={styles.languageButton} onPress={() => {
            const next = i18n.language === 'ar' ? 'en' : i18n.language === 'en' ? 'ku' : 'ar';
            changeLanguage(next);
          }}>
            <Ionicons name="language" size={20} color="#FFFFFF" />
            <Text style={styles.languageText}>
              {i18n.language === 'ar' ? 'العربية' : i18n.language === 'en' ? 'English' : 'کوردی'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Main Content */}
      <View style={styles.content}>
        <View style={styles.welcomeContainer}>
          {/* Welcome Text with Animation */}
          <Animated.View
            style={useAnimatedStyle(() => ({
              transform: [{ translateY: titleTranslateY.value }],
              opacity: titleOpacity.value,
            }))}
          >
            <Text style={styles.welcomeTitle}>
              {t('welcome.title')}
            </Text>
          </Animated.View>
          
          <Animated.View
            style={useAnimatedStyle(() => ({
              transform: [{ translateY: subtitleTranslateY.value }],
              opacity: subtitleOpacity.value,
            }))}
          >
            <Text style={styles.welcomeSubtitle}>
              {t('welcome.subtitle')}
            </Text>
          </Animated.View>

          {/* Medical Icons Section - 3 icons only */}
          <View style={styles.medicalIconsContainer}>
            <View style={styles.iconsGrid}>
              <AnimatedMedicalIcon
                iconName="heart"
                iconSize={40}
                style={styles.gridIcon}
                rotation={iconRotations[0]}
                scale={iconScales[0]}
              />
              <AnimatedMedicalIcon
                iconName="medical"
                iconSize={45}
                style={styles.gridIcon}
                rotation={iconRotations[1]}
                scale={iconScales[1]}
              />
              <AnimatedMedicalIcon
                iconName="pulse"
                iconSize={40}
                style={styles.gridIcon}
                rotation={iconRotations[2]}
                scale={iconScales[2]}
              />
            </View>
          </View>
        </View>

        {/* Bottom Actions with Animation */}
        <Animated.View
          style={[
            styles.bottomActions,
            useAnimatedStyle(() => ({
              transform: [{ scale: buttonScale.value }],
              opacity: buttonOpacity.value,
            })),
          ]}
        >
          <TouchableOpacity style={styles.primaryButton} onPress={navigateToNext}>
            <Text style={styles.primaryButtonText}>{t('welcome.get_started')}</Text>
            <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.secondaryButton} onPress={navigateToLogin}>
            <Text style={styles.secondaryButtonText}>{t('welcome.already_have_account')}</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: theme.colors.primary,
  },
  header: {
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.2)',
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoText: {
    flexDirection: 'column',
  },
  logoTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  logoSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    marginTop: 8,
  },
  languageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  languageText: {
    color: '#FFFFFF',
    marginLeft: 4,
    fontSize: 14,
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 40,
  },
  welcomeContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  medicalIconsContainer: {
    marginTop: 40,
    marginBottom: 20,
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 20,
  },
  iconsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 20,
    width: '100%',
  },
  medicalIcon: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    borderRadius: 20,
    padding: 12,
    borderWidth: 0,
    shadowColor: 'transparent',
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  gridIcon: {
    width: 70,
    height: 70,
  },
  welcomeTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 16,
    paddingHorizontal: 20,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 3, height: 3 },
    textShadowRadius: 6,
  },
  welcomeSubtitle: {
    fontSize: 18,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 0,
    paddingHorizontal: 20,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
    fontWeight: '500',
    lineHeight: 26,
  },
  bottomActions: {
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 40,
    paddingVertical: 16,
    borderRadius: 25,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: theme.colors.primary,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    marginBottom: 16,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    marginRight: 8,
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  secondaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
});

export default WelcomeScreen;
