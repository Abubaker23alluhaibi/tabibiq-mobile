import * as DocumentPicker from 'expo-document-picker';
import { Platform } from 'react-native';

export interface ImagePickerResult {
  uri: string;
  width?: number;
  height?: number;
  type?: string;
}

export const pickImage = async (): Promise<ImagePickerResult | null> => {
  try {
    // استخدام DocumentPicker لجميع المنصات لتجنب مشاكل الصلاحيات
    const result = await DocumentPicker.getDocumentAsync({
      type: 'image/*',
      copyToCacheDirectory: true,
      multiple: false,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const asset = result.assets[0];
      return {
        uri: asset.uri,
        type: asset.mimeType || 'image/jpeg',
        width: (asset as any).width,
        height: (asset as any).height,
      };
    }
  } catch (error) {
    // Error picking image - return null
  }
  
  return null;
};
