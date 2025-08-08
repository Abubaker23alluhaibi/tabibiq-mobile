import React from 'react';
import { View, StyleSheet } from 'react-native';

interface CSSScrollViewProps {
  children: React.ReactNode;
  style?: any;
  contentContainerStyle?: any;
  showsVerticalScrollIndicator?: boolean;
  showsHorizontalScrollIndicator?: boolean;
  horizontal?: boolean;
  [key: string]: any;
}

export const CSSScrollView: React.FC<CSSScrollViewProps> = ({ 
  children, 
  style, 
  contentContainerStyle,
  showsVerticalScrollIndicator = true,
  showsHorizontalScrollIndicator = false,
  horizontal = false,
  ...props 
}) => {
  const scrollStyle = {
    height: '100vh', // استخدام ارتفاع الشاشة الكامل
    overflow: horizontal ? 'auto' : 'auto',
    overflowX: horizontal ? 'auto' : 'hidden',
    overflowY: horizontal ? 'hidden' : 'auto',
    WebkitOverflowScrolling: 'touch',
    paddingBottom: horizontal ? 0 : 200, // زيادة المساحة في الأسفل
    ...(contentContainerStyle || {}),
  };

  return (
    <View
      style={[
        styles.container,
        horizontal && styles.horizontalContainer,
        style
      ]}
      {...props}
    >
      <div style={scrollStyle}>
        {children}
        {/* إضافة مساحة إضافية للتمرير */}
        {!horizontal && <div style={{ height: '50vh', minHeight: 400 }} />}
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

export default CSSScrollView;
