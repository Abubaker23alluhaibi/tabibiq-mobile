import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface ImagePickerOptions {
  mediaType?: 'photo' | 'video' | 'mixed';
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  includeBase64?: boolean;
  includeExtra?: boolean;
  selectionLimit?: number;
  saveToPhotos?: boolean;
  [key: string]: any;
}

interface ImagePickerResponse {
  didCancel?: boolean;
  errorCode?: string;
  errorMessage?: string;
  assets?: Array<{
    uri?: string;
    width?: number;
    height?: number;
    type?: string;
    fileName?: string;
    fileSize?: number;
    base64?: string;
  }>;
}

class ImagePicker {
  static launchImageLibrary(
    options: ImagePickerOptions = {},
    callback?: (response: ImagePickerResponse) => void
  ): Promise<ImagePickerResponse> {
    return new Promise((resolve) => {
      // محاكاة اختيار الصورة على الويب
      const mockResponse: ImagePickerResponse = {
        didCancel: false,
        assets: [
          {
            uri: 'https://via.placeholder.com/300x300?text=Selected+Image',
            width: 300,
            height: 300,
            type: 'image/jpeg',
            fileName: 'selected-image.jpg',
            fileSize: 1024,
          },
        ],
      };
      
      if (callback) {
        callback(mockResponse);
      }
      resolve(mockResponse);
    });
  }

  static launchCamera(
    options: ImagePickerOptions = {},
    callback?: (response: ImagePickerResponse) => void
  ): Promise<ImagePickerResponse> {
    return new Promise((resolve) => {
      // محاكاة التقاط صورة على الويب
      const mockResponse: ImagePickerResponse = {
        didCancel: false,
        assets: [
          {
            uri: 'https://via.placeholder.com/300x300?text=Camera+Image',
            width: 300,
            height: 300,
            type: 'image/jpeg',
            fileName: 'camera-image.jpg',
            fileSize: 1024,
          },
        ],
      };
      
      if (callback) {
        callback(mockResponse);
      }
      resolve(mockResponse);
    });
  }
}

// مكون للاختيار من المعرض
export const ImagePickerComponent: React.FC<{
  onImageSelected?: (response: ImagePickerResponse) => void;
  style?: any;
}> = ({ onImageSelected, style }) => {
  const handleImageSelection = async () => {
    try {
      const response = await ImagePicker.launchImageLibrary({
        mediaType: 'photo',
        quality: 0.8,
      });
      
      if (onImageSelected) {
        onImageSelected(response);
      }
    } catch (error) {
      console.error('Error selecting image:', error);
    }
  };

  return (
    <TouchableOpacity style={[styles.button, style]} onPress={handleImageSelection}>
      <Text style={styles.buttonText}>📷 اختيار صورة</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ImagePicker;



