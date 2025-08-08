import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface CameraProps {
  style?: any;
  type?: 'front' | 'back';
  children?: React.ReactNode;
  [key: string]: any;
}

export const Camera: React.FC<CameraProps> = ({ style, type = 'back', children, ...props }) => {
  return (
    <View style={[styles.container, style]}>
      <View style={styles.cameraPlaceholder}>
        <Text style={styles.placeholderText}>📷 كاميرا</Text>
        <Text style={styles.subText}>Camera Component (Web)</Text>
        <Text style={styles.typeText}>Type: {type}</Text>
      </View>
      {children}
    </View>
  );
};

export const CameraView: React.FC<CameraProps> = Camera;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  cameraPlaceholder: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  placeholderText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  subText: {
    fontSize: 14,
    color: '#ccc',
    marginBottom: 4,
  },
  typeText: {
    fontSize: 12,
    color: '#999',
  },
});

export default Camera;




