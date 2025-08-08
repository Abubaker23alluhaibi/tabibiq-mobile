import { isRTL } from '../locales';

// الألوان الأساسية - مطابقة تماماً للواجهة الأمامية
export const colors = {
  // Primary colors
  primary: '#009688', // Turquoise/Teal
  primaryDark: '#00695C', // Darker turquoise
  primaryLight: '#B2DFDB',
  
  // Purple variations
  purple: '#7c4dff', // بنفسجي - مطابق للواجهة الأمامية
  purpleDark: '#5e35b1',
  purpleLight: '#b39ddb',
  
  // Teal variations
  teal: '#009688', // أخضر فاتح - بدلاً من الأزرق
  tealDark: '#00695C',
  tealLight: '#B2DFDB',
  
  // Gradient colors
  gradientStart: 'rgba(0, 150, 136, 0.9)', // Turquoise with opacity
  gradientEnd: 'rgba(0, 105, 92, 0.9)', // Darker turquoise with opacity
  
  // Button gradient colors
  buttonGradientStart: '#7c4dff', // بداية تدرج الأزرار
  buttonGradientEnd: '#00695C', // نهاية تدرج الأزرار - أخضر داكن
  
  // Status colors
  success: '#009688',
  warning: '#FF9800',
  error: '#F44336',
  info: '#2196F3',
  
  // Text colors
  textPrimary: '#333', // أسود داكن - مطابق للواجهة الأمامية
  textSecondary: '#666', // رمادي - مطابق للواجهة الأمامية
  textDisabled: '#BDBDBD',
  
  // Background colors
  background: '#f7fafd', // رمادي فاتح جداً - مطابق للواجهة الأمامية
  backgroundSecondary: '#FFFFFF', // أبيض
  backgroundTertiary: '#f8f9fa', // رمادي فاتح جداً - مطابق للواجهة الأمامية
  
  // Border colors
  border: '#e0e0e0', // رمادي فاتح للحدود - مطابق للواجهة الأمامية
  borderLight: '#f5f5f5',
  
  // Shadows
  shadow: 'rgba(0, 0, 0, 0.1)',
  shadowDark: 'rgba(0, 0, 0, 0.2)',
  
  // Overlays
  overlay: 'rgba(0, 0, 0, 0.5)',
  overlayLight: 'rgba(0, 0, 0, 0.3)',
  
  // Specific colors
  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',
  
  // Rating colors
  rating: '#FFD700',
  ratingEmpty: '#E0E0E0',
  
  // Health status colors
  healthGood: '#009688',
  healthWarning: '#FF9800',
  healthCritical: '#F44336',
  
  // Gender colors
  male: '#2196F3',
  female: '#E91E63',
  
  // Priority colors
  priorityLow: '#009688',
  priorityMedium: '#FF9800',
  priorityHigh: '#F44336',
  priorityUrgent: '#9C27B0',
  
  // Additional colors
  inputBackground: '#f8fafd', // خلفية حقول الإدخال - مطابق للواجهة الأمامية
  inputBorder: '#B2DFDB', // حدود حقول الإدخال - أخضر فاتح
  inputBorderFocus: '#009688', // حدود حقول الإدخال عند التركيز - أخضر
  cardBackground: '#FFFFFF', // خلفية البطاقات
  sectionBackground: '#f8f9fa', // خلفية الأقسام - مطابق للواجهة الأمامية
  
  // Alert colors
  alertSuccess: '#e8f5e8', // خلفية تنبيه النجاح
  alertSuccessText: '#2e7d32', // نص تنبيه النجاح
  alertSuccessBorder: '#c8e6c9', // حدود تنبيه النجاح
  
  alertError: '#ffebee', // خلفية تنبيه الخطأ
  alertErrorText: '#c62828', // نص تنبيه الخطأ
  alertErrorBorder: '#ffcdd2', // حدود تنبيه الخطأ
  
  // Additional button colors
  buttonOrange: '#ff9800', // برتقالي للأزرار
  buttonOrangeDark: '#ff5722', // برتقالي داكن للأزرار
  buttonGray: '#f5f5f5', // رمادي للأزرار
  buttonGrayText: '#666', // نص الأزرار الرمادية
  
  // Secondary colors
  secondary: '#FF9800', // برتقالي - للتوافق
  secondaryDark: '#F57C00',
  secondaryLight: '#FFB74D',
  accent: '#FFD93D', // أخضر - للتوافق
  accentDark: '#388E3C',
  accentLight: '#81C784',
};

