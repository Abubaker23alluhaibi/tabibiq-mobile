import { api } from './api';
import { API_CONFIG } from '../config/api';
import { logApiCall, logApiResponse, logError } from '../utils/logger';

export interface Advertisement {
  _id: string;
  title: string;
  description: string;
  image: string;
  type: 'update' | 'promotion' | 'announcement' | 'doctor' | 'center';
  status: 'active' | 'inactive' | 'pending';
  priority: number;
  target: 'users' | 'doctors' | 'both';
  startDate: string;
  endDate: string;
  isFeatured: boolean;
  clicks: number;
  views: number;
  link?: string;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AdvertisementStats {
  views: number;
  clicks: number;
}

export interface CreateAdvertisementData {
  title: string;
  description: string;
  image: string;
  type?: 'update' | 'promotion' | 'announcement' | 'doctor' | 'center';
  target: 'users' | 'doctors' | 'both';
  startDate: string;
  endDate: string;
  priority?: number;
  isFeatured?: boolean;
  link?: string;
}

export interface UpdateAdvertisementData extends Partial<CreateAdvertisementData> {
  status?: 'active' | 'inactive' | 'pending';
}

class AdvertisementsAPI {
  private baseUrl = `${API_CONFIG.BASE_URL}/advertisements`;

  /**
   * جلب الإعلانات حسب الفئة المستهدفة
   */
  async getAdvertisements(target: 'users' | 'doctors' | 'both' = 'both'): Promise<Advertisement[]> {
    try {
      logApiCall('GET', `${this.baseUrl}/${target}`, { target });
      
      const response = await api.get(`/advertisements/${target}`, { includeAuth: false });
      
      logApiResponse(`${this.baseUrl}/${target}`, 200);
      
      // api.get يرجع البيانات مباشرة وليس response.data
      if (Array.isArray(response)) {
        return response;
      }
      
      return response || [];
    } catch (error: any) {
      logError('خطأ في جلب الإعلانات', error);
      console.log('Error fetching advertisements:', error);
      return [];
    }
  }

  /**
   * جلب جميع الإعلانات (للأدمن)
   */
  async getAllAdvertisements(): Promise<Advertisement[]> {
    try {
      logApiCall('GET', `${this.baseUrl}/admin/advertisements`);
      
      const response = await api.get('/admin/advertisements');
      
      logApiResponse(`${this.baseUrl}/admin/advertisements`, 200);
      
      // api.get يرجع البيانات مباشرة وليس response.data
      if (Array.isArray(response)) {
        return response;
      }
      
      return response || [];
    } catch (error: any) {
      logError('خطأ في جلب جميع الإعلانات', error);
      return [];
    }
  }

  /**
   * إنشاء إعلان جديد
   */
  async createAdvertisement(data: CreateAdvertisementData): Promise<Advertisement> {
    try {
      logApiCall('POST', `${this.baseUrl}/admin/advertisements`, data);
      
      const response = await api.post('/admin/advertisements', data);
      
      logApiResponse(`${this.baseUrl}/admin/advertisements`, 201);
      
      return response.data.advertisement || response.data;
    } catch (error: any) {
      logError('خطأ في إنشاء الإعلان', error);
      throw new Error(error.response?.data?.error || 'فشل في إنشاء الإعلان');
    }
  }

  /**
   * تحديث إعلان
   */
  async updateAdvertisement(id: string, data: UpdateAdvertisementData): Promise<Advertisement> {
    try {
      logApiCall('PUT', `${this.baseUrl}/admin/advertisements/${id}`, data);
      
      const response = await api.put(`/admin/advertisements/${id}`, data);
      
      logApiResponse(`${this.baseUrl}/admin/advertisements/${id}`, 200);
      
      return response.data.advertisement || response.data;
    } catch (error: any) {
      logError('خطأ في تحديث الإعلان', error);
      throw new Error(error.response?.data?.error || 'فشل في تحديث الإعلان');
    }
  }

