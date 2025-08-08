import React from 'react';
import { View, StyleSheet } from 'react-native';

interface SimpleWebScrollProps {
  children: React.ReactNode;
  style?: any;
  contentContainerStyle?: any;
  showsVerticalScrollIndicator?: boolean;
  showsHorizontalScrollIndicator?: boolean;
  horizontal?: boolean;
  [key: string]: any;
}

export const SimpleWebScroll: React.FC<SimpleWebScrollProps> = ({ 
  children, 
  style, 
  contentContainerStyle,
  showsVerticalScrollIndicator = true,
  showsHorizontalScrollIndicator = false,
  horizontal = false,
  ...props 
}) => {
  return (
    <View
      style={[
        styles.container,
        horizontal && styles.horizontalContainer,
        style
      ]}
      {...props}
    >
      <div
        style={{
          height: '100%',
          overflow: horizontal ? 'auto' : 'auto',
          overflowX: horizontal ? 'auto' : 'hidden',
          overflowY: horizontal ? 'hidden' : 'auto',
          WebkitOverflowScrolling: 'touch',
          paddingBottom: horizontal ? 0 : 100,
        }}
      >
        <div style={contentContainerStyle}>
          {children}
        </div>
      </div>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  horizontalContainer: {
    flexDirection: 'row',
  },
});

export default SimpleWebScroll;


