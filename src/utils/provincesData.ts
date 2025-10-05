// بيانات المحافظات العراقية مع المناطق
export interface ProvinceData {
  id: string;
  name: {
    ar: string;
    en: string;
    ku: string;
  };
  areas: string[];
}

export const PROVINCES_DATA: ProvinceData[] = [
  {
    id: 'baghdad',
    name: {
      ar: 'بغداد',
      en: 'Baghdad',
      ku: 'بەغداد'
    },
    areas: [
      'الكرخ',
      'الرصافة',
      'المنصور',
      'الأعظمية',
      'الزيتون',
      'الدورة',
      'البياع',
      'الزعفرانية',
      'أبو غريب',
      'المحمودية',
      'اللطيفية',
      'الرشيد',
      'الطارمية',
      'التاجي',
      'الطارمية',
      'الفلوجة',
      'الرمادي',
      'الخالدية',
      'الخضراء',
      'الكرادة',
      'باب الشرقي',
      'باب المعظم',
      'شارع الرشيد',
      'شارع فلسطين',
      'شارع الكفاح',
      'شارع السعدون',
      'شارع الرشيد',
      'شارع فلسطين',
      'شارع الكفاح',
      'شارع السعدون'
    ]
  },
  {
    id: 'basra',
    name: {
      ar: 'البصرة',
      en: 'Basra',
      ku: 'بەسرە'
    },
    areas: [
      'المركز',
      'أبو الخصيب',
      'القرنة',
      'الزبير',
      'شط العرب',
      'الهارثة',
      'الطويلة',
      'البرجسية',
      'الخضراء',
      'الزبير',
      'شط العرب',
      'الهارثة',
      'الطويلة',
      'البرجسية',
      'الخضراء'
    ]
  },
  {
    id: 'nineveh',
    name: {
      ar: 'نينوى',
      en: 'Nineveh',
      ku: 'نینەوا'
    },
    areas: [
      'الموصل',
      'المركز',
      'الحمدانية',
      'تلعفر',
      'الشيخان',
      'البعاج',
      'سنجار',
      'تلعفر',
      'الشيخان',
      'البعاج',
      'سنجار'
    ]
  },
  {
    id: 'anbar',
    name: {
      ar: 'الأنبار',
      en: 'Anbar',
      ku: 'ئەنبار'
    },
    areas: [
      'الرمادي',
      'المركز',
      'الفلوجة',
      'الخالدية',
      'الخضراء',
      'الرطبة',
      'الرطبة',
      'الرطبة'
    ]
  },
  {
    id: 'dhi-qar',
    name: {
      ar: 'ذي قار',
      en: 'Dhi Qar',
      ku: 'ذی قار'
    },
    areas: [
      'الناصرية',
      'المركز',
      'الشطرة',
      'الرفاعي',
      'الجبايش',
      'القلعة',
      'الجبايش',
      'القلعة'
    ]
  },
  {
    id: 'salah-ad-din',
    name: {
      ar: 'صلاح الدين',
      en: 'Salah ad-Din',
      ku: 'سەلاحەدین'
    },
    areas: [
      'تكريت',
      'المركز',
      'بيجي',
      'الشرقاط',
      'بلد',
      'دور',
      'بلد',
      'دور'
    ]
  },
  {
    id: 'diyala',
    name: {
      ar: 'ديالى',
      en: 'Diyala',
      ku: 'دیالە'
    },
    areas: [
      'بعقوبة',
      'المركز',
      'الخالص',
      'بلدروز',
      'المقدادية',
      'خانقين',
      'بلدروز',
      'المقدادية',
      'خانقين'
    ]
  },
  {
    id: 'karbala',
    name: {
      ar: 'كربلاء',
      en: 'Karbala',
      ku: 'کەربەلا'
    },
    areas: [
      'المركز',
      'عين التمر',
      'الهندية',
      'عين التمر',
      'الهندية'
    ]
  },
  {
    id: 'najaf',
    name: {
      ar: 'النجف',
      en: 'Najaf',
      ku: 'نجف'
    },
    areas: [
      'المركز',
      'الكوفة',
      'المناذرة',
      'الكوفة',
      'المناذرة'
    ]
  },
  {
    id: 'babil',
    name: {
      ar: 'بابل',
      en: 'Babil',
      ku: 'بابل'
    },
    areas: [
      'الحلة',
      'المركز',
      'المسيب',
      'المحمودية',
      'الهاشمية',
      'المسيب',
      'المحمودية',
      'الهاشمية'
    ]
  },
  {
    id: 'wasit',
    name: {
      ar: 'واسط',
      en: 'Wasit',
      ku: 'واسط'
    },
    areas: [
      'الكوت',
      'المركز',
      'النعمانية',
      'الزبيرية',
      'الحي',
      'النعمانية',
      'الزبيرية',
      'الحي'
    ]
  },
  {
    id: 'maysan',
    name: {
      ar: 'ميسان',
      en: 'Maysan',
      ku: 'میسان'
    },
    areas: [
      'العمارة',
      'المركز',
      'المجر الكبير',
      'الخير',
      'الكوميت',
      'المجر الكبير',
      'الخير',
      'الكوميت'
    ]
  },
  {
    id: 'qadisiyah',
    name: {
      ar: 'القادسية',
      en: 'Qadisiyah',
      ku: 'قادسیە'
    },
    areas: [
      'الديوانية',
      'المركز',
      'الشنافية',
      'الغماس',
      'الشنافية',
      'الغماس'
    ]
  },
  {
    id: 'muthanna',
    name: {
      ar: 'المثنى',
      en: 'Muthanna',
      ku: 'موثنا'
    },
    areas: [
      'السماوة',
      'المركز',
      'الرموثة',
      'الخضر',
      'الرموثة',
      'الخضر'
    ]
  },
  {
    id: 'kirkuk',
    name: {
      ar: 'كركوك',
      en: 'Kirkuk',
      ku: 'کەرکوک'
    },
    areas: [
      'المركز',
      'داقوق',
      'الحويجة',
      'داقوق',
      'الحويجة'
    ]
  },
  {
    id: 'erbil',
    name: {
      ar: 'أربيل',
      en: 'Erbil',
      ku: 'هەولێر'
    },
    areas: [
      'المركز',
      'مخمور',
      'خبات',
      'مخمور',
      'خبات'
    ]
  },
  {
    id: 'duhok',
    name: {
      ar: 'دهوك',
      en: 'Duhok',
      ku: 'دهۆک'
    },
    areas: [
      'المركز',
      'زاخو',
      'أميدي',
      'زاخو',
      'أميدي'
    ]
  },
  {
    id: 'sulaymaniyah',
    name: {
      ar: 'السليمانية',
      en: 'Sulaymaniyah',
      ku: 'سلێمانی'
    },
    areas: [
      'المركز',
      'بنجوين',
      'رانية',
      'بنجوين',
      'رانية'
    ]
  },
  {
    id: 'halabja',
    name: {
      ar: 'حلبجة',
      en: 'Halabja',
      ku: 'هەڵەبجە'
    },
    areas: [
      'المركز',
      'بيارة',
      'شربازير',
      'بيارة',
      'شربازير'
    ]
  }
];

// دالة للحصول على اسم المحافظة باللغة المطلوبة
export const getProvinceName = (provinceId: string, language: 'ar' | 'en' | 'ku'): string => {
  const province = PROVINCES_DATA.find(p => p.id === provinceId);
  return province ? province.name[language] : provinceId;
};

// دالة للحصول على جميع المحافظات باللغة المطلوبة
export const getProvincesByLanguage = (language: 'ar' | 'en' | 'ku'): string[] => {
  return PROVINCES_DATA.map(p => p.name[language]);
};

// دالة للحصول على المناطق لمحافظة معينة
export const getAreasByProvince = (provinceId: string): string[] => {
  const province = PROVINCES_DATA.find(p => p.id === provinceId);
  return province ? province.areas : [];
};

// دالة للبحث عن محافظة بالاسم
export const findProvinceByName = (name: string, language: 'ar' | 'en' | 'ku'): ProvinceData | undefined => {
  return PROVINCES_DATA.find(p => 
    p.name[language].toLowerCase() === name.toLowerCase()
  );
};












