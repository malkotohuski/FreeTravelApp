import React from 'react';
import {SafeAreaView, StyleSheet} from 'react-native';
import {WebView} from 'react-native-webview';
import {useTranslation} from 'react-i18next';

export default function PrivacyPolicyScreen() {
  const {i18n} = useTranslation();

  const source =
    i18n.language === 'bg'
      ? require('../../../docs/privacy-policy-bg.html')
      : require('../../../docs/privacy-policy-eng.html');

  return (
    <SafeAreaView style={styles.container}>
      <WebView originWhitelist={['*']} source={source} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1},
});
