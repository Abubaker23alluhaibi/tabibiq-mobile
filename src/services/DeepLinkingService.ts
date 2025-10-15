import * as Linking from 'expo-linking';
import { Platform } from 'react-native';

export interface DeepLinkData {
  type: 'doctor' | 'appointment' | 'profile' | 'notification';
  id?: string;
  action?: string;
}

export type DeepLinkListener = (data: DeepLinkData | null) => void;

class DeepLinkingService {
  private static instance: DeepLinkingService;
  private isInitialized = false;
  private listeners: DeepLinkListener[] = [];
  private lastProcessedUrl: string | null = null;

  private constructor() {}

  public static getInstance(): DeepLinkingService {
    if (!DeepLinkingService.instance) {
      DeepLinkingService.instance = new DeepLinkingService();
    }
    return DeepLinkingService.instance;
  }

  public addListener(listener: DeepLinkListener): () => void {
    this.listeners.push(listener);
    
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  private notifyListeners(data: DeepLinkData | null): void {
    this.listeners.forEach((listener, index) => {
      try {
        listener(data);
      } catch (error) {
        // خطأ في المستمع
      }
    });
  }

  public async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // معالجة الرابط الأولي عند فتح التطبيق
      const initialUrl = await Linking.getInitialURL();
      if (initialUrl) {
        // تأخير قصير لضمان تحميل التطبيق بالكامل
        setTimeout(() => {
          this.processDeepLink(initialUrl);
        }, 2000);
      }

      // إعداد مستمع للروابط الجديدة
      const subscription = Linking.addEventListener('url', ({ url }) => {
        this.processDeepLink(url);
      });

      this.isInitialized = true;
    } catch (error) {
      if (__DEV__) {
        console.error('خطأ في تهيئة Deep Linking:', error);
      }
    }
  }

  private processDeepLink(url: string): void {
    if (this.lastProcessedUrl === url) return;
    this.lastProcessedUrl = url;

    const data = this.handleDeepLink(url);
    this.notifyListeners(data);
  }

  private handleDeepLink(url: string): DeepLinkData | null {
    try {
      if (__DEV__) {
        console.log('Processing deep link URL:', url);
      }
      const parsed = Linking.parse(url);
      if (__DEV__) {
        console.log('Parsed URL:', parsed);
      }
      
      // التعامل مع روابط التطوير (exp://)
      if (parsed.scheme === 'exp') {
        if (__DEV__) {
          console.log('Development deep link ignored:', url);
        }
        return null;
      }
      
      // التعامل مع تنسيق tabibiq://doctor/123
      if (parsed.scheme === 'tabibiq') {
        const pathSegments = parsed.path ? parsed.path.split('/').filter(Boolean) : [];
        
        // في تنسيق tabibiq://doctor/123، الـ hostname هو "doctor" والـ path هو "/123"
        const allSegments = [parsed.hostname, ...pathSegments].filter(Boolean);
        if (__DEV__) {
          console.log('All segments:', allSegments);
        }
        
        if (allSegments.length > 0) {
          const firstSegment = allSegments[0];
          
          if (firstSegment === 'doctor' && allSegments.length > 1) {
            const result = {
              type: 'doctor' as const,
              id: allSegments[1] || undefined,
              action: allSegments[2] || 'view'
            };
            if (__DEV__) {
              console.log('Doctor deep link result:', result);
            }
            return result;
          }
          
          if (firstSegment === 'appointment' && allSegments.length > 1) {
            const result = {
              type: 'appointment' as const,
              id: allSegments[1] || undefined,
              action: allSegments[2] || 'view'
            };
            if (__DEV__) {
              console.log('Appointment deep link result:', result);
            }
            return result;
          }
          
          if (firstSegment === 'profile') {
            const result = {
              type: 'profile' as const,
              action: allSegments[1] || 'view'
            };
            if (__DEV__) {
              console.log('Profile deep link result:', result);
            }
            return result;
          }
          
          if (firstSegment === 'notification' && allSegments.length > 1) {
            const result = {
              type: 'notification' as const,
              id: allSegments[1] || undefined,
              action: allSegments[2] || 'view'
            };
            if (__DEV__) {
              console.log('Notification deep link result:', result);
            }
            return result;
          }
        }
      }
      
      // التعامل مع روابط HTTPS من الموقع
      if (parsed.scheme === 'https' && parsed.hostname === 'tabib-iq.com') {
        const pathSegments = parsed.path ? parsed.path.split('/').filter(Boolean) : [];
        if (__DEV__) {
          console.log('HTTPS path segments:', pathSegments);
        }
        
        if (pathSegments.length > 0) {
          const firstSegment = pathSegments[0];
          
          if (firstSegment === 'doctor' && pathSegments.length > 1) {
            const result = {
              type: 'doctor' as const,
              id: pathSegments[1],
              action: pathSegments[2] || 'view'
            };
            if (__DEV__) {
              console.log('HTTPS Doctor deep link result:', result);
            }
            return result;
          }
          
          if (firstSegment === 'appointment' && pathSegments.length > 1) {
            const result = {
              type: 'appointment' as const,
              id: pathSegments[1],
              action: pathSegments[2] || 'view'
            };
            if (__DEV__) {
              console.log('HTTPS Appointment deep link result:', result);
            }
            return result;
          }
          
          if (firstSegment === 'profile') {
            const result = {
              type: 'profile' as const,
              action: pathSegments[1] || 'view'
            };
            if (__DEV__) {
              console.log('HTTPS Profile deep link result:', result);
            }
            return result;
          }
          
          if (firstSegment === 'notification' && pathSegments.length > 1) {
            const result = {
              type: 'notification' as const,
              id: pathSegments[1],
              action: pathSegments[2] || 'view'
            };
            if (__DEV__) {
              console.log('HTTPS Notification deep link result:', result);
            }
            return result;
          }
        }
      }
      
      // التعامل مع التنسيق القديم (hostname/path)
      if (parsed.hostname && parsed.path) {
        const pathSegments = parsed.path.split('/').filter(Boolean);
        if (__DEV__) {
          console.log('Legacy path segments:', pathSegments);
        }
        
        if (pathSegments.length > 0) {
          const firstSegment = pathSegments[0];
          
          if (firstSegment === 'doctor' && pathSegments.length > 1) {
            const result = {
              type: 'doctor' as const,
              id: pathSegments[1],
              action: pathSegments[2] || 'view'
            };
            if (__DEV__) {
              console.log('Legacy Doctor deep link result:', result);
            }
            return result;
          }
          
          if (firstSegment === 'appointment' && pathSegments.length > 1) {
            const result = {
              type: 'appointment' as const,
              id: pathSegments[1],
              action: pathSegments[2] || 'view'
            };
            if (__DEV__) {
              console.log('Legacy Appointment deep link result:', result);
            }
            return result;
          }
          
          if (firstSegment === 'profile') {
            const result = {
              type: 'profile' as const,
              action: pathSegments[1] || 'view'
            };
            if (__DEV__) {
              console.log('Legacy Profile deep link result:', result);
            }
            return result;
          }
          
          if (firstSegment === 'notification' && pathSegments.length > 1) {
            const result = {
              type: 'notification' as const,
              id: pathSegments[1],
              action: pathSegments[2] || 'view'
            };
            if (__DEV__) {
              console.log('Legacy Notification deep link result:', result);
            }
            return result;
          }
        }
      }

      if (__DEV__) {
        console.log('No matching deep link pattern found');
      }
      return null;
    } catch (error) {
      if (__DEV__) {
        console.error('Error parsing deep link:', error);
      }
      return null;
    }
  }

  public async openDeepLink(data: DeepLinkData): Promise<boolean> {
    try {
      let url = '';
      
      switch (data.type) {
        case 'doctor':
          url = `https://tabib-iq.com/doctor/${data.id}`;
          break;
        case 'appointment':
          url = `https://tabib-iq.com/appointment/${data.id}`;
          break;
        case 'profile':
          url = 'https://tabib-iq.com/profile';
          break;
        case 'notification':
          url = `https://tabib-iq.com/notification/${data.id}`;
          break;
        default:
          return false;
      }

      if (Platform.OS === 'web') {
        window.location.href = url;
        return true;
      } else {
        const canOpen = await Linking.canOpenURL(url);
        if (canOpen) {
          await Linking.openURL(url);
          return true;
        }
      }

      return false;
    } catch (error) {
      return false;
    }
  }

  public async openExternalUrl(url: string): Promise<boolean> {
    try {
      if (Platform.OS === 'web') {
        window.open(url, '_blank');
        return true;
      } else {
        const canOpen = await Linking.canOpenURL(url);
        if (canOpen) {
          await Linking.openURL(url);
          return true;
        }
      }
      return false;
    } catch (error) {
      return false;
    }
  }

  public async openSettings(): Promise<boolean> {
    try {
      if (Platform.OS === 'ios') {
        await Linking.openURL('app-settings:');
        return true;
      } else if (Platform.OS === 'android') {
        await Linking.openURL('package:com.tabibiq.mobile');
        return true;
      }
      return false;
    } catch (error) {
      return false;
    }
  }

  public async openPhone(phoneNumber: string): Promise<boolean> {
    try {
      const url = `tel:${phoneNumber}`;
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
        return true;
      }
      return false;
    } catch (error) {
      return false;
    }
  }

  public async openEmail(email: string, subject?: string, body?: string): Promise<boolean> {
    try {
      let url = `mailto:${email}`;
      const params = new URLSearchParams();
      
      if (subject) params.append('subject', subject);
      if (body) params.append('body', body);
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }
      
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
        return true;
      }
      return false;
    } catch (error) {
      return false;
    }
  }

  public async openMap(latitude: number, longitude: number, label?: string): Promise<boolean> {
    try {
      let url = '';
      
      if (Platform.OS === 'ios') {
        url = `https://maps.apple.com/?q=${label || 'Location'}&ll=${latitude},${longitude}`;
      } else {
        url = `geo:${latitude},${longitude}?q=${latitude},${longitude}${label ? `(${label})` : ''}`;
      }
      
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
        return true;
      }
      return false;
    } catch (error) {
      return false;
    }
  }

  public async openWhatsApp(phoneNumber: string, message?: string): Promise<boolean> {
    try {
      let url = `whatsapp://send?phone=${phoneNumber}`;
      
      if (message) {
        url += `&text=${encodeURIComponent(message)}`;
      }
      
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
        return true;
      }
      return false;
    } catch (error) {
      return false;
    }
  }

  public async openTelegram(username: string, message?: string): Promise<boolean> {
    try {
      let url = `tg://msg?to=${username}`;
      
      if (message) {
        url += `&text=${encodeURIComponent(message)}`;
      }
      
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
        return true;
      }
      return false;
    } catch (error) {
      return false;
    }
  }

  public async openFacebook(pageId: string): Promise<boolean> {
    try {
      let url = '';
      
      if (Platform.OS === 'ios') {
        url = `fb://profile/${pageId}`;
      } else {
        url = `fb://page/${pageId}`;
      }
      
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
        return true;
      }
      return false;
    } catch (error) {
      return false;
    }
  }

  public async openInstagram(username: string): Promise<boolean> {
    try {
      const url = `instagram://user?username=${username}`;
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
        return true;
      }
      return false;
    } catch (error) {
      return false;
    }
  }

  public async openTwitter(username: string): Promise<boolean> {
    try {
      const url = `twitter://user?screen_name=${username}`;
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
        return true;
      }
      return false;
    } catch (error) {
      return false;
    }
  }

  public async openYouTube(channelId: string): Promise<boolean> {
    try {
      const url = `youtube://channel/${channelId}`;
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
        return true;
      }
      return false;
    } catch (error) {
      return false;
    }
  }

  public async openWebsite(url: string): Promise<boolean> {
    try {
      if (Platform.OS === 'web') {
        window.open(url, '_blank');
        return true;
      } else {
        const canOpen = await Linking.canOpenURL(url);
        if (canOpen) {
          await Linking.openURL(url);
          return true;
        }
      }
      return false;
    } catch (error) {
      return false;
    }
  }

  public async shareContent(content: string, url?: string): Promise<boolean> {
    try {
      if (Platform.OS === 'web') {
        if (navigator.share) {
          await navigator.share({
            title: 'TabibiQ',
            text: content,
            url: url || 'https://tabib-iq.com'
          });
          return true;
        } else {
          const shareUrl = `mailto:?subject=TabibiQ&body=${encodeURIComponent(content + (url ? `\n\n${url}` : ''))}`;
          window.location.href = shareUrl;
          return true;
        }
      } else {
        const shareUrl = `mailto:?subject=TabibiQ&body=${encodeURIComponent(content + (url ? `\n\n${url}` : ''))}`;
        const canOpen = await Linking.canOpenURL(shareUrl);
        if (canOpen) {
          await Linking.openURL(shareUrl);
          return true;
        }
      }
      return false;
    } catch (error) {
      return false;
    }
  }

  public destroy(): void {
    this.listeners = [];
    this.isInitialized = false;
    this.lastProcessedUrl = null;
  }
}

export default DeepLinkingService;
