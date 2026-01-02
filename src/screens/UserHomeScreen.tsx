import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
  Image,
  Dimensions,
  StatusBar,
  RefreshControl,
  Alert,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../utils/theme';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../contexts/NotificationContext';
import { API_CONFIG } from '../config/api';
import StarRating from '../components/StarRating';
import { getTodayLocalizedDayName } from '../utils/dateUtils';
import {
  mapSpecialtyToLocalized,
  getArabicSpecialties,
  mapProvinceToLocalized,
} from '../utils/specialtyMapper';
import {
  PROVINCES,
  SPECIALTIES,
  SPECIALTY_CATEGORIES,
  getAllCategories,
  getAllSubSpecialties,
} from '../utils/constants';
import i18n from '../locales/index';
import { formatNumber, formatPrice } from '../utils/constants';
import AdvertisementSlider from '../components/AdvertisementSlider';
import { getResponsiveSearchBarStyles } from '../utils/searchBarStyles';
import { logger, logError, logWarn, logInfo, logDebug, logUserAction, logApiCall, logApiResponse } from '../utils/logger';

// بيانات احتياطية في حالة فشل الترجمة
const FALLBACK_PROVINCES = [
  'بغداد',
  'البصرة',
  'أربيل',
  'السليمانية',
  'كركوك',
  'النجف',
  'كربلاء',
  'الديوانية',
  'العمارة',
];

const FALLBACK_SPECIALTIES = [
  'طب عام',
  'طب القلب',
  'طب الأطفال',
  'طب العظام',
  'طب الأعصاب',
  'طب الجلد',
  'طب العيون',
  'طب الأسنان',
  'طب النفس',
  'طب النساء',
  'طب المسالك البولية',
  'طب الجهاز الهضمي',
  'طب الغدد الصماء',
  'طب الأورام',
  'طب الروماتيزم',
  'طب الصدر',
  'طب الكلى',
  'طب الدم',
  'طب المناعة',
  'الأمراض المعدية',
  'طب الطوارئ',
  'طب الأسرة',
  'طب الباطنة',
  'الجراحة العامة',
  'جراحة التجميل',
  'جراحة الأعصاب',
  'جراحة القلب والصدر',
  'جراحة الأوعية الدموية',
  'جراحة العظام',
  'جراحة الأطفال',
  'جراحة المسالك البولية',
  'جراحة النساء',
  'جراحة الفم والوجه والفكين',
  'التخدير',
  'الأشعة',
  'علم الأمراض',
  'طب المختبرات',
  'الطب النووي',
  'طب التأهيل',
  'طب الرياضة',
  'طب العمل',
  'طب الوقاية',
  'طب المسنين',
  'الرعاية التلطيفية',
];

const { width, height } = Dimensions.get('window');
const GRID_CARD_WIDTH = Math.floor((width - 40 - 24) / 2); // paddingHorizontal 20 + مسافة بين الأعمدة ~24

// تعريف نوع البيانات للطبيب
interface Doctor {
  id: string;
  name: string;
  specialty: string;
  province: string;
  area: string;
  rating: number;
  reviews_count?: number;
  experience: string;
  image: string | null;
  available: boolean;
  about?: string;
  clinicLocation?: string;
  phone?: string;
  email?: string;
  isFeatured?: boolean;
  status?: string;
  work_times?: any[];
}

