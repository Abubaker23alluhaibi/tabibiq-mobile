import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  Image, 
  StatusBar,
  TextInput,
  ScrollView,
  RefreshControl,
  Modal
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../utils/theme';
import { mapSpecialtyToLocalized, mapProvinceToLocalized, mapCategoryToLocalized } from '../utils/specialtyMapper';
import { API_CONFIG } from '../config/api';
import { useNavigation } from '@react-navigation/native';
import { PROVINCES, SPECIALTIES } from '../utils/constants';
import { MEDICAL_SPECIALTIES, getSpecialtiesByCategory, SPECIALTY_CATEGORIES as NEW_SPECIALTY_CATEGORIES } from '../utils/medicalSpecialties';

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

const AllDoctorsScreen = () => {
  const { t, i18n } = useTranslation();
  const navigation = useNavigation();
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [filteredDoctors, setFilteredDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // حالات البحث والفلترة
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>('');
  const [selectedProvince, setSelectedProvince] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [showFilters, setShowFilters] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showSpecialtyModal, setShowSpecialtyModal] = useState(false);


  // دوال للتعامل مع اختيار الفئات والتخصصات
  const handleCategorySelect = (category: string) => {
    setSelectedCategory(category);
    setSelectedSpecialty(''); // إعادة تعيين التخصص عند تغيير الفئة
    setShowCategoryModal(false);
    // فتح مودال الفلاتر مباشرة بعد اختيار الفئة
    setShowFilters(true);
  };

  const handleSpecialtySelect = (specialty: string) => {
    setSelectedSpecialty(specialty);
    setShowSpecialtyModal(false);
    // فتح مودال الفلاتر مباشرة بعد اختيار التخصص
    setShowFilters(true);
  };

  const clearFilters = () => {
    setSelectedCategory('');
    setSelectedSpecialty('');
    setSelectedProvince('');
    setSearchQuery('');
  };

  useEffect(() => {
    loadDoctors();
  }, []);

  useEffect(() => {
    // تطبيق الفلترة عند تغيير أي من المتغيرات

    
    let filtered = [...doctors];

    // فلترة حسب البحث النصي
    if (searchQuery.trim()) {
      filtered = filtered.filter(doctor =>
        doctor.name.toLowerCase().indexOf(searchQuery.toLowerCase()) !== -1 ||
        doctor.specialty.toLowerCase().indexOf(searchQuery.toLowerCase()) !== -1 ||
        doctor.province.toLowerCase().indexOf(searchQuery.toLowerCase()) !== -1 ||
        doctor.area.toLowerCase().indexOf(searchQuery.toLowerCase()) !== -1
      );
    }

    // فلترة حسب التخصص
    if (selectedSpecialty) {
      filtered = filtered.filter(doctor => doctor.specialty === selectedSpecialty);
    }

    // فلترة حسب المحافظة
    if (selectedProvince) {
      filtered = filtered.filter(doctor => doctor.province === selectedProvince);
    }


    setFilteredDoctors(filtered);
  }, [searchQuery, selectedSpecialty, selectedProvince, doctors]);

  const loadDoctors = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_CONFIG.BASE_URL}/doctors`);
      const data = await res.json();
      const mapped: Doctor[] = (data || []).map((d: any) => {
        const rawSpec = d.specialty || d.category_ar || d.category;
        const localizedSpec = mapSpecialtyToLocalized(rawSpec);
        
        // Debug: طباعة التخصص الأصلي والمترجم (في التطوير فقط)
        if (__DEV__ && rawSpec && rawSpec !== localizedSpec) {
          // يمكن إضافة logging هنا إذا لزم الأمر
        }
        
        return {
          id: d._id || d.id,
          name: d.name || t('common.doctor'),
          specialty: localizedSpec || t('common.general_specialty'),
          province: d.province || t('common.not_specified'),
          area: d.area || t('common.not_specified'),
          image: d.imageUrl || d.profile_image || d.profileImage || d.image || null,
          isFeatured: d.isFeatured || d.is_featured || false,
          rating: Number(
            d.averageRating ??
            d.ratingAverage ??
            d.rating_avg ??
            d.avgRating ??
            d.rating ?? 0
          ) || 0,
          experience: d.experienceYears ? `${d.experienceYears} ${t('common.years')}` : t('common.not_specified'),
        };
      });
      
      // إبراز المميزين أولاً
      const featured = mapped.filter(d => d.isFeatured);
      const regular = mapped.filter(d => !d.isFeatured);
      
      // ترتيب الأطباء غير المميزين بشكل عشوائي
      const shuffledRegular = regular.sort(() => Math.random() - 0.5);
      
      const allDoctors = [...featured, ...shuffledRegular];
      
      setDoctors(allDoctors);
      setFilteredDoctors(allDoctors);
    } catch (e) {
      setDoctors([]);
      setFilteredDoctors([]);
    } finally {
      setLoading(false);
    }
  };



  const onRefresh = async () => {
    setRefreshing(true);
    await loadDoctors();
    setRefreshing(false);
  };

  const renderItem = ({ item }: { item: Doctor }) => (
    <TouchableOpacity 
      style={styles.card} 
      onPress={() => (navigation as any).navigate('DoctorDetails', { doctorId: item.id })}
      activeOpacity={0.7}
    >
      {/* صورة الطبيب مع الشارة المميزة */}
      <View style={styles.imageContainer}>
        <Image 
          source={{ uri: item.image || 'https://via.placeholder.com/80' }} 
          style={styles.avatar} 
        />
        {item.isFeatured && (
          <View style={styles.featuredBadge}>
            <Ionicons name="star" size={12} color={theme.colors.white} />
            <Text style={styles.featuredText}>{t('doctor.featured')}</Text>
          </View>
        )}
      </View>

      {/* معلومات الطبيب الرئيسية */}
      <View style={styles.infoContainer}>
        <View style={styles.nameContainer}>
          <Text style={styles.name} numberOfLines={2} ellipsizeMode="tail">{item.name}</Text>
          {item.isFeatured && (
            <Ionicons name="star" size={14} color="#FFD700" style={styles.starIcon} />
          )}
        </View>
        
        <View style={styles.specialtyContainer}>
          <Ionicons name="medical" size={14} color={theme.colors.primary} style={styles.specialtyIcon} />
          <Text style={styles.spec} numberOfLines={2} ellipsizeMode="tail">{item.specialty}</Text>
        </View>
        
        <View style={styles.locationContainer}>
          <Ionicons name="location" size={12} color={theme.colors.textSecondary} style={styles.locationIcon} />
          <Text style={styles.loc} numberOfLines={2} ellipsizeMode="tail">
            {mapProvinceToLocalized(item.province)}{item.area ? `, ${item.area}` : ''}
          </Text>
        </View>

        {/* معلومات إضافية */}
        <View style={styles.additionalInfo}>
          {item.experience && (
            <View style={styles.experienceContainer}>
              <Ionicons name="time" size={12} color={theme.colors.textSecondary} />
              <Text style={styles.experienceText} numberOfLines={1} ellipsizeMode="tail">
                {item.experience}
              </Text>
            </View>
          )}
          
          {item.rating && (
            <View style={styles.ratingContainer}>
              <Ionicons name="star" size={12} color="#FFD700" />
              <Text style={styles.ratingText} numberOfLines={1}>
                {item.rating.toFixed(1)}
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* زر الانتقال */}
      <View style={styles.arrowContainer}>
        <Ionicons name="chevron-forward" size={20} color={theme.colors.primary} />
      </View>
    </TouchableOpacity>
  );

  const renderFilterModal = () => {
    if (!showFilters) return null;
    
    return (
      <Modal
        visible={showFilters && !showCategoryModal && !showSpecialtyModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowFilters(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.filterModal}>
            <View style={styles.filterHeader}>
              <Text style={styles.filterTitle}>{t('filters.title')}</Text>
              <TouchableOpacity onPress={() => setShowFilters(false)}>
                <Ionicons name="close" size={24} color={theme.colors.textPrimary} />
              </TouchableOpacity>
            </View>
            

          <View style={styles.filterSection}>
            <Text style={styles.filterLabel}>
              {t('filters.province')} ({PROVINCES.length})
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.scrollContainer}
            >
              <TouchableOpacity
                style={[
                  styles.filterChip,
                  selectedProvince === '' && styles.filterChipActive,
                ]}
                onPress={() => {
                  setSelectedProvince('');
                }}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    selectedProvince === '' && styles.filterChipTextActive,
                  ]}
                >
                  {t('filters.all')}
                </Text>
              </TouchableOpacity>
              {PROVINCES.map((province) => (
                <TouchableOpacity
                  key={province}
                  style={[
                    styles.filterChip,
                    selectedProvince === province && styles.filterChipActive,
                  ]}
                  onPress={() => {
                    const next = selectedProvince === province ? '' : province;
                    setSelectedProvince(next);
                  }}
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      selectedProvince === province && styles.filterChipTextActive,
                    ]}
                  >
                    {mapProvinceToLocalized(province)}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* اختيار فئة التخصص */}
          <View style={styles.filterSection}>
            <Text style={styles.filterLabel}>{t('filters.specialty_category_optional')}</Text>
            <View style={styles.categoryButton}>
              <TouchableOpacity
                style={styles.categoryButtonContent}
                onPress={() => setShowCategoryModal(true)}
              >
                <Text style={styles.categoryButtonText}>
                  {selectedCategory ? mapCategoryToLocalized(selectedCategory) : t('filters.select_specialty_category_optional')}
                </Text>
                <Ionicons name="chevron-down" size={20} color={theme.colors.textSecondary} />
              </TouchableOpacity>
              {selectedCategory && (
                <TouchableOpacity 
                  onPress={() => setSelectedCategory('')}
                  style={styles.clearCategoryButton}
                >
                  <Ionicons name="close-circle" size={20} color={theme.colors.error} />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* اختيار التخصص */}
          <View style={styles.filterSection}>
            <Text style={styles.filterLabel}>{t('filters.specialty')}</Text>
            <TouchableOpacity
              style={styles.categoryButton}
              onPress={() => setShowSpecialtyModal(true)}
            >
              <Text style={styles.categoryButtonText}>
                {selectedSpecialty || t('filters.select_specialty')}
              </Text>
              <Ionicons name="chevron-down" size={20} color={theme.colors.textSecondary} />
            </TouchableOpacity>
            
            {/* رسالة توضيحية */}
            {selectedCategory && (
              <View style={styles.infoContainer}>
                <Ionicons name="information-circle" size={16} color={theme.colors.primary} />
                <Text style={styles.infoText}>
                  {t('filters.category_selected_info', { category: mapCategoryToLocalized(selectedCategory) })}
                </Text>
              </View>
            )}
          </View>

          <View style={styles.filterActions}>
            <TouchableOpacity style={styles.clearFiltersButton} onPress={clearFilters}>
              <Ionicons name="refresh" size={16} color={theme.colors.primary} />
              <Text style={styles.clearFiltersText}>{t('filters.clear')}</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.applyFilterButton}
              onPress={() => setShowFilters(false)}
            >
              <Text style={styles.applyFilterButtonText}>
                {t('filters.apply')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.primary} />
      
      {/* Header */}
      <View style={styles.header}> 
        <Text style={styles.headerTitle}>{t('user_home.recommended_doctors')}</Text>
        <TouchableOpacity 
          style={styles.filterButton}
          onPress={() => setShowFilters(true)}
        >
          <Ionicons 
            name="filter" 
            size={24} 
            color={theme.colors.white} 
          />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color={theme.colors.textSecondary} />
        <TextInput
          style={styles.searchInput}
          placeholder={t('search.placeholder')}
          value={searchQuery}
          onChangeText={(text) => {
            setSearchQuery(text);
          }}
          placeholderTextColor={theme.colors.textSecondary}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => { setSearchQuery(''); }} style={styles.clearSearchButton}>
            <Ionicons name="close-circle" size={20} color={theme.colors.textSecondary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Active Filters Display */}
      {(selectedSpecialty || selectedProvince) && (
        <View style={styles.activeFiltersContainer}>
          <Text style={styles.activeFiltersTitle}>{t('filters.applied')}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {selectedProvince && (
              <View style={styles.activeFilterChip}>
                <Text style={styles.activeFilterText}>{t('filters.province')}: {mapProvinceToLocalized(selectedProvince)}</Text>
                <TouchableOpacity onPress={() => { setSelectedProvince(''); }}>
                  <Ionicons name="close-circle" size={16} color={theme.colors.primary} />
                </TouchableOpacity>
              </View>
            )}
            {selectedSpecialty && (
              <View style={styles.activeFilterChip}>
                <Text style={styles.activeFilterText}>{t('filters.specialty')}: {mapSpecialtyToLocalized(selectedSpecialty)}</Text>
                <TouchableOpacity onPress={() => { setSelectedSpecialty(''); }}>
                  <Ionicons name="close-circle" size={16} color={theme.colors.primary} />
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>
        </View>
      )}

      {/* Results Count */}
      <View style={styles.resultsContainer}>
        <Text style={styles.resultsText}>
          {filteredDoctors.length} {t('doctors.available')}
          {(searchQuery || selectedSpecialty || selectedProvince) ? ` (${t('doctors.filtered')})` : ''}
        </Text>
      </View>

      {/* Doctors List */}
      <FlatList
        data={filteredDoctors}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            colors={[theme.colors.primary]}
            tintColor={theme.colors.primary}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="search" size={64} color={theme.colors.textSecondary} />
            <Text style={styles.emptyText}>
              {loading ? t('common.loading') : t('search.no_results')}
            </Text>
            <Text style={styles.emptySubtext}>
              {t('search.try_different_criteria')}
            </Text>
          </View>
        }
      />

      {/* Filter Modal */}
      {renderFilterModal()}

      {/* Modal لاختيار فئة التخصص */}
      <Modal
        visible={showCategoryModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowCategoryModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('filters.specialty_category')}</Text>
              <View style={styles.modalHeaderButtons}>
                <TouchableOpacity 
                  onPress={() => {
                    setShowCategoryModal(false);
                    setShowFilters(true);
                  }} 
                  style={styles.backButton}
                >
                  <Ionicons name="arrow-back" size={20} color={theme.colors.primary} />
                  <Text style={styles.backButtonText}>{t('filters.title')}</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setShowCategoryModal(false)} style={styles.closeButton}>
                  <Ionicons name="close" size={24} color={theme.colors.textSecondary} />
                </TouchableOpacity>
              </View>
            </View>
            
            <ScrollView style={styles.modalList}>
              {NEW_SPECIALTY_CATEGORIES.map((category, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.modalItem}
                  onPress={() => handleCategorySelect(category)}
                >
                  <Text style={styles.modalItemText}>{mapCategoryToLocalized(category)}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Modal لاختيار التخصص */}
      <Modal
        visible={showSpecialtyModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowSpecialtyModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('filters.specialty')}</Text>
              <View style={styles.modalHeaderButtons}>
                <TouchableOpacity 
                  onPress={() => {
                    setShowSpecialtyModal(false);
                    setShowFilters(true);
                  }} 
                  style={styles.backButton}
                >
                  <Ionicons name="arrow-back" size={20} color={theme.colors.primary} />
                  <Text style={styles.backButtonText}>{t('filters.title')}</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setShowSpecialtyModal(false)} style={styles.closeButton}>
                  <Ionicons name="close" size={24} color={theme.colors.textSecondary} />
                </TouchableOpacity>
              </View>
            </View>
            
            <ScrollView style={styles.modalList}>
              {selectedCategory ? (
                // إذا كان هناك فئة مختارة، اعرض التخصصات الخاصة بها
                getSpecialtiesByCategory(selectedCategory).map((specialty, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.modalItem}
                    onPress={() => handleSpecialtySelect(specialty.ar)}
                  >
                    <Text style={styles.modalItemText}>
                      {i18n.language === 'en' ? specialty.en : i18n.language === 'ku' ? specialty.ku : specialty.ar}
                    </Text>
                  </TouchableOpacity>
                ))
              ) : (
                // إذا لم تكن هناك فئة مختارة، اعرض جميع التخصصات
                MEDICAL_SPECIALTIES.map((specialty, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.modalItem}
                    onPress={() => handleSpecialtySelect(specialty.ar)}
                  >
                    <Text style={styles.modalItemText}>
                      {i18n.language === 'en' ? specialty.en : i18n.language === 'ku' ? specialty.ku : specialty.ar}
                    </Text>
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingTop: 50, 
    paddingBottom: 16, 
    paddingHorizontal: 16, 
    backgroundColor: theme.colors.primary 
  },
  headerTitle: { color: theme.colors.white, fontSize: 18, fontWeight: 'bold' },
  filterButton: {
    padding: 8,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.white,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: theme.colors.textPrimary,
    paddingVertical: 0,
    marginHorizontal: 12,
  },
  clearSearchButton: {
    padding: 4,
  },
  filtersContainer: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  filtersContent: {
    alignItems: 'center',
  },
  clearFiltersButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  clearFiltersText: {
    color: theme.colors.primary,
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  filterSectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: theme.colors.textPrimary,
  },
  resultsContainer: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  resultsText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    marginHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: theme.colors.border + '20',
  },
  imageContainer: {
    position: 'relative',
    marginRight: 16,
  },
  avatar: { 
    width: 60, 
    height: 60, 
    borderRadius: 30, 
    backgroundColor: theme.colors.background,
    borderWidth: 2,
    borderColor: theme.colors.primary + '20',
  },
  featuredBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#FFD700',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  featuredText: { 
    fontSize: 9, 
    color: theme.colors.white, 
    fontWeight: 'bold',
  },
  infoContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  name: { 
    fontSize: 16, 
    fontWeight: '700', 
    color: theme.colors.textPrimary,
    flex: 1,
    lineHeight: 20,
  },
  starIcon: {
    marginLeft: 6,
  },
  specialtyContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  specialtyIcon: {
    marginRight: 6,
    marginTop: 2,
  },
  spec: { 
    fontSize: 13, 
    color: theme.colors.primary,
    fontWeight: '600',
    flex: 1,
    lineHeight: 18,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  locationIcon: {
    marginRight: 6,
    marginTop: 2,
  },
  loc: { 
    fontSize: 12, 
    color: theme.colors.textSecondary,
    flex: 1,
    lineHeight: 16,
  },
  additionalInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  experienceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    flex: 1,
    marginRight: 8,
  },
  experienceText: {
    fontSize: 11,
    color: theme.colors.textSecondary,
    marginLeft: 4,
    fontWeight: '500',
    flex: 1,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF8E1',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    minWidth: 50,
  },
  ratingText: {
    fontSize: 11,
    color: '#F57C00',
    marginLeft: 4,
    fontWeight: '600',
  },
  arrowContainer: {
    marginLeft: 12,
    padding: 8,
  },
  listContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  emptyText: {
    fontSize: 18,
    color: theme.colors.textSecondary,
    marginTop: 10,
  },
  emptySubtext: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginTop: 5,
    textAlign: 'center',
  },
  filterModal: {
    backgroundColor: theme.colors.white,
    borderRadius: 20,
    width: '90%',
    maxHeight: '80%',
    padding: 24,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  filterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 20,
  },
  filterTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
  },
  filterSection: {
    width: '100%',
    marginBottom: 20,
  },
  filterLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: theme.colors.textPrimary,
  },
  scrollContainer: {
    alignItems: 'center',
  },
  filterChip: {
    backgroundColor: theme.colors.background,
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginRight: 8,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  filterChipActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  filterChipText: {
    color: theme.colors.textSecondary,
    fontSize: 14,
  },
  filterChipTextActive: {
    color: theme.colors.white,
  },
  filterActions: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 20,
  },
  applyFilterButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 12,
  },
  applyFilterButtonText: {
    color: theme.colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  activeFiltersContainer: {
    backgroundColor: theme.colors.background,
    borderRadius: 12,
    padding: 12,
    marginHorizontal: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  activeFiltersTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
    color: theme.colors.textPrimary,
  },
  activeFilterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginRight: 8,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  activeFilterText: {
    fontSize: 13,
    color: theme.colors.textPrimary,
    marginRight: 8,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: theme.colors.white,
    borderRadius: 20,
    maxHeight: '70%',
    width: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    flex: 1,
  },
  modalHeaderButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 12,
    backgroundColor: theme.colors.background,
    borderRadius: 8,
  },
  backButtonText: {
    fontSize: 14,
    color: theme.colors.primary,
    marginLeft: 4,
    fontWeight: '600',
  },
  closeButton: {
    padding: 4,
  },
  modalList: {
    maxHeight: 400,
  },
  modalItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  modalItemText: {
    fontSize: 16,
    color: theme.colors.textPrimary,
  },
  // Category button styles
  categoryButton: {
    backgroundColor: theme.colors.white,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  categoryButtonContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryButtonText: {
    fontSize: 16,
    color: theme.colors.textPrimary,
    flex: 1,
  },
  clearCategoryButton: {
    position: 'absolute',
    right: 12,
    top: 12,
    padding: 4,
  },
  infoText: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginLeft: 8,
    flex: 1,
    textAlign: 'right',
  },
});

export default AllDoctorsScreen;


