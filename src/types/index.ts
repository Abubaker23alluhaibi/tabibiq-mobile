// أنواع التنقل
export type RootStackParamList = {
  Landing: undefined;
  Login: undefined;
  UserSignUp: undefined;
  UserHomeStack: undefined;
  DoctorDashboard: undefined;
  DoctorDetails: { doctorId: string };
  MyAppointments: undefined;
  UserProfile: undefined;
  DoctorProfile: undefined;
  DoctorAppointments: undefined;
  MedicineReminder: undefined;
  HealthCenters: undefined;
  CenterLogin: undefined;
  CenterHome: undefined;
  DoctorCalendar: undefined;
  DoctorAnalytics: undefined;
  AppointmentDurationEditor: undefined;
  NotificationSettings: undefined;
  Notifications: undefined;
  DoctorProfileEdit: undefined;
  UserProfileEdit: undefined;
  AllDoctors: undefined;
  ChangePassword: undefined;
  TopRatedDoctors: undefined;
  DoctorReviews: { doctorId: string };
};

// نوع المستخدم
export interface User {
  id: string;
  name: string;
  firstName?: string;
  first_name?: string;
  email: string;
  phone: string;
  user_type: 'user' | 'doctor' | 'admin' | 'center';
  disabled?: boolean; // حقل تعطيل الحساب الموقت
  image?: string;
  profileImage?: string;
  profile_image?: string;
  rating?: number;
  reviews_count?: number;
  created_at: string;
  updated_at: string;
}

// نوع الطبيب
export interface Doctor extends User {
  specialty: string;
  province: string;
  area: string;
  clinic_location: string;
  map_location?: string;
  about?: string;
  experience_years: number;
  appointment_duration: number;
  rating?: number;
  reviews_count?: number;
  averageRating?: number;
  totalRatings?: number;
  is_verified: boolean;
  is_available: boolean;
  work_times: WorkTime[];
  disabled?: boolean; // حقل تعطيل الحساب الموقت
}

// نوع الموعد - محدث ليتطابق مع قاعدة البيانات
export interface Appointment {
  id: string;
  userId: string; // معرف المستخدم (مريض)
  doctorId: string; // معرف الطبيب
  userName: string; // اسم المريض
  doctorName: string; // اسم الطبيب
  centerName?: string; // اسم المركز الصحي
  date: string; // التاريخ
  time: string; // الوقت
  reason?: string; // سبب الزيارة
  patientAge: number; // عمر المريض - إجباري
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  price?: number; // السعر
  notes?: string; // ملاحظات
  type: 'normal' | 'special_appointment'; // نوع الموعد
  patientPhone?: string; // رقم هاتف المريض
  duration: number; // مدة الموعد (دقائق)
  attendance: 'present' | 'absent'; // حالة الحضور
  attendanceTime?: string; // وقت تسجيل الحضور
  createdAt: string; // تاريخ الإنشاء
  updatedAt: string; // تاريخ التحديث
  
  // الحقول الجديدة للحجز لشخص آخر
  isBookingForOther?: boolean; // هل الحجز لشخص آخر؟
  patientName?: string; // اسم المريض الفعلي (عند الحجز لشخص آخر)
  bookerName?: string; // اسم الشخص الذي قام بالحجز
  
  // حقول احتياطية للتوافق مع الكود الحالي
  patient_id?: string; // معرف المريض (احتياطي)
  doctor_id?: string; // معرف الطبيب (احتياطي)
  age?: number; // العمر (احتياطي)
  created_at?: string; // تاريخ الإنشاء (احتياطي)
  updated_at?: string; // تاريخ التحديث (احتياطي)
  
  // علاقات (للتوافق مع الكود الحالي)
  patient?: User;
  doctor?: Doctor;
}

// نوع وقت العمل
export interface WorkTime {
  id: string;
  doctor_id: string;
  day: number; // 0 = الأحد، 1 = الاثنين، إلخ
  start_time: string;
  end_time: string;
  is_available: boolean;
}

// نوع يوم عدم التواجد (الإجازة)
export interface UnavailableDay {
  id?: string;
  doctor_id: string;
  date: string; // YYYY-MM-DD
  type: 'full_day' | 'partial_day';
  start_time?: string; // HH:MM (للأيام الجزئية فقط)
  end_time?: string; // HH:MM (للأيام الجزئية فقط)
  reason?: string;
  created_at?: string;
  updated_at?: string;
}

// نوع التقويم الشهري
export interface MonthCalendar {
  year: number;
  month: number;
  weeks: CalendarWeek[];
}

// نوع أسبوع التقويم
export interface CalendarWeek {
  weekNumber: number;
  days: CalendarDay[];
}

