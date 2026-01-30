import Constants from 'expo-constants';

export const API_CONFIG = {
  get BASE_URL() {
    // Use environment variable if available, otherwise fallback to production
    return Constants.expoConfig?.extra?.apiUrl || 'https://web-production-78766.up.railway.app';
  },
  
  get AUTH_LOGIN() {
    return `${this.BASE_URL}/login`;
  },
  
  get AUTH_REGISTER() {
    return `${this.BASE_URL}/register`;
  },
  
  get AUTH_REGISTER_DOCTOR() {
    return `${this.BASE_URL}/register-doctor`;
  },
  
  get AUTH_LOGOUT() {
    return `${this.BASE_URL}/logout`;
  },
  
  get USERS_PROFILE() {
    return `${this.BASE_URL}/users`;
  },
  
  get USERS_BY_ID() {
    return `${this.BASE_URL}/users`;
  },
  
  get DOCTORS() {
    return `${this.BASE_URL}/doctors`;
  },

  get DOCTORS_NEAREST() {
    return `${this.BASE_URL}/doctors/nearest`;
  },

  get DOCTOR_PASSWORD() {
    return `${this.BASE_URL}/doctor-password`;
  },

  get UPLOAD_PROFILE_IMAGE() {
    return `${this.BASE_URL}/upload-profile-image`;
  },

  get DOCTOR() {
    return `${this.BASE_URL}/doctor`;
  },

  get DOCTOR_WORK_TIMES() {
    return `${this.BASE_URL}/doctor`;
  },

  get DOCTOR_APPOINTMENT_DURATION() {
    return `${this.BASE_URL}/doctor`;
  },
  
  get APPOINTMENTS() {
    return `${this.BASE_URL}/appointments`;
  },
  
  get REMINDERS() {
    return `${this.BASE_URL}/medicine-reminders`;
  },
  
  get NOTIFICATIONS() {
    return `${this.BASE_URL}/notifications`;
  },
  
  get SETTINGS() {
    return `${this.BASE_URL}/settings`;
  },
  
  get SPECIALTIES() {
    return `${this.BASE_URL}/specialties`;
  },
  
  get PROVINCES() {
    return `${this.BASE_URL}/provinces`;
  },
  
  get STATS() {
    return `${this.BASE_URL}/api/analytics`;
  },
};

export const buildApiUrl = (endpoint: string, id?: string) => {
  if (id) {
    return `${endpoint}/${id}`;
  }
  return endpoint;
};

export const buildApiUrlWithParams = (endpoint: string, params?: Record<string, any>) => {
  if (!params || Object.keys(params).length === 0) {
    return endpoint;
  }
  
  const queryString = new URLSearchParams(params).toString();
  return `${endpoint}?${queryString}`;
};

export const getCurrentServerInfo = () => {
  return {
    baseUrl: API_CONFIG.BASE_URL,
    serverType: 'إنتاجي',
  };
}; 