// أحجام الخطوط
export const typography = {
  // أحجام العناوين
  h1: {
    fontSize: 32,
    fontWeight: 'bold' as const,
    lineHeight: 40,
  },
  h2: {
    fontSize: 28,
    fontWeight: 'bold' as const,
    lineHeight: 36,
  },
  h3: {
    fontSize: 24,
    fontWeight: 'bold' as const,
    lineHeight: 32,
  },
  h4: {
    fontSize: 20,
    fontWeight: '600' as const,
    lineHeight: 28,
  },
  h5: {
    fontSize: 18,
    fontWeight: '600' as const,
    lineHeight: 24,
  },
  h6: {
    fontSize: 16,
    fontWeight: '600' as const,
    lineHeight: 22,
  },
  
  // أحجام النصوص
  body1: {
    fontSize: 16,
    fontWeight: 'normal' as const,
    lineHeight: 24,
  },
  body2: {
    fontSize: 14,
    fontWeight: 'normal' as const,
    lineHeight: 20,
  },
  caption: {
    fontSize: 12,
    fontWeight: 'normal' as const,
    lineHeight: 16,
  },
  overline: {
    fontSize: 10,
    fontWeight: 'normal' as const,
    lineHeight: 14,
    textTransform: 'uppercase' as const,
  },
  
  // أحجام الأزرار
  button: {
    fontSize: 16,
    fontWeight: '600' as const,
    lineHeight: 24,
    textTransform: 'none' as const,
  },
  buttonSmall: {
    fontSize: 14,
    fontWeight: '600' as const,
    lineHeight: 20,
    textTransform: 'none' as const,
  },
};

// المسافات والهوامش
export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  
  // مسافات خاصة
  screenPadding: 16,
  cardPadding: 16,
  buttonPadding: 12,
  inputPadding: 12,
};

// أحجام العناصر
export const sizes = {
  // أحجام الأزرار
  buttonHeight: 48,
  buttonHeightSmall: 36,
  buttonHeightLarge: 56,
  
  // أحجام حقول الإدخال
  inputHeight: 48,
  inputHeightSmall: 40,
  
  // أحجام البطاقات
  cardBorderRadius: 12,
  cardBorderRadiusSmall: 8,
  cardBorderRadiusLarge: 16,
  
  // أحجام الأيقونات
  iconSize: 24,
  iconSizeSmall: 16,
  iconSizeLarge: 32,
  iconSizeXLarge: 48,
  
  // أحجام الصور
  avatarSize: 40,
  avatarSizeSmall: 32,
  avatarSizeLarge: 64,
  avatarSizeXLarge: 120,
  
  // أحجام الشعارات
  logoSize: 120,
  logoSizeSmall: 80,
  logoSizeLarge: 160,
};

// الظلال
export const shadows = {
  small: {
    shadowColor: colors.shadow,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 2,
  },
  medium: {
    shadowColor: colors.shadow,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.30,
    shadowRadius: 4.65,
    elevation: 4,
  },
  large: {
    shadowColor: colors.shadow,
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.37,
    shadowRadius: 7.49,
    elevation: 8,
  },
  extraLarge: {
    shadowColor: colors.shadow,
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.44,
    shadowRadius: 10.32,
    elevation: 16,
  },
};

// أنماط الأزرار
export const buttonStyles = {
  primary: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
    color: colors.white,
  },
  secondary: {
    backgroundColor: colors.secondary,
    borderColor: colors.secondary,
    color: colors.white,
  },
  outline: {
    backgroundColor: colors.transparent,
    borderColor: colors.primary,
    color: colors.primary,
  },
  ghost: {
    backgroundColor: colors.transparent,
    borderColor: colors.transparent,
    color: colors.primary,
  },
  danger: {
    backgroundColor: colors.error,
    borderColor: colors.error,
    color: colors.white,
  },
  success: {
    backgroundColor: colors.success,
    borderColor: colors.success,
    color: colors.white,
  },
  warning: {
    backgroundColor: colors.warning,
    borderColor: colors.warning,
    color: colors.white,
  },
};

