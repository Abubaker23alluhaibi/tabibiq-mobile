import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { theme } from '../utils/theme';
import { advertisementsAPI, Advertisement } from '../services/advertisementsAPI';

// تم نقل واجهة Advertisement إلى advertisementsAPI.ts

interface AdvertisementSliderProps {
  target?: 'users' | 'doctors' | 'both';
  style?: any;
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const AdvertisementSlider: React.FC<AdvertisementSliderProps> = ({ 
  target = 'both',
  style 
}) => {
  const { t } = useTranslation();
  const [advertisements, setAdvertisements] = useState<Advertisement[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    fetchAdvertisements();
    
    // التمرير التلقائي كل 5 ثواني
    intervalRef.current = setInterval(() => {
      setCurrentIndex(prevIndex => 
        prevIndex === advertisements.length - 1 ? 0 : prevIndex + 1
      );
    }, 5000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [target, advertisements.length]);

  const fetchAdvertisements = async () => {
    try {
      setLoading(true);
      setError('');
      
      let advertisements: Advertisement[] = [];
      
      if (target === 'both') {
        // للدكتور: جرب إعلانات الأطباء أولاً، ثم إعلانات عامة
        try {
          advertisements = await advertisementsAPI.getAdvertisements('doctors');
        } catch (err) {
          // إذا فشل، جرب إعلانات المستخدمين
          advertisements = await advertisementsAPI.getAdvertisements('users');
        }
      } else {
        advertisements = await advertisementsAPI.getAdvertisements(target);
      }
      
      // ترتيب الإعلانات حسب الأولوية
      advertisements = advertisementsAPI.sortAdvertisementsByPriority(advertisements);
      
      // تصفية الإعلانات الصالحة فقط
      advertisements = advertisements.filter(ad => advertisementsAPI.isAdvertisementValid(ad));
      
      setAdvertisements(advertisements);
      
      // تحديث إحصائيات المشاهدة
      advertisements.forEach(ad => {
        advertisementsAPI.trackView(ad._id);
      });
      
    } catch (err: any) {
      setError(err.message || 'خطأ في الاتصال بالخادم');
    } finally {
      setLoading(false);
    }
  };

  const updateStats = async (adId: string, action: 'view' | 'click') => {
    try {
      if (action === 'view') {
        await advertisementsAPI.trackView(adId);
      } else if (action === 'click') {
        await advertisementsAPI.trackClick(adId);
      }
    } catch (err) {
      // تجاهل أخطاء الإحصائيات
    }
  };

  const handleAdClick = (advertisement: Advertisement) => {
    updateStats(advertisement._id, 'click');
    // يمكن إضافة منطق إضافي هنا مثل فتح الرابط
    if (advertisement.link) {
      // فتح الرابط في المتصفح أو التطبيق
    }
  };

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
    // إعادة تعيين المؤقت
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = setInterval(() => {
        setCurrentIndex(prevIndex => 
          prevIndex === advertisements.length - 1 ? 0 : prevIndex + 1
        );
      }, 5000);
    }
  };

  const goToPrevious = () => {
    setCurrentIndex(prevIndex => 
      prevIndex === 0 ? advertisements.length - 1 : prevIndex - 1
    );
  };

