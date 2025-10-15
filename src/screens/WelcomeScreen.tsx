import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  StatusBar,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../utils/theme';
import { isRTL, changeLanguage } from '../locales';

const { width, height } = Dimensions.get('window');

const WelcomeScreen = () => {
  const navigation = useNavigation();
  const { t, i18n } = useTranslation();

  const navigateToNext = () => {
    navigation.navigate('AppIntro' as never);
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
          {/* Medical Icons Section - Random Layout */}
          <View style={styles.medicalIconsContainer}>
            <View style={styles.randomIconContainer}>
              <View style={[styles.medicalIcon, styles.randomIcon1]}>
                <Ionicons name="heart" size={35} color="#FFD700" />
              </View>
              <View style={[styles.medicalIcon, styles.randomIcon2]}>
                <Ionicons name="medical" size={40} color="#FFD700" />
              </View>
              <View style={[styles.medicalIcon, styles.randomIcon3]}>
                <Ionicons name="pulse" size={32} color="#FFD700" />
              </View>
              <View style={[styles.medicalIcon, styles.randomIcon4]}>
                <Ionicons name="stethoscope" size={38} color="#FFD700" />
              </View>
              <View style={[styles.medicalIcon, styles.randomIcon5]}>
                <Ionicons name="fitness" size={36} color="#FFD700" />
              </View>
              <View style={[styles.medicalIcon, styles.randomIcon6]}>
                <Ionicons name="shield-checkmark" size={34} color="#FFD700" />
              </View>
              <View style={[styles.medicalIcon, styles.randomIcon7]}>
                <Ionicons name="thermometer" size={30} color="#FFD700" />
              </View>
              <View style={[styles.medicalIcon, styles.randomIcon8]}>
                <Ionicons name="flask" size={33} color="#FFD700" />
              </View>
            </View>
          </View>
          
          {/* Welcome Icon */}
          <View style={styles.welcomeIcon}>
            <Ionicons name="medical" size={100} color="#FFD700" />
          </View>
          
          {/* Welcome Text */}
          <Text style={styles.welcomeTitle}>
            {t('welcome.title')}
          </Text>
          
          <Text style={styles.welcomeSubtitle}>
            {t('welcome.subtitle')}
          </Text>
        </View>

        {/* Bottom Actions */}
        <View style={styles.bottomActions}>
          <TouchableOpacity style={styles.primaryButton} onPress={navigateToNext}>
            <Text style={styles.primaryButtonText}>{t('welcome.get_started')}</Text>
            <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.secondaryButton} onPress={navigateToLogin}>
            <Text style={styles.secondaryButtonText}>{t('welcome.already_have_account')}</Text>
          </TouchableOpacity>
        </View>
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
    marginBottom: 40,
    alignItems: 'center',
    height: 220,
    width: '100%',
    paddingHorizontal: 10,
  },
  randomIconContainer: {
    position: 'relative',
    width: '100%',
    height: '100%',
  },
  medicalIcon: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 20,
    padding: 12,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    shadowColor: '#FFD700',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  randomIcon1: {
    top: 5,
    left: 15,
    width: 55,
    height: 55,
    transform: [{ rotate: '15deg' }],
  },
  randomIcon2: {
    top: 25,
    right: 10,
    width: 65,
    height: 65,
    transform: [{ rotate: '-10deg' }],
  },
  randomIcon3: {
    top: 70,
    left: 5,
    width: 50,
    height: 50,
    transform: [{ rotate: '8deg' }],
  },
  randomIcon4: {
    top: 45,
    right: 35,
    width: 60,
    height: 60,
    transform: [{ rotate: '-5deg' }],
  },
  randomIcon5: {
    top: 110,
    left: 45,
    width: 53,
    height: 53,
    transform: [{ rotate: '12deg' }],
  },
  randomIcon6: {
    top: 10,
    left: 45,
    width: 57,
    height: 57,
    transform: [{ rotate: '-8deg' }],
  },
  randomIcon7: {
    top: 90,
    right: 15,
    width: 48,
    height: 48,
    transform: [{ rotate: '6deg' }],
  },
  randomIcon8: {
    top: 130,
    right: 45,
    width: 51,
    height: 51,
    transform: [{ rotate: '-12deg' }],
  },
  welcomeIcon: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    marginBottom: 40,
  },
  welcomeTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 16,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 3, height: 3 },
    textShadowRadius: 6,
  },
  welcomeSubtitle: {
    fontSize: 18,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 40,
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