// أنماط حقول الإدخال
export const inputStyles = {
  default: {
    borderColor: colors.border,
    backgroundColor: colors.background,
    color: colors.textPrimary,
  },
  focused: {
    borderColor: colors.primary,
    backgroundColor: colors.background,
    color: colors.textPrimary,
  },
  error: {
    borderColor: colors.error,
    backgroundColor: colors.background,
    color: colors.textPrimary,
  },
  disabled: {
    borderColor: colors.border,
    backgroundColor: colors.backgroundSecondary,
    color: colors.textDisabled,
  },
};

// أنماط البطاقات
export const cardStyles = {
  default: {
    backgroundColor: colors.background,
    borderColor: colors.border,
    borderRadius: sizes.cardBorderRadius,
  },
  elevated: {
    backgroundColor: colors.background,
    borderColor: colors.transparent,
    borderRadius: sizes.cardBorderRadius,
    ...shadows.medium,
  },
  outlined: {
    backgroundColor: colors.background,
    borderColor: colors.border,
    borderRadius: sizes.cardBorderRadius,
  },
};

// أنماط التنبيهات
export const alertStyles = {
  success: {
    backgroundColor: colors.success,
    color: colors.white,
    iconColor: colors.white,
  },
  warning: {
    backgroundColor: colors.warning,
    color: colors.white,
    iconColor: colors.white,
  },
  error: {
    backgroundColor: colors.error,
    color: colors.white,
    iconColor: colors.white,
  },
  info: {
    backgroundColor: colors.info,
    color: colors.white,
    iconColor: colors.white,
  },
};

// أنماط الشريط العلوي
export const headerStyles = {
  default: {
    backgroundColor: colors.background,
    borderBottomColor: colors.border,
    color: colors.textPrimary,
  },
  primary: {
    backgroundColor: colors.primary,
    borderBottomColor: colors.primaryDark,
    color: colors.white,
  },
  transparent: {
    backgroundColor: colors.transparent,
    borderBottomColor: colors.transparent,
    color: colors.textPrimary,
  },
};

// أنماط الشريط السفلي
export const tabBarStyles = {
  default: {
    backgroundColor: colors.background,
    borderTopColor: colors.border,
    activeColor: colors.primary,
    inactiveColor: colors.textSecondary,
  },
  primary: {
    backgroundColor: colors.primary,
    borderTopColor: colors.primaryDark,
    activeColor: colors.white,
    inactiveColor: colors.primaryLight,
  },
};

// أنماط القوائم
export const listStyles = {
  default: {
    backgroundColor: colors.background,
    borderColor: colors.border,
    color: colors.textPrimary,
  },
  elevated: {
    backgroundColor: colors.background,
    borderColor: colors.transparent,
    color: colors.textPrimary,
    ...shadows.small,
  },
};

// أنماط التحميل
export const loadingStyles = {
  default: {
    color: colors.primary,
    size: 'large' as const,
  },
  small: {
    color: colors.primary,
    size: 'small' as const,
  },
};

// أنماط الخريطة
export const mapStyles = {
  default: {
    backgroundColor: colors.backgroundSecondary,
    borderColor: colors.border,
  },
};

// أنماط التقويم
export const calendarStyles = {
  default: {
    backgroundColor: colors.background,
    borderColor: colors.border,
    selectedColor: colors.primary,
    todayColor: colors.accent,
    textColor: colors.textPrimary,
  },
};

