import React, { useState, useEffect, useRef, useMemo } from 'react';
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
  Platform,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../utils/theme';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../contexts/NotificationContext';
import { API_CONFIG } from '../config/api';
import { getTodayLocalizedDayName } from '../utils/dateUtils';
import {
  mapSpecialtyToLocalized,
  mapProvinceToLocalized,
  mapCategoryToLocalized
} from '../utils/specialtyMapper';
import {
  PROVINCES,
  SPECIALTIES,
  getSpecialtiesByCategory
} from '../utils/constants'; 
import AdvertisementSlider from '../components/AdvertisementSlider';
import { logError, logApiCall, logApiResponse } from '../utils/logger';
import { useNearestDoctors } from '../hooks/useNearestDoctors';

import { SPECIALTY_CATEGORIES as NEW_SPECIALTY_CATEGORIES } from '../utils/medicalSpecialties'; 

const { width } = Dimensions.get('window');
// حساب دقيق لعرض الكارت ليكون متناسقاً
const GRID_CARD_WIDTH = Math.floor((width - 32 - 12) / 2); 

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
  /** من القريبين - يظهر فقط ضمن المقترحين عند توفر موقع المستخدم */
  isNearby?: boolean;
  distance?: number;
}

type FilterViewMode = 'MAIN' | 'PROVINCE' | 'CATEGORY' | 'SPECIALTY';

