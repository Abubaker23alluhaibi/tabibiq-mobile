// دالة لتحويل التخصصات من البيانات الخلفية إلى الأسماء العربية المعروضة
import i18n from '../locales';
import { MEDICAL_SPECIALTIES, getSpecialtyById, getSpecialtyByKey } from './medicalSpecialties';

// الحصول على مفاتيح التخصصات بالترتيب
const specialtyKeysInOrder = MEDICAL_SPECIALTIES.map(specialty => specialty.key);

export const mapSpecialtyToArabic = (specialty: string | number | null | undefined): string => {
  if (!specialty) {
    return 'غير محدد';
  }

  // تحويل الرقم إلى نص إذا كان رقماً
  const specialtyStr = String(specialty).trim();

  // إذا كان فارغاً
  if (!specialtyStr || specialtyStr === '') {
    return 'غير محدد';
  }

  // البحث عن التخصص بالرقم
  if (!isNaN(Number(specialtyStr))) {
    const specialtyById = getSpecialtyById(Number(specialtyStr));
    if (specialtyById) {
      return specialtyById.ar;
    }
  }

  // البحث عن التخصص بالمفتاح
  const specialtyByKey = getSpecialtyByKey(specialtyStr.toLowerCase());
  if (specialtyByKey) {
    return specialtyByKey.ar;
  }

  // البحث في التخصصات الموجودة بالفعل
  const existingSpecialty = MEDICAL_SPECIALTIES.find(s => 
    s.ar === specialtyStr || 
    s.en === specialtyStr || 
    s.ku === specialtyStr ||
    s.key === specialtyStr.toLowerCase()
  );

  if (existingSpecialty) {
    return existingSpecialty.ar;
  }

  // إذا كان الرقم غير معرف، حاول إرجاع تخصص افتراضي
  if (!isNaN(Number(specialtyStr))) {

    return 'الطب العام';
  }

  // إذا لم يتم العثور على التخصص، إرجاع القيمة الأصلية مع تحسين

  return specialtyStr;
};

// ترجمة حسب اللغة الحالية (ar/en/ku) باستخدام مفاتيح specialties من i18n
export const mapSpecialtyToLocalized = (specialty: string | number | null | undefined): string => {
  if (specialty === null || specialty === undefined) return i18n.t('common.not_specified');
  const raw = String(specialty).trim();
  if (!raw) return i18n.t('common.not_specified');

  // الحصول على اللغة الحالية
  const currentLanguage = i18n.language || 'ar';
  
  // إذا كان مفتاحًا قياسيًا
  const lower = raw.toLowerCase();
  if (specialtyKeysInOrder.includes(lower)) {
    const value = (i18n.t(`specialties.${lower}`) as any) || raw;
    return typeof value === 'string' ? value : raw;
  }

  // إذا كان رقماً (فهرسًا)
  if (!isNaN(Number(raw))) {
    const idx = Number(raw);
    const key = specialtyKeysInOrder[idx];
    if (key) {
      const value = (i18n.t(`specialties.${key}`) as any) || raw;
      return typeof value === 'string' ? value : raw;
    }
  }

  // البحث في التخصصات الطبية مباشرة أولاً
  const medicalSpecialty = MEDICAL_SPECIALTIES.find(s => 
    s.ar === raw || 
    s.en === raw || 
    s.ku === raw ||
    s.key === lower ||
    s.ar.toLowerCase() === lower ||
    s.en.toLowerCase() === lower ||
    s.ku.toLowerCase() === lower
  );

  if (medicalSpecialty) {
    // إرجاع التخصص باللغة المحددة
    switch (currentLanguage) {
      case 'en':
        return medicalSpecialty.en;
      case 'ku':
        return medicalSpecialty.ku;
      case 'ar':
      default:
        return medicalSpecialty.ar;
    }
  }

  // إذا كان نصاً باللغة العربية/الإنجليزية/الكردية، نحاول العثور على المفتاح بمقارنة القيم المحلية
  try {
    const specObj = i18n.t('specialties', { returnObjects: true }) as Record<string, string>;
    if (specObj) {
      const entry = Object.entries(specObj).find(([, v]) => String(v).toLowerCase() === lower);
      if (entry) return entry[1];
    }
  } catch {}

  // البحث الجزئي في التخصصات الطبية
  const partialMatch = MEDICAL_SPECIALTIES.find(s => 
    s.ar.includes(raw) || 
    s.en.toLowerCase().includes(lower) ||
    raw.includes(s.ar) ||
    lower.includes(s.en.toLowerCase())
  );

  if (partialMatch) {
    // إرجاع التخصص باللغة المحددة
    switch (currentLanguage) {
      case 'en':
        return partialMatch.en;
      case 'ku':
        return partialMatch.ku;
      case 'ar':
      default:
        return partialMatch.ar;
    }
  }

  // Debug: طباعة التخصص الذي لم يتم العثور عليه (في التطوير فقط)
  if (__DEV__) {
    // يمكن إضافة logging هنا إذا لزم الأمر
  }
  
  return raw || i18n.t('common.not_specified');
};

