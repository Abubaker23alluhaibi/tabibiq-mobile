import React from 'react';
import { ScrollView, View, StyleSheet } from 'react-native';

interface WebScrollViewProps {
  children: React.ReactNode;
  style?: any;
  contentContainerStyle?: any;
  showsVerticalScrollIndicator?: boolean;
  showsHorizontalScrollIndicator?: boolean;
  refreshControl?: any;
  horizontal?: boolean;
  [key: string]: any;
}

export const WebScrollView: React.FC<WebScrollViewProps> = ({ 
  children, 
  style, 
  contentContainerStyle,
  showsVerticalScrollIndicator = true,
  showsHorizontalScrollIndicator = false,
  refreshControl,
  horizontal = false,
  ...props 
}) => {
  return (
    <ScrollView
      style={[styles.scrollView, horizontal && styles.horizontalScrollView, style]}
      contentContainerStyle={[styles.contentContainer, contentContainerStyle]}
      showsVerticalScrollIndicator={showsVerticalScrollIndicator}
      showsHorizontalScrollIndicator={showsHorizontalScrollIndicator}
      refreshControl={refreshControl}
      nestedScrollEnabled={true}
      scrollEventThrottle={16}
      horizontal={horizontal}
      {...props}
    >
      {children}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
    // خصائص خاصة بالويب للتمرير العمودي
    overflow: 'auto',
    WebkitOverflowScrolling: 'touch',
  } as any,
  horizontalScrollView: {
    // خصائص خاصة بالويب للتمرير الأفقي
    overflow: 'auto',
    flexDirection: 'row',
  } as any,
  contentContainer: {
    flexGrow: 1,
    paddingBottom: 150, // مساحة إضافية في الأسفل
    minHeight: '100%',
  },
});

export default WebScrollView;

