import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface MapViewProps {
  style?: any;
  region?: any;
  children?: React.ReactNode;
  [key: string]: any;
}

interface MarkerProps {
  coordinate: {
    latitude: number;
    longitude: number;
  };
  title?: string;
  description?: string;
  [key: string]: any;
}

export const MapView: React.FC<MapViewProps> = ({ style, children, ...props }) => {
  return (
    <View style={[styles.container, style]}>
      <View style={styles.mapPlaceholder}>
        <Text style={styles.placeholderText}>🗺️ خريطة</Text>
        <Text style={styles.subText}>Map Component (Web)</Text>
      </View>
      {children}
    </View>
  );
};

export const Marker: React.FC<MarkerProps> = ({ coordinate, title, description, ...props }) => {
  return (
    <View style={styles.marker}>
      <Text style={styles.markerText}>📍</Text>
      {title && <Text style={styles.markerTitle}>{title}</Text>}
    </View>
  );
};

// Export both as default and named exports
const MapViewDefault = MapView as any;
MapViewDefault.Marker = Marker;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  mapPlaceholder: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  placeholderText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666',
    marginBottom: 8,
  },
  subText: {
    fontSize: 14,
    color: '#999',
  },
  marker: {
    alignItems: 'center',
  },
  markerText: {
    fontSize: 24,
  },
  markerTitle: {
    fontSize: 12,
    color: '#333',
    textAlign: 'center',
    marginTop: 4,
  },
});

export default MapViewDefault;