// دالة لتحويل التخصصات من العربية إلى الإنجليزية (للتسجيل)
export const mapSpecialtyToEnglish = (arabicSpecialty: string): string => {
  const specialty = MEDICAL_SPECIALTIES.find(s => s.ar === arabicSpecialty);
  return specialty ? specialty.en : arabicSpecialty;
};

// دالة للحصول على قائمة التخصصات العربية
export const getArabicSpecialties = (): string[] => {
  return MEDICAL_SPECIALTIES.map(specialty => specialty.ar);
};

// دالة لترجمة المحافظات حسب اللغة الحالية
export const mapProvinceToLocalized = (province: string | null | undefined): string => {
  if (province === null || province === undefined) return i18n.t('common.not_specified');
  const raw = String(province).trim();
  if (!raw) return i18n.t('common.not_specified');

  // الحصول على اللغة الحالية
  const currentLanguage = i18n.language || 'ar';
  
  // قائمة المحافظات العراقية مع ترجماتها
  const provincesMap: Record<string, { ar: string; en: string; ku: string }> = {
    'بغداد': { ar: 'بغداد', en: 'Baghdad', ku: 'بەغداد' },
    'البصرة': { ar: 'البصرة', en: 'Basra', ku: 'بەسرە' },
    'أربيل': { ar: 'أربيل', en: 'Erbil', ku: 'هەولێر' },
    'السليمانية': { ar: 'السليمانية', en: 'Sulaymaniyah', ku: 'سلێمانی' },
    'كركوك': { ar: 'كركوك', en: 'Kirkuk', ku: 'کەرکوک' },
    'النجف': { ar: 'النجف', en: 'Najaf', ku: 'نجف' },
    'كربلاء': { ar: 'كربلاء', en: 'Karbala', ku: 'کەربەلا' },
    'الديوانية': { ar: 'الديوانية', en: 'Diwaniyah', ku: 'دیوانیە' },
    'العمارة': { ar: 'العمارة', en: 'Amarah', ku: 'عەمارە' },
    'نينوى': { ar: 'نينوى', en: 'Nineveh', ku: 'نینەوا' },
    'الأنبار': { ar: 'الأنبار', en: 'Anbar', ku: 'ئەنبار' },
    'ذي قار': { ar: 'ذي قار', en: 'Dhi Qar', ku: 'ذی قار' },
    'صلاح الدين': { ar: 'صلاح الدين', en: 'Salah ad-Din', ku: 'سەلاحەدین' },
    'ديالى': { ar: 'ديالى', en: 'Diyala', ku: 'دیالە' },
    'بابل': { ar: 'بابل', en: 'Babil', ku: 'بابل' },
    'واسط': { ar: 'واسط', en: 'Wasit', ku: 'واسط' },
    'ميسان': { ar: 'ميسان', en: 'Maysan', ku: 'میسان' },
    'القادسية': { ar: 'القادسية', en: 'Qadisiyah', ku: 'قادسیە' },
    'المثنى': { ar: 'المثنى', en: 'Muthanna', ku: 'موثنا' },
    'دهوك': { ar: 'دهوك', en: 'Duhok', ku: 'دهۆک' },
    'حلبجة': { ar: 'حلبجة', en: 'Halabja', ku: 'هەڵەبجە' },
    // إضافة الترجمات العكسية
    'Baghdad': { ar: 'بغداد', en: 'Baghdad', ku: 'بەغداد' },
    'Basra': { ar: 'البصرة', en: 'Basra', ku: 'بەسرە' },
    'Erbil': { ar: 'أربيل', en: 'Erbil', ku: 'هەولێر' },
    'Sulaymaniyah': { ar: 'السليمانية', en: 'Sulaymaniyah', ku: 'سلێمانی' },
    'Kirkuk': { ar: 'كركوك', en: 'Kirkuk', ku: 'کەرکوک' },
    'Najaf': { ar: 'النجف', en: 'Najaf', ku: 'نجف' },
    'Karbala': { ar: 'كربلاء', en: 'Karbala', ku: 'کەربەلا' },
    'Diwaniyah': { ar: 'الديوانية', en: 'Diwaniyah', ku: 'دیوانیە' },
    'Amarah': { ar: 'العمارة', en: 'Amarah', ku: 'عەمارە' },
    'Nineveh': { ar: 'نينوى', en: 'Nineveh', ku: 'نینەوا' },
    'Anbar': { ar: 'الأنبار', en: 'Anbar', ku: 'ئەنبار' },
    'Dhi Qar': { ar: 'ذي قار', en: 'Dhi Qar', ku: 'ذی قار' },
    'Salah ad-Din': { ar: 'صلاح الدين', en: 'Salah ad-Din', ku: 'سەلاحەدین' },
    'Diyala': { ar: 'ديالى', en: 'Diyala', ku: 'دیالە' },
    'Babil': { ar: 'بابل', en: 'Babil', ku: 'بابل' },
    'Wasit': { ar: 'واسط', en: 'Wasit', ku: 'واسط' },
    'Maysan': { ar: 'ميسان', en: 'Maysan', ku: 'میسان' },
    'Qadisiyah': { ar: 'القادسية', en: 'Qadisiyah', ku: 'قادسیە' },
    'Muthanna': { ar: 'المثنى', en: 'Muthanna', ku: 'موثنا' },
    'Duhok': { ar: 'دهوك', en: 'Duhok', ku: 'دهۆک' },
    'Halabja': { ar: 'حلبجة', en: 'Halabja', ku: 'هەڵەبجە' },
  };

  // البحث عن المحافظة
  const provinceData = provincesMap[raw] || provincesMap[raw.toLowerCase()];
  
  if (provinceData) {
    switch (currentLanguage) {
      case 'en':
        return provinceData.en;
      case 'ku':
        return provinceData.ku;
      case 'ar':
      default:
        return provinceData.ar;
    }
  }

  // البحث الجزئي
  const partialMatch = Object.entries(provincesMap).find(([key, value]) => 
    key.toLowerCase().includes(raw.toLowerCase()) ||
    value.ar.includes(raw) ||
    value.en.toLowerCase().includes(raw.toLowerCase()) ||
    value.ku.includes(raw)
  );

  if (partialMatch) {
    const [, provinceData] = partialMatch;
    switch (currentLanguage) {
      case 'en':
        return provinceData.en;
      case 'ku':
        return provinceData.ku;
      case 'ar':
      default:
        return provinceData.ar;
    }
  }

  return raw || i18n.t('common.not_specified');
};

