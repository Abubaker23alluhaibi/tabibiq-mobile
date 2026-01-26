import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  StatusBar,
  TextInput,
  RefreshControl,
  Modal,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../utils/theme';
import {
  mapSpecialtyToLocalized,
  mapProvinceToLocalized,
  mapCategoryToLocalized
} from '../utils/specialtyMapper';
import { API_CONFIG } from '../config/api';
import { useNavigation } from '@react-navigation/native';
import { PROVINCES } from '../utils/constants';
import { 
  MEDICAL_SPECIALTIES, 
  SPECIALTY_CATEGORIES as NEW_SPECIALTY_CATEGORIES,
  getSpecialtiesByCategory
} from '../utils/medicalSpecialties';

interface Doctor {
  id: string;
  name: string;
  specialty: string;
  province: string;
  area: string;
  image: string | null;
  rating?: number;
  experience?: string;
  isFeatured?: boolean;
}

type FilterViewMode = 'MAIN' | 'PROVINCE' | 'CATEGORY' | 'SPECIALTY';

const AllDoctorsScreen = () => {
  const { t, i18n } = useTranslation();
  const navigation = useNavigation();

  // --- State Management ---
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true); // تحميل أولي
  const [loadingMore, setLoadingMore] = useState(false); // تحميل المزيد (Pagination)
  const [refreshing, setRefreshing] = useState(false); // سحب للتحديث
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true); // هل يوجد المزيد من البيانات؟

  // --- Filter States ---
  const [searchQuery, setSearchQuery] = useState('');
  // نستخدم هذا المتغير لتأخير البحث قليلاً (Debounce)
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState(''); 
  
  const [selectedSpecialty, setSelectedSpecialty] = useState('');
  const [selectedProvince, setSelectedProvince] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

  const [showFilters, setShowFilters] = useState(false);
  const [filterViewMode, setFilterViewMode] = useState<FilterViewMode>('MAIN');

  // مؤقت للبحث
  const searchTimeout = useRef<NodeJS.Timeout | null>(null);

  // --- Helper Function for Image URLs ---
  const getImageUrl = (imagePath: string | null | undefined): string | null => {
    if (!imagePath || imagePath === 'null' || imagePath === 'undefined' || imagePath.trim() === '') {
      return null;
    }
    
    // إذا كانت الصورة من Cloudinary أو رابط كامل
    if (imagePath.startsWith('https://res.cloudinary.com') || imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
      return imagePath;
    }
    
    // إذا كانت الصورة محلية (تبدأ بـ /uploads/)
    if (imagePath.startsWith('/uploads/')) {
      return `${API_CONFIG.BASE_URL}${imagePath}`;
    }
    
    // إذا كانت الصورة مسار نسبي آخر
    if (imagePath && !imagePath.startsWith('http')) {
      const cleanPath = imagePath.replace(/^\/+/, '');
      return `${API_CONFIG.BASE_URL}/${cleanPath}`;
    }
    
    return null;
  };

  // --- Debounce Search Logic ---
  // هذا يمنع إرسال طلب للسيرفر مع كل حرف يكتبه المستخدم
  useEffect(() => {
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 500); // انتظر نصف ثانية بعد توقف الكتابة
    return () => { if (searchTimeout.current) clearTimeout(searchTimeout.current); };
  }, [searchQuery]);

  // --- Main Data Fetching Effect ---
  // يتم استدعاؤه عند تغيير أي فلتر (بحث، محافظة، تخصص)
  useEffect(() => {
    // إعادة تعيين الصفحة للأولى عند تغيير الفلاتر
    setPage(1);
    setHasMore(true);
    fetchDoctors(1, true);
  }, [debouncedSearchQuery, selectedSpecialty, selectedProvince, selectedCategory]);

  // --- Fetch Function ---
  const fetchDoctors = async (pageNumber: number, reset: boolean = false) => {
    if (!reset && (!hasMore || loadingMore)) return;

    if (reset) setLoading(true);
    else setLoadingMore(true);

    try {
      // بناء رابط الـ API مع الفلاتر (Server-Side Filtering Ready)
      let url = `${API_CONFIG.BASE_URL}/doctors?page=${pageNumber}&limit=10`;
      
      if (debouncedSearchQuery) url += `&search=${encodeURIComponent(debouncedSearchQuery)}`;
      if (selectedProvince) url += `&province=${encodeURIComponent(selectedProvince)}`;
      if (selectedSpecialty) url += `&specialty=${encodeURIComponent(selectedSpecialty)}`;
      // ملاحظة: إذا الباك إند لا يدعم هذه المتغيرات حالياً، سيتجاهلها ويعيد الكل، وسيعمل الكود أيضاً

      const res = await fetch(url);
      const data = await res.json();

      // التعامل مع هيكلية البيانات (سواء كانت مصفوفة مباشرة أو داخل كائن data)
      const rawDoctors = Array.isArray(data) ? data : (data.doctors || data.data || []);
      
      // تسجيل للتشخيص - أول طبيب في القائمة
      if (rawDoctors.length > 0) {
        const firstDoctor = rawDoctors[0];
        console.log('📋 Sample doctor from API:', {
          name: firstDoctor.name,
          imageUrl: firstDoctor.imageUrl,
          image: firstDoctor.image,
          profileImage: firstDoctor.profileImage,
          profile_image: firstDoctor.profile_image,
        });
      }
      
      const mapped: Doctor[] = rawDoctors.map((d: any) => {
        // الحصول على الصورة من أي حقل متاح
        const rawImage = d.imageUrl || d.profile_image || d.profileImage || d.image || null;
        // معالجة الصورة باستخدام getImageUrl
        const processedImage = getImageUrl(rawImage);
        
        // تسجيل للتشخيص (يمكن حذفه لاحقاً)
        if (rawImage && !processedImage) {
          console.log('⚠️ Image processing failed:', { rawImage, doctorName: d.name });
        } else if (processedImage) {
          console.log('✅ Image processed successfully:', { 
            rawImage, 
            processedImage, 
            doctorName: d.name 
          });
        }
        
        return {
          id: d._id || d.id,
          name: d.name || t('common.doctor'),
          specialty: mapSpecialtyToLocalized(d.specialty || d.category_ar || d.category),
          province: d.province || t('common.not_specified'),
          area: d.area || t('common.not_specified'),
          image: processedImage,
          isFeatured: d.isFeatured || d.is_featured || false,
          rating: Number(d.averageRating ?? d.ratingAverage ?? d.rating_avg ?? d.avgRating ?? d.rating ?? 0) || 0,
          experience: d.experienceYears ? `${d.experienceYears} ${t('common.years')}` : t('common.not_specified'),
        };
      });

      // --- Client Side Filtering Fallback ---
      // إذا كان الباك إند لا يدعم الفلترة، نقوم بالفلترة هنا (لضمان عمل التطبيق في كل الحالات)
      let finalDoctors = mapped;
      // نتحقق إذا كان السيرفر أعاد الكل (عدد كبير) رغم أننا طلبنا صفحة محددة، فهذا يعني أنه لا يدعم الفلترة
      const serverSupportsFiltering = rawDoctors.length <= 20; 

      if (!serverSupportsFiltering) {
         if (debouncedSearchQuery) {
            finalDoctors = finalDoctors.filter(d => 
               d.name.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
               d.specialty.toLowerCase().includes(debouncedSearchQuery.toLowerCase())
            );
         }
         if (selectedProvince) finalDoctors = finalDoctors.filter(d => d.province === selectedProvince);
         if (selectedSpecialty) finalDoctors = finalDoctors.filter(d => d.specialty === selectedSpecialty);
      }

      // تحديث الحالة
      if (reset) {
        setDoctors(finalDoctors);
      } else {
        setDoctors(prev => [...prev, ...finalDoctors]);
      }

      // التحقق مما إذا كان هناك المزيد
      if (finalDoctors.length < 10) {
        setHasMore(false);
      }

    } catch (error) {
      if (reset) setDoctors([]);
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setRefreshing(false);
    }
  };

  // --- Handlers ---
  const handleLoadMore = () => {
    if (!loading && !loadingMore && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchDoctors(nextPage, false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    setPage(1);
    setHasMore(true);
    fetchDoctors(1, true);
  };

  const clearFilters = () => {
    setSelectedCategory('');
    setSelectedSpecialty('');
    setSelectedProvince('');
    // سيقوم الـ useEffect بإعادة التحميل تلقائياً
  };

  // --- Render Components ---
  const renderQuickFilters = () => {
    const oneProvince = PROVINCES[0]; 
    const oneSpecialty = typeof MEDICAL_SPECIALTIES[0] === 'string' 
        ? MEDICAL_SPECIALTIES[0] 
        : (MEDICAL_SPECIALTIES[0] as any).value || (MEDICAL_SPECIALTIES[0] as any).ar;

    return (
      <View style={styles.quickFilterContainer}>
        <Text style={styles.sectionTitle}>{t('suggestions', 'اقتراحات سريعة')}</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.quickFilterScroll}>
            <TouchableOpacity
                style={[styles.quickFilterChip, selectedProvince === oneProvince && styles.quickFilterChipActive]}
                onPress={() => setSelectedProvince(selectedProvince === oneProvince ? '' : oneProvince)}
            >
                <Text style={[styles.quickFilterText, selectedProvince === oneProvince && styles.quickFilterTextActive]}>
                    {mapProvinceToLocalized(oneProvince, i18n.language)}
                </Text>
            </TouchableOpacity>

            <TouchableOpacity
                style={[styles.quickFilterChip, selectedSpecialty === oneSpecialty && styles.quickFilterChipActive]}
                onPress={() => setSelectedSpecialty(selectedSpecialty === oneSpecialty ? '' : oneSpecialty)}
            >
                <Text style={[styles.quickFilterText, selectedSpecialty === oneSpecialty && styles.quickFilterTextActive]}>
                    {mapSpecialtyToLocalized(oneSpecialty, i18n.language)}
                </Text>
            </TouchableOpacity>

            <TouchableOpacity
                style={styles.moreButtonChip}
                onPress={() => { setFilterViewMode('MAIN'); setShowFilters(true); }}
            >
                <Text style={styles.moreButtonText}>{t('common.more', 'المزيد')}...</Text>
                <Ionicons name="filter" size={14} color={theme.colors.primary} style={{marginLeft: 4}} />
            </TouchableOpacity>
        </ScrollView>
      </View>
    );
  };

  const renderItem = ({ item }: { item: Doctor }) => {
    // معالجة الصورة مرة أخرى للتأكد - استخدام getImageUrl مرة أخرى
    const imageUri = item.image ? getImageUrl(item.image) : null;
    
    return (
      <TouchableOpacity
        style={styles.gridCard}
        activeOpacity={0.8}
        onPress={() => (navigation as any).navigate('DoctorDetails', { doctorId: item.id })}
      >
        <View style={styles.imageContainer}>
          {imageUri ? (
            <Image
              source={{ uri: imageUri }}
              style={styles.cardImage}
              resizeMode="cover"
              onError={(e) => {
                console.log('❌ Failed to load doctor image:', {
                  uri: imageUri,
                  originalImage: item.image,
                  doctorName: item.name,
                });
              }}
              onLoadStart={() => {
                console.log('🔄 Loading image:', imageUri);
              }}
              onLoad={() => {
                console.log('✅ Image loaded successfully:', imageUri);
              }}
            />
          ) : (
            <Image
              source={require('../../assets/icon.png')}
              style={styles.cardImage}
              resizeMode="cover"
            />
          )}
        </View>
        <View style={styles.cardBody}>
          <Text style={styles.cardName} numberOfLines={1}>{item.name}</Text>
          <Text style={styles.cardSpec} numberOfLines={1}>{item.specialty}</Text>
          <View style={styles.locationRow}>
            <Ionicons name="location-outline" size={12} color={theme.colors.textSecondary} />
            <Text style={styles.cardLoc} numberOfLines={1}>
               {mapProvinceToLocalized(item.province, i18n.language)}
               {item.area ? ` - ${item.area}` : ''}
            </Text>
          </View>
          <View style={styles.cardFooter}>
            {item.rating ? (
              <View style={styles.ratingRow}>
                <Ionicons name="star" size={14} color="#FFD700" />
                <Text style={styles.ratingText}>{item.rating.toFixed(1)}</Text>
              </View>
            ) : <View />} 
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderFooter = () => {
    if (!loadingMore) return <View style={{height: 20}} />;
    return (
      <View style={styles.loadingFooter}>
        <ActivityIndicator size="small" color={theme.colors.primary} />
      </View>
    );
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
                   onPress={() => { setSelectedProvince(item); setFilterViewMode('MAIN'); }}
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
                   onPress={() => { setSelectedCategory(item); setSelectedSpecialty(''); setFilterViewMode('MAIN'); }}
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
        const specialtiesList = selectedCategory ? getSpecialtiesByCategory(selectedCategory) : MEDICAL_SPECIALTIES;
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
                      onPress={() => { setSelectedSpecialty(val); setFilterViewMode('MAIN'); }}
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
                <TouchableOpacity style={styles.simpleSelector} onPress={() => setFilterViewMode('PROVINCE')}>
                  <View>
                    <Text style={styles.simpleLabel}>{t('filters.province')}</Text>
                    <Text style={selectedProvince ? styles.simpleValueSelected : styles.simpleValue}>
                        {selectedProvince ? mapProvinceToLocalized(selectedProvince, i18n.language) : t('filters.all')}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={theme.colors.textSecondary} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.simpleSelector} onPress={() => setFilterViewMode('CATEGORY')}>
                   <View>
                    <Text style={styles.simpleLabel}>{t('filters.specialty_category_optional')}</Text>
                    <Text style={selectedCategory ? styles.simpleValueSelected : styles.simpleValue}>
                        {selectedCategory ? mapCategoryToLocalized(selectedCategory) : t('filters.all')}
                    </Text>
                   </View>
                   <Ionicons name="chevron-forward" size={18} color={theme.colors.textSecondary} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.simpleSelector} onPress={() => setFilterViewMode('SPECIALTY')}>
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
                <TouchableOpacity style={styles.solidBtn} onPress={() => setShowFilters(false)}>
                    <Text style={styles.solidBtnLabel}>{t('filters.apply')}</Text>
                </TouchableOpacity>
            </View>
          </View>
        );
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.primary} />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t('user_home.recommended_doctors')}</Text>
        <TouchableOpacity onPress={() => { setFilterViewMode('MAIN'); setShowFilters(true); }}>
          <Ionicons name="filter" size={24} color={theme.colors.white} />
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color={theme.colors.textSecondary} />
        <TextInput
          style={styles.searchInput}
          placeholder={t('search.placeholder')}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Quick Filters */}
      {renderQuickFilters()}

      {/* Doctors List */}
      <FlatList
        data={doctors}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        numColumns={2}
        columnWrapperStyle={{ justifyContent: 'space-between' }}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        
        // ✅ Infinite Scroll Props
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5} // تحميل المزيد عندما يصل لمنتصف القائمة الحالية
        ListFooterComponent={renderFooter}
        
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            colors={[theme.colors.primary]}
          />
        }
        ListEmptyComponent={
          !loading && doctors.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text>{t('search.no_results')}</Text>
            </View>
          ) : null
        }
      />

      {/* Filter Modal */}
      <Modal visible={showFilters} transparent={true} animationType="fade" onRequestClose={() => setShowFilters(false)}>
        <View style={styles.modalOverlay}>
            {renderFilterContent()}
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingTop: 50, paddingBottom: 16, paddingHorizontal: 16,
    backgroundColor: theme.colors.primary,
  },
  headerTitle: { color: theme.colors.white, fontSize: 18, fontWeight: 'bold' },
  searchContainer: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: theme.colors.white,
    borderRadius: 16, paddingHorizontal: 16, paddingVertical: 12, margin: 16,
    borderWidth: 1, borderColor: theme.colors.border,
  },
  searchInput: { flex: 1, marginLeft: 10, textAlign: 'right' },
  
  // Quick Filters
  quickFilterContainer: { marginBottom: 16 },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: theme.colors.textPrimary, marginLeft: 16, marginBottom: 8, textAlign: 'left' },
  quickFilterScroll: { paddingHorizontal: 16, paddingBottom: 4 },
  quickFilterChip: {
      paddingHorizontal: 16, paddingVertical: 8, backgroundColor: theme.colors.white,
      borderRadius: 20, marginRight: 8, borderWidth: 1, borderColor: theme.colors.border,
  },
  quickFilterChipActive: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
  quickFilterText: { fontSize: 13, color: theme.colors.textSecondary, fontWeight: '500' },
  quickFilterTextActive: { color: theme.colors.white },
  moreButtonChip: {
      paddingHorizontal: 16, paddingVertical: 8, backgroundColor: theme.colors.background,
      borderRadius: 20, marginRight: 8, borderWidth: 1, borderColor: theme.colors.primary,
      flexDirection: 'row', alignItems: 'center',
  },
  moreButtonText: { fontSize: 13, color: theme.colors.primary, fontWeight: '600' },

  // List Styles
  listContainer: { paddingHorizontal: 16, paddingBottom: 32 },
  gridCard: {
    width: '48%', backgroundColor: theme.colors.white, borderRadius: 16, marginBottom: 16,
    overflow: 'hidden', borderWidth: 1, borderColor: theme.colors.border + '20', elevation: 3,
  },
  imageContainer: {
    width: '100%',
    height: 140,
    overflow: 'hidden',
    backgroundColor: theme.colors.background,
  },
  cardImage: { 
    width: '100%', 
    height: 140, 
    resizeMode: 'cover', 
    backgroundColor: theme.colors.background 
  },
  cardBody: { padding: 12 },
  cardName: { fontSize: 14, fontWeight: '700', color: theme.colors.textPrimary, textAlign: 'left', marginBottom: 4 },
  cardSpec: { fontSize: 12, color: theme.colors.primary, fontWeight: '600', textAlign: 'left', marginBottom: 6 },
  locationRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  cardLoc: { fontSize: 11, color: theme.colors.textSecondary, marginLeft: 4, flex: 1 },
  cardFooter: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center' },
  ratingRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF8E1', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8 },
  ratingText: { marginLeft: 4, fontSize: 11, fontWeight: 'bold', color: '#F57C00' },
  
  loadingFooter: { paddingVertical: 20, alignItems: 'center' },
  emptyContainer: { alignItems: 'center', marginTop: 40 },

  // Modal Styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-start', paddingTop: 120, alignItems: 'center' },
  popupContent: { width: '90%', backgroundColor: theme.colors.white, borderRadius: 16, padding: 16, elevation: 5, shadowColor: '#000', shadowOffset: {width:0, height:2}, shadowOpacity: 0.25, shadowRadius: 4 },
  popupHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, borderBottomWidth: 1, borderBottomColor: theme.colors.border + '40', paddingBottom: 8 },
  popupTitle: { fontSize: 16, fontWeight: 'bold', color: theme.colors.textPrimary },
  popupTitleMain: { fontSize: 18, fontWeight: 'bold', color: theme.colors.textPrimary },
  closeBtn: { padding: 4 },
  filterBody: { gap: 12, marginBottom: 20 },
  simpleSelector: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 12, backgroundColor: theme.colors.background, borderRadius: 10, borderWidth: 1, borderColor: theme.colors.border },
  simpleLabel: { fontSize: 12, color: theme.colors.textSecondary, marginBottom: 2 },
  simpleValue: { fontSize: 14, color: theme.colors.textPrimary },
  simpleValueSelected: { fontSize: 14, color: theme.colors.primary, fontWeight: '600' },
  popupFooter: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12, paddingTop: 8 },
  textBtn: { paddingVertical: 10, paddingHorizontal: 16 },
  textBtnLabel: { color: theme.colors.textSecondary, fontWeight: '600' },
  solidBtn: { backgroundColor: theme.colors.primary, paddingVertical: 10, paddingHorizontal: 24, borderRadius: 8 },
  solidBtnLabel: { color: theme.colors.white, fontWeight: '600' },
  listItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: theme.colors.border + '20' },
  listItemText: { fontSize: 15, color: theme.colors.textPrimary },
  selectedText: { color: theme.colors.primary, fontWeight: 'bold' },
  backButton: { padding: 4 }
});

export default AllDoctorsScreen;