  const goToNext = () => {
    setCurrentIndex(prevIndex => 
      prevIndex === advertisements.length - 1 ? 0 : prevIndex + 1
    );
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, style]}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>{t('advertisements.loading')}</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.errorContainer, style]}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  if (advertisements.length === 0) {
    // إذا لم توجد إعلانات، لا تظهر أي شيء - مطابق للموقع
    return null;
  }

  return (
    <View style={[styles.container, style]}>
      {/* الإعلان الحالي */}
      <TouchableOpacity
        style={styles.adContainer}
        onPress={() => handleAdClick(advertisements[currentIndex])}
        activeOpacity={0.9}
      >
                 <Image
           source={{ uri: advertisements[currentIndex]?.image }}
           style={styles.adImage}
           resizeMode="contain"
           onError={() => {
             // يمكن إضافة صورة افتراضية هنا
           }}
         />
        
        {/* معلومات الإعلان */}
        <View style={styles.adInfo}>
          <Text style={styles.adTitle} numberOfLines={1}>
            {advertisements[currentIndex]?.title || 'عنوان الإعلان'}
          </Text>
          <Text style={styles.adDescription} numberOfLines={2}>
            {advertisements[currentIndex]?.description || 'وصف الإعلان'}
          </Text>
        </View>
      </TouchableOpacity>

      {/* أزرار التنقل */}
      {advertisements.length > 1 && (
        <>
          <TouchableOpacity
            style={styles.navButton}
            onPress={goToPrevious}
            activeOpacity={0.7}
          >
            <Text style={styles.navButtonText}>‹</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.navButton, styles.navButtonRight]}
            onPress={goToNext}
            activeOpacity={0.7}
          >
            <Text style={styles.navButtonText}>›</Text>
          </TouchableOpacity>
        </>
      )}

      {/* مؤشرات الشرائح */}
      {advertisements.length > 1 && (
        <View style={styles.indicatorsContainer}>
          {advertisements.map((_, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.indicator,
                index === currentIndex && styles.indicatorActive
              ]}
              onPress={() => goToSlide(index)}
              activeOpacity={0.7}
            />
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    width: '100%',
    height: Math.min(screenHeight * 0.25, 180), // ارتفاع نسبي للشاشة مع حد أقصى
    marginVertical: 8,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: theme.colors.background, // استخدام نفس لون خلفية الشاشة الرئيسية
    elevation: 0, // إزالة الظل
    shadowColor: 'transparent', // إزالة الظل
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
  },
  loadingContainer: {
    height: Math.min(screenHeight * 0.25, 180),
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background, // استخدام نفس لون خلفية الشاشة الرئيسية
    borderRadius: 16,
    marginVertical: 8,
  },
  loadingText: {
    marginTop: 8,
    fontSize: 14,
    color: theme.colors.textSecondary, // استخدام لون النص الثانوي من الثيم
    textAlign: 'center',
    fontWeight: '500',
  },
  errorContainer: {
    height: Math.min(screenHeight * 0.25, 180),
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background, // استخدام نفس لون خلفية الشاشة الرئيسية
    borderRadius: 16,
    marginVertical: 8,
    paddingHorizontal: 16,
  },
  errorText: {
    fontSize: 14,
    color: theme.colors.error, // استخدام لون الخطأ من الثيم
    textAlign: 'center',
    fontWeight: '500',
  },
  adContainer: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  adImage: {
    width: '100%',
    height: '100%',
    backgroundColor: theme.colors.background, // استخدام نفس لون خلفية الشاشة الرئيسية
    alignSelf: 'center', // توسيط الصورة
  },
  adInfo: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    paddingBottom: 20,
  },
  adTitle: {
    color: 'white',
    fontSize: Math.max(screenWidth * 0.04, 16), // حجم نسبي للشاشة
    fontWeight: 'bold',
    marginBottom: 6,
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  adDescription: {
    color: 'white',
    fontSize: Math.max(screenWidth * 0.035, 14), // حجم نسبي للشاشة
    opacity: 0.95,
    textAlign: 'center',
    lineHeight: 18,
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  navButton: {
    position: 'absolute',
    left: 8,
    top: '50%',
    transform: [{ translateY: -20 }],
    backgroundColor: 'rgba(0,0,0,0.6)',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
  },
  navButtonRight: {
    left: undefined,
    right: 8,
  },
  navButtonText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  indicatorsContainer: {
    position: 'absolute',
    bottom: 8,
    left: '50%',
    transform: [{ translateX: -50 }],
    flexDirection: 'row',
    gap: 6,
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.6)',
  },
  indicatorActive: {
    backgroundColor: 'white',
    width: 20, // مؤشر أوسع للشريحة النشطة
  },
});

export default AdvertisementSlider;
