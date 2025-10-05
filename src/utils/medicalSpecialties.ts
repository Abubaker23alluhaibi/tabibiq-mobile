// جميع التخصصات الطبية مع أكوادها باللغات الثلاث
export interface MedicalSpecialty {
  id: number;
  key: string;
  ar: string;
  en: string;
  ku: string;
  category: string;
}

export const MEDICAL_SPECIALTIES: MedicalSpecialty[] = [
  // 1. الطب العام والأساسي
  { id: 0, key: 'general_medicine', ar: 'الطب العام', en: 'General Medicine', ku: 'پزیشکی گشتی', category: 'الطب العام والأساسي' },
  { id: 1, key: 'family_medicine', ar: 'طب الأسرة', en: 'Family Medicine', ku: 'خێزان', category: 'الطب العام والأساسي' },
  { id: 2, key: 'pediatrics', ar: 'طب الأطفال', en: 'Pediatrics', ku: 'منداڵ', category: 'الطب العام والأساسي' },
  { id: 3, key: 'gynecology_obstetrics', ar: 'طب النساء والتوليد', en: 'Gynecology & Obstetrics', ku: 'ژن و لەدایکبوون', category: 'الطب العام والأساسي' },
  { id: 4, key: 'emergency_medicine', ar: 'الطوارئ', en: 'Emergency', ku: 'فوریت', category: 'الطب العام والأساسي' },
  { id: 5, key: 'geriatrics', ar: 'طب المسنين', en: 'Geriatrics', ku: 'پزیشکی پیران', category: 'الطب العام والأساسي' },
  { id: 6, key: 'community_medicine', ar: 'طب المجتمع', en: 'Community Medicine', ku: 'پزیشکی کۆمەڵگا', category: 'الطب العام والأساسي' },
  { id: 7, key: 'preventive_medicine', ar: 'طب الوقاية', en: 'Preventive Medicine', ku: 'پزیشکی پاراستن', category: 'الطب العام والأساسي' },

  // 2. التخصصات الباطنية
  { id: 8, key: 'internal_medicine', ar: 'الباطنية', en: 'Internal Medicine', ku: 'باطنی', category: 'التخصصات الباطنية' },
  { id: 9, key: 'cardiology', ar: 'أمراض القلب', en: 'Cardiology', ku: 'نەخۆشی دڵ', category: 'التخصصات الباطنية' },
  { id: 10, key: 'gastroenterology', ar: 'أمراض الجهاز الهضمي', en: 'Gastroenterology', ku: 'نەخۆشی هەزمەوەر', category: 'التخصصات الباطنية' },
  { id: 11, key: 'hematology', ar: 'أمراض الدم', en: 'Hematology', ku: 'نەخۆشی خوێن', category: 'التخصصات الباطنية' },
  { id: 12, key: 'nephrology', ar: 'الكلى', en: 'Nephrology', ku: 'کلی', category: 'التخصصات الباطنية' },
  { id: 13, key: 'endocrinology', ar: 'الغدد والسكري', en: 'Endocrinology & Diabetes', ku: 'غدد و شەکر', category: 'التخصصات الباطنية' },
  { id: 14, key: 'infectious_diseases', ar: 'الأمراض المعدية', en: 'Infectious Diseases', ku: 'نەخۆشی تووشبوو', category: 'التخصصات الباطنية' },
  { id: 15, key: 'rheumatology', ar: 'الروماتيزم', en: 'Rheumatology', ku: 'روماتیزم', category: 'التخصصات الباطنية' },
  { id: 16, key: 'oncology', ar: 'الأورام', en: 'Oncology', ku: 'ئۆرام', category: 'التخصصات الباطنية' },
  { id: 17, key: 'neurology', ar: 'الأعصاب', en: 'Neurology', ku: 'عەصاب', category: 'التخصصات الباطنية' },
  { id: 18, key: 'psychiatry', ar: 'الطب النفسي', en: 'Psychiatry', ku: 'دەروونی', category: 'التخصصات الباطنية' },
  { id: 19, key: 'immunology', ar: 'طب المناعة', en: 'Immunology', ku: 'پزیشکی بەرگری', category: 'التخصصات الباطنية' },
  { id: 20, key: 'pulmonology', ar: 'طب الصدر', en: 'Pulmonology', ku: 'پزیشکی سینگ', category: 'التخصصات الباطنية' },
  { id: 21, key: 'urology', ar: 'طب المسالك البولية', en: 'Urology', ku: 'پزیشکی میزڕۆژ', category: 'التخصصات الباطنية' },
  { id: 22, key: 'dermatology', ar: 'طب الجلد', en: 'Dermatology', ku: 'پزیشکی پێست', category: 'التخصصات الباطنية' },

  // 3. التخصصات الجراحية
  { id: 23, key: 'general_surgery', ar: 'الجراحة العامة', en: 'General Surgery', ku: 'جراحی گشتی', category: 'التخصصات الجراحية' },
  { id: 24, key: 'orthopedic_surgery', ar: 'جراحة العظام', en: 'Orthopedic Surgery', ku: 'جراحی عەظام', category: 'التخصصات الجراحية' },
  { id: 25, key: 'neurosurgery', ar: 'جراحة الأعصاب', en: 'Neurosurgery', ku: 'جراحی عەصاب', category: 'التخصصات الجراحية' },
  { id: 26, key: 'cardiothoracic_surgery', ar: 'جراحة القلب والصدر', en: 'Cardiothoracic Surgery', ku: 'جراحی دڵ و سەروو سەفەر', category: 'التخصصات الجراحية' },
  { id: 27, key: 'plastic_surgery', ar: 'جراحة التجميل', en: 'Plastic Surgery', ku: 'جراحی جوانکاری', category: 'التخصصات الجراحية' },
  { id: 28, key: 'vascular_surgery', ar: 'جراحة الأوعية الدموية', en: 'Vascular Surgery', ku: 'جراحی توێژینەوەی خوێن', category: 'التخصصات الجراحية' },
  { id: 29, key: 'urological_surgery', ar: 'جراحة المسالك البولية', en: 'Urology Surgery', ku: 'جراحی مەسالك', category: 'التخصصات الجراحية' },
  { id: 30, key: 'pediatric_surgery', ar: 'جراحة الأطفال', en: 'Pediatric Surgery', ku: 'جراحی منداڵ', category: 'التخصصات الجراحية' },
  { id: 31, key: 'ent_surgery', ar: 'جراحة الأنف والأذن والحنجرة', en: 'ENT Surgery', ku: 'جراحی گوش و لووت و حەنجەرە', category: 'التخصصات الجراحية' },
  { id: 32, key: 'maxillofacial_surgery', ar: 'جراحة الوجه والفكين', en: 'Maxillofacial Surgery', ku: 'جراحی دەندان و ڕوو و چاو', category: 'التخصصات الجراحية' },
  { id: 33, key: 'plastic_reconstructive_surgery', ar: 'جراحة التجميل والترميم', en: 'Plastic & Reconstructive Surgery', ku: 'جراحی جوانکاری و دووبارە دروستکردنەوە', category: 'التخصصات الجراحية' },
  { id: 34, key: 'laparoscopic_surgery', ar: 'جراحة المناظير', en: 'Laparoscopic Surgery', ku: 'جراحی مەنزەرە', category: 'التخصصات الجراحية' },

  // 4. تخصصات الرأس والأسنان
  { id: 35, key: 'ophthalmology', ar: 'العيون', en: 'Ophthalmology', ku: 'چاو', category: 'تخصصات الرأس والأسنان' },
  { id: 36, key: 'ent', ar: 'الأنف والأذن والحنجرة', en: 'ENT', ku: 'گوش و لووت و حەنجەرە', category: 'تخصصات الرأس والأسنان' },
  { id: 37, key: 'dentistry', ar: 'الأسنان', en: 'Dentistry', ku: 'دەندان', category: 'تخصصات الرأس والأسنان' },
  { id: 38, key: 'oral_medicine_surgery', ar: 'طب وجراحة الفم', en: 'Oral Medicine & Surgery', ku: 'پزیشکی و جراحی دەم', category: 'تخصصات الرأس والأسنان' },
  { id: 39, key: 'orthodontics', ar: 'تقويم الأسنان', en: 'Orthodontics', ku: 'ڕاستکردنەوەی دەندان', category: 'تخصصات الرأس والأسنان' },
  { id: 40, key: 'cosmetic_dentistry', ar: 'طب الأسنان التجميلي', en: 'Cosmetic Dentistry', ku: 'پزیشکی دەندان جوانکاری', category: 'تخصصات الرأس والأسنان' },

  // 5. تخصصات الأطفال الدقيقة
  { id: 41, key: 'neonatology', ar: 'حديثي الولادة', en: 'Neonatology', ku: 'تازە لەدایکبوو', category: 'تخصصات الأطفال الدقيقة' },
  { id: 42, key: 'pediatric_cardiology', ar: 'قلب الأطفال', en: 'Pediatric Cardiology', ku: 'دڵی منداڵ', category: 'تخصصات الأطفال الدقيقة' },
  { id: 43, key: 'pediatric_gastroenterology', ar: 'الجهاز الهضمي للأطفال', en: 'Pediatric Gastroenterology', ku: 'هەزمەوەری منداڵ', category: 'تخصصات الأطفال الدقيقة' },
  { id: 44, key: 'pediatric_neurology', ar: 'أعصاب الأطفال', en: 'Pediatric Neurology', ku: 'عەصابی منداڵ', category: 'تخصصات الأطفال الدقيقة' },
  { id: 45, key: 'pediatric_hematology', ar: 'أمراض الدم للأطفال', en: 'Pediatric Hematology', ku: 'نەخۆشی خوێنی منداڵ', category: 'تخصصات الأطفال الدقيقة' },
  { id: 46, key: 'pediatric_endocrinology', ar: 'أمراض الغدد للأطفال', en: 'Pediatric Endocrinology', ku: 'نەخۆشی غددی منداڵ', category: 'تخصصات الأطفال الدقيقة' },
  { id: 47, key: 'pediatric_nephrology', ar: 'أمراض الكلى للأطفال', en: 'Pediatric Nephrology', ku: 'نەخۆشی کلی منداڵ', category: 'تخصصات الأطفال الدقيقة' },
  { id: 48, key: 'pediatric_rheumatology', ar: 'أمراض الروماتيزم للأطفال', en: 'Pediatric Rheumatology', ku: 'نەخۆشی روماتیزمی منداڵ', category: 'تخصصات الأطفال الدقيقة' },

  // 6. التخصصات الطبية المساندة
  { id: 49, key: 'anesthesiology', ar: 'التخدير', en: 'Anesthesia', ku: 'تخدیر', category: 'التخصصات الطبية المساندة' },
  { id: 50, key: 'radiology', ar: 'الأشعة', en: 'Radiology', ku: 'ئاشعە', category: 'التخصصات الطبية المساندة' },
  { id: 51, key: 'nuclear_medicine', ar: 'الطب النووي', en: 'Nuclear Medicine', ku: 'پزیشکی نوو', category: 'التخصصات الطبية المساندة' },
  { id: 52, key: 'medical_laboratory', ar: 'التحاليل الطبية', en: 'Medical Laboratory', ku: 'تاقیکردنەوە', category: 'التخصصات الطبية المساندة' },
  { id: 53, key: 'physical_medicine_rehabilitation', ar: 'الطب الطبيعي والتأهيلي', en: 'Physical Medicine & Rehabilitation', ku: 'پزیشکی گەشەپێدەر', category: 'التخصصات الطبية المساندة' },
  { id: 54, key: 'sports_medicine', ar: 'الطب الرياضي', en: 'Sports Medicine', ku: 'وەرزشی', category: 'التخصصات الطبية المساندة' },
  { id: 55, key: 'forensic_medicine', ar: 'الطب الشرعي', en: 'Forensic Medicine', ku: 'پزیشکی یاسایی', category: 'التخصصات الطبية المساندة' },
  { id: 56, key: 'pain_medicine', ar: 'طب الألم', en: 'Pain Medicine', ku: 'پزیشکی ئازار', category: 'التخصصات الطبية المساندة' },
  { id: 57, key: 'occupational_medicine', ar: 'طب المهنة', en: 'Occupational Medicine', ku: 'پزیشکی پیشەیی', category: 'التخصصات الطبية المساندة' },
  { id: 58, key: 'public_health', ar: 'الصحة العامة', en: 'Public Health', ku: 'تەندروستی گشتی', category: 'التخصصات الطبية المساندة' },
  { id: 59, key: 'rehabilitation_medicine', ar: 'طب التأهيل', en: 'Rehabilitation Medicine', ku: 'پزیشکی ڕێکخستن', category: 'التخصصات الطبية المساندة' },
  { id: 60, key: 'palliative_care', ar: 'الرعاية التلطيفية', en: 'Palliative Care', ku: 'چاودێری ئاسوودە', category: 'التخصصات الطبية المساندة' },
  { id: 61, key: 'advanced_emergency_medicine', ar: 'طب الطوارئ المتقدم', en: 'Advanced Emergency Medicine', ku: 'پزیشکی فوریتی پێشکەوتوو', category: 'التخصصات الطبية المساندة' },
  { id: 62, key: 'intensive_care_medicine', ar: 'طب العناية المركزة', en: 'Intensive Care Medicine', ku: 'پزیشکی چاودێری چڕ', category: 'التخصصات الطبية المساندة' },

  // 7. العلوم الطبية المساندة
  { id: 63, key: 'nursing', ar: 'التمريض', en: 'Nursing', ku: 'پرستاری', category: 'العلوم الطبية المساندة' },
  { id: 64, key: 'clinical_nutrition', ar: 'التغذية العلاجية', en: 'Clinical Nutrition', ku: 'خواردنی پزیشکی', category: 'العلوم الطبية المساندة' },
  { id: 65, key: 'physical_therapy', ar: 'العلاج الطبيعي', en: 'Physical Therapy', ku: 'گەشەپێدانی جەستە', category: 'العلوم الطبية المساندة' },
  { id: 66, key: 'pharmacy', ar: 'الصيدلة', en: 'Pharmacy', ku: 'دەرمانسازی', category: 'العلوم الطبية المساندة' },
  { id: 67, key: 'medical_psychology', ar: 'علم النفس الطبي', en: 'Medical Psychology', ku: 'دەروونناسی پزیشکی', category: 'العلوم الطبية المساندة' },
  { id: 68, key: 'occupational_therapy', ar: 'العلاج الوظيفي', en: 'Occupational Therapy', ku: 'چارەسەری پیشەیی', category: 'العلوم الطبية المساندة' },
  { id: 69, key: 'speech_therapy', ar: 'علاج النطق', en: 'Speech Therapy', ku: 'چارەسەری قسەکردن', category: 'العلوم الطبية المساندة' },
  { id: 70, key: 'respiratory_therapy', ar: 'العلاج التنفسي', en: 'Respiratory Therapy', ku: 'چارەسەری هەناسە', category: 'العلوم الطبية المساندة' },
  { id: 71, key: 'medical_laboratory_technology', ar: 'تقنية المختبرات الطبية', en: 'Medical Laboratory Technology', ku: 'تەکنەلۆجی تاقیکردنەوەی پزیشکی', category: 'العلوم الطبية المساندة' },

  // 8. التخصصات الجديدة والمتطورة
  { id: 72, key: 'genomic_medicine', ar: 'طب الجينوم', en: 'Genomic Medicine', ku: 'پزیشکی جینۆم', category: 'التخصصات الجديدة والمتطورة' },
  { id: 73, key: 'stem_cell_medicine', ar: 'طب الخلايا الجذعية', en: 'Stem Cell Medicine', ku: 'پزیشکی خانەی بنەڕەت', category: 'التخصصات الجديدة والمتطورة' },
  { id: 74, key: 'personalized_medicine', ar: 'الطب الشخصي', en: 'Personalized Medicine', ku: 'پزیشکی کەسی', category: 'التخصصات الجديدة والمتطورة' },
  { id: 75, key: 'non_surgical_cosmetic_medicine', ar: 'طب التجميل غير الجراحي', en: 'Non-Surgical Cosmetic Medicine', ku: 'پزیشکی جوانکاری نە جەراحی', category: 'التخصصات الجديدة والمتطورة' },
  { id: 76, key: 'obesity_medicine', ar: 'طب السمنة', en: 'Obesity Medicine', ku: 'پزیشکی قەڵەوی', category: 'التخصصات الجديدة والمتطورة' },
  { id: 77, key: 'sleep_medicine', ar: 'طب النوم', en: 'Sleep Medicine', ku: 'پزیشکی خەو', category: 'التخصصات الجديدة والمتطورة' },
  { id: 78, key: 'travel_medicine', ar: 'طب السفر', en: 'Travel Medicine', ku: 'پزیشکی گەشت', category: 'التخصصات الجديدة والمتطورة' },
  { id: 79, key: 'space_medicine', ar: 'طب الفضاء', en: 'Space Medicine', ku: 'پزیشکی بۆشایی', category: 'التخصصات الجديدة والمتطورة' },
  { id: 80, key: 'diving_medicine', ar: 'طب الغوص', en: 'Diving Medicine', ku: 'پزیشکی مەلوان', category: 'التخصصات الجديدة والمتطورة' },
  { id: 81, key: 'advanced_sports_medicine', ar: 'طب الرياضة المتقدم', en: 'Advanced Sports Medicine', ku: 'پزیشکی وەرزشی پێشکەوتوو', category: 'التخصصات الجديدة والمتطورة' },
  { id: 82, key: 'advanced_geriatrics', ar: 'طب الشيخوخة المتقدم', en: 'Advanced Geriatrics', ku: 'پزیشکی پیرانی پێشکەوتوو', category: 'التخصصات الجديدة والمتطورة' },
  { id: 83, key: 'neuropathic_pain_medicine', ar: 'طب الألم العصبي', en: 'Neuropathic Pain Medicine', ku: 'پزیشکی ئازاری عەصابی', category: 'التخصصات الجديدة والمتطورة' },
  { id: 84, key: 'vascular_medicine', ar: 'طب الأوعية الدموية', en: 'Vascular Medicine', ku: 'پزیشکی خوێنڕاگ', category: 'التخصصات الجديدة والمتطورة' },
  { id: 85, key: 'immunology_allergy_medicine', ar: 'طب المناعة والتحسس', en: 'Immunology & Allergy Medicine', ku: 'پزیشکی بەرگری و هەستیاری', category: 'التخصصات الجديدة والمتطورة' },
];

// فئات التخصصات
export const SPECIALTY_CATEGORIES = [
  'الطب العام والأساسي',
  'التخصصات الباطنية',
  'التخصصات الجراحية',
  'تخصصات الرأس والأسنان',
  'تخصصات الأطفال الدقيقة',
  'التخصصات الطبية المساندة',
  'العلوم الطبية المساندة',
  'التخصصات الجديدة والمتطورة',
];

// دوال مساعدة
export const getSpecialtiesByCategory = (category: string): MedicalSpecialty[] => {
  return MEDICAL_SPECIALTIES.filter(specialty => specialty.category === category);
};

export const getSpecialtyById = (id: number): MedicalSpecialty | undefined => {
  return MEDICAL_SPECIALTIES.find(specialty => specialty.id === id);
};

export const getSpecialtyByKey = (key: string): MedicalSpecialty | undefined => {
  return MEDICAL_SPECIALTIES.find(specialty => specialty.key === key);
};

export const getAllSpecialties = (): MedicalSpecialty[] => {
  return MEDICAL_SPECIALTIES;
};

export const getSpecialtyNamesByLanguage = (language: 'ar' | 'en' | 'ku'): string[] => {
  return MEDICAL_SPECIALTIES.map(specialty => specialty[language]);
};

// دالة للحصول على التخصصات العربية فقط
export const getArabicSpecialties = (): string[] => {
  return MEDICAL_SPECIALTIES.map(specialty => specialty.ar);
};

