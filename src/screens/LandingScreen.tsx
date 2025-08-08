import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
  StatusBar,
  ImageBackground,
} from 'react-native';
import CSSScrollView from '../components/web/CSSScrollView';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../utils/theme';
import { isRTL } from '../locales';

const { width, height } = Dimensions.get('window');

const LandingScreen = () => {
  const navigation = useNavigation();
  const { t, i18n } = useTranslation();

  const navigateToLogin = () => {
    navigation.navigate('Login' as never);
  };

  const navigateToSignUp = () => {
    navigation.navigate('UserSignUp' as never);
  };

  return (
    <ImageBackground
      source={require('../../assets/background-landing.png')}
      style={styles.mainContainer}
      resizeMode="cover"
    >
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      {/* Header */}
      <LinearGradient
        colors={['rgba(0, 150, 136, 0.1)', 'rgba(0, 150, 136, 0.9)']}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <View style={styles.logoContainer}>
            <Image 
              source={require('../../assets/icon.png')} 
              style={styles.logoImage}
              resizeMode="contain"
            />
            <View style={styles.logoText}>
              <Text style={styles.logoTitle}>TabibiQ</Text>
              <Text style={styles.logoSubtitle}>منصة طبيب العراق</Text>
            </View>
          </View>
          
          <TouchableOpacity style={styles.languageButton}>
            <Ionicons name="language" size={20} color={theme.colors.primary} />
            <Text style={styles.languageText}>
              {i18n.language === 'ar' ? 'العربية' : i18n.language === 'en' ? 'English' : 'کوردی'}
            </Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Main Content */}
      <CSSScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Hero Section - مطابق للواجهة الأمامية */}
        <View style={styles.heroSection}>
          <View style={styles.heroContainer}>
            <View style={styles.heroContent}>
              <Text style={styles.heroTitle}>
                منصة طبيب العراق <Text style={styles.highlight}>الرائدة</Text>
              </Text>
              <Text style={styles.heroSubtitle}>
                منصة طبية متكاملة تصل المرضى بأفضل الأطباء في العراق
              </Text>
              
              {/* Stats - مطابق للواجهة الأمامية */}
              <View style={styles.heroStats}>
                <View style={styles.stat}>
                  <Text style={styles.statNumber}>500+</Text>
                  <Text style={styles.statLabel}>طبيب</Text>
                </View>
                <View style={styles.stat}>
                  <Text style={styles.statNumber}>10K+</Text>
                  <Text style={styles.statLabel}>مريض</Text>
                </View>
                <View style={styles.stat}>
                  <Text style={styles.statNumber}>50K+</Text>
                  <Text style={styles.statLabel}>موعد</Text>
                </View>
              </View>
              
              {/* Buttons - مطابق للواجهة الأمامية */}
              <View style={styles.heroButtons}>
                <TouchableOpacity style={styles.ctaBtnPrimary} onPress={navigateToSignUp}>
                  <Text style={styles.ctaBtnText}>ابدأ الآن</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.ctaBtnSecondary} onPress={navigateToLogin}>
                  <Text style={styles.ctaBtnSecondaryText}>تسجيل الدخول</Text>
                </TouchableOpacity>
              </View>
            </View>
            
            {/* Hero Image */}
            <View style={styles.heroImage}>
              <View style={styles.heroLogo}>
                <Ionicons name="medical" size={80} color="#FFD700" />
              </View>
            </View>
          </View>
        </View>

        {/* About Section - مطابق للواجهة الأمامية */}
        <View style={styles.aboutSection}>
          <View style={styles.container}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>من نحن</Text>
              <Text style={styles.sectionSubtitle}>
                منصة طبية رائدة تهدف إلى تسهيل الوصول للرعاية الصحية
              </Text>
            </View>
            
            <View style={styles.aboutContent}>
              <Text style={styles.aboutMainTitle}>منصة طبيب العراق</Text>
              <Text style={styles.aboutDescription}>
                منصة طبية متكاملة تصل المرضى بأفضل الأطباء في العراق، 
                توفر خدمات الحجز الإلكتروني والاستشارات الطبية بسهولة وأمان.
              </Text>
              
              {/* Features Grid - مطابق للواجهة الأمامية */}
              <View style={styles.featuresGrid}>
                <View style={styles.feature}>
                  <Text style={styles.featureIcon}>🔒</Text>
                  <Text style={styles.featureTitle}>أمان تام</Text>
                  <Text style={styles.featureDescription}>
                    بياناتك محمية ومشفرة بأحدث التقنيات
                  </Text>
                </View>
                
                <View style={styles.feature}>
                  <Text style={styles.featureIcon}>⚡</Text>
                  <Text style={styles.featureTitle}>سرعة في الحجز</Text>
                  <Text style={styles.featureDescription}>
                    احجز موعدك في أقل من دقيقة
                  </Text>
                </View>
                
                <View style={styles.feature}>
                  <Text style={styles.featureIcon}>👨‍⚕️</Text>
                  <Text style={styles.featureTitle}>أطباء معتمدون</Text>
                  <Text style={styles.featureDescription}>
                    جميع الأطباء مراجعون ومعتمدون
                  </Text>
                </View>
                
                <View style={styles.feature}>
                  <Text style={styles.featureIcon}>📱</Text>
                  <Text style={styles.featureTitle}>سهولة الاستخدام</Text>
                  <Text style={styles.featureDescription}>
                    واجهة بسيطة وسهلة للجميع
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* How to Use Section - مطابق للواجهة الأمامية */}
        <View style={styles.howToUseSection}>
          <View style={styles.container}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>كيفية الاستخدام</Text>
              <Text style={styles.sectionSubtitle}>
                خطوات بسيطة للحصول على الرعاية الصحية
              </Text>
            </View>
            
            <View style={styles.stepsContainer}>
              <View style={styles.step}>
                <View style={styles.stepNumber}>1</View>
                <Text style={styles.stepIcon}>🔍</Text>
                <Text style={styles.stepTitle}>ابحث عن طبيب</Text>
                <Text style={styles.stepDescription}>
                  ابحث عن أفضل الأطباء في منطقتك حسب التخصص
                </Text>
              </View>
              
              <View style={styles.step}>
                <View style={styles.stepNumber}>2</View>
                <Text style={styles.stepIcon}>📅</Text>
                <Text style={styles.stepTitle}>احجز موعدك</Text>
                <Text style={styles.stepDescription}>
                  اختر الوقت المناسب واحجز موعدك بسهولة
                </Text>
              </View>
              
              <View style={styles.step}>
                <View style={styles.stepNumber}>3</View>
                <Text style={styles.stepIcon}>✅</Text>
                <Text style={styles.stepTitle}>تأكيد الموعد</Text>
                <Text style={styles.stepDescription}>
                  احصل على تأكيد فوري وذكريات للموعد
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* CTA Section */}
        <View style={styles.ctaSection}>
          <View style={styles.container}>
            <Text style={styles.ctaTitle}>ابدأ رحلتك الصحية اليوم</Text>
            <Text style={styles.ctaSubtitle}>
              انضم إلى آلاف المرضى والأطباء الذين يثقون بنا
            </Text>
            
            <View style={styles.ctaButtons}>
              <TouchableOpacity style={styles.ctaBtnPrimary} onPress={navigateToSignUp}>
                <Text style={styles.ctaBtnText}>ابدأ الآن</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.ctaBtnSecondary} onPress={navigateToLogin}>
                <Text style={styles.ctaBtnSecondaryText}>تسجيل الدخول</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Additional Content for Scrolling */}
        <View style={styles.additionalSection}>
          <View style={styles.container}>
            <Text style={styles.sectionTitle}>مميزات إضافية</Text>
            <Text style={styles.sectionSubtitle}>
              اكتشف المزيد من الخدمات المتاحة
            </Text>
            
            <View style={styles.additionalFeatures}>
              <View style={styles.additionalFeature}>
                <Text style={styles.featureIcon}>💊</Text>
                <Text style={styles.featureTitle}>تذكير الأدوية</Text>
                <Text style={styles.featureDescription}>
                  احصل على تذكيرات منتظمة لأدويتك
                </Text>
              </View>
              
              <View style={styles.additionalFeature}>
                <Text style={styles.featureIcon}>📋</Text>
                <Text style={styles.featureTitle}>السجل الطبي</Text>
                <Text style={styles.featureDescription}>
                  احتفظ بسجل طبي شامل وآمن
                </Text>
              </View>
              
              <View style={styles.additionalFeature}>
                <Text style={styles.featureIcon}>🏥</Text>
                <Text style={styles.featureTitle}>المراكز الصحية</Text>
                <Text style={styles.featureDescription}>
                  اكتشف أفضل المراكز الصحية القريبة
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Footer Section */}
        <View style={styles.footerSection}>
          <View style={styles.container}>
            <Text style={styles.footerTitle}>TabibiQ - منصة طبيب العراق</Text>
            <Text style={styles.footerSubtitle}>
              نحن هنا لخدمتك وضمان صحتك
            </Text>
          </View>
        </View>
              </CSSScrollView>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#F5F5F5',
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
  logoImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 12,
  },
  logoText: {
    flexDirection: 'column',
  },
  logoTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  logoSubtitle: {
    fontSize: 16,
    color: 'rgba(0, 150, 136, 0.8)',
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
    color: theme.colors.primary,
    marginLeft: 4,
    fontSize: 14,
  },
  content: {
    flex: 1,
    paddingBottom: 100, // إضافة مساحة في الأسفل للتمرير
  },
  heroSection: {
    minHeight: height * 0.8,
    paddingTop: 60,
    paddingBottom: 40,
  },
  heroContainer: {
    flex: 1,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  heroContent: {
    flex: 1,
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 16,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 3, height: 3 },
    textShadowRadius: 6,
  },
  highlight: {
    color: '#FFD700',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  },
  heroSubtitle: {
    fontSize: 18,
    color: '#FFFFFF',
    marginBottom: 24,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
    fontWeight: '500',
  },
  heroStats: {
    flexDirection: 'row',
    marginBottom: 32,
    gap: 24,
  },
  stat: {
    alignItems: 'flex-start',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  statLabel: {
    fontSize: 14,
    color: '#FFFFFF',
    marginTop: 4,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  heroButtons: {
    flexDirection: 'row',
    gap: 16,
  },
  ctaBtnPrimary: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 25,
    shadowColor: theme.colors.primary,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  ctaBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  },
  ctaBtnSecondary: {
    backgroundColor: 'transparent',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  ctaBtnSecondaryText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  },
  heroImage: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroLogo: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  aboutSection: {
    paddingVertical: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
  },
  howToUseSection: {
    paddingVertical: 60,
    backgroundColor: 'rgba(248, 249, 250, 0.8)',
  },
  container: {
    paddingHorizontal: 20,
  },
  sectionHeader: {
    alignItems: 'center',
    marginBottom: 40,
  },
  sectionTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
    marginBottom: 12,
  },
  sectionSubtitle: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  aboutContent: {
    alignItems: 'center',
  },
  aboutMainTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
    marginBottom: 16,
  },
  aboutDescription: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  feature: {
    width: '48%',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  featureIcon: {
    fontSize: 32,
    marginBottom: 12,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    textAlign: 'center',
    marginBottom: 8,
  },
  featureDescription: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 16,
  },
  stepsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  step: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  stepNumber: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.primary,
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    lineHeight: 40,
    marginBottom: 12,
  },
  stepIcon: {
    fontSize: 32,
    marginBottom: 12,
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    textAlign: 'center',
    marginBottom: 8,
  },
  stepDescription: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 16,
  },
  ctaSection: {
    paddingVertical: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    alignItems: 'center',
  },
  ctaTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
    textAlign: 'center',
    marginBottom: 16,
  },
  ctaSubtitle: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  ctaButtons: {
    flexDirection: 'row',
    gap: 16,
  },
  additionalSection: {
    paddingVertical: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  additionalFeatures: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 30,
  },
  additionalFeature: {
    width: '30%',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  footerSection: {
    paddingVertical: 40,
    backgroundColor: 'rgba(0, 150, 136, 0.9)',
    alignItems: 'center',
  },
  footerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
  },
  footerSubtitle: {
    fontSize: 16,
    color: '#FFFFFF',
    textAlign: 'center',
    opacity: 0.9,
  },
});

export default LandingScreen; 