// الثيم الكامل
export const theme = {
  colors: {
    // الألوان الأساسية - مطابقة للواجهة الأمامية
    primary: '#009688', // أخضر فاتح
    primaryDark: '#00695C', // أخضر داكن
    secondary: '#FF9800', // برتقالي
    accent: '#FFD93D', // أخضر
    
    // الألوان الجديدة من الواجهة الأمامية
    purple: '#7c4dff', // بنفسجي - مطابق للواجهة الأمامية
    purpleDark: '#5e35b1',
    purpleLight: '#b39ddb',
    
    teal: '#009688', // أخضر فاتح - مطابق للواجهة الأمامية
    tealDark: '#00695C',
    tealLight: '#B2DFDB',
    
    // ألوان التدرجات من الواجهة الأمامية
    gradientStart: 'rgba(0, 150, 136, 0.9)', // بداية التدرج الرئيسي
    gradientEnd: 'rgba(0, 105, 92, 0.9)', // نهاية التدرج الرئيسي
    
    // ألوان الأزرار من الواجهة الأمامية
    buttonGradientStart: '#7c4dff', // بداية تدرج الأزرار
    buttonGradientEnd: '#00695C', // نهاية تدرج الأزرار
    
    // ألوان النص - مطابقة للواجهة الأمامية
    textPrimary: '#333', // أسود داكن - مطابق للواجهة الأمامية
    textSecondary: '#666', // رمادي - مطابق للواجهة الأمامية
    textLight: '#BDBDBD', // رمادي فاتح
    
    // ألوان الخلفية - مطابقة للواجهة الأمامية
    background: '#f7fafd', // رمادي فاتح جداً - مطابق للواجهة الأمامية
    white: '#FFFFFF',
    
    // ألوان الحالة
    success: '#009688', // أخضر
    warning: '#FF9800', // برتقالي
    error: '#F44336', // أحمر
    info: '#2196F3', // أزرق
    
    // ألوان إضافية - مطابقة للواجهة الأمامية
    border: '#e0e0e0', // رمادي فاتح للحدود - مطابق للواجهة الأمامية
    shadow: '#000000', // أسود للظلال
    
    // ألوان إضافية من الواجهة الأمامية
    inputBackground: '#f8fafd', // خلفية حقول الإدخال - مطابق للواجهة الأمامية
    inputBorder: '#B2DFDB', // حدود حقول الإدخال - أخضر فاتح
    inputBorderFocus: '#009688', // حدود حقول الإدخال عند التركيز - أخضر
    cardBackground: '#FFFFFF', // خلفية البطاقات
    sectionBackground: '#f8f9fa', // خلفية الأقسام - مطابق للواجهة الأمامية
    
    // ألوان التنبيهات من الواجهة الأمامية
    alertSuccess: '#e8f5e8', // خلفية تنبيه النجاح
    alertSuccessText: '#2e7d32', // نص تنبيه النجاح
    alertSuccessBorder: '#c8e6c9', // حدود تنبيه النجاح
    
    alertError: '#ffebee', // خلفية تنبيه الخطأ
    alertErrorText: '#c62828', // نص تنبيه الخطأ
    alertErrorBorder: '#ffcdd2', // حدود تنبيه الخطأ
    
    // ألوان الأزرار الإضافية من الواجهة الأمامية
    buttonOrange: '#ff9800', // برتقالي للأزرار
    buttonOrangeDark: '#ff5722', // برتقالي داكن للأزرار
    buttonGray: '#f5f5f5', // رمادي للأزرار
    buttonGrayText: '#666', // نص الأزرار الرمادية
  },
  
  // أحجام الخطوط
  typography: {
    h1: {
      fontSize: 32,
      fontWeight: 'bold',
    },
    h2: {
      fontSize: 24,
      fontWeight: 'bold',
    },
    h3: {
      fontSize: 20,
      fontWeight: '600',
    },
    h4: {
      fontSize: 18,
      fontWeight: '600',
    },
    body: {
      fontSize: 16,
      fontWeight: 'normal',
    },
    bodySmall: {
      fontSize: 14,
      fontWeight: 'normal',
    },
    caption: {
      fontSize: 12,
      fontWeight: 'normal',
    },
  },
  
  // المسافات
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  
  // نصف قطر الزوايا
  borderRadius: {
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
    round: 50,
  },
  
  // الأحجام
  sizes: {
    // أحجام الأزرار
    buttonHeight: 48,
    buttonHeightSmall: 36,
    buttonHeightLarge: 56,
    
    // أحجام حقول الإدخال
    inputHeight: 48,
    inputHeightSmall: 40,
    
    // أحجام البطاقات
    cardBorderRadius: 12,
    cardBorderRadiusSmall: 8,
    cardBorderRadiusLarge: 16,
    
    // أحجام الأيقونات
    iconSize: 24,
    iconSizeSmall: 16,
    iconSizeLarge: 32,
    iconSizeXLarge: 48,
    
    // أحجام الصور
    avatarSize: 40,
    avatarSizeSmall: 32,
    avatarSizeLarge: 64,
    avatarSizeXLarge: 120,
    
    // أحجام الشعارات
    logoSize: 120,
    logoSizeSmall: 80,
    logoSizeLarge: 160,
  },
  
  // الظلال
  shadows: {
    small: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    medium: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
      elevation: 4,
    },
    large: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.2,
      shadowRadius: 16,
      elevation: 8,
    },
  },
  
  // أحجام الأيقونات
  iconSizes: {
    small: 16,
    medium: 24,
    large: 32,
    xlarge: 48,
  },
  
  // أحجام الأزرار
  buttonSizes: {
    small: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      fontSize: 14,
    },
    medium: {
      paddingHorizontal: 24,
      paddingVertical: 12,
      fontSize: 16,
    },
    large: {
      paddingHorizontal: 32,
      paddingVertical: 16,
      fontSize: 18,
    },
  },
  
  // أنماط الأزرار
  buttonStyles: {
    primary: {
      backgroundColor: '#009688',
      color: '#FFFFFF',
    },
    secondary: {
      backgroundColor: '#FF9800',
      color: '#FFFFFF',
    },
    outline: {
      backgroundColor: 'transparent',
      borderColor: '#009688',
      borderWidth: 1,
      color: '#009688',
    },
    ghost: {
      backgroundColor: 'transparent',
      color: '#009688',
    },
  },
  
  // أنماط الحقول
  inputStyles: {
    default: {
      backgroundColor: '#FFFFFF',
      borderColor: '#E0E0E0',
      borderWidth: 1,
      borderRadius: 8,
      paddingHorizontal: 16,
      paddingVertical: 12,
    },
    focused: {
      backgroundColor: '#FFFFFF',
      borderColor: '#009688',
      borderWidth: 2,
      borderRadius: 8,
      paddingHorizontal: 16,
      paddingVertical: 12,
    },
    error: {
      backgroundColor: '#FFFFFF',
      borderColor: '#F44336',
      borderWidth: 1,
      borderRadius: 8,
      paddingHorizontal: 16,
      paddingVertical: 12,
    },
  },
  
  // أنماط البطاقات
  cardStyles: {
    default: {
      backgroundColor: '#FFFFFF',
      borderRadius: 12,
      padding: 16,
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.1,
      shadowRadius: 3.84,
      elevation: 5,
  },
    elevated: {
      backgroundColor: '#FFFFFF',
      borderRadius: 12,
      padding: 16,
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 4,
      },
      shadowOpacity: 0.15,
      shadowRadius: 6.27,
      elevation: 8,
    },
  },
  
  // أنماط القوائم
  listStyles: {
    item: {
      backgroundColor: '#FFFFFF',
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: '#E0E0E0',
    },
    itemSelected: {
      backgroundColor: '#E3F2FD',
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: '#E0E0E0',
    },
  },
  
  // أنماط التنبيهات
  alertStyles: {
    success: {
      backgroundColor: '#E8F5E8',
      borderColor: '#009688',
      color: '#2E7D32',
    },
    warning: {
      backgroundColor: '#FFF3E0',
      borderColor: '#FF9800',
      color: '#E65100',
    },
    error: {
      backgroundColor: '#FFEBEE',
      borderColor: '#F44336',
      color: '#C62828',
    },
    info: {
      backgroundColor: '#E3F2FD',
      borderColor: '#2196F3',
      color: '#1565C0',
    },
  },
};

// دالة للحصول على لون الحالة
export const getStatusColor = (status: string) => {
  switch (status.toLowerCase()) {
    case 'success':
    case 'confirmed':
    case 'active':
      return theme.colors.success;
    case 'warning':
    case 'pending':
    case 'processing':
      return theme.colors.warning;
    case 'error':
    case 'cancelled':
    case 'inactive':
      return theme.colors.error;
    case 'info':
    case 'default':
    default:
      return theme.colors.info;
  }
};

// دالة للحصول على نمط الحقل
export const getInputStyle = (focused: boolean, hasError: boolean) => {
  if (hasError) return theme.inputStyles.error;
  if (focused) return theme.inputStyles.focused;
  return theme.inputStyles.default;
};

// دالة للحصول على نمط الزر
export const getButtonStyle = (variant: 'primary' | 'secondary' | 'outline' | 'ghost' = 'primary') => {
  return theme.buttonStyles[variant];
};

// دالة للحصول على نمط التنبيه
export const getAlertStyle = (type: 'success' | 'warning' | 'error' | 'info') => {
  return theme.alertStyles[type];
};

export default theme; 