const UserHomeScreen = () => {
  const navigation = useNavigation();
  const { t } = useTranslation();
  const { user, profile, signOut } = useAuth();
  const {
    notifications,
    scheduledNotifications,
    isNotificationEnabled,
    registerForNotifications,
    sendNotification,
  } = useNotifications();

  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProvince, setSelectedProvince] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [provinces, setProvinces] = useState<string[]>(PROVINCES);
  const [specialties, setSpecialties] = useState<string[]>(SPECIALTIES);
  const [showAllRecommended, setShowAllRecommended] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  // قوائم محسوبة للاستخدام في الواجهة
  const computedProvinces =
    provinces && provinces.length > 0 ? provinces : PROVINCES;
  const computedSpecialties =
    specialties && specialties.length > 0 ? specialties : SPECIALTIES;



  // دالة مساعدة لتحميل خيارات الفلتر
  const loadFilterOptions = () => {
    try {
      logDebug('بدء تحميل خيارات الفلتر');
      logDebug('PROVINCES من constants', { count: PROVINCES.length, type: 'محافظة' });
      logDebug('SPECIALTIES من constants', { count: SPECIALTIES.length, type: 'تخصص' });

      // استخدام القيم الثابتة كأولوية
      let provincesData = [...PROVINCES];
      let specialtiesData = [...SPECIALTIES];

      // محاولة تحميل من الترجمة إذا كانت متاحة
      try {
        // محاولة تحميل المحافظات من الترجمة
        let translationProvinces: string[] = [];
        try {
          const provincesFromTranslation = t('provinces', {
            returnObjects: true,
          });
          if (
            Array.isArray(provincesFromTranslation) &&
            provincesFromTranslation.length > 0
          ) {
            // التأكد من أن جميع العناصر هي نصوص
            const validProvinces = provincesFromTranslation.filter(
              item => typeof item === 'string'
            ) as string[];
            if (validProvinces.length > 0) {
              translationProvinces = validProvinces;
              logDebug('تم تحميل المحافظات من الترجمة', { 
                count: translationProvinces.length, 
                type: 'محافظة' 
              });
            }
          }
        } catch (e) {
          logWarn('فشل في تحميل المحافظات من الترجمة، استخدام القيم الثابتة');
        }

        // محاولة تحميل التخصصات من الترجمة
        let translationSpecialties: string[] = [];
        try {
          const specialtiesFromTranslation = t('specialties_list', {
            returnObjects: true,
          });
          if (
            Array.isArray(specialtiesFromTranslation) &&
            specialtiesFromTranslation.length > 0
          ) {
            // التأكد من أن جميع العناصر هي نصوص
            const validSpecialties = specialtiesFromTranslation.filter(
              item => typeof item === 'string'
            ) as string[];
            if (validSpecialties.length > 0) {
              translationSpecialties = validSpecialties;
          logDebug('تم تحميل التخصصات من الترجمة', { 
            count: translationSpecialties.length, 
            type: 'تخصص' 
          });
            }
          }
        } catch (e) {
          logWarn('فشل في تحميل التخصصات من الترجمة، استخدام القيم الثابتة');
        }

        // استخدام الترجمة إذا كانت متاحة وصحيحة
        if (translationProvinces.length > 0) {
          provincesData = translationProvinces;
        } else {
          logDebug('استخدام المحافظات الثابتة', { 
            count: provincesData.length, 
            type: 'محافظة' 
          });
        }

        if (translationSpecialties.length > 0) {
          specialtiesData = translationSpecialties;
        } else {
          logDebug('استخدام التخصصات الثابتة', { 
            count: specialtiesData.length, 
            type: 'تخصص' 
          });
        }
      } catch (translationError) {
        logWarn('فشل في تحميل الترجمة، استخدام القيم الثابتة');
      }

      // التأكد من أن البيانات صحيحة
      if (!Array.isArray(provincesData) || provincesData.length === 0) {
        logWarn('بيانات المحافظات غير صحيحة، استخدام القيم الثابتة');
        provincesData = [...PROVINCES];
      }

      if (!Array.isArray(specialtiesData) || specialtiesData.length === 0) {
        logWarn('بيانات التخصصات غير صحيحة، استخدام القيم الثابتة');
        specialtiesData = [...SPECIALTIES];
      }

      logDebug('بيانات المحافظات النهائية', { provinces: provincesData });
      logDebug('بيانات التخصصات النهائية', { specialties: specialtiesData });

      setProvinces(Array.from(new Set(provincesData)));
      setSpecialties(Array.from(new Set(specialtiesData)));

      // تأكيد إضافي على تحديث الحالة
      logInfo('تم تحديث الحالة', { 
        provincesCount: provincesData.length,
        specialtiesCount: specialtiesData.length
      });
    } catch (error) {
      logError('خطأ في تحميل خيارات الفلتر', error);
      // استخدام القيم الثابتة في حالة الخطأ
      logDebug('استخدام القيم الثابتة للمحافظات', { provinces: PROVINCES });
      logDebug('استخدام القيم الثابتة للتخصصات', { specialties: SPECIALTIES });

      setProvinces([...PROVINCES]);
      setSpecialties([...SPECIALTIES]);
    }
  };

  useEffect(() => {
    // تحميل فوري بدون تأخير
    loadFilterOptions();

    fetchDoctors();

    // تسجيل الإشعارات إذا لم تكن مفعلة
    if (!isNotificationEnabled) {
      registerForNotifications();
    }
  }, [t]); // إضافة t كتبعية

  const fetchDoctors = async () => {
    setLoading(true);
    try {
      logDebug('جلب الأطباء من قاعدة البيانات');
      logApiCall('/doctors', 'GET');

      // جلب الأطباء من API الحقيقي
      const response = await fetch(`${API_CONFIG.BASE_URL}/doctors`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const doctorsData = await response.json();
      logApiResponse('/doctors', response.status);

      // إضافة logging مفصل لبيانات الأطباء
      logDebug('عينة من بيانات الأطباء', { sample: doctorsData.slice(0, 2) });

      // معالجة البيانات لتتناسب مع التطبيق وتصفية الأطباء المعطلين
      const processedDoctors = doctorsData
        .filter((doctor: any) => {
          // تصفية الأطباء - إظهار الأطباء المعتمدين والمفعلين وغير المعطلين فقط
          const isApproved = doctor.status === 'approved';
          const isActive = doctor.active !== false && doctor.active !== 'false';
          const isNotDeleted = !doctor.deleted && doctor.deleted !== true;
          const isNotDisabled = !doctor.disabled; // إضافة فلترة الأطباء المعطلين
          
          logDebug(`فحص حالة الطبيب ${doctor.name}`, {
            id: doctor._id || doctor.id,
            status: doctor.status,
            active: doctor.active,
            deleted: doctor.deleted,
            disabled: doctor.disabled,
            isApproved,
            isActive,
            isNotDeleted,
            isNotDisabled,
            willShow: isApproved && isActive && isNotDeleted && isNotDisabled
          });

          return isApproved && isActive && isNotDeleted && isNotDisabled;
        })
        .map((doctor: any, index: number) => {
          // إضافة logging مفصل للصور
          logDebug(`معالجة الطبيب ${index + 1}`, {
            id: doctor._id || doctor.id,
            name: doctor.name,
            specialty: doctor.specialty,
            originalSpecialty: doctor.specialty,
            category_ar: doctor.category_ar,
            category: doctor.category,
            imageUrl: doctor.imageUrl,
            profile_image: doctor.profile_image,
            profileImage: doctor.profileImage,
            image: doctor.image,
          });

          // تحسين استخراج التخصص باستخدام الدالة الجديدة
          let specialty = mapSpecialtyToLocalized(
            doctor.specialty || doctor.category_ar || doctor.category
          );

          const processedDoctor: Doctor = {
            id: doctor._id || doctor.id,
            name: doctor.name || t('common.unknown_doctor'),
            specialty: specialty,
            province: doctor.province || t('common.not_specified'),
            area: doctor.area || t('common.not_specified'),
            rating: doctor.rating || 0,
            experience: doctor.experienceYears
              ? `${doctor.experienceYears} ${t('common.years')}`
              : t('common.not_specified'),
            image: getImageUrl(
              doctor.imageUrl ||
                doctor.profile_image ||
                doctor.profileImage ||
                doctor.image
            ),
            available: doctor.status === 'approved' && doctor.active !== false,
            about: doctor.about || '',
            clinicLocation: doctor.clinicLocation || '',
            phone: doctor.phone || '',
            email: doctor.email || '',
            isFeatured: !!(doctor.isFeatured || doctor.is_featured),
            status: doctor.status || 'pending',
          };

          logDebug(`الطبيب ${index + 1} بعد المعالجة`, {
            name: processedDoctor.name,
            specialty: processedDoctor.specialty,
            finalImage: processedDoctor.image,
            available: processedDoctor.available,
          });

          return processedDoctor;
        });


      // ترتيب بإبراز الأطباء المميزين أولاً ثم عشوائي للباقي
      const featured = (processedDoctors as Doctor[]).filter(
        d => (d as any).isFeatured === true
      );
      const regular = (processedDoctors as Doctor[]).filter(
        d => !(d as any).isFeatured
      );
      const shuffledRegular = shuffleArray<Doctor>(regular);
      
      // تحديد عدد الأطباء المطلوب عرضهم (10 أطباء)
      const maxDoctorsToShow = 10;
      
      // إضافة الأطباء المميزين أولاً
      let finalDoctors = [...featured];
      
      // إضافة باقي الأطباء العاديين حتى نصل للعدد المطلوب
      if (finalDoctors.length < maxDoctorsToShow) {
        const remainingSlots = maxDoctorsToShow - finalDoctors.length;
        const regularToAdd = shuffledRegular.slice(0, remainingSlots);
        finalDoctors = [...finalDoctors, ...regularToAdd];
      }
      
      // إذا كان عدد الأطباء المميزين أكثر من 10، نعرض فقط أول 10
      if (finalDoctors.length > maxDoctorsToShow) {
        finalDoctors = finalDoctors.slice(0, maxDoctorsToShow);
      }
      
      setDoctors(finalDoctors);
    } catch (error) {
      // في حالة الخطأ، استخدم بيانات وهمية كاحتياطي
      const fallbackDoctors: Doctor[] = [
        {
          id: '1',
          name: 'د. أحمد محمد',
          specialty: 'طب القلب',
          province: 'بغداد',
          area: 'الكرادة',
          rating: 4.8,
          experience: '15 سنة',
          image:
            'https://via.placeholder.com/100x100/4CAF50/FFFFFF?text=د.أحمد',
          available: true,
        },
        {
          id: '2',
          name: 'د. فاطمة علي',
          specialty: 'طب الأطفال',
          province: 'بغداد',
          area: 'المنصور',
          rating: 4.9,
          experience: '12 سنة',
          image:
            'https://via.placeholder.com/100x100/2196F3/FFFFFF?text=د.فاطمة',
          available: true,
        },
      ];
      setDoctors(fallbackDoctors);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchDoctors();
    setRefreshing(false);
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    // تطبيق البحث
  };

  const handleFilter = (province: string, specialty: string) => {
    setSelectedProvince(province);
    setSelectedSpecialty(specialty);
    setShowFilters(false);
    // تطبيق الفلتر
  };

  // دالة خلط عشوائي للمصفوفة
  const shuffleArray = <T,>(array: T[]): T[] => {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  };

  // فلترة الأطباء حسب البحث والفلترة
  const filteredDoctors = doctors.filter(doctor => {
    const matchesSearch =
      !searchQuery ||
      doctor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doctor.specialty.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doctor.province.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doctor.area.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesProvince =
      !selectedProvince || doctor.province === selectedProvince;
    const matchesSpecialty =
      !selectedSpecialty || doctor.specialty === selectedSpecialty;

    return matchesSearch && matchesProvince && matchesSpecialty;
  });

  const handleDoctorPress = (doctor: Doctor) => {
    // التحقق من تسجيل الدخول
    if (!user) {
      Alert.alert(t('login_required.title'), t('login_required.message'), [
        {
          text: t('login_required.cancel'),
          style: 'cancel',
        },
        {
          text: t('login_required.login'),
          onPress: () => {
            (navigation as any).navigate('Login');
          },
        },
      ]);
      return;
    }

    // الانتقال لصفحة تفاصيل الطبيب
    (navigation as any).navigate('DoctorDetails', { doctorId: doctor.id });
  };

  const handleSignOut = () => {
    Alert.alert(t('auth.logout'), t('auth.logout_confirm'), [
      {
        text: t('common.cancel'),
        style: 'cancel',
      },
      {
        text: t('common.confirm'),
        onPress: signOut,
      },
    ]);
  };

  // دالة لتنسيق أيام العمل
  // دالة مساعدة لمعالجة مسار الصورة
  const getImageUrl = (imagePath: string | null | undefined): string | null => {
    if (!imagePath || imagePath === 'null' || imagePath === 'undefined') {
      return null;
    }

    try {
      // إذا كانت الصورة من Cloudinary (تبدأ بـ https://res.cloudinary.com)
      if (imagePath.startsWith('https://res.cloudinary.com')) {
        return imagePath;
      }

      // إذا كانت الصورة محلية (تبدأ بـ /uploads/)
      if (imagePath.startsWith('/uploads/')) {
        return `${API_CONFIG.BASE_URL}${imagePath}`;
      }

      // إذا كانت الصورة رابط كامل
      if (imagePath.startsWith('http')) {
        // التحقق من صحة الرابط
        try {
          new URL(imagePath);
          return imagePath;
        } catch {
          return null;
        }
      }

      // إذا كانت الصورة مسار نسبي (بدون /uploads/)
      if (
        imagePath &&
        !imagePath.startsWith('http') &&
        !imagePath.startsWith('/uploads/')
      ) {
        // تنظيف المسار من الأحرف غير المسموح بها
        const cleanPath = imagePath.replace(/^\/+/, ''); // إزالة / من البداية
        return `${API_CONFIG.BASE_URL}/${cleanPath}`;
      }

      return null;
    } catch (error) {
      return null;
    }
  };

  const getWorkingDaysText = (workTimes: any[]) => {
    if (!workTimes || workTimes.length === 0) {
      return t('doctor.working_days_not_specified');
    }

    const daysMap = {
      0: t('day_names.sunday'),
      1: t('day_names.monday'),
      2: t('day_names.tuesday'),
      3: t('day_names.wednesday'),
      4: t('day_names.thursday'),
      5: t('day_names.friday'),
      6: t('day_names.saturday'),
    };

    const availableDays = workTimes
      .filter(wt => wt.is_available)
      .map(wt => daysMap[wt.day as keyof typeof daysMap])
      .filter(day => day);

    if (availableDays.length === 0) {
      return t('doctor.not_available');
    }

    if (availableDays.length <= 3) {
      return availableDays.join('، ');
    }

    return `${availableDays.length} ${t('doctor.days')}`;
  };

  const renderDoctorCard = ({ item }: { item: Doctor }) => (
    <TouchableOpacity
      style={[styles.doctorCard, { width: GRID_CARD_WIDTH }]}
      onPress={() => handleDoctorPress(item)}
    >
      {/* Header with image and badges */}
      <View style={styles.doctorImageContainer}>
        {item.image ? (
          <Image
            source={{ uri: item.image }}
            style={styles.doctorImage}
            resizeMode="cover"
            defaultSource={require('../../assets/icon.png')}
            onError={e => {

            }}
            onLoad={() => {

            }}
          />
        ) : (
          <Image
            source={require('../../assets/icon.png')}
            style={styles.doctorImage}
            resizeMode="cover"
          />
        )}
        {(item as any).isFeatured && (
          <View style={styles.featuredBadge}>
            <Ionicons name="star" size={10} color={theme.colors.white} />
            <Text style={styles.featuredText}>{t('doctor.featured')}</Text>
          </View>
        )}
        {item.available && (
          <View style={styles.availableBadge}>
            <Text style={styles.availableText}>{t('doctor.available')}</Text>
          </View>
        )}
      </View>

      {/* Doctor Info - Compact */}
      <View style={styles.doctorInfo}>
        <Text style={styles.doctorName} numberOfLines={1}>
          {item.name}
        </Text>

        <View style={styles.specialtyContainer}>
          <Ionicons name="medical" size={12} color={theme.colors.primary} />
          <Text style={styles.doctorSpecialty} numberOfLines={1}>
            {item.specialty || t('common.not_specified')}
          </Text>
        </View>

        <View style={styles.doctorLocation}>
          <Ionicons
            name="location"
            size={10}
            color={theme.colors.textSecondary}
          />
          <Text style={styles.doctorLocationText} numberOfLines={1}>
            {mapProvinceToLocalized(item.province)}, {item.area}
          </Text>
        </View>

        {/* Rating - Compact */}
        {(item.rating && item.rating > 0) && (
          <View style={styles.doctorRating}>
            <Ionicons name="star" size={12} color="#FFD700" />
            <Text style={styles.ratingText}>{item.rating.toFixed(1)}</Text>
            {item.reviews_count && item.reviews_count > 0 && (
              <Text style={styles.ratingCount}>({item.reviews_count})</Text>
            )}
          </View>
        )}
      </View>

      {/* Book Button */}
      <View style={styles.cardActions}>
        <TouchableOpacity
          style={styles.bookButton}
          onPress={() => handleDoctorPress(item)}
        >
          <Text style={styles.bookButtonText}>
            {t('appointment.book_appointment')}
          </Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  const renderFilterModal = () => (
    <View style={styles.filterModal}>
      <View style={styles.filterHeader}>
        <Text style={styles.filterTitle}>{t('search.filters')}</Text>
        <TouchableOpacity onPress={() => setShowFilters(false)}>
          <Ionicons name="close" size={24} color={theme.colors.textPrimary} />
        </TouchableOpacity>
      </View>

      <View style={styles.filterSection}>
        <Text style={styles.filterLabel}>
          {t('search.province')} ({computedProvinces.length})
        </Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollContainer}
        >
          {computedProvinces.length === 0 && (
            <Text style={styles.emptyText}>{t('search.no_results')}</Text>
          )}
          {[
            { label: t('common.all'), value: '' },
            ...computedProvinces.map(p => ({ label: p, value: p })),
          ].map(opt => (
            <TouchableOpacity
              key={`prov-${opt.value || 'all'}`}
              style={[
                styles.filterChip,
                selectedProvince === opt.value && styles.filterChipActive,
              ]}
              onPress={() => setSelectedProvince(opt.value)}
            >
              <Text
                style={[
                  styles.filterChipText,
                  selectedProvince === opt.value && styles.filterChipTextActive,
                ]}
              >
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={styles.filterSection}>
        <Text style={styles.filterLabel}>
          {t('search.specialty')} ({computedSpecialties.length})
        </Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollContainer}
        >
          {computedSpecialties.length === 0 && (
            <Text style={styles.emptyText}>{t('search.no_results')}</Text>
          )}
          {[
            { label: t('common.all'), value: '' },
            ...computedSpecialties.map(s => ({ label: s, value: s })),
          ].map(opt => (
            <TouchableOpacity
              key={`spec-${opt.value || 'all'}`}
              style={[
                styles.filterChip,
                selectedSpecialty === opt.value && styles.filterChipActive,
              ]}
              onPress={() => setSelectedSpecialty(opt.value)}
            >
              <Text
                style={[
                  styles.filterChipText,
                  selectedSpecialty === opt.value &&
                    styles.filterChipTextActive,
                ]}
              >
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <TouchableOpacity
        style={styles.applyFilterButton}
        onPress={() => handleFilter(selectedProvince, selectedSpecialty)}
      >
        <Text style={styles.applyFilterButtonText}>
          {t('search.apply_filters')}
        </Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="light-content"
        backgroundColor={theme.colors.primary}
      />

      <View style={styles.topBar}>
        <View style={styles.headerButtons}>
          <TouchableOpacity
            style={styles.notificationButton}
            onPress={() => navigation.navigate('Notifications' as never)}
          >
            <Ionicons
              name="notifications"
              size={24}
              color={theme.colors.textPrimary}
            />
            {notifications.filter(n => !n.isRead).length > 0 && (
              <View style={styles.notificationBadge}>
                <Text style={styles.notificationBadgeText}>
                  {notifications.filter(n => !n.isRead).length > 9
                    ? '9+'
                    : notifications.filter(n => !n.isRead).length}
                </Text>
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.profileButton}
            onPress={() => navigation.navigate('UserProfile' as never)}
          >
            <Ionicons name="person" size={24} color={theme.colors.textPrimary} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* إزالة عدادات المواعيد والإشعارات وتذكيرات الأدوية */}

        {/* إعلانات للمستخدمين */}
        <AdvertisementSlider target="users" style={styles.advertisementSlider} />

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            {t('user_home.recommended_doctors')}
          </Text>
          <TouchableOpacity
            onPress={() => (navigation as any).navigate('AllDoctors')}
          >
            <Text style={styles.seeAllText}>{t('common.see_all')}</Text>
          </TouchableOpacity>
        </View>


        {/* شبكة أفقية وعمودية: نعرض صف أفقي من المقترحين، وأسفله شبكة عمودية لباقي الأطباء. عند الضغط على عرض الكل نعرض الجميع في الشبكة */}
        {true && (
          <FlatList
            data={filteredDoctors.slice(0, 6)}
            renderItem={renderDoctorCard}
            keyExtractor={item => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.doctorsList}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons
                  name="search"
                  size={64}
                  color={theme.colors.textSecondary}
                />
                <Text style={styles.emptyText}>
                  {loading ? t('common.loading') : t('user_home.no_doctors_available')}
                </Text>
              </View>
            }
          />
        )}

        {/* عرض باقي الأطباء في شبكة عمودية (إذا كان هناك أكثر من 6) */}
        {filteredDoctors.length > 6 && (
          <>
            <FlatList
              data={showAllRecommended ? filteredDoctors.slice(6) : filteredDoctors.slice(6, 10)}
              renderItem={renderDoctorCard}
              keyExtractor={item => item.id + '-grid'}
              numColumns={2}
              columnWrapperStyle={{
                justifyContent: 'space-between',
                paddingHorizontal: 20,
              }}
              scrollEnabled={false}
              contentContainerStyle={{ paddingTop: 8, paddingBottom: 20 }}
              ListEmptyComponent={null}
            />
            
            {/* زر عرض الكل */}
            {!showAllRecommended && filteredDoctors.length > 10 && (
              <TouchableOpacity
                style={styles.showAllButton}
                onPress={() => setShowAllRecommended(true)}
              >
                <Text style={styles.showAllButtonText}>
                  عرض جميع الأطباء ({filteredDoctors.length})
                </Text>
                <Ionicons name="chevron-down" size={20} color={theme.colors.primary} />
              </TouchableOpacity>
            )}
            
            {/* زر إخفاء بعض الأطباء */}
            {showAllRecommended && (
              <TouchableOpacity
                style={styles.showAllButton}
                onPress={() => setShowAllRecommended(false)}
              >
                <Text style={styles.showAllButtonText}>
                  إخفاء بعض الأطباء
                </Text>
                <Ionicons name="chevron-up" size={20} color={theme.colors.primary} />
              </TouchableOpacity>
            )}
          </>
        )}

        <View style={styles.quickActions}>
          <TouchableOpacity
            style={styles.quickAction}
            onPress={() => navigation.navigate('MyAppointments' as never)}
          >
            <View style={styles.quickActionIcon}>
              <Ionicons name="calendar" size={24} color={theme.colors.white} />
            </View>
            <Text style={styles.quickActionText}>
              {t('appointments.my_appointments')} - {getTodayLocalizedDayName(t)}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickAction}
            onPress={() => navigation.navigate('MedicineReminder' as never)}
          >
            <View style={styles.quickActionIcon}>
              <Ionicons name="medical" size={24} color={theme.colors.white} />
            </View>
            <Text style={styles.quickActionText}>
              {t('medicine_reminder.title')}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  topBar: {
    paddingTop: 34,
    paddingBottom: 12,
    paddingHorizontal: 16,
    backgroundColor: theme.colors.background,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  header: {
    paddingTop: 34,
    paddingBottom: 12,
    paddingHorizontal: 16,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  userInfo: {
    flex: 1,
  },
  welcomeText: {
    fontSize: 14,
    color: theme.colors.white + 'CC',
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.white,
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  notificationButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    position: 'relative',
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  notificationBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: theme.colors.error,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationBadgeText: {
    color: theme.colors.white,
    fontSize: 10,
    fontWeight: 'bold',
  },
  profileButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.white,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: theme.colors.textPrimary,
    marginLeft: 6,
  },
  filterButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: theme.colors.white + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  advertisementSlider: {
    marginHorizontal: 16,
    marginVertical: 10,
  },
  filterModal: {
    backgroundColor: theme.colors.white,
    padding: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  filterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  filterTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
  },
  filterSection: {
    marginBottom: 20,
  },
  filterLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    marginBottom: 12,
    paddingHorizontal: 20,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: theme.colors.background,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  filterChipActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  filterChipText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  filterChipTextActive: {
    color: theme.colors.white,
  },
  scrollContainer: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  applyFilterButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  applyFilterButtonText: {
    color: theme.colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyText: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginTop: 16,
  },
  content: {
    flex: 1,
    paddingBottom: 100, // إضافة مساحة في الأسفل للتمرير
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: theme.colors.white,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginHorizontal: 4,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: 4,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
  },
  seeAllText: {
    fontSize: 14,
    color: theme.colors.primary,
    fontWeight: '600',
  },
  doctorsList: {
    paddingHorizontal: 20,
  },
  doctorCard: {
    width: 214, // تكبير العرض بنسبة 7% (200 * 1.07 = 214)
    backgroundColor: theme.colors.white,
    borderRadius: 12,
    padding: 15, // تكبير الحشو بنسبة 7% (14 * 1.07 = 15)
    marginRight: 12,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  doctorImageContainer: {
    position: 'relative',
    alignItems: 'center',
    marginBottom: 8, // تقليل المسافة
  },
  doctorImage: {
    width: 64, // تكبير حجم الصورة بنسبة 7% (60 * 1.07 = 64)
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    borderColor: theme.colors.primary,
  },

  availableBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: theme.colors.success,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  featuredBadge: {
    position: 'absolute',
    top: -2,
    left: -2,
    backgroundColor: '#FFD700',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  featuredText: {
    fontSize: 8,
    color: theme.colors.white,
    fontWeight: 'bold',
    marginLeft: 2,
  },
  availableText: {
    fontSize: 8,
    color: theme.colors.white,
    fontWeight: 'bold',
  },
  doctorInfo: {
    alignItems: 'center',
    marginBottom: 6,
  },
  doctorName: {
    fontSize: 15, // تكبير النص بنسبة 7% (14 * 1.07 = 15)
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
    marginBottom: 3,
    textAlign: 'center',
  },
  doctorSpecialty: {
    fontSize: 12, // تكبير النص بنسبة 7% (11 * 1.07 = 12)
    color: theme.colors.textSecondary,
    marginLeft: 3,
    textAlign: 'center',
    flex: 1,
  },
  specialtyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 3,
  },
  doctorLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 3,
  },
  doctorLocationText: {
    fontSize: 11, // تكبير النص بنسبة 7% (10 * 1.07 = 11)
    color: theme.colors.textSecondary,
    marginLeft: 3,
    textAlign: 'center',
    flex: 1,
  },
  doctorRating: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ratingText: {
    fontSize: 12, // تكبير النص بنسبة 7% (11 * 1.07 = 12)
    color: theme.colors.textPrimary,
    fontWeight: '600',
    marginLeft: 2,
  },
  ratingCount: {
    fontSize: 9,
    color: theme.colors.textSecondary,
    marginLeft: 3,
  },
  doctorExperience: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginLeft: 8,
  },
  workingDaysContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  workingDaysText: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginLeft: 4,
  },
  cardActions: {
    alignItems: 'center',
  },
  bookButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: 12, // تصغير نصف القطر
    paddingVertical: 4, // تصغير الحشو العمودي
    paddingHorizontal: 10, // تصغير الحشو الأفقي
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  bookButtonText: {
    color: theme.colors.white,
    fontSize: 11, // تصغير النص
    fontWeight: '600',
  },
  detailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },
  detailsButtonText: {
    color: theme.colors.primary,
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    marginBottom: 20, // إضافة مساحة إضافية في الأسفل
  },
  quickAction: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  quickActionIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  quickActionText: {
    fontSize: 12,
    color: theme.colors.textPrimary,
    textAlign: 'center',
  },
  cardIndicator: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: theme.colors.background + '80',
    borderRadius: 12,
    padding: 4,
  },
  showAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primaryLight,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginTop: 10,
    marginBottom: 20,
    alignSelf: 'center',
  },
  showAllButtonText: {
    color: theme.colors.primary,
    fontSize: 14,
    fontWeight: 'bold',
    marginRight: 8,
  },
});

export default UserHomeScreen;
