import React from 'react';
import { WebView } from 'react-native-webview';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { useRoute } from '@react-navigation/native';

const WebViewScreen = () => {
  const route = useRoute<any>();
  
  // إذا لم يرسل الزر رابطاً، سيفتح صفحة الموقع الرئيسية كاحتياط
  const targetUrl = route.params?.url || 'https://www.tabib-iq.com';

  return (
    <View style={styles.container}>
      <WebView 
        source={{ uri: targetUrl }} 
        startInLoadingState={true}
        renderLoading={() => (
          <ActivityIndicator
            color="#07635d"
            size="large"
            style={styles.loader}
          />
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  loader: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginLeft: -20,
    marginTop: -20,
  },
});

export default WebViewScreen;