import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  TextInput,
  Modal,
  Dimensions,
  Linking,
  Clipboard,
  Platform, // ✅ تمت إضافته هنا
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { Calendar } from 'react-native-calendars';
import { theme } from '../utils/theme';
import { api } from '../services/api';
import { API_CONFIG } from '../config/api';
import { APP_CONFIG } from '../config/constants';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../contexts/NotificationContext';
import { mapSpecialtyToLocalized, mapProvinceToLocalized } from '../utils/specialtyMapper';
import StarRating from '../components/StarRating';
import Toast from '../components/Toast';
import CustomModal from '../components/CustomModal';
import { useToast } from '../hooks/useToast';
import { useModal } from '../hooks/useModal';

interface DoctorDetailsScreenProps {
  route: {
    params: {
      doctorId: string;
    };
  };
}

const { width } = Dimensions.get('window');

const DoctorDetailsScreen: React.FC<DoctorDetailsScreenProps> = ({ route }) => {
  const { doctorId } = route.params;
  const navigation = useNavigation();
  const { t } = useTranslation();
  const { user, profile } = useAuth();
  const {
    sendAppointmentNotificationToDoctor,
    refreshDoctorNotifications,
    scheduleAppointmentReminder,
  } = useNotifications();
  const { toast, showToast, hideToast } = useToast();
  const { modal, showModal, hideModal, showAlert, showError } = useModal();
  
  // ✅ Ref for ScrollView to handle auto-scrolling
  const scrollViewRef = useRef<ScrollView>(null);
  const [ratingSectionY, setRatingSectionY] = useState(0);

  const [doctor, setDoctor] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [reason, setReason] = useState('');
  const [age, setAge] = useState('');
  const [availableTimes, setAvailableTimes] = useState<string[]>([]);
  const [bookedTimes, setBookedTimes] = useState<string[]>([]);
  const [showCalendar, setShowCalendar] = useState(false);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showBookingForOtherModal, setShowBookingForOtherModal] = useState(false);
  const [isBookingForOther, setIsBookingForOther] = useState(false);
  const [patientName, setPatientName] = useState('');
  const [patientPhone, setPatientPhone] = useState('');
  const [patientAge, setPatientAge] = useState('');
  const [visibleMonthDate, setVisibleMonthDate] = useState<Date>(new Date());
  const [unavailableDays, setUnavailableDays] = useState<any[]>([]);
  
  // Rating states
  const [userRating, setUserRating] = useState(0);
  const [userComment, setUserComment] = useState('');
  const [ratingLoading, setRatingLoading] = useState(false);
  const [userExistingRating, setUserExistingRating] = useState<any>(null);
  const [isEditingRating, setIsEditingRating] = useState(false);

  // --- Helper Functions ---
  const toWesternDigits = (input: string) => {
    if (!input) return '';
    const map: Record<string, string> = { '٠': '0', '١': '1', '٢': '2', '٣': '3', '٤': '4', '٥': '5', '٦': '6', '٧': '7', '٨': '8', '٩': '9' };
    return input.replace(/[٠-٩]/g, d => map[d] ?? d);
  };

  const parseTimeSafe = (input: string): { hour: number; minute: number } | null => {
    if (!input || typeof input !== 'string') return null;
    let s = toWesternDigits(input).trim();
    s = s.replace(/[\s\u202A\u202B\u202C\u200F\u200E]/g, '');
    s = s.replace(/(ص|صباحاً|م|مساءً|AM|PM|am|pm)/g, '');
    const match = /^(\d{1,2}):(\d{2})/.exec(s);
    if (!match) return null;
    let h = parseInt(match[1], 10);
    let m = parseInt(match[2], 10);
    if (isNaN(h) || isNaN(m)) return null;
    h = Math.max(0, Math.min(23, h));
    m = Math.max(0, Math.min(59, m));
    return { hour: h, minute: m };
  };

  const normalizeArabicNumbers = (text: string) => {
    return text.replace(/[٠-٩]/g, (match) => {
      return String.fromCharCode(match.charCodeAt(0) - '٠'.charCodeAt(0) + '0'.charCodeAt(0));
    });
  };

  const getImageUrl = (imagePath: string | null | undefined): string | null => {
    if (!imagePath || imagePath === 'null' || imagePath === 'undefined') return null;
    if (imagePath.startsWith('https://res.cloudinary.com')) return imagePath;
    if (imagePath.startsWith('/uploads/')) return `${API_CONFIG.BASE_URL}${imagePath}`;
    if (imagePath.startsWith('http')) return imagePath;
    if (imagePath && !imagePath.startsWith('http') && !imagePath.startsWith('/uploads/')) {
      return `${API_CONFIG.BASE_URL}/${imagePath.replace(/^\/+/, '')}`;
    }
    return null;
  };

  // --- Map / Location Logic ---
  const handleOpenLocation = () => {
    if (doctor.mapLocation) {
      Linking.openURL(doctor.mapLocation);
    } else {
      const query = `${doctor.clinicLocation || ''} ${doctor.area || ''} ${doctor.province || ''}`;
      const url = Platform.select({
        ios: `maps:0,0?q=${query}`,
        android: `geo:0,0?q=${query}`
      });
      if (url) Linking.openURL(url);
      else Alert.alert('معلومات', 'لا يوجد موقع محدد على الخريطة');
    }
  };

  // ✅ Scroll to Reviews Section
  const scrollToReviews = () => {
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollTo({ y: ratingSectionY, animated: true });
    }
  };

  // --- Fetching Logic ---
  const fetchUnavailableDays = async () => {
    try {
      try {
        const response = await fetch(`${API_CONFIG.BASE_URL}/doctor/${doctorId}`);
        if (response.ok) {
          const updatedDoctorData = await response.json();
          const doctorInfo = updatedDoctorData.doctor || updatedDoctorData;
          if (doctorInfo?.vacationDays && Array.isArray(doctorInfo.vacationDays)) {
            const converted = doctorInfo.vacationDays.map((date: string) => ({
              doctor_id: doctorId, date: date, type: 'full_day', reason: 'إجازة'
            }));
            setUnavailableDays(converted);
            return;
          }
        }
      } catch (e) {}

      if (doctor?.vacationDays && Array.isArray(doctor.vacationDays)) {
        const converted = doctor.vacationDays.map((date: string) => ({
          doctor_id: doctorId, date: date, type: 'full_day', reason: 'إجازة'
        }));
        setUnavailableDays(converted);
      } else {
        setUnavailableDays([]);
      }
    } catch (e) { setUnavailableDays([]); }
  };

  const fetchUserRating = async () => {
    if (!user?.id || !doctorId) return;
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/ratings/user/${user.id}/doctor/${doctorId}`);
      if (response.ok) {
        const data = await response.json();
        if (data.rating) {
          setUserExistingRating(data.rating);
          setUserRating(data.rating.rating);
          setUserComment(data.rating.comment || '');
          setIsEditingRating(true);
        }
      }
    } catch (e) {}
  };

  const fetchDoctorDetails = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_CONFIG.BASE_URL}/doctors/${doctorId}`);
      if (response.ok) {
        const doctorData = await response.json();
        const specialty = mapSpecialtyToLocalized(doctorData.specialty || doctorData.category_ar || doctorData.category);
        
        // ✅ جلب التقييم الحقيقي بدقة (نفس منطق صفحة كل الأطباء)
        const realRating = Number(
            doctorData.averageRating ?? 
            doctorData.ratingAverage ?? 
            doctorData.rating_avg ?? 
            doctorData.avgRating ?? 
            doctorData.rating ?? 
            0
        );

        setDoctor({ 
            ...doctorData, 
            specialty,
            rating: realRating // تحديث التقييم للقيمة الموحدة
        });
      } else {
        // Fallback fetch
        const allRes = await fetch(`${API_CONFIG.BASE_URL}/doctors`);
        if (allRes.ok) {
          const allDocs = await allRes.json();
          const found = allDocs.find((d: any) => d._id === doctorId || d.id === doctorId);
          if (found) {
            const specialty = mapSpecialtyToLocalized(found.specialty || found.category_ar || found.category);
            
            // ✅ جلب التقييم الحقيقي لل Fallback أيضاً
            const realRating = Number(
                found.averageRating ?? 
                found.ratingAverage ?? 
                found.rating_avg ?? 
                found.avgRating ?? 
                found.rating ?? 
                0
            );

            setDoctor({ ...found, specialty, rating: realRating });
          } else {
            showError(t('error.title'), t('error.doctor_not_found'));
          }
        }
      }
    } catch (e) {
      showError(t('error.title'), t('error.fetch_doctor'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDoctorDetails();
    if (user && user.id) fetchUserRating();
  }, [doctorId, user]);

  useEffect(() => {
    if (doctor) fetchUnavailableDays();
  }, [doctor]);

  // --- Calendar Logic --- (No changes here, kept for functionality)
  const weekdayKeys = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  
  const normalizeDayToKey = (value: any): string | null => {
    if (value === null || value === undefined) return null;
    const raw = String(value).trim().toLowerCase();
    if (weekdayKeys.includes(raw)) return raw;
    const num = Number(raw);
    if (!isNaN(num) && num >= 0 && num <= 6) return weekdayKeys[num];
    const ar = ['الأحد','الاثنين','الثلاثاء','الأربعاء','الخميس','الجمعة','السبت'];
    const idx = ar.indexOf(String(value).trim());
    if (idx >= 0) return weekdayKeys[idx];
    return null;
  };

  const generateTimeSlots = (from: string, to: string) => {
    const slots: string[] = [];
    try {
      const start = new Date(`2000-01-01 ${from}`);
      const end = new Date(`2000-01-01 ${to}`);
      const duration = doctor?.appointmentDuration ? Number(doctor.appointmentDuration) : 30;
      while (start < end) {
        slots.push(start.toTimeString().slice(0, 5));
        start.setMinutes(start.getMinutes() + duration);
      }
    } catch (e) {}
    return slots;
  };

  const isDayAvailable = (date: Date) => {
    const dStr = date.toISOString().split('T')[0];
    if (unavailableDays.some((u: any) => u.date === dStr)) return false;
    const dayKey = weekdayKeys[date.getDay()];
    if (!doctor?.workTimes) return false;
    const keys = doctor.workTimes.map((wt: any) => normalizeDayToKey(wt.day)).filter(Boolean);
    return keys.includes(dayKey);
  };

  const getMarkedDates = () => {
    const marked: any = {};
    if (selectedDate) marked[selectedDate] = { selected: true, selectedColor: theme.colors.primary };
    
    const today = new Date();
    const currM = visibleMonthDate.getMonth();
    const currY = visibleMonthDate.getFullYear();

    for (let i = 1; i <= 31; i++) {
      const d = new Date(currY, currM, i);
      if (d < today) continue;
      if (d.getMonth() !== currM) break;
      
      const dStr = d.toISOString().split('T')[0];
      const isUnavailable = unavailableDays.some((u: any) => u.date === dStr);
      
      if (isUnavailable) {
        marked[dStr] = { marked: true, dotColor: theme.colors.error };
      } else if (isDayAvailable(d)) {
        if (selectedDate !== dStr) {
          marked[dStr] = { marked: true, dotColor: theme.colors.success };
        }
      }
    }
    return marked;
  };

  const onDayPress = async (day: any) => {
    const dateStr = day.dateString;
    const isUnav = unavailableDays.some((u: any) => u.date === dateStr);
    if (isUnav) {
      showAlert('غير متاح', 'هذا اليوم هو يوم إجازة.');
      return;
    }
    setSelectedDate(dateStr);
    setAvailableTimes([]);
    setSelectedTime('');
    
    const dObj = new Date(dateStr);
    const dKey = weekdayKeys[dObj.getDay()];
    const times = doctor.workTimes.filter((wt: any) => normalizeDayToKey(wt.day) === dKey);
    const slots: string[] = [];
    times.forEach((wt: any) => {
      if (wt.from && wt.to) slots.push(...generateTimeSlots(wt.from, wt.to));
    });
    setAvailableTimes(slots);
    
    try {
      const res = await api.get(`/appointments/${doctorId}/${dateStr}`);
      const apps = res || [];
      setBookedTimes(apps.map((a: any) => a.time));
    } catch (e) { setBookedTimes([]); }
  };

  // --- Booking Logic ---
  const bookAppointment = async () => {
    if (!user?.id) {
      Alert.alert(t('error.title'), 'يجب تسجيل الدخول', [
        { text: 'إلغاء', style: 'cancel' },
        { text: 'تسجيل الدخول', onPress: () => navigation.navigate('Login' as never) }
      ]);
      return;
    }
    if (!selectedDate || !selectedTime) {
      showError(t('error.title'), t('validation.select_date_time'));
      return;
    }

    let finalAge: number, finalPName: string, finalPPhone: string, finalBooker: string;
    
    if (isBookingForOther) {
      if (!patientName.trim() || !patientPhone.trim() || !patientAge.trim()) {
        Alert.alert(t('error.title'), 'جميع الحقول مطلوبة'); return;
      }
      const normAge = normalizeArabicNumbers(patientAge.trim());
      const ageNum = parseInt(normAge);
      if (isNaN(ageNum) || ageNum < 1 || ageNum > 120) {
        Alert.alert(t('error.title'), 'العمر غير صحيح'); return;
      }
      finalAge = ageNum;
      finalPName = patientName.trim();
      finalPPhone = patientPhone.trim();
      finalBooker = profile?.first_name || user?.name || 'User';
    } else {
      if (!age.trim()) {
        Alert.alert(t('error.title'), t('validation.age_required')); return;
      }
      const normAge = normalizeArabicNumbers(age.trim());
      const ageNum = parseInt(normAge);
      if (isNaN(ageNum) || ageNum < 1 || ageNum > 120) {
        Alert.alert(t('error.title'), 'العمر غير صحيح'); return;
      }
      finalAge = ageNum;
      finalPName = profile?.first_name || user?.name || 'Patient';
      finalPPhone = profile?.phone || user?.phone || '';
      finalBooker = profile?.first_name || user?.name || 'User';
    }

    setBookingLoading(true);
    try {
      const bookingData = {
        userId: user.id,
        doctorId: doctorId,
        userName: finalPName,
        doctorName: doctor?.name,
        date: selectedDate,
        time: selectedTime,
        reason: reason || '',
        patientAge: finalAge,
        price: 0,
        type: 'normal',
        patientPhone: finalPPhone,
        duration: doctor?.appointmentDuration || 30,
        attendance: 'absent',
        isBookingForOther: isBookingForOther,
        patientName: finalPName,
        bookerName: isBookingForOther ? finalBooker : undefined,
        age: finalAge
      };

      const response = await api.post('/appointments', bookingData);
      
      const [y, m, d] = selectedDate.split('-').map(n => parseInt(n));
      const parsed = parseTimeSafe(selectedTime);
      if (parsed) {
        const aptDate = new Date(y, m - 1, d, parsed.hour, parsed.minute);
        sendAppointmentNotificationToDoctor(
          doctorId, response.data?.appointment?._id || Date.now().toString(),
          finalPName, aptDate, aptDate.toLocaleTimeString()
        ).catch(() => {});
        refreshDoctorNotifications(doctorId).catch(() => {});
        scheduleAppointmentReminder(
          response.data?.appointment?._id, aptDate, doctor?.name, finalPName
        ).catch(() => {});
      }

      Alert.alert(t('success.title'), t('appointments.booking_success'), [{
        text: t('common.ok'),
        onPress: () => {
          setShowBookingModal(false);
          setShowBookingForOtherModal(false);
          navigation.navigate('MyAppointments' as never);
        }
      }]);
    } catch (e: any) {
      Alert.alert(t('error.title'), e?.message || 'فشل الحجز');
    } finally {
      setBookingLoading(false);
    }
  };

  // --- Rating Logic ---
  const handleSubmitRating = async () => {
    if (!user || !doctorId || userRating === 0) return;
    setRatingLoading(true);
    try {
      const isUpdate = isEditingRating && userExistingRating;
      const url = isUpdate ? `${API_CONFIG.BASE_URL}/ratings/${userExistingRating.id}` : `${API_CONFIG.BASE_URL}/ratings`;
      const method = isUpdate ? 'PUT' : 'POST';
      const body = { userId: user.id, doctorId, rating: userRating, comment: userComment.trim() || undefined };
      
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const data = await res.json();
      
      if (res.ok) {
        Alert.alert(t('success.title'), t('rating.success'), [{ text: 'OK' }]);
        fetchDoctorDetails();
        if (isUpdate) setUserExistingRating({ ...userExistingRating, rating: userRating, comment: userComment.trim() });
        else { setUserExistingRating({ id: data.rating?.id, rating: userRating, comment: userComment.trim() }); setIsEditingRating(true); }
      } else {
        Alert.alert('Error', data.error);
      }
    } catch (e) {} finally { setRatingLoading(false); }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (!doctor) return <View style={styles.errorContainer}><Text>Error</Text></View>;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.primary} />
      
      <ScrollView 
        ref={scrollViewRef} // ✅ ربط السكرول
        style={styles.scrollView} 
        contentContainerStyle={styles.scrollContent} 
        showsVerticalScrollIndicator={false}
      >
        
        {/* Header Section */}
        <View style={styles.headerContainer}>
          <View style={styles.headerBackground}>
             <TouchableOpacity style={styles.headerBackButton} onPress={() => navigation.goBack()}>
                <Ionicons name="arrow-back" size={24} color={theme.colors.white} />
             </TouchableOpacity>
          </View>
          
          <View style={styles.profileCard}>
            <View style={styles.imageWrapper}>
              {getImageUrl(doctor.imageUrl || doctor.image) ? (
                <Image 
                  source={{ uri: getImageUrl(doctor.imageUrl || doctor.image) || '' }} 
                  style={styles.profileImage}
                  resizeMode="cover"
                />
              ) : (
                <Image 
                  source={require('../../assets/icon.png')} 
                  style={styles.profileImage}
                  resizeMode="cover"
                />
              )}
              {doctor.available && <View style={styles.onlineBadge} />}
            </View>
            
            <Text style={styles.doctorName}>{doctor.name}</Text>
            <View style={styles.specialtyTag}>
               <Text style={styles.specialtyText}>{doctor.specialty}</Text>
            </View>

            <View style={styles.statsRow}>
               {/* ✅ Touchable Stats Item for Rating */}
               <TouchableOpacity 
                 style={styles.statItem} 
                 onPress={scrollToReviews} // ✅ عند الضغط ينزل للتقييم
               >
                  <View style={[styles.iconBox, {backgroundColor: '#FFF8E1'}]}>
                     <Ionicons name="star" size={18} color="#FFD700" />
                  </View>
                  {/* ✅ عرض التقييم الحقيقي دائماً */}
                  <Text style={styles.statValue}>
                    {doctor.rating ? Number(doctor.rating).toFixed(1) : 'جديد'}
                  </Text>
                  <Text style={styles.statLabel}>{t('rating.rating') || 'تقييم'}</Text>
               </TouchableOpacity>

               <View style={styles.divider} />
               <View style={styles.statItem}>
                  <View style={[styles.iconBox, {backgroundColor: '#E3F2FD'}]}>
                     <Ionicons name="briefcase" size={18} color={theme.colors.primary} />
                  </View>
                  <Text style={styles.statValue}>{doctor.experienceYears || 0} +</Text>
                  <Text style={styles.statLabel}>{t('doctor.years') || 'خبرة'}</Text>
               </View>
               <View style={styles.divider} />
               <View style={styles.statItem}>
                  <View style={[styles.iconBox, {backgroundColor: '#E8F5E9'}]}>
                     <Ionicons name="people" size={18} color={theme.colors.success} />
                  </View>
                  <Text style={styles.statValue}>100+</Text>
                  <Text style={styles.statLabel}>مريض</Text>
               </View>
            </View>
          </View>
        </View>

        {/* Content Section */}
        <View style={styles.contentSection}>
           
           {/* About */}
           {doctor.about && (
             <View style={styles.infoCard}>
               <Text style={styles.cardTitle}>{t('doctor.about')}</Text>
               <Text style={styles.aboutText}>{doctor.about}</Text>
             </View>
           )}

           {/* Location (Clickable) */}
           <TouchableOpacity 
              style={styles.infoCard} 
              onPress={handleOpenLocation}
              activeOpacity={0.7}
           >
              <View style={styles.cardHeaderRow}>
                 <Text style={styles.cardTitle}>{t('doctor.clinic_location')}</Text>
                 <Ionicons name="chevron-back" size={18} color={theme.colors.textSecondary} style={{transform: [{ scaleX: -1 }]}}/>
              </View>
              
              <View style={styles.locationRow}>
                 <View style={styles.locationIconBox}>
                    <Ionicons name="location" size={24} color={theme.colors.primary} />
                 </View>
                 <View style={{flex: 1}}>
                    <Text style={styles.locationTitle}>{doctor.clinicLocation || 'العنوان غير محدد'}</Text>
                    <Text style={styles.locationSubtitle}>
                       {mapProvinceToLocalized(doctor.province)}, {doctor.area}
                    </Text>
                 </View>
              </View>
           </TouchableOpacity>

           {/* ✅ Action Buttons (Updated: Map instead of Reviews) */}
           <View style={styles.actionButtonsRow}>
              <TouchableOpacity 
                style={styles.actionBtnOutline}
                onPress={() => {
                   const url = `${APP_CONFIG.APP.WEBSITE_URL}/doctor/${doctor._id || doctor.id}`;
                   Clipboard.setString(url);
                   Alert.alert(t('common.copied'), 'تم نسخ الرابط');
                }}
              >
                 <Ionicons name="share-social-outline" size={20} color={theme.colors.primary} />
                 <Text style={styles.actionBtnText}>{t('common.share') || 'مشاركة'}</Text>
              </TouchableOpacity>

              {/* ✅ زر الموقع بدلاً من المراجعات */}
              <TouchableOpacity 
                style={styles.actionBtnOutline}
                onPress={handleOpenLocation}
              >
                 <Ionicons name="map-outline" size={20} color={theme.colors.primary} />
                 <Text style={styles.actionBtnText}>{t('doctor.location_map') || 'الموقع'}</Text>
              </TouchableOpacity>
           </View>

           {/* Rating Input & Display */}
           <View 
             style={styles.infoCard}
             onLayout={(event) => {
               // ✅ التقاط مكان قسم التقييم للنزول إليه
               const layout = event.nativeEvent.layout;
               setRatingSectionY(layout.y + 200); // إضافة إزاحة بسيطة
             }}
           >
              <View style={styles.cardHeaderRow}>
                 <Text style={styles.cardTitle}>
                    {isEditingRating ? t('rating.update_rating') : t('rating.rate_doctor')}
                 </Text>
                 {/* زر عرض كل المراجعات إذا أردته هنا */}
                 <TouchableOpacity onPress={() => navigation.navigate('DoctorReviews' as never, { doctorId: doctor.id } as never)}>
                    <Text style={{color: theme.colors.primary, fontSize: 12}}>عرض الكل</Text>
                 </TouchableOpacity>
              </View>

              {user && user.id ? (
                <>
                  <View style={styles.ratingStarsRow}>
                     {[1, 2, 3, 4, 5].map((star) => (
                        <TouchableOpacity key={star} onPress={() => setUserRating(star)}>
                           <Ionicons name="star" size={36} color={star <= userRating ? "#FFD700" : "#E0E0E0"} />
                        </TouchableOpacity>
                     ))}
                  </View>
                  <TextInput
                     style={styles.ratingInput}
                     placeholder={t('rating.comment_placeholder')}
                     value={userComment}
                     onChangeText={setUserComment}
                     multiline
                  />
                  <TouchableOpacity 
                     style={[styles.submitBtn, (!userRating || ratingLoading) && {opacity: 0.6}]}
                     disabled={!userRating || ratingLoading}
                     onPress={handleSubmitRating}
                  >
                     {ratingLoading ? <ActivityIndicator color="#fff"/> : <Text style={styles.submitBtnText}>{t('rating.submit_rating')}</Text>}
                  </TouchableOpacity>
                </>
              ) : (
                <Text style={{textAlign: 'center', color: theme.colors.textSecondary}}>
                   يجب تسجيل الدخول لتقييم الطبيب
                </Text>
              )}
           </View>

        </View>
      </ScrollView>

      {/* Booking Button */}
      <View style={styles.fixedFooter}>
         <TouchableOpacity 
            style={styles.mainBookingButton} 
            onPress={() => setShowCalendar(true)}
            activeOpacity={0.8}
         >
            <Text style={styles.mainBookingText}>{t('appointment.book_appointment')}</Text>
            <Ionicons name="calendar" size={20} color="#fff" style={{marginLeft: 8}} />
         </TouchableOpacity>
      </View>

      {/* --- Modals --- */}
      <Modal visible={showCalendar} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowCalendar(false)}>
         <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
               <Text style={styles.modalTitle}>{t('appointment.choose_appointment_time')}</Text>
               <TouchableOpacity onPress={() => setShowCalendar(false)}>
                  <Ionicons name="close-circle" size={30} color={theme.colors.textSecondary} />
               </TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={{paddingBottom: 40}}>
               <Calendar
                  onDayPress={onDayPress}
                  markedDates={getMarkedDates()}
                  minDate={new Date().toISOString().split('T')[0]}
                  theme={{
                     selectedDayBackgroundColor: theme.colors.primary,
                     todayTextColor: theme.colors.primary,
                     arrowColor: theme.colors.primary,
                  }}
               />
               {selectedDate && availableTimes.length > 0 && (
                  <View style={styles.slotsContainer}>
                     <Text style={styles.slotsTitle}>الأوقات المتاحة:</Text>
                     <View style={styles.slotsGrid}>
                        {availableTimes.map((time, idx) => {
                           const isBooked = bookedTimes.includes(time);
                           return (
                              <TouchableOpacity 
                                 key={idx} 
                                 style={[
                                    styles.timeSlot, 
                                    selectedTime === time && styles.timeSlotSelected,
                                    isBooked && styles.timeSlotBooked
                                 ]}
                                 disabled={isBooked}
                                 onPress={() => setSelectedTime(time)}
                              >
                                 <Text style={[
                                    styles.timeSlotText, 
                                    selectedTime === time && {color: '#fff'},
                                    isBooked && {color: theme.colors.error}
                                 ]}>
                                    {time}
                                 </Text>
                              </TouchableOpacity>
                           )
                        })}
                     </View>
                  </View>
               )}
               {selectedDate && availableTimes.length === 0 && (
                  <Text style={styles.noSlotsText}>{t('appointments.day_not_available')}</Text>
               )}
            </ScrollView>
            {selectedDate && selectedTime && (
               <View style={styles.modalFooter}>
                  <TouchableOpacity style={styles.confirmBtn} onPress={() => { setShowCalendar(false); setShowBookingModal(true); }}>
                     <Text style={styles.confirmBtnText}>{t('appointments.confirm_booking')}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                     style={[styles.confirmBtn, {backgroundColor: theme.colors.success, marginTop: 10}]} 
                     onPress={() => { setShowCalendar(false); setShowBookingForOtherModal(true); }}
                  >
                     <Text style={styles.confirmBtnText}>{t('booking_for_other.title')}</Text>
                  </TouchableOpacity>
               </View>
            )}
         </View>
      </Modal>

      {/* Booking Form Modal */}
      <Modal visible={showBookingModal} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowBookingModal(false)}>
         <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
               <Text style={styles.modalTitle}>{t('appointments.confirm_booking')}</Text>
               <TouchableOpacity onPress={() => setShowBookingModal(false)}>
                  <Ionicons name="close" size={24} color={theme.colors.textPrimary} />
               </TouchableOpacity>
            </View>
            <View style={styles.formContainer}>
               <View style={styles.summaryCard}>
                  <Text style={styles.summaryText}>📅 {selectedDate}</Text>
                  <Text style={styles.summaryText}>⏰ {selectedTime}</Text>
                  <Text style={styles.summaryText}>👨‍⚕️ {doctor.name}</Text>
               </View>

               {!isBookingForOther && (
                  <>
                     <Text style={styles.label}>{t('validation.patient_age')}</Text>
                     <TextInput 
                        style={styles.input} 
                        value={age} 
                        onChangeText={setAge} 
                        keyboardType="numeric" 
                        placeholder="أدخل العمر"
                     />
                  </>
               )}

               <Text style={styles.label}>{t('validation.visit_reason_optional')}</Text>
               <TextInput 
                  style={[styles.input, {height: 80}]} 
                  value={reason} 
                  onChangeText={setReason} 
                  multiline 
                  placeholder="سبب الزيارة..."
               />

               <TouchableOpacity 
                  style={[styles.mainBookingButton, bookingLoading && {opacity: 0.7}]} 
                  onPress={bookAppointment}
                  disabled={bookingLoading}
               >
                  {bookingLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.mainBookingText}>{t('validation.confirm_booking')}</Text>}
               </TouchableOpacity>
            </View>
         </View>
      </Modal>

      {/* Booking For Other Modal */}
      <Modal 
        visible={showBookingForOtherModal} 
        animationType="slide" 
        presentationStyle="pageSheet" 
        onRequestClose={() => setShowBookingForOtherModal(false)}
      >
         <SafeAreaView style={{flex: 1, backgroundColor: '#fff'}}>
           <View style={styles.modalContainer}>
              <View style={styles.modalHeader}>
                 <Text style={styles.modalTitle}>{t('appointments.book_for_other_person')}</Text>
                 <TouchableOpacity onPress={() => setShowBookingForOtherModal(false)}>
                    <Ionicons name="close" size={24} color={theme.colors.textPrimary} />
                 </TouchableOpacity>
              </View>
              <ScrollView contentContainerStyle={{padding: 20}}>
                 <View style={styles.formContainer}>
                    <Text style={styles.label}>{t('validation.patient_name')}</Text>
                    <TextInput style={styles.input} value={patientName} onChangeText={setPatientName} placeholder="اسم المريض" />
                    
                    <Text style={styles.label}>{t('validation.patient_phone')}</Text>
                    <TextInput style={styles.input} value={patientPhone} onChangeText={setPatientPhone} keyboardType="phone-pad" placeholder="رقم الهاتف" />
                    
                    <Text style={styles.label}>{t('validation.patient_age')}</Text>
                    <TextInput style={styles.input} value={patientAge} onChangeText={setPatientAge} keyboardType="numeric" placeholder="العمر" />

                    <TouchableOpacity 
                        style={[styles.mainBookingButton, {marginTop: 20}]} 
                        onPress={() => {
                          setIsBookingForOther(true);
                          setShowBookingForOtherModal(false);
                          setShowBookingModal(true);
                        }}
                    >
                        <Text style={styles.mainBookingText}>{t('common.continue')}</Text>
                    </TouchableOpacity>
                 </View>
              </ScrollView>
           </View>
         </SafeAreaView>
      </Modal>

      <Toast visible={toast.visible} message={toast.message} type={toast.type} onHide={hideToast} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  
  headerContainer: { marginBottom: 10 },
  headerBackground: {
    height: 140, backgroundColor: theme.colors.primary,
    borderBottomLeftRadius: 30, borderBottomRightRadius: 30,
    paddingTop: Platform.OS === 'ios' ? 50 : 30, paddingHorizontal: 20,
  },
  headerBackButton: {
    width: 40, height: 40, justifyContent: 'center', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 12,
  },
  profileCard: {
    marginHorizontal: 20, marginTop: -60, backgroundColor: '#fff',
    borderRadius: 20, padding: 20, alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1, shadowRadius: 10, elevation: 5,
  },
  imageWrapper: { position: 'relative', marginBottom: 12 },
  profileImage: { width: 100, height: 100, borderRadius: 25, borderWidth: 3, borderColor: '#fff' },
  onlineBadge: {
    position: 'absolute', bottom: -2, right: -2, width: 16, height: 16, borderRadius: 8,
    backgroundColor: theme.colors.success, borderWidth: 2, borderColor: '#fff',
  },
  doctorName: { fontSize: 20, fontWeight: 'bold', color: theme.colors.textPrimary, textAlign: 'center', marginBottom: 4 },
  specialtyTag: {
    backgroundColor: theme.colors.primary + '15', paddingHorizontal: 12, paddingVertical: 4,
    borderRadius: 20, marginBottom: 16,
  },
  specialtyText: { color: theme.colors.primary, fontSize: 14, fontWeight: '600' },
  
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', paddingTop: 16, borderTopWidth: 1, borderTopColor: '#F0F0F0' },
  statItem: { alignItems: 'center', flex: 1 },
  iconBox: { width: 32, height: 32, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginBottom: 4 },
  statValue: { fontSize: 14, fontWeight: 'bold', color: theme.colors.textPrimary },
  statLabel: { fontSize: 12, color: theme.colors.textSecondary },
  divider: { width: 1, height: '80%', backgroundColor: '#F0F0F0', alignSelf: 'center' },

  contentSection: { padding: 20, paddingBottom: 100 },
  infoCard: {
    backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  cardTitle: { fontSize: 16, fontWeight: 'bold', color: theme.colors.textPrimary, marginBottom: 12 },
  cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  aboutText: { fontSize: 14, color: theme.colors.textSecondary, lineHeight: 22, textAlign: 'left' },
  
  locationRow: { flexDirection: 'row', alignItems: 'center' },
  locationIconBox: {
    width: 40, height: 40, borderRadius: 12, backgroundColor: theme.colors.primary + '10',
    justifyContent: 'center', alignItems: 'center', marginRight: 12,
  },
  locationTitle: { fontSize: 15, fontWeight: '600', color: theme.colors.textPrimary },
  locationSubtitle: { fontSize: 13, color: theme.colors.textSecondary, marginTop: 2 },
  mapButton: { padding: 8 },

  actionButtonsRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  actionBtnOutline: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 12, borderWidth: 1, borderColor: theme.colors.primary,
    borderRadius: 12, backgroundColor: '#fff',
  },
  actionBtnText: { color: theme.colors.primary, fontWeight: '600', marginLeft: 8 },

  ratingStarsRow: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 16 },
  ratingInput: {
    borderWidth: 1, borderColor: '#E0E0E0', borderRadius: 12, padding: 12, height: 80,
    textAlignVertical: 'top', marginBottom: 16, backgroundColor: '#F9F9F9',
  },
  submitBtn: { backgroundColor: theme.colors.primary, padding: 14, borderRadius: 12, alignItems: 'center' },
  submitBtnText: { color: '#fff', fontWeight: 'bold' },

  fixedFooter: {
    position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#fff', padding: 20,
    borderTopWidth: 1, borderTopColor: '#F0F0F0', paddingBottom: Platform.OS === 'ios' ? 34 : 20,
  },
  mainBookingButton: {
    backgroundColor: theme.colors.primary, paddingVertical: 16, borderRadius: 14,
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
    shadowColor: theme.colors.primary, shadowOffset: {width:0, height:4},
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 6,
  },
  mainBookingText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },

  modalContainer: { flex: 1, backgroundColor: '#fff' },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingBottom: 20, paddingTop: Platform.OS === 'android' ? 50 : 20,
    borderBottomWidth: 1, borderBottomColor: '#F0F0F0',
  },
  modalTitle: { fontSize: 18, fontWeight: 'bold' },
  slotsContainer: { padding: 20 },
  slotsTitle: { fontSize: 16, fontWeight: '600', marginBottom: 12 },
  slotsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  timeSlot: {
    paddingVertical: 10, paddingHorizontal: 16, borderRadius: 10,
    backgroundColor: '#F0F0F0', minWidth: 80, alignItems: 'center',
  },
  timeSlotSelected: { backgroundColor: theme.colors.primary },
  timeSlotBooked: { backgroundColor: '#FFEBEE', opacity: 0.6 },
  timeSlotText: { fontSize: 14, fontWeight: '500', color: '#333' },
  noSlotsText: { textAlign: 'center', marginTop: 40, color: '#999', fontSize: 16 },
  modalFooter: { padding: 20, borderTopWidth: 1, borderTopColor: '#F0F0F0' },
  confirmBtn: { backgroundColor: theme.colors.primary, padding: 16, borderRadius: 12, alignItems: 'center' },
  confirmBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  
  formContainer: { padding: 0 },
  summaryCard: { backgroundColor: '#F5F7FA', padding: 16, borderRadius: 12, marginBottom: 20 },
  summaryText: { fontSize: 15, marginBottom: 6, color: '#333' },
  label: { fontSize: 14, fontWeight: '600', marginBottom: 8, marginTop: 12, color: '#333' },
  input: { borderWidth: 1, borderColor: '#E0E0E0', borderRadius: 10, padding: 12, fontSize: 16, backgroundColor: '#fff' },
});

export default DoctorDetailsScreen;