  /**
   * حذف إعلان
   */
  async deleteAdvertisement(id: string): Promise<void> {
    try {
      logApiCall('DELETE', `${this.baseUrl}/admin/advertisements/${id}`);
      
      await api.delete(`/admin/advertisements/${id}`);
      
      logApiResponse(`${this.baseUrl}/admin/advertisements/${id}`, 200);
    } catch (error: any) {
      logError('خطأ في حذف الإعلان', error);
      throw new Error(error.response?.data?.error || 'فشل في حذف الإعلان');
    }
  }

  /**
   * تسجيل مشاهدة إعلان
   */
  async trackView(advertisementId: string): Promise<void> {
    try {
      logApiCall('POST', `${this.baseUrl}/${advertisementId}/view`);
      
      await api.post(`/advertisements/${advertisementId}/view`);
      
      logApiResponse(`${this.baseUrl}/${advertisementId}/view`, 200);
    } catch (error: any) {
      logError('خطأ في تسجيل مشاهدة الإعلان', error);
      // لا نرمي خطأ هنا لأن هذا لا يجب أن يؤثر على تجربة المستخدم
    }
  }

  /**
   * تسجيل نقرة على إعلان
   */
  async trackClick(advertisementId: string): Promise<void> {
    try {
      logApiCall('POST', `${this.baseUrl}/${advertisementId}/click`);
      
      await api.post(`/advertisements/${advertisementId}/click`);
      
      logApiResponse(`${this.baseUrl}/${advertisementId}/click`, 200);
    } catch (error: any) {
      logError('خطأ في تسجيل نقرة الإعلان', error);
      // لا نرمي خطأ هنا لأن هذا لا يجب أن يؤثر على تجربة المستخدم
    }
  }

  /**
   * جلب إحصائيات إعلان
   */
  async getAdvertisementStats(advertisementId: string): Promise<AdvertisementStats> {
    try {
      logApiCall('GET', `${this.baseUrl}/${advertisementId}/stats`);
      
      const response = await api.get(`/advertisements/${advertisementId}/stats`);
      
      logApiResponse(`${this.baseUrl}/${advertisementId}/stats`, 200);
      
      // api.get يرجع البيانات مباشرة
      if (response && typeof response === 'object') {
        return {
          views: response.views || 0,
          clicks: response.clicks || 0
        };
      }
      
      return { views: 0, clicks: 0 };
    } catch (error: any) {
      logError('خطأ في جلب إحصائيات الإعلان', error);
      return { views: 0, clicks: 0 };
    }
  }

  /**
   * جلب الإعلانات المميزة
   */
  async getFeaturedAdvertisements(target: 'users' | 'doctors' | 'both' = 'both'): Promise<Advertisement[]> {
    try {
      const advertisements = await this.getAdvertisements(target);
      return advertisements.filter(ad => ad.isFeatured && ad.status === 'active');
    } catch (error: any) {
      logError('خطأ في جلب الإعلانات المميزة', error);
      return [];
    }
  }

  /**
   * التحقق من صحة الإعلان (تاريخ انتهاء الصلاحية)
   */
  isAdvertisementValid(advertisement: Advertisement): boolean {
    const now = new Date();
    const startDate = new Date(advertisement.startDate);
    const endDate = new Date(advertisement.endDate);
    
    return advertisement.status === 'active' && 
           startDate <= now && 
           endDate >= now;
  }

  /**
   * ترتيب الإعلانات حسب الأولوية
   */
  sortAdvertisementsByPriority(advertisements: Advertisement[]): Advertisement[] {
    return advertisements.sort((a, b) => {
      // أولاً: الإعلانات المميزة
      if (a.isFeatured && !b.isFeatured) return -1;
      if (!a.isFeatured && b.isFeatured) return 1;
      
      // ثانياً: الأولوية
      if (a.priority !== b.priority) return b.priority - a.priority;
      
      // ثالثاً: تاريخ الإنشاء
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }
}

export const advertisementsAPI = new AdvertisementsAPI();
export default advertisementsAPI;
