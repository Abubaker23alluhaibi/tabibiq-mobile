// أنواع التنقل
export type RootStackParamList = {
  Landing: undefined;
  Login: undefined;
  UserSignUp: undefined;
  DoctorSignUp: undefined;
  UserHome: undefined;
  DoctorDashboard: undefined;
  DoctorDetails: { doctor: Doctor };
  MyAppointments: undefined;
  UserProfile: undefined;
  DoctorProfile: undefined;
  DoctorAppointments: undefined;
  AdminDashboard: undefined;
  AdminLogin: undefined;
  MedicineReminder: undefined;
  HealthCenters: undefined;
  CenterLogin: undefined;
  CenterHome: undefined;
  DoctorCalendar: undefined;
  DoctorAnalytics: undefined;
  WorkTimesEditor: undefined;
  AppointmentDurationEditor: undefined;
  NotificationSettings: undefined;
  DoctorProfileEdit: undefined;
  UserProfileEdit: undefined;
};

// نوع المستخدم
export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  user_type: 'user' | 'doctor' | 'admin' | 'center';
  image?: string;
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
  is_verified: boolean;
  is_available: boolean;
  work_times: WorkTime[];
}

// نوع الموعد
export interface Appointment {
  id: string;
  patient_id: string;
  doctor_id: string;
  date: string;
  time: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  type: 'consultation' | 'follow_up' | 'emergency' | 'examination';
  notes?: string;
  created_at: string;
  updated_at: string;
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
  frequency: 'daily' | 'twice_daily' | 'three_times_daily' | 'weekly' | 'monthly';
  time: string;
  notes?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// نوع المركز الصحي
export interface HealthCenter {
  id: string;
  name: string;
  type: 'hospital' | 'clinic' | 'laboratory' | 'pharmacy';
  province: string;
  area: string;
  address: string;
  phone: string;
  email?: string;
  website?: string;
  rating?: number;
  reviews_count?: number;
  services: string[];
  working_hours: WorkTime[];
  image?: string;
  is_verified: boolean;
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
  total_revenue: number;
  average_rating: number;
  total_reviews: number;
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
  birth_date?: string;
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