// ترجمة فئات التخصصات حسب اللغة الحالية
export const mapCategoryToLocalized = (category: string | null | undefined): string => {
  if (category === null || category === undefined) return i18n.t('common.not_specified');
  const raw = String(category).trim();
  if (!raw) return i18n.t('common.not_specified');

  const currentLanguage = i18n.language || 'ar';

  // القائمة الأساسية للفئات كما هي مستخدمة في البيانات (بالعربية)
  const categoriesMap: Record<string, { ar: string; en: string; ku: string }> = {
    'الطب العام والأساسي': { ar: 'الطب العام والأساسي', en: 'General & Basic Medicine', ku: 'پزیشکی گشتی و بنەڕەتی' },
    'التخصصات الباطنية': { ar: 'التخصصات الباطنية', en: 'Internal Medicine Specialties', ku: 'تایبەتمەندییەکانی ناوخۆ' },
    'التخصصات الجراحية': { ar: 'التخصصات الجراحية', en: 'Surgical Specialties', ku: 'تایبەتمەندییە جراحییەکان' },
    'تخصصات الرأس والأسنان': { ar: 'تخصصات الرأس والأسنان', en: 'Head & Dental Specialties', ku: 'تایبەتمەندییەکانی سەر و ددان' },
    'تخصصات الأطفال الدقيقة': { ar: 'تخصصات الأطفال الدقيقة', en: 'Pediatric Subspecialties', ku: 'تایبەتمەندی وردەکانی منداڵان' },
    'التخصصات الطبية المساندة': { ar: 'التخصصات الطبية المساندة', en: 'Medical Support Specialties', ku: 'تایبەتمەندییە پشتیوانە پزیشکییەکان' },
    'العلوم الطبية المساندة': { ar: 'العلوم الطبية المساندة', en: 'Allied Health Sciences', ku: 'زانستە هاوپۆلەکانێ تەندروستی' },
    'التخصصات الجديدة والمتطورة': { ar: 'التخصصات الجديدة والمتطورة', en: 'New & Emerging Specialties', ku: 'تایبەتمەندییە نوێ و پێشکەوتووەکان' },
  };

  const data = categoriesMap[raw] || categoriesMap[raw.toLowerCase()];
  if (!data) return raw || i18n.t('common.not_specified');

  switch (currentLanguage) {
    case 'en':
      return data.en;
    case 'ku':
      return data.ku;
    case 'ar':
    default:
      return data.ar;
  }
};