// نوع يوم التقويم
export interface CalendarDay {
  date: string; // YYYY-MM-DD
  dayOfMonth: number;
  dayOfWeek: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  isPast: boolean;
  isSelected: boolean;
  isUnavailable: boolean;
  unavailableType?: 'full_day' | 'partial_day';
  unavailableTimes?: {
    start: string;
    end: string;
  };
}

// نوع التقييم
export interface Review {
  id: string;
  patient_id: string;
  doctor_id: string;
  rating: number;
  comment?: string;
  created_at: string;
  patient?: User;
}

// نوع التذكير
export interface Reminder {
  id: string;
  user_id: string;
  medicine_name: string;
  dosage: string;
  frequency:
    | 'daily'
    | 'twice_daily'
    | 'three_times_daily'
    | 'weekly'
    | 'monthly';
  time: string;
  notes?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}


// نوع الإشعار
export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'appointment' | 'reminder' | 'system' | 'promotion';
  is_read: boolean;
  created_at: string;
  data?: any;
}

// نوع الإحصائيات
export interface Statistics {
  total_appointments: number;
  confirmed_appointments: number;
  pending_appointments: number;
  cancelled_appointments: number;
  completed_appointments: number;
  // إحصائيات الحضور
  total_attended: number;
  total_absent: number;
  total_not_marked: number;
  attendance_rate: number; // نسبة الحضور
  total_revenue: number;
  average_rating: number;
}

// نوع البحث
export interface SearchFilters {
  province?: string;
  specialty?: string;
  rating?: number;
  availability?: boolean;
  price_range?: {
    min: number;
    max: number;
  };
}

// نوع النتيجة
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// نوع الخطأ
export interface ApiError {
  message: string;
  code?: string;
  details?: any;
}

// نوع الحالة
export interface LoadingState {
  isLoading: boolean;
  error?: string;
}

// نوع الإعدادات
export interface Settings {
  language: 'ar' | 'en' | 'ku';
  notifications: {
    appointments: boolean;
    reminders: boolean;
    promotions: boolean;
    system: boolean;
  };
  theme: 'light' | 'dark' | 'auto';
  privacy: {
    share_location: boolean;
    share_contact: boolean;
    share_medical_info: boolean;
  };
}

// نوع الملف الشخصي
export interface Profile {
  id: string;
  user_id: string;

  gender?: 'male' | 'female';
  blood_type?: 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';
  height?: number; // بالسم
  weight?: number; // بالكيلوغرام
  allergies?: string[];
  medical_conditions?: string[];
  medications?: string[];
  emergency_contact?: {
    name: string;
    phone: string;
    relationship: string;
  };
}

// نوع الموقع
export interface Location {
  latitude: number;
  longitude: number;
  address?: string;
}

// نوع الملف
export interface File {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
  created_at: string;
}

// نوع الدفع
export interface Payment {
  id: string;
  appointment_id: string;
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  method: 'cash' | 'card' | 'online';
  created_at: string;
  updated_at: string;
}

// نوع التقارير
export interface Report {
  id: string;
  user_id: string;
  doctor_id: string;
  appointment_id: string;
  symptoms: string[];
  diagnosis?: string;
  prescription?: string[];
  notes?: string;
  created_at: string;
  updated_at: string;
}

// نوع الجدول الزمني
export interface Schedule {
  id: string;
  doctor_id: string;
  date: string;
  time_slots: TimeSlot[];
}

// نوع الفترة الزمنية
export interface TimeSlot {
  time: string;
  is_available: boolean;
  appointment_id?: string;
}

// نوع التصنيف
export interface Category {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  color?: string;
}

// نوع التخصص
export interface Specialty extends Category {
  parent_id?: string;
  children?: Specialty[];
}

// نوع المحافظة
export interface Province {
  id: string;
  name: string;
  areas: string[];
}

// نوع المنطقة
export interface Area {
  id: string;
  name: string;
  province_id: string;
}

// نوع الخدمة
export interface Service {
  id: string;
  name: string;
  description?: string;
  price?: number;
  duration?: number; // بالدقائق
  category_id: string;
}

// نوع العضو
export interface Member {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'moderator' | 'member';
  permissions: string[];
  created_at: string;
}

// نوع النشاط
export interface Activity {
  id: string;
  user_id: string;
  type: 'login' | 'appointment' | 'review' | 'payment';
  description: string;
  data?: any;
  created_at: string;
}

// نوع الإعدادات العامة
export interface AppSettings {
  version: string;
  maintenance_mode: boolean;
  features: {
    appointments: boolean;
    reviews: boolean;
    payments: boolean;
    notifications: boolean;
    chat: boolean;
  };
  limits: {
    max_appointments_per_day: number;
    max_reviews_per_user: number;
    max_file_size: number;
  };
}
