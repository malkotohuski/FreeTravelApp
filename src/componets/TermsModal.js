import React from 'react';
import {
  Modal,
  SafeAreaView,
  TouchableOpacity,
  Text,
  StyleSheet,
  View,
} from 'react-native';
import {WebView} from 'react-native-webview';
import {useTranslation} from 'react-i18next';

export default function TermsModal({visible, onClose, type}) {
  const {i18n, t} = useTranslation();

  const source =
    type === 'terms'
      ? i18n.language === 'bg'
        ? require('../../docs/terms-of-service-bg.html')
        : require('../../docs/terms-of-service-en.html')
      : i18n.language === 'bg'
      ? require('../../docs/privacy-policy-bg.html')
      : require('../../docs/privacy-policy-eng.html');

  return (
    <Modal visible={visible} animationType="slide" transparent={false}>
      <SafeAreaView style={{flex: 1}}>
        <View style={styles.header}>
          <Text style={styles.title}>
            {type === 'privacy' ? t('privacyPolicy') : t('termsOfService')}
          </Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeText}>{t('Close')}</Text>
          </TouchableOpacity>
        </View>
        <WebView originWhitelist={['*']} source={source} style={{flex: 1}} />
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  header: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    justifyContent: 'space-between',
    backgroundColor: '#f4511e',
  },
  closeButton: {
    // може да добавиш padding ако искаш повече разстояние
  },
  closeText: {
    color: '#fff',
    fontSize: 16,
  },
  title: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
