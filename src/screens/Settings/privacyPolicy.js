import React from 'react';
import {SafeAreaView, StyleSheet} from 'react-native';
import {WebView} from 'react-native-webview';

export default function PrivacyPolicyScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <WebView
        source={{
          uri: 'https://malkotohuski.github.io/FreeTravelApp/privacy-policy.html',
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1},
});
