import { useState, useCallback } from 'react';
import * as Location from 'expo-location';
import { doctorsAPI } from '../services/api';

export interface NearestDoctor {
  id: string;
  _id?: string;
  name: string;
  specialty: string;
  province?: string;
  area?: string;
  image?: string | null;
  profileImage?: string | null;
  averageRating?: number;
  totalRatings?: number;
  distance?: number;
  clinicLocation?: string;
  phone?: string;
}

export interface UseNearestDoctorsResult {
  doctors: NearestDoctor[];
  loading: boolean;
  error: string | null;
  locationPermission: 'granted' | 'denied' | 'undetermined' | null;
  refetch: () => Promise<void>;
}

export function useNearestDoctors(limit?: number): UseNearestDoctorsResult {
  const [doctors, setDoctors] = useState<NearestDoctor[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [locationPermission, setLocationPermission] = useState<'granted' | 'denied' | 'undetermined' | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      setLocationPermission(status === 'granted' ? 'granted' : status === 'denied' ? 'denied' : 'undetermined');

      if (status !== 'granted') {
        setError('تم رفض إذن الموقع. يرجى تفعيل الموقع من الإعدادات لعرض الأطباء الأقرب.');
        setDoctors([]);
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const { latitude, longitude } = location.coords;

      const data = await doctorsAPI.getNearestDoctors(latitude, longitude, limit);
      if (data == null) {
        setError('فشل في جلب الأطباء. تحقق من الاتصال.');
        setDoctors([]);
        return;
      }
      const list = Array.isArray(data) ? data : (data as any)?.doctors ?? [];
      setDoctors(
        list.map((d: any) => ({
          id: d._id || d.id,
          _id: d._id,
          name: d.name,
          specialty: d.specialty,
          province: d.province,
          area: d.area,
          image: d.image,
          profileImage: d.profileImage,
          averageRating: d.averageRating,
          totalRatings: d.totalRatings,
          distance: d.distance,
          clinicLocation: d.clinicLocation,
          phone: d.phone,
        }))
      );
    } catch (e: any) {
      const message =
        e?.message ||
        (e?.code === 'E_LOCATION_UNAVAILABLE' ? 'الموقع غير متاح.' : 'حدث خطأ أثناء جلب الأطباء الأقرب.');
      setError(message);
      setDoctors([]);
    } finally {
      setLoading(false);
    }
  }, [limit]);

  return { doctors, loading, error, locationPermission, refetch };
}