// دالة للحصول على التخصصات الإنجليزية فقط
export const getEnglishSpecialties = (): string[] => {
  return MEDICAL_SPECIALTIES.map(specialty => specialty.en);
};

// دالة للحصول على التخصصات الكردية فقط
export const getKurdishSpecialties = (): string[] => {
  return MEDICAL_SPECIALTIES.map(specialty => specialty.ku);
};

// دالة لتحويل التخصص من العربية إلى الإنجليزية
export const mapSpecialtyToEnglish = (arabicSpecialty: string): string => {
  const specialty = MEDICAL_SPECIALTIES.find(s => s.ar === arabicSpecialty);
  return specialty ? specialty.en : arabicSpecialty;
};

// دالة لتحويل التخصص من الإنجليزية إلى العربية
export const mapSpecialtyToArabic = (englishSpecialty: string): string => {
  const specialty = MEDICAL_SPECIALTIES.find(s => s.en === englishSpecialty);
  return specialty ? specialty.ar : englishSpecialty;
};

// دالة لتحويل التخصص من العربية إلى الكردية
export const mapSpecialtyToKurdish = (arabicSpecialty: string): string => {
  const specialty = MEDICAL_SPECIALTIES.find(s => s.ar === arabicSpecialty);
  return specialty ? specialty.ku : arabicSpecialty;
};

// دالة للحصول على التخصصات حسب اللغة المحددة
export const getSpecialtiesByLanguage = (language: 'ar' | 'en' | 'ku'): { [key: string]: string } => {
  const result: { [key: string]: string } = {};
  MEDICAL_SPECIALTIES.forEach(specialty => {
    result[specialty.key] = specialty[language];
  });
  return result;
};
