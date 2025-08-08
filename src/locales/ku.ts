export default {
  // وەرگێڕانی گشتی
  common: {
    ok: 'باشە',
    cancel: 'هەڵوەشاندنەوە',
    save: 'پاشەکەوت',
    edit: 'دەستکاری',
    delete: 'سڕینەوە',
    back: 'گەڕانەوە',
    next: 'داهاتوو',
    previous: 'پێشوو',
    search: 'گەڕان',
    filter: 'فلتەر',
    all: 'هەموو',
    see_all: 'بینینی هەموو',
    loading: 'چاوەڕوان...',
    error: 'هەڵە',
    success: 'سەرکەوتوو',
    warning: 'ئاگادارکردنەوە',
    info: 'زانیاری',
  },

  // پشتڕاستکردنەوە
  auth: {
    login: 'چوونەژوورەوە',
    signup: 'دروستکردنی هەژمار',
    logout: 'چوونەدەرەوە',
    logout_confirm: 'دڵنیای لە چوونەدەرەوە؟',
    email: 'ئیمەیڵ',
    password: 'وشەی نهێنی',
    confirm_password: 'دووپاتکردنەوەی وشەی نهێنی',
    full_name: 'ناوی تەواو',
    phone: 'ژمارەی مۆبایل',
    enter_email: 'ئیمەیڵەکەت بنووسە',
    enter_password: 'وشەی نهێنیت بنووسە',
    enter_full_name: 'ناوی تەواوت بنووسە',
    enter_phone: 'ژمارەی مۆبایلت بنووسە',
    create_account: 'دروستکردنی هەژماری نوێ',
    join_tabibiq: 'پەیوەندی بە پلاتفۆرمی TabibiQ بکە',
    already_have_account: 'هەژمارت هەیە؟',
    creating_account: 'دروستکردنی هەژمار...',
    signup_success: 'هەژمار بە سەرکەوتوویی دروستکرا',
    signup_success_message: 'هەژمارەکەت بە سەرکەوتوویی دروستکرا! ئێستا دەتوانیت چوونەژوورەوە بکەیت.',
    doctor_signup_success_message: 'هەژماری دکتۆر بە سەرکەوتوویی دروستکرا! داواکاریەکەت بەم زووانە پێداچوونەوەی بۆ دەکرێت.',
    signup_error: 'هەڵە لە دروستکردنی هەژمار',
    signup_error_message: 'هەڵەیەک ڕوویدا لە کاتی دروستکردنی هەژمارەکەت. تکایە دووبارە هەوڵ بدە.',
    login_error: 'هەڵە لە چوونەژوورەوە',
    login_error_message: 'ئیمەیڵ یان وشەی نهێنی هەڵەیە.',
    doctor_signup: 'چوونەژوورەوە وەک دکتۆر',
    signup_as_doctor: 'چوونەژوورەوە وەک دکتۆر',
    doctor_registration: 'تۆمارکردنی دکتۆر',
    step: 'هەنگاو',
    specialty: 'تایبەتمەندی',
    province: 'پارێزگا',
    area: 'ناوچە',
    clinic_location: 'شوێنی کلینیک',
    map_location: 'لینکی شوێن لە نەخشە',
    about: 'دەربارەی تۆ',
    experience_years: 'ساڵەکانی ئەزموون',
    appointment_duration: 'ماوەی نەشتەرگەری (خولەک)',
    select_specialty: 'تایبەتمەندی هەڵبژێرە',
    select_province: 'پارێزگا هەڵبژێرە',
    enter_area: 'ناوچە بنووسە',
    enter_clinic_location: 'شوێنی کلینیک بنووسە',
    enter_experience_years: 'ساڵەکانی ئەزموون بنووسە',
    enter_about: 'دەربارەی خۆت بنووسە',
    profile_image: 'وێنەی پڕۆفایل',
    select_image: 'وێنە هەڵبژێرە',
    registration_summary: 'کورتەی تۆمارکردن',
    name: 'ناو',
    location: 'شوێن',
    complete_registration: 'تەواوکردنی تۆمارکردن',
  },

  // پشتڕاستکردنەوەی داتا
  validation: {
    name_required: 'ناو پێویستە',
    email_required: 'ئیمەیڵ پێویستە',
    email_invalid: 'فۆرماتی ئیمەیڵ هەڵەیە',
    phone_required: 'ژمارەی مۆبایل پێویستە',
    password_required: 'وشەی نهێنی پێویستە',
    password_length: 'وشەی نهێنی دەبێت لانیکەم ٦ پیت بێت',
    password_mismatch: 'وشە نهێنییەکان وەک یەک نین',
    specialty_required: 'تایبەتمەندی پێویستە',
    province_required: 'پارێزگا پێویستە',
    area_required: 'ناوچە پێویستە',
    clinic_location_required: 'شوێنی کلینیک پێویستە',
  },

  // پەڕەی سەرەکی بەکارهێنەر
  user_home: {
    welcome: 'بەخێربێیت',
    appointments: 'نەشتەرگەرییەکان',
    reminders: 'ئەبەسەرھاتنەکان',
    favorites: 'دڵخۆشەکان',
    recommended_doctors: 'دکتۆرە پێشنیارکراوەکان',
  },

  // دکتۆر
  doctor: {
    available: 'بەردەستە',
    today: 'ئەمڕۆ',
    this_week: 'ئەم هەفتانە',
    this_month: 'ئەم مانگانە',
    total: 'کۆی گشتی',
    today_appointments: 'نەشتەرگەرییەکانی ئەمڕۆ',
    calendar: 'ڕۆژژمێر',
    analytics: 'شیکردنەوە',
    profile: 'پڕۆفایل',
  },

  // نەشتەرگەرییەکان
  appointment: {
    book: 'نەشتەرگەری تۆمار بکە',
    confirmed: 'پشتڕاستکراوەتەوە',
    pending: 'چاوەڕوان',
    cancelled: 'هەڵوەشێندراوەتەوە',
    consultation: 'ڕاوێژ',
    follow_up: 'دووپاتکردنەوە',
    emergency: 'ناوچەپێویست',
    call: 'پەیوەندی',
    message: 'پەیام',
    notes: 'تێبینییەکان',
    details: 'وردەکارییەکان',
    cancel: 'هەڵوەشاندنەوە',
    book_now: 'ئێستا تۆمار بکە',
  },

  // نەشتەرگەرییەکان (پەڕەی نەشتەرگەرییەکان)
  appointments: {
    my_appointments: 'نەشتەرگەرییەکانم',
    no_appointments: 'هیچ نەشتەرگەرییەک نییە',
    no_appointments_subtitle: 'هێشتا هیچ نەشتەرگەرییەکت تۆمار نەکردووە. دەست پێبکە بە گەڕان بۆ دکتۆر و تۆمارکردنی نەشتەرگەری.',
  },

  // گەڕان
  search: {
    find_doctor: 'دکتۆر بدۆزەوە',
    filters: 'فلتەرەکان',
    province: 'پارێزگا',
    specialty: 'تایبەتمەندی',
    apply_filters: 'جێبەجێکردنی فلتەرەکان',
  },

  // ئەبەسەرھاتنی دەرمان
  medicine_reminder: {
    title: 'ئەبەسەرھاتنی دەرمان',
  },

  // ناوەندە تەندروستییەکان
  health_centers: {
    title: 'ناوەندە تەندروستییەکان',
  },

  // پڕۆفایل
  profile: {
    title: 'پڕۆفایل',
    edit: 'دەستکاری پڕۆفایل',
    edit_coming_soon: 'تایبەتمەندی دەستکاری بەم زووانە بەردەست دەبێت',
  },

  // بەڕێوەبەری
  admin: {
    login: 'چوونەژوورەوەی بەڕێوەبەری',
    dashboard: 'داشبۆرد',
  },

  // ناوەند
  center: {
    login: 'چوونەژوورەوەی ناوەند',
    home: 'ناوەندی تەندروستی',
  },

  // پارێزگاکان
  provinces: [
    'بەغداد',
    'بەسرە',
    'مووسڵ',
    'هەولێر',
    'سلێمانی',
    'کەرکوک',
    'نجەف',
    'کەربەلا',
    'حلە',
    'دیوانیە',
    'عەمارە',
    'ناسریە',
    'زوبەیر',
    'زوبەیر',
    'زوبەیر',
    'زوبەیر',
    'زوبەیر',
    'زوبەیر',
  ],

  // تایبەتمەندییەکان
  specialties: {
    cardiology: 'دڵناسی',
    pediatrics: 'منداڵناسی',
    orthopedics: 'ئێسکناسی',
    neurology: 'دەماری',
    dermatology: 'پێستناسی',
    ophthalmology: 'چاڤناسی',
    dentistry: 'ددانناسی',
    psychiatry: 'دەروونناسی',
    gynecology: 'ژنانناسی',
    urology: 'میزڕێژناسی',
    gastroenterology: 'گەدە و ڕیخۆڵەناسی',
    endocrinology: 'دەرەقناسی',
    oncology: 'شێرپەنجەناسی',
    rheumatology: 'ڕیوومەتیزناسی',
    pulmonology: 'سییەناسی',
    nephrology: 'گورچیلەناسی',
    hematology: 'خوێنناسی',
    immunology: 'بەرگریناسی',
    infectious_diseases: 'نەخۆشی بەرگرییەکان',
    emergency_medicine: 'پزیشکی ناوچەپێویست',
    family_medicine: 'پزیشکی خێزان',
    internal_medicine: 'پزیشکی ناوەوە',
    surgery: 'نەشتەرگەری گشتی',
    plastic_surgery: 'نەشتەرگەری جوانکاری',
    neurosurgery: 'نەشتەرگەری دەمار',
    cardiothoracic_surgery: 'نەشتەرگەری دڵ و سییە',
    vascular_surgery: 'نەشتەرگەری خوێنبەر',
    orthopedic_surgery: 'نەشتەرگەری ئێسک',
    pediatric_surgery: 'نەشتەرگەری منداڵان',
    urological_surgery: 'نەشتەرگەری میزڕێژ',
    gynecological_surgery: 'نەشتەرگەری ژنان',
    maxillofacial_surgery: 'نەشتەرگەری دەم و دەموچاو',
    anesthesiology: 'بێهۆشکردن',
    radiology: 'تیشکناسی',
    pathology: 'نەخۆشیناسی',
    laboratory_medicine: 'پزیشکی تاقیگە',
    nuclear_medicine: 'پزیشکی ئەتۆمی',
    physical_medicine: 'پزیشکی جەستەیی',
    sports_medicine: 'پزیشکی وەرزش',
    occupational_medicine: 'پزیشکی پیشەیی',
    preventive_medicine: 'پزیشکی پاراستن',
    geriatrics: 'پزیشکی بەتەمەن',
    palliative_care: 'چاودێری ئارامکردن',
  },

  // پۆلەکانی تایبەتمەندی
  specialty_categories: [
    {
      category: 'پزیشکی ناوەوە',
      specialties: [
        'دڵناسی',
        'پزیشکی ناوەوە',
        'گەدە و ڕیخۆڵەناسی',
        'دەرەقناسی',
        'ڕیوومەتیزناسی',
        'سییەناسی',
        'گورچیلەناسی',
        'خوێنناسی',
        'بەرگریناسی',
        'نەخۆشی بەرگرییەکان',
      ],
    },
    {
      category: 'نەشتەرگەری',
      specialties: [
        'نەشتەرگەری گشتی',
        'نەشتەرگەری جوانکاری',
        'نەشتەرگەری دەمار',
        'نەشتەرگەری دڵ و سییە',
        'نەشتەرگەری خوێنبەر',
        'نەشتەرگەری ئێسک',
        'نەشتەرگەری منداڵان',
        'نەشتەرگەری میزڕێژ',
        'نەشتەرگەری ژنان',
        'نەشتەرگەری دەم و دەموچاو',
      ],
    },
    {
      category: 'منداڵناسی',
      specialties: [
        'منداڵناسی',
        'نەشتەرگەری منداڵان',
      ],
    },
    {
      category: 'ژنانناسی',
      specialties: [
        'ژنانناسی',
        'نەشتەرگەری ژنان',
      ],
    },
    {
      category: 'ددانناسی',
      specialties: [
        'ددانناسی',
        'نەشتەرگەری دەم و دەموچاو',
      ],
    },
    {
      category: 'دەروونناسی',
      specialties: [
        'دەروونناسی',
      ],
    },
    {
      category: 'چاڤناسی',
      specialties: [
        'چاڤناسی',
      ],
    },
    {
      category: 'پێستناسی',
      specialties: [
        'پێستناسی',
      ],
    },
    {
      category: 'دەماری',
      specialties: [
        'دەماری',
        'نەشتەرگەری دەمار',
      ],
    },
    {
      category: 'ئێسکناسی',
      specialties: [
        'ئێسکناسی',
        'نەشتەرگەری ئێسک',
      ],
    },
    {
      category: 'میزڕێژناسی',
      specialties: [
        'میزڕێژناسی',
        'نەشتەرگەری میزڕێژ',
      ],
    },
    {
      category: 'شێرپەنجەناسی',
      specialties: [
        'شێرپەنجەناسی',
      ],
    },
    {
      category: 'پزیشکی ناوچەپێویست',
      specialties: [
        'پزیشکی ناوچەپێویست',
      ],
    },
    {
      category: 'پزیشکی خێزان',
      specialties: [
        'پزیشکی خێزان',
      ],
    },
    {
      category: 'پزیشکی جەستەیی',
      specialties: [
        'پزیشکی جەستەیی',
        'پزیشکی وەرزش',
        'پزیشکی پیشەیی',
      ],
    },
    {
      category: 'پزیشکی پاراستن',
      specialties: [
        'پزیشکی پاراستن',
        'پزیشکی بەتەمەن',
        'چاودێری ئارامکردن',
      ],
    },
    {
      category: 'دەستنیشانکردن و چارەسەر',
      specialties: [
        'بێهۆشکردن',
        'تیشکناسی',
        'نەخۆشیناسی',
        'پزیشکی تاقیگە',
        'پزیشکی ئەتۆمی',
      ],
    },
  ],

  // پەڕەی سەرەکی
  landing: {
    title: 'پلاتفۆرمی TabibiQ',
    highlight: 'پێشەنگ',
    subtitle: 'پەیوەندی نەخۆشەکان بە دکتۆر و ناوەندە تەندروستییەکان بە ئاسانی و سەلامەتی',
    stats: {
      doctors: 'دکتۆر',
      patients: 'نەخۆش',
      appointments: 'نەشتەرگەری',
    },
  },
}; 