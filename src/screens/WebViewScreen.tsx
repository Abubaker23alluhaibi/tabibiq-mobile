import React from 'react';
import { WebView } from 'react-native-webview';
import { ActivityIndicator, View, StyleSheet } from 'react-native';

const WebViewScreen = () => {
  return (
    <View style={styles.container}>
      <WebView 
        source={{ uri: 'https://www.tabib-iq.com/signup-doctor' }} 
        startInLoadingState={true}
        renderLoading={() => (
          <ActivityIndicator
            color="#0000ff"
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