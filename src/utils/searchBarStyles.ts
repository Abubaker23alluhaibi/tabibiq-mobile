import { Platform, Dimensions } from 'react-native';
import { theme } from './theme';

const { width: screenWidth } = Dimensions.get('window');

// أنماط شريط البحث المحسنة لجميع الأجهزة
export const searchBarStyles = {
  // حاوية شريط البحث
  searchContainer: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingHorizontal: 16,
    marginTop: Platform.OS === 'ios' ? 12 : 8,
    marginBottom: Platform.OS === 'ios' ? 8 : 4,
  },

  // حاوية حقل البحث
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: theme.colors.white,
    borderRadius: Platform.OS === 'ios' ? 12 : 8,
    paddingHorizontal: Platform.OS === 'ios' ? 16 : 12,
    paddingVertical: Platform.OS === 'ios' ? 12 : 8,
    marginRight: 8,
    // أحجام ثابتة لجميع الأجهزة
    minHeight: 44,
    maxHeight: 44,
    // ظل خفيف
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },

  // حقل البحث
  searchInput: {
    flex: 1,
    fontSize: Platform.OS === 'ios' ? 16 : 15,
    color: theme.colors.textPrimary,
    marginLeft: 8,
    paddingVertical: 0, // إزالة padding إضافي
    textAlign: 'right' as const, // محاذاة النص لليمين للعربية
    // إزالة الخط تحت النص في الأندرويد
    textDecorationLine: 'none' as const,
    // تحسين عرض النص
    includeFontPadding: false,
  },

  // زر الفلتر
  filterButton: {
    width: 44,
    height: 44,
    borderRadius: Platform.OS === 'ios' ? 12 : 8,
    backgroundColor: theme.colors.white + '20',
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    // ظل خفيف
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },

  // أيقونة البحث
  searchIcon: {
    marginLeft: Platform.OS === 'ios' ? 4 : 2,
    opacity: 0.7,
  },

  // أيقونة الفلتر
  filterIcon: {
    opacity: 0.9,
  },

  // أنماط للشاشات الصغيرة
  compact: {
    searchContainer: {
      paddingHorizontal: 12,
      marginTop: 6,
      marginBottom: 4,
    },
    searchInputContainer: {
      paddingHorizontal: Platform.OS === 'ios' ? 14 : 10,
      paddingVertical: Platform.OS === 'ios' ? 10 : 6,
      minHeight: 40,
      maxHeight: 40,
    },
    searchInput: {
      fontSize: Platform.OS === 'ios' ? 15 : 14,
    },
    filterButton: {
      width: 40,
      height: 40,
    },
  },

  // أنماط للشاشات الكبيرة
  large: {
    searchContainer: {
      paddingHorizontal: 20,
      marginTop: 16,
      marginBottom: 12,
    },
    searchInputContainer: {
      paddingHorizontal: Platform.OS === 'ios' ? 18 : 16,
      paddingVertical: Platform.OS === 'ios' ? 14 : 10,
      minHeight: 48,
      maxHeight: 48,
    },
    searchInput: {
      fontSize: Platform.OS === 'ios' ? 17 : 16,
    },
    filterButton: {
      width: 48,
      height: 48,
    },
  },
};

// دالة للحصول على الأنماط المناسبة حسب حجم الشاشة
export const getResponsiveSearchBarStyles = () => {
  if (screenWidth < 360) {
    return { ...searchBarStyles, ...searchBarStyles.compact };
  } else if (screenWidth > 600) {
    return { ...searchBarStyles, ...searchBarStyles.large };
  }
  return searchBarStyles;
};

// أنماط إضافية للتحسين
export const enhancedSearchBarStyles = {
  // تأثيرات بصرية محسنة
  searchInputContainerEnhanced: {
    ...searchBarStyles.searchInputContainer,
    borderWidth: 1,
    borderColor: theme.colors.border,
    // تدرج لوني خفيف
    backgroundColor: theme.colors.white,
  },

  // تأثير التركيز
  searchInputContainerFocused: {
    borderColor: theme.colors.primary,
    shadowColor: theme.colors.primary,
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },

  // تأثير الضغط
  filterButtonPressed: {
    backgroundColor: theme.colors.white + '30',
    transform: [{ scale: 0.95 }],
  },
};