const UserHomeScreen = () => {
  const navigation = useNavigation();
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const {
    notifications,
    isNotificationEnabled,
    registerForNotifications,
  } = useNotifications();

  const featuredListRef = useRef<FlatList>(null);
  const [currentScrollIndex, setCurrentScrollIndex] = useState(0);

  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [allDoctors, setAllDoctors] = useState<Doctor[]>([]); // جميع الأطباء للبحث
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  
  const [selectedProvince, setSelectedProvince] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  
  const [showFilters, setShowFilters] = useState(false);
  const [filterViewMode, setFilterViewMode] = useState<FilterViewMode>('MAIN');

  const [showAllRecommended, setShowAllRecommended] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  const { doctors: nearestDoctors, refetch: refetchNearest } = useNearestDoctors(30);

  useEffect(() => {
    fetchDoctors();
    if (!isNotificationEnabled) {
      registerForNotifications();
    }
  }, [t]);

  useEffect(() => {
    refetchNearest();
  }, []);

  // Debounce للبحث
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  // جلب جميع الأطباء عند البحث
  useEffect(() => {
    if (debouncedSearchQuery.trim()) {
      fetchAllDoctorsForSearch();
    } else {
      setAllDoctors([]);
      setIsSearching(false);
    }
  }, [debouncedSearchQuery]);

  const fetchDoctors = async () => {
    setLoading(true);
    try {
      logApiCall('/doctors', 'GET');
      const response = await fetch(`${API_CONFIG.BASE_URL}/doctors`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const doctorsData = await response.json();
      logApiResponse('/doctors', response.status);

      const processedDoctors = doctorsData
        .filter((doctor: any) => {
          const isApproved = doctor.status === 'approved';
          const isActive = doctor.active !== false && doctor.active !== 'false';
          const isNotDeleted = !doctor.deleted;
          const isNotDisabled = !doctor.disabled;
          return isApproved && isActive && isNotDeleted && isNotDisabled;
        })
        .map((doctor: any) => {
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
              doctor.imageUrl || doctor.profile_image || doctor.profileImage || doctor.image
            ),
            available: doctor.status === 'approved' && doctor.active !== false,
            about: doctor.about || '',
            clinicLocation: doctor.clinicLocation || '',
            phone: doctor.phone || '',
            email: doctor.email || '',
            isFeatured: !!(doctor.isFeatured || doctor.is_featured),
            status: doctor.status || 'pending',
          };
          return processedDoctor;
        });

      const featured = (processedDoctors as Doctor[]).filter(d => (d as any).isFeatured === true);
      const regular = (processedDoctors as Doctor[]).filter(d => !(d as any).isFeatured);
      const shuffledRegular = shuffleArray<Doctor>(regular);
      // عرض كل الأطباء (موصى بهم أولاً ثم الباقي) وليس فقط 10
      const finalDoctors = [...featured, ...shuffledRegular];
      setDoctors(finalDoctors);
    } catch (error) {
      logError('Error fetching doctors', error);
      setDoctors([]); 
    } finally {
      setLoading(false);
    }
  };

  const fetchAllDoctorsForSearch = async () => {
    setIsSearching(true);
    try {
      let url = `${API_CONFIG.BASE_URL}/doctors`;
      
      // إضافة معاملات البحث والفلاتر
      const params = new URLSearchParams();
      if (debouncedSearchQuery) params.append('search', debouncedSearchQuery);
      if (selectedProvince) params.append('province', selectedProvince);
      if (selectedSpecialty) params.append('specialty', selectedSpecialty);
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      logApiCall(url, 'GET');
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const doctorsData = await response.json();
      logApiResponse(url, response.status);

      const processedDoctors = doctorsData
        .filter((doctor: any) => {
          const isApproved = doctor.status === 'approved';
          const isActive = doctor.active !== false && doctor.active !== 'false';
          const isNotDeleted = !doctor.deleted;
          const isNotDisabled = !doctor.disabled;
          return isApproved && isActive && isNotDeleted && isNotDisabled;
        })
        .map((doctor: any) => {
          let specialty = mapSpecialtyToLocalized(
            doctor.specialty || doctor.category_ar || doctor.category
          );

          const processedDoctor: Doctor = {
            id: doctor._id || doctor.id,
            name: doctor.name || t('common.unknown_doctor'),
            specialty: specialty,
            province: doctor.province || t('common.not_specified'),
            area: doctor.area || t('common.not_specified'),
            rating: doctor.rating || doctor.averageRating || 0,
            experience: doctor.experienceYears
              ? `${doctor.experienceYears} ${t('common.years')}`
              : t('common.not_specified'),
            image: getImageUrl(
              doctor.imageUrl || doctor.profile_image || doctor.profileImage || doctor.image
            ),
            available: doctor.status === 'approved' && doctor.active !== false,
            about: doctor.about || '',
            clinicLocation: doctor.clinicLocation || '',
            phone: doctor.phone || '',
            email: doctor.email || '',
            isFeatured: !!(doctor.isFeatured || doctor.is_featured),
            status: doctor.status || 'pending',
          };
          return processedDoctor;
        });

      setAllDoctors(processedDoctors);
    } catch (error) {
      logError('Error fetching all doctors for search', error);
      setAllDoctors([]);
    } finally {
      setIsSearching(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchDoctors();
    if (debouncedSearchQuery.trim()) {
      await fetchAllDoctorsForSearch();
    }
    setRefreshing(false);
  };

  const shuffleArray = <T,>(array: T[]): T[] => {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  };

  // استخدام جميع الأطباء عند البحث، والأطباء المحدودة عند عدم البحث
  const doctorsToFilter = debouncedSearchQuery.trim() ? allDoctors : doctors;
  
  const filteredDoctors = doctorsToFilter.filter(doctor => {
    // عند البحث، النتائج تأتي من السيرفر مع الفلاتر، لكن نضيف فلترة إضافية محلية للتأكد
    const matchesSearch =
      !debouncedSearchQuery ||
      doctor.name.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
      doctor.specialty.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
      doctor.province.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
      doctor.area.toLowerCase().includes(debouncedSearchQuery.toLowerCase());

    const matchesProvince = !selectedProvince || doctor.province === selectedProvince;
    const matchesSpecialty = !selectedSpecialty || doctor.specialty === selectedSpecialty;

    return matchesSearch && matchesProvince && matchesSpecialty;
  });

  const nearestIds = useMemo(() => new Set(nearestDoctors.map(d => d.id)), [nearestDoctors]);
  const nearestDistanceMap = useMemo(
    () => new Map(nearestDoctors.map(d => [d.id, d.distance])),
    [nearestDoctors]
  );
  const displayedDoctors = useMemo(
    () =>
      filteredDoctors.map(d => ({
        ...d,
        isNearby: nearestIds.has(d.id),
        distance: nearestDistanceMap.get(d.id),
      })),
    [filteredDoctors, nearestIds, nearestDistanceMap]
  );

  // تمرير تلقائي للقائمة الأفقية (مع منع scrollToIndex عند قائمة فارغة)
  useEffect(() => {
    const list = displayedDoctors.slice(0, 6);
    if (list.length <= 1) return;

    const interval = setInterval(() => {
      const currentList = displayedDoctors.slice(0, 6);
      if (currentList.length === 0) return;
      let nextIndex = currentScrollIndex + 1;
      if (nextIndex >= currentList.length) nextIndex = 0;
      setCurrentScrollIndex(nextIndex);
      try {
        featuredListRef.current?.scrollToIndex({
          index: nextIndex,
          animated: true,
          viewPosition: 0.5
        });
      } catch (_) {}
    }, 3000);

    return () => clearInterval(interval);
  }, [currentScrollIndex, displayedDoctors.length]);

  const handleDoctorPress = (doctor: Doctor) => {
    if (!user) {
      Alert.alert(t('login_required.title'), t('login_required.message'), [
        { text: t('login_required.cancel'), style: 'cancel' },
        { text: t('login_required.login'), onPress: () => (navigation as any).navigate('Login') },
      ]);
      return;
    }
    (navigation as any).navigate('DoctorDetails', { doctorId: doctor.id });
  };

  const getImageUrl = (imagePath: string | null | undefined): string | null => {
    if (!imagePath || imagePath === 'null' || imagePath === 'undefined') return null;
    if (imagePath.startsWith('http')) return imagePath;
    if (imagePath.startsWith('/uploads/')) return `${API_CONFIG.BASE_URL}${imagePath}`;
    return `${API_CONFIG.BASE_URL}/${imagePath.replace(/^\/+/, '')}`;
  };

  const clearFilters = () => {
    setSelectedCategory('');
    setSelectedSpecialty('');
    setSelectedProvince('');
  };

  const renderFilterContent = () => {
    switch (filterViewMode) {
      case 'PROVINCE':
        return (
          <View style={styles.popupContent}>
             <View style={styles.popupHeader}>
                <TouchableOpacity onPress={() => setFilterViewMode('MAIN')} style={styles.backButton}>
                   <Ionicons name="arrow-back" size={24} color={theme.colors.textPrimary} />
                </TouchableOpacity>
                <Text style={styles.popupTitle}>{t('filters.province')}</Text>
                <View style={{width:24}}/>
             </View>
             <FlatList
               data={PROVINCES}
               keyExtractor={(item) => item}
               style={{maxHeight: 300}}
               renderItem={({ item }) => (
                 <TouchableOpacity 
                   style={styles.listItem}
                   onPress={() => {
                     setSelectedProvince(item);
                     setFilterViewMode('MAIN');
                   }}
                 >
                   <Text style={[styles.listItemText, selectedProvince === item && styles.selectedText]}>
                     {mapProvinceToLocalized(item, i18n.language)}
                   </Text>
                   {selectedProvince === item && <Ionicons name="checkmark" size={20} color={theme.colors.primary} />}
                 </TouchableOpacity>
               )}
             />
          </View>
        );

      case 'CATEGORY':
        return (
          <View style={styles.popupContent}>
            <View style={styles.popupHeader}>
                <TouchableOpacity onPress={() => setFilterViewMode('MAIN')} style={styles.backButton}>
                   <Ionicons name="arrow-back" size={24} color={theme.colors.textPrimary} />
                </TouchableOpacity>
                <Text style={styles.popupTitle}>{t('filters.specialty_category')}</Text>
                <View style={{width:24}}/>
             </View>
             <FlatList
               data={NEW_SPECIALTY_CATEGORIES}
               keyExtractor={(item) => item}
               style={{maxHeight: 300}}
               renderItem={({ item }) => (
                 <TouchableOpacity 
                   style={styles.listItem}
                   onPress={() => {
                     setSelectedCategory(item);
                     setSelectedSpecialty(''); 
                     setFilterViewMode('MAIN');
                   }}
                 >
                   <Text style={[styles.listItemText, selectedCategory === item && styles.selectedText]}>
                     {mapCategoryToLocalized(item)}
                   </Text>
                   {selectedCategory === item && <Ionicons name="checkmark" size={20} color={theme.colors.primary} />}
                 </TouchableOpacity>
               )}
             />
          </View>
        );

      case 'SPECIALTY':
        const specialtiesList = selectedCategory 
            ? (typeof getSpecialtiesByCategory === 'function' ? getSpecialtiesByCategory(selectedCategory) : SPECIALTIES)
            : SPECIALTIES;

        return (
          <View style={styles.popupContent}>
             <View style={styles.popupHeader}>
                <TouchableOpacity onPress={() => setFilterViewMode('MAIN')} style={styles.backButton}>
                   <Ionicons name="arrow-back" size={24} color={theme.colors.textPrimary} />
                </TouchableOpacity>
                <Text style={styles.popupTitle}>{t('filters.specialty')}</Text>
                <View style={{width:24}}/>
             </View>
             <FlatList
               data={specialtiesList}
               keyExtractor={(item: any) => item.value || item.ar || item}
               style={{maxHeight: 300}}
               renderItem={({ item }) => {
                 const val = item.ar || item.value || item;
                 return (
                    <TouchableOpacity 
                      style={styles.listItem}
                      onPress={() => {
                        setSelectedSpecialty(val);
                        setFilterViewMode('MAIN');
                      }}
                    >
                      <Text style={[styles.listItemText, selectedSpecialty === val && styles.selectedText]}>
                        {mapSpecialtyToLocalized(val, i18n.language)}
                      </Text>
                      {selectedSpecialty === val && <Ionicons name="checkmark" size={20} color={theme.colors.primary} />}
                    </TouchableOpacity>
                 );
               }}
             />
          </View>
        );

      case 'MAIN':
      default:
        return (
          <View style={styles.popupContent}>
            <View style={styles.popupHeader}>
               <Text style={styles.popupTitleMain}>{t('filters.title')}</Text>
               <TouchableOpacity onPress={() => setShowFilters(false)} style={styles.closeBtn}>
                 <Ionicons name="close" size={24} color={theme.colors.textSecondary} />
               </TouchableOpacity>
            </View>

            <View style={styles.filterBody}>
                <TouchableOpacity 
                  style={styles.simpleSelector}
                  onPress={() => setFilterViewMode('PROVINCE')}
                >
                  <View>
                    <Text style={styles.simpleLabel}>{t('filters.province')}</Text>
                    <Text style={selectedProvince ? styles.simpleValueSelected : styles.simpleValue}>
                        {selectedProvince ? mapProvinceToLocalized(selectedProvince, i18n.language) : t('filters.all')}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={theme.colors.textSecondary} />
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.simpleSelector}
                  onPress={() => setFilterViewMode('CATEGORY')}
                >
                   <View>
                    <Text style={styles.simpleLabel}>{t('filters.specialty_category_optional')}</Text>
                    <Text style={selectedCategory ? styles.simpleValueSelected : styles.simpleValue}>
                        {selectedCategory ? mapCategoryToLocalized(selectedCategory) : t('filters.all')}
                    </Text>
                   </View>
                   <Ionicons name="chevron-forward" size={18} color={theme.colors.textSecondary} />
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.simpleSelector}
                  onPress={() => setFilterViewMode('SPECIALTY')}
                >
                  <View>
                    <Text style={styles.simpleLabel}>{t('filters.specialty')}</Text>
                    <Text style={selectedSpecialty ? styles.simpleValueSelected : styles.simpleValue}>
                        {selectedSpecialty ? mapSpecialtyToLocalized(selectedSpecialty, i18n.language) : t('filters.all')}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={theme.colors.textSecondary} />
                </TouchableOpacity>
            </View>

            <View style={styles.popupFooter}>
                <TouchableOpacity style={styles.textBtn} onPress={clearFilters}>
                    <Text style={styles.textBtnLabel}>{t('filters.clear')}</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.solidBtn} 
                  onPress={() => setShowFilters(false)}
                >
                    <Text style={styles.solidBtnLabel}>{t('filters.apply')}</Text>
                </TouchableOpacity>
            </View>
          </View>
        );
    }
  };

  const renderDoctorCard = ({ item }: { item: Doctor }) => (
    <TouchableOpacity
      style={[styles.doctorCard, { width: GRID_CARD_WIDTH }]}
      onPress={() => handleDoctorPress(item)}
      activeOpacity={0.9}
    >
      <View style={styles.doctorImageContainer}>
        {item.image ? (
          <Image
            source={{ uri: item.image }}
            style={styles.doctorImage}
            resizeMode="cover"
            onError={(e) => {
              console.log('Failed to load doctor image:', item.image);
            }}
            defaultSource={require('../../assets/icon.png')}
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
          </View>
        )}

        {item.isNearby && (
          <View style={styles.nearbyBadge}>
            <Ionicons name="navigate" size={9} color={theme.colors.white} />
            <Text style={styles.nearbyBadgeText} numberOfLines={1}>
              {t('user_home.nearby_badge', 'من القريبين')}
            </Text>
          </View>
        )}
        
        {item.available && (
          <View style={styles.availableBadge}>
             <View style={styles.onlineDot} />
          </View>
        )}
      </View>

      <View style={styles.doctorInfo}>
        <Text style={styles.doctorName} numberOfLines={1}>
          {item.name}
        </Text>

        <View style={styles.specialtyContainer}>
          <Text style={styles.doctorSpecialty} numberOfLines={1}>
            {item.specialty || t('common.not_specified')}
          </Text>
        </View>

        <View style={styles.doctorLocation}>
          <Ionicons name="location-outline" size={10} color={theme.colors.textSecondary} />
          <Text style={styles.doctorLocationText} numberOfLines={1}>
            {mapProvinceToLocalized(item.province)}, {item.area}
          </Text>
        </View>

        {(item.rating && item.rating > 0) ? (
          <View style={styles.ratingPill}>
            <Ionicons name="star" size={9} color="#FFD700" />
            <Text style={styles.ratingText}>{item.rating.toFixed(1)}</Text>
          </View>
        ) : <View style={{height: 12}} />} 
      </View>

      <View style={styles.cardActions}>
        <TouchableOpacity
          style={styles.bookButton}
          onPress={() => handleDoctorPress(item)}
        >
          <Text style={styles.bookButtonText}>
            {t('appointment.book_appointment') || 'حجز موعد'}
          </Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle={user ? "light-content" : "dark-content"}
        backgroundColor={user ? theme.colors.primary : theme.colors.background}
      />

      <View style={[styles.topBar, user && styles.topBarLoggedIn]}>
        <View style={styles.headerButtons}>
          {user ? (
            <>
              <TouchableOpacity
                style={styles.notificationButton}
                onPress={() => navigation.navigate('Notifications' as never)}
              >
                <Ionicons name="notifications" size={24} color={theme.colors.textPrimary} />
                {notifications.filter(n => !n.isRead).length > 0 && (
                  <View style={styles.notificationBadge}>
                    <Text style={styles.notificationBadgeText}>
                      {notifications.filter(n => !n.isRead).length > 9 ? '9+' : notifications.filter(n => !n.isRead).length}
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
            </>
          ) : (
            <TouchableOpacity
              style={styles.loginButton}
              onPress={() => navigation.navigate('Login' as never)}
            >
              <Ionicons name="log-in" size={20} color={theme.colors.white} />
              <Text style={styles.loginButtonText}>{t('auth.login') || 'تسجيل الدخول'}</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={{ paddingBottom: 150 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* ✅ التعديل هنا: تم توسيط الإعلانات */}
        <View style={{ alignItems: 'center', width: '100%' }}>
            <AdvertisementSlider target="users" style={styles.advertisementSlider} />
        </View>

        <View style={styles.searchAndFilterContainer}>
          <View style={styles.searchContainer}>
            <View style={styles.searchInputWrapper}>
              <Ionicons name="search" size={20} color={theme.colors.textSecondary} style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder={t('search.placeholder') || 'ابحث عن طبيب...'}
                placeholderTextColor={theme.colors.textSecondary}
                value={searchQuery}
                onChangeText={setSearchQuery}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setIsSearchFocused(false)}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity 
                  onPress={() => {
                    setSearchQuery('');
                    setDebouncedSearchQuery('');
                    setAllDoctors([]);
                  }} 
                  style={styles.clearSearchButton}
                >
                  <Ionicons name="close-circle" size={20} color={theme.colors.textSecondary} />
                </TouchableOpacity>
              )}
              {isSearching && (
                <ActivityIndicator size="small" color={theme.colors.primary} style={styles.searchLoader} />
              )}
            </View>
          </View>

          <View style={styles.filterSection}>
            <Text style={styles.filterLabel}>{t('suggestions', 'اقتراحات سريعة')}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterChipsContainer}>
              <TouchableOpacity
                style={[styles.filterChip, selectedProvince === PROVINCES[0] && styles.filterChipActive]}
                onPress={() => setSelectedProvince(selectedProvince === PROVINCES[0] ? '' : PROVINCES[0])}
              >
                <Text style={[styles.filterChipText, selectedProvince === PROVINCES[0] && styles.filterChipTextActive]}>
                  {mapProvinceToLocalized(PROVINCES[0])}
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.filterChip, selectedSpecialty === (typeof SPECIALTIES[0] === 'string' ? SPECIALTIES[0] : (SPECIALTIES[0] as any).value) && styles.filterChipActive]}
                onPress={() => {
                   const val = typeof SPECIALTIES[0] === 'string' ? SPECIALTIES[0] : (SPECIALTIES[0] as any).value;
                   setSelectedSpecialty(selectedSpecialty === val ? '' : val);
                }}
              >
                <Text style={[styles.filterChipText, selectedSpecialty === (typeof SPECIALTIES[0] === 'string' ? SPECIALTIES[0] : (SPECIALTIES[0] as any).value) && styles.filterChipTextActive]}>
                  {mapSpecialtyToLocalized(SPECIALTIES[0])}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.moreChip}
                onPress={() => {
                   setFilterViewMode('MAIN');
                   setShowFilters(true);
                }}
              >
                <Text style={styles.moreChipText}>{t('common.more') || 'مزيد'}</Text>
                <Ionicons name="filter" size={14} color={theme.colors.primary} />
              </TouchableOpacity>
            </ScrollView>
          </View>

          <TouchableOpacity
            style={styles.nearestDoctorsButton}
            onPress={() => (navigation as any).navigate('NearestDoctors')}
            activeOpacity={0.8}
          >
            <Ionicons name="navigate" size={20} color={theme.colors.primary} />
            <Text style={styles.nearestDoctorsButtonText}>{t('nearest_doctors.title', 'الأطباء الأقرب')}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{t('user_home.recommended_doctors')}</Text>
          <TouchableOpacity onPress={() => (navigation as any).navigate('AllDoctors')}>
            <Text style={styles.seeAllText}>{t('common.see_all')}</Text>
          </TouchableOpacity>
        </View>

        <FlatList
          ref={featuredListRef}
          data={displayedDoctors.slice(0, 6)}
          renderItem={renderDoctorCard}
          keyExtractor={item => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.doctorsList}
          getItemLayout={(data, index) => (
            { length: GRID_CARD_WIDTH + 12, offset: (GRID_CARD_WIDTH + 12) * index, index }
          )}
          onScrollToIndexFailed={() => {}}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="search" size={64} color={theme.colors.textSecondary} />
              <Text style={styles.emptyText}>
                {isSearching ? t('common.loading') : loading ? t('common.loading') : 
                 debouncedSearchQuery.trim() ? 
                 (t('search.no_results') || 'لم يتم العثور على نتائج') : 
                 t('user_home.no_doctors_available')}
              </Text>
            </View>
          }
        />

        {displayedDoctors.length > 6 && (
          <>
            <FlatList
              data={showAllRecommended ? displayedDoctors.slice(6) : displayedDoctors.slice(6, 10)}
              renderItem={renderDoctorCard}
              keyExtractor={item => item.id + '-grid'}
              numColumns={2}
              columnWrapperStyle={{ justifyContent: 'space-between', paddingHorizontal: 16 }}
              scrollEnabled={false}
              contentContainerStyle={{ paddingTop: 8, paddingBottom: 20 }}
            />
            
            {!showAllRecommended && displayedDoctors.length > 10 && (
              <TouchableOpacity style={styles.showAllButton} onPress={() => setShowAllRecommended(true)}>
                <Text style={styles.showAllButtonText}>عرض جميع الأطباء ({displayedDoctors.length})</Text>
                <Ionicons name="chevron-down" size={20} color={theme.colors.primary} />
              </TouchableOpacity>
            )}
            
            {showAllRecommended && (
              <TouchableOpacity style={styles.showAllButton} onPress={() => setShowAllRecommended(false)}>
                <Text style={styles.showAllButtonText}>إخفاء بعض الأطباء</Text>
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
            <Text style={styles.quickActionText}>{t('medicine_reminder.title')}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <Modal
        visible={showFilters}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowFilters(false)}
      >
        <View style={styles.modalOverlay}>
            {renderFilterContent()}
        </View>
      </Modal>

    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  topBar: {
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
    paddingBottom: 12,
    paddingHorizontal: 16,
    backgroundColor: theme.colors.background,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  topBarLoggedIn: { backgroundColor: theme.colors.primary },
  headerButtons: { flexDirection: 'row', alignItems: 'center' },
  notificationButton: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: theme.colors.white,
    justifyContent: 'center', alignItems: 'center',
    marginRight: 12, elevation: 2,
  },
  notificationBadge: {
    position: 'absolute', top: -2, right: -2,
    backgroundColor: theme.colors.error, borderRadius: 10,
    minWidth: 20, height: 20, justifyContent: 'center', alignItems: 'center',
  },
  notificationBadgeText: { color: theme.colors.white, fontSize: 10, fontWeight: 'bold' },
  profileButton: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: theme.colors.white,
    justifyContent: 'center', alignItems: 'center', elevation: 2,
  },
  loginButton: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, elevation: 3,
  },
  loginButtonText: { color: theme.colors.white, fontSize: 14, fontWeight: '600', marginLeft: 6 },
  
  searchAndFilterContainer: {
    paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: theme.colors.background,
  },
  searchContainer: { marginBottom: 16 },
  searchInputWrapper: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: theme.colors.white, borderRadius: 12,
    paddingHorizontal: 16, paddingVertical: 12,
    borderWidth: 1, borderColor: theme.colors.border, elevation: 2,
  },
  searchIcon: { marginRight: 12 },
  searchInput: { flex: 1, fontSize: 16, color: theme.colors.textPrimary, padding: 0 },
  clearSearchButton: { marginLeft: 8, padding: 4 },
  searchLoader: { marginLeft: 8 },
  
  filterSection: { marginBottom: 16 },
  filterLabel: { fontSize: 14, fontWeight: '600', color: theme.colors.textPrimary, marginBottom: 8 },
  filterChipsContainer: { paddingRight: 4 },
  filterChip: {
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20,
    backgroundColor: theme.colors.white, borderWidth: 1,
    borderColor: theme.colors.border, marginRight: 8,
    flexDirection: 'row', alignItems: 'center',
  },
  filterChipActive: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
  filterChipText: { fontSize: 14, color: theme.colors.textPrimary },
  filterChipTextActive: { color: theme.colors.white, fontWeight: '600' },
  moreChip: {
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20,
    backgroundColor: theme.colors.white, borderWidth: 1,
    borderColor: theme.colors.primary, marginRight: 8,
    flexDirection: 'row', alignItems: 'center', gap: 4,
  },
  moreChipText: { fontSize: 14, color: theme.colors.primary, fontWeight: '600' },
  nearestDoctorsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: theme.colors.white,
    borderWidth: 1,
    borderColor: theme.colors.primary,
    marginTop: 10,
    gap: 8,
  },
  nearestDoctorsButtonText: { fontSize: 15, color: theme.colors.primary, fontWeight: '600' },

  // ✅ تعديل ستايل الإعلان للتوسيط ومنع الميلان
  advertisementSlider: { 
    marginVertical: 10,
    alignSelf: 'center', // يجعل العنصر يتوسط الشاشة
    width: width - 32, // عرض محدد لضمان عدم الخروج عن الحواف
  },
  
  content: { flex: 1 }, 
  
  sectionHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', paddingHorizontal: 20, marginBottom: 16,
  },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: theme.colors.textPrimary },
  seeAllText: { fontSize: 14, color: theme.colors.primary, fontWeight: '600' },
  doctorsList: { paddingHorizontal: 16 },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 40 },
  emptyText: { fontSize: 16, color: theme.colors.textSecondary, marginTop: 16 },

  // ==========================================
  // ✅ ستايلات الكارت (تم تصغير الحجم والمسافات للأندرويد)
  // ==========================================
  doctorCard: {
    width: GRID_CARD_WIDTH,
    backgroundColor: theme.colors.white,
    borderRadius: 14, // تقليل الانحناء قليلاً
    padding: 5, // ✅ تقليل البادينغ الداخلي
    marginRight: 12,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: theme.colors.border + '40',
  },
  doctorImageContainer: {
    position: 'relative', alignItems: 'center',
    marginBottom: 4, 
    marginTop: 0,
  },
  doctorImage: {
    width: '100%', 
    height: 110, // ✅ تقليل ارتفاع الصورة من 140 الى 110
    borderRadius: 12, 
    backgroundColor: theme.colors.background,
  },
  featuredBadge: {
    position: 'absolute', top: -4, left: -4,
    backgroundColor: '#FFD700', width: 22, height: 22, borderRadius: 11,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: theme.colors.white, elevation: 2,
  },
  nearbyBadge: {
    position: 'absolute', bottom: 4, left: 4,
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: theme.colors.primary, paddingHorizontal: 6, paddingVertical: 3,
    borderRadius: 8, maxWidth: '85%', gap: 2,
    borderWidth: 1, borderColor: theme.colors.white, elevation: 2,
  },
  nearbyBadgeText: {
    fontSize: 8, color: theme.colors.white, fontWeight: '600', includeFontPadding: false,
  },
  availableBadge: {
    position: 'absolute', bottom: -2, right: -2,
    backgroundColor: theme.colors.white, padding: 2, borderRadius: 8,
  },
  onlineDot: {
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: theme.colors.success, borderWidth: 1, borderColor: theme.colors.white,
  },
  
  doctorInfo: { 
    alignItems: 'center', 
    marginBottom: 2,
    paddingHorizontal: 2,
  },
  doctorName: {
    fontSize: 13, // تقليل الخط قليلاً
    fontWeight: '700', 
    color: theme.colors.textPrimary,
    marginBottom: 2, 
    textAlign: 'center',
    includeFontPadding: false, // ✅ مهم للأندرويد لإزالة الفراغ الزائد
  },
  specialtyContainer: {
    marginBottom: 2, backgroundColor: theme.colors.primary + '10',
    paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4,
  },
  doctorSpecialty: {
    fontSize: 10, 
    color: theme.colors.primary, 
    fontWeight: '600', 
    textAlign: 'center',
    includeFontPadding: false,
  },
  doctorLocation: { flexDirection: 'row', alignItems: 'center', marginBottom: 2 },
  doctorLocationText: { 
    fontSize: 9, 
    color: theme.colors.textSecondary, 
    marginLeft: 2,
    includeFontPadding: false 
  },
  ratingPill: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF8E1',
    paddingHorizontal: 6, paddingVertical: 1, borderRadius: 10, marginBottom: 4,
  },
  ratingText: { fontSize: 10, color: '#F57C00', fontWeight: '700', marginLeft: 2 },
  
  cardActions: { alignItems: 'center', marginTop: 0 },
  bookButton: {
    backgroundColor: theme.colors.primary, borderRadius: 8,
    paddingVertical: 6, // تقليل ارتفاع الزر
    paddingHorizontal: 10, width: '100%',
    alignItems: 'center', justifyContent: 'center',
  },
  bookButtonText: { color: theme.colors.white, fontSize: 11, fontWeight: '600', includeFontPadding: false },

  // Other components
  showAllButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: theme.colors.primaryLight, borderRadius: 12,
    paddingVertical: 12, paddingHorizontal: 20, marginTop: 10, marginBottom: 20,
    alignSelf: 'center',
  },
  showAllButtonText: { color: theme.colors.primary, fontSize: 14, fontWeight: 'bold', marginRight: 8 },
  quickActions: { flexDirection: 'row', justifyContent: 'space-between', padding: 20, marginBottom: 20 },
  quickAction: { flex: 1, alignItems: 'center', marginHorizontal: 4 },
  quickActionIcon: {  
    width: 50, height: 50, borderRadius: 25, backgroundColor: theme.colors.primary,
    justifyContent: 'center', alignItems: 'center', marginBottom: 8,
  },
  quickActionText: { fontSize: 12, color: theme.colors.textPrimary, textAlign: 'center' },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  popupContent: {
      width: '90%',
      backgroundColor: theme.colors.white,
      borderRadius: 16,
      padding: 16,
      elevation: 5,
      shadowColor: '#000',
      shadowOffset: {width:0, height:2},
      shadowOpacity: 0.25,
      shadowRadius: 4,
  },
  popupHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border + '40',
      paddingBottom: 8,
  },
  popupTitle: {
      fontSize: 16,
      fontWeight: 'bold',
      color: theme.colors.textPrimary,
  },
  popupTitleMain: {
      fontSize: 18,
      fontWeight: 'bold',
      color: theme.colors.textPrimary,
  },
  closeBtn: {
      padding: 4,
  },
  filterBody: {
      gap: 12,
      marginBottom: 20,
  },
  simpleSelector: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 12,
      backgroundColor: theme.colors.background,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: theme.colors.border,
  },
  simpleLabel: {
      fontSize: 12,
      color: theme.colors.textSecondary,
      marginBottom: 2,
  },
  simpleValue: {
      fontSize: 14,
      color: theme.colors.textPrimary,
  },
  simpleValueSelected: {
      fontSize: 14,
      color: theme.colors.primary,
      fontWeight: '600',
  },
  popupFooter: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      gap: 12,
      paddingTop: 8,
  },
  textBtn: {
      paddingVertical: 10,
      paddingHorizontal: 16,
  },
  textBtnLabel: {
      color: theme.colors.textSecondary,
      fontWeight: '600',
  },
  solidBtn: {
      backgroundColor: theme.colors.primary,
      paddingVertical: 10,
      paddingHorizontal: 24,
      borderRadius: 8,
  },
  solidBtnLabel: {
      color: theme.colors.white,
      fontWeight: '600',
  },
  listItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 14,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border + '20',
  },
  listItemText: {
      fontSize: 15,
      color: theme.colors.textPrimary,
  },
  selectedText: {
      color: theme.colors.primary,
      fontWeight: 'bold',
  },
  backButton: {
      padding: 4,
  }
});

export default UserHomeScreen;