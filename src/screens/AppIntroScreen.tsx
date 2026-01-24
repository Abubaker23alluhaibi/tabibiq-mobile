import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Dimensions,
  StatusBar,
  Animated,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../utils/theme';

const { width, height } = Dimensions.get('window');

const AppIntroScreen = () => {
  const navigation = useNavigation();
  const { t } = useTranslation();
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollX = useRef(new Animated.Value(0)).current;
  const slidesRef = useRef(null);

  const features = [
    {
      id: '1',
      icon: 'shield-checkmark', // Ionicons name
      title: t('landing.features.security') || 'أمان عالي',
      description: t('landing.features.security_desc') || 'بياناتك مشفرة ومحمية بأحدث التقنيات العالمية لضمان الخصوصية.',
    },
    {
      id: '2',
      icon: 'flash',
      title: t('landing.features.speed') || 'سرعة في الحجز',
      description: t('landing.features.speed_desc') || 'احجز موعدك مع طبيبك المفضل في ثوانٍ معدودة وبدون انتظار.',
    },
    {
      id: '3',
      icon: 'people',
      title: t('landing.features.doctors') || 'نخبة الأطباء',
      description: t('landing.features.doctors_desc') || 'مجموعة مختارة من أفضل الأطباء والاستشاريين في كافة التخصصات.',
    },
    {
      id: '4',
      icon: 'phone-portrait',
      title: t('landing.features.ease') || 'سهولة الاستخدام',
      description: t('landing.features.ease_desc') || 'واجهة مستخدم بسيطة وسهلة تناسب جميع الأعمار.',
    },
  ];

  const viewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems && viewableItems.length > 0) {
      setCurrentIndex(viewableItems[0].index);
    }
  }).current;

  const viewConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

  const scrollToNext = () => {
    if (currentIndex < features.length - 1) {
      // @ts-ignore
      slidesRef.current?.scrollToIndex({ index: currentIndex + 1 });
    } else {
      navigation.navigate('AuthOptionsScreen' as never);
    }
  };

  const skip = () => {
    navigation.navigate('Login' as never);
  };

  const renderItem = ({ item }: any) => {
    return (
      <View style={styles.slide}>
        <View style={styles.iconContainer}>
          <Ionicons name={item.icon} size={100} color={theme.colors.primary} />
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.title}>{item.title}</Text>
          <Text style={styles.description}>{item.description}</Text>
        </View>
      </View>
    );
  };

  const Paginator = ({ data, scrollX }: any) => {
    return (
      <View style={styles.paginatorContainer}>
        {data.map((_: any, i: number) => {
          const inputRange = [(i - 1) * width, i * width, (i + 1) * width];
          const dotWidth = scrollX.interpolate({
            inputRange,
            outputRange: [10, 20, 10],
            extrapolate: 'clamp',
          });
          const opacity = scrollX.interpolate({
            inputRange,
            outputRange: [0.3, 1, 0.3],
            extrapolate: 'clamp',
          });

          return (
            <Animated.View
              key={i.toString()}
              style={[styles.dot, { width: dotWidth, opacity }]}
            />
          );
        })}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* Skip Button */}
      <View style={styles.header}>
        <TouchableOpacity onPress={skip} style={styles.skipButton}>
          <Text style={styles.skipText}>{t('intro.skip_to_login') || 'تخطي'}</Text>
        </TouchableOpacity>
      </View>

      {/* Slider */}
      <View style={{ flex: 3 }}>
        <FlatList
          ref={slidesRef}
          data={features}
          renderItem={renderItem}
          horizontal
          showsHorizontalScrollIndicator={false}
          pagingEnabled
          bounces={false}
          keyExtractor={(item) => item.id}
          onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], {
            useNativeDriver: false,
          })}
          onViewableItemsChanged={viewableItemsChanged}
          viewabilityConfig={viewConfig}
          scrollEventThrottle={32}
        />
      </View>

      {/* Bottom Section */}
      <View style={styles.footer}>
        <Paginator data={features} scrollX={scrollX} />

        <TouchableOpacity style={styles.nextButton} onPress={scrollToNext}>
          <Text style={styles.nextButtonText}>
            {currentIndex === features.length - 1 ? (t('intro.start') || 'ابدأ ') : (t('intro.next') || 'التالي')}
          </Text>
          <Ionicons 
            name={currentIndex === features.length - 1 ? "checkmark" : "arrow-forward"} 
            size={20} 
            color="#fff" 
            style={{marginLeft: 8}}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    width: '100%',
    height: 60,
    marginTop: 40,
    paddingHorizontal: 20,
    justifyContent: 'center',
    alignItems: 'flex-end', // زر التخطي على اليمين (أو اليسار حسب اللغة)
  },
  skipButton: {
    padding: 10,
  },
  skipText: {
    color: theme.colors.textSecondary || '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  slide: {
    width: width,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  iconContainer: {
    flex: 0.6,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
    width: 200,
    height: 200,
    backgroundColor: theme.colors.primary + '10', // لون شفافjjj خفيف جداً
    borderRadius: 100,
  },
  textContainer: {
    flex: 0.4,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: theme.colors.primary,
    marginBottom: 16,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    fontWeight: '400',
    color: theme.colors.textSecondary || '#666',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 10,
  },
  footer: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 50,
    width: '100%',
  },
  paginatorContainer: {
    flexDirection: 'row',
    height: 64,
  },
  dot: {
    height: 10,
    borderRadius: 5,
    backgroundColor: theme.colors.primary,
    marginHorizontal: 8,
  },
  nextButton: {
    backgroundColor: theme.colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '80%',
    paddingVertical: 16,
    borderRadius: 30,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  nextButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default AppIntroScreen;