import React from 'react';
import {SafeAreaView, StyleSheet} from 'react-native';
import {WebView} from 'react-native-webview';
import {useTranslation} from 'react-i18next';

export default function TermsOfServiceScreen() {
  const {i18n} = useTranslation();

  const source =
    i18n.language === 'bg'
      ? require('../../../docs/terms-of-service-bg.html')
      : require('../../../docs/terms-of-service-en.html');

  return (
    <SafeAreaView style={styles.container}>
      <WebView originWhitelist={['*']} source={source} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1},
});
