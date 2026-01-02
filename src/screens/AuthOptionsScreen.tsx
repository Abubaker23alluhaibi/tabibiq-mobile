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
import { useApp } from '../contexts/AppContext';

const { width, height } = Dimensions.get('window');

const AuthOptionsScreen = () => {
  const navigation = useNavigation();
  const { t } = useTranslation();
  const { markAppAsLaunched } = useApp();

  const navigateToLogin = async () => {
    await markAppAsLaunched();
    navigation.navigate('Login' as never);
  };

  return (
    <View style={styles.mainContainer}>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.primary} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>{t('auth_options.title')}</Text>
        
        <View style={styles.placeholder} />
      </View>

      {/* Content */}
      <View style={styles.content}>
        {/* Floating Emojis */}
        <View style={styles.floatingEmojis}>
          <Text style={[styles.floatingEmoji, styles.emoji1]}>🎉</Text>
          <Text style={[styles.floatingEmoji, styles.emoji2]}>✨</Text>
          <Text style={[styles.floatingEmoji, styles.emoji3]}>🌟</Text>
          <Text style={[styles.floatingEmoji, styles.emoji4]}>💚</Text>
          <Text style={[styles.floatingEmoji, styles.emoji5]}>🎊</Text>
          <Text style={[styles.floatingEmoji, styles.emoji6]}>🎈</Text>
        </View>

        {/* Medical Equipment Stickers */}
        <View style={styles.medicalStickers}>
          <Text style={[styles.medicalSticker, styles.sticker1]}>🩺</Text>
          <Text style={[styles.medicalSticker, styles.sticker2]}>💉</Text>
          <Text style={[styles.medicalSticker, styles.sticker3]}>🩹</Text>
          <Text style={[styles.medicalSticker, styles.sticker4]}>🧬</Text>
          <Text style={[styles.medicalSticker, styles.sticker5]}>🔬</Text>
          <Text style={[styles.medicalSticker, styles.sticker6]}>🦠</Text>
        </View>

        <View style={styles.authContainer}>
          {/* Welcome Message */}
          <View style={styles.welcomeSection}>
            <Text style={styles.welcomeTitle}>
              {t('auth_options.welcome_message')}
            </Text>
            
            <Text style={styles.welcomeSubtitle}>
              {t('auth_options.welcome_subtitle_simple')}
            </Text>

            {/* Decorative Elements */}
            <View style={styles.decorativeElements}>
              <Text style={styles.decorativeEmoji}>🏥</Text>
              <Text style={styles.decorativeEmoji}>👨‍⚕️</Text>
              <Text style={styles.decorativeEmoji}>💊</Text>
            </View>
          </View>

          {/* Auth Options */}
          <View style={styles.authOptions}>
            {/* Login */}
            <TouchableOpacity style={styles.authButton} onPress={navigateToLogin}>
              <View style={styles.authButtonContent}>
                <View style={styles.authIcon}>
                  <Ionicons name="log-in" size={28} color="#FFFFFF" />
                </View>
                <View style={styles.authText}>
                  <Text style={styles.authTitle}>{t('auth.login')}</Text>
                  <Text style={styles.authDescription}>{t('auth.login_description')}</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#FFFFFF" />
              </View>
              {/* Button Decoration */}
              <Text style={styles.buttonEmoji}>🚀</Text>
            </TouchableOpacity>

            {/* Sign Up */}
            <TouchableOpacity style={styles.authButtonSecondary} onPress={navigateToLogin}>
              <View style={styles.authButtonContent}>
                <View style={styles.authIconSecondary}>
                  <Ionicons name="person-add" size={28} color={theme.colors.primary} />
                </View>
                <View style={styles.authText}>
                  <Text style={styles.authTitleSecondary}>{t('auth.signup')}</Text>
                  <Text style={styles.authDescriptionSecondary}>{t('auth.signup_description')}</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={theme.colors.primary} />
              </View>
              {/* Button Decoration */}
              <Text style={styles.buttonEmojiSecondary}>🎯</Text>
            </TouchableOpacity>
          </View>

          {/* Bottom Decorative Elements */}
          <View style={styles.bottomDecorations}>
            <Text style={styles.bottomEmoji}>🎨</Text>
            <Text style={styles.bottomEmoji}>🌈</Text>
            <Text style={styles.bottomEmoji}>🎪</Text>
          </View>

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
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 30,
    position: 'relative',
  },
  floatingEmojis: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
  },
  floatingEmoji: {
    position: 'absolute',
    fontSize: 24,
    opacity: 0.7,
  },
  emoji1: {
    top: '15%',
    left: '10%',
    fontSize: 20,
  },
  emoji2: {
    top: '25%',
    right: '15%',
    fontSize: 18,
  },
  emoji3: {
    top: '40%',
    left: '5%',
    fontSize: 22,
  },
  emoji4: {
    top: '60%',
    right: '8%',
    fontSize: 26,
  },
  emoji5: {
    top: '75%',
    left: '12%',
    fontSize: 19,
  },
  emoji6: {
    top: '85%',
    right: '20%',
    fontSize: 21,
  },
  medicalStickers: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
  },
  medicalSticker: {
    position: 'absolute',
    fontSize: 24,
    opacity: 0.7,
  },
  sticker1: {
    top: '12%',
    right: '25%',
    fontSize: 22,
  },
  sticker2: {
    top: '30%',
    left: '20%',
    fontSize: 20,
  },
  sticker3: {
    top: '50%',
    right: '30%',
    fontSize: 24,
  },
  sticker4: {
    top: '65%',
    left: '8%',
    fontSize: 26,
  },
  sticker5: {
    top: '25%',
    left: '25%',
    fontSize: 23,
  },
  sticker6: {
    top: '75%',
    right: '12%',
    fontSize: 21,
  },
  authContainer: {
    flex: 1,
    justifyContent: 'center',
    zIndex: 2,
  },
  welcomeSection: {
    alignItems: 'center',
    marginBottom: 50,
  },
  welcomeTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 40,
  },
  welcomeSubtitle: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    lineHeight: 26,
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  decorativeElements: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 20,
    marginTop: 10,
  },
  decorativeEmoji: {
    fontSize: 28,
    opacity: 0.8,
  },
  authOptions: {
    gap: 16,
  },
  authButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
    position: 'relative',
  },
  authButtonSecondary: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
    position: 'relative',
  },
  authButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 24,
  },
  authIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  authIconSecondary: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(0, 150, 136, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  authText: {
    flex: 1,
  },
  authTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 6,
  },
  authTitleSecondary: {
    fontSize: 20,
    fontWeight: '600',
    color: theme.colors.primary,
    marginBottom: 6,
  },
  authDescription: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.8)',
    lineHeight: 22,
  },
  authDescriptionSecondary: {
    fontSize: 15,
    color: theme.colors.textSecondary,
    lineHeight: 22,
  },
  buttonEmoji: {
    position: 'absolute',
    top: -8,
    right: -8,
    fontSize: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 12,
    padding: 4,
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  buttonEmojiSecondary: {
    position: 'absolute',
    top: -8,
    right: -8,
    fontSize: 24,
    backgroundColor: theme.colors.primary,
    borderRadius: 12,
    padding: 4,
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  bottomDecorations: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 30,
    marginTop: 30,
  },
  bottomEmoji: {
    fontSize: 32,
    opacity: 0.6,
  },
});

export default AuthOptionsScreen;
