import React from 'react';
import {
  SafeAreaView,
  StyleSheet,
  View,
  TouchableOpacity,
  Text,
} from 'react-native';
import {WebView} from 'react-native-webview';
import {useTranslation} from 'react-i18next';
import {useNavigation} from '@react-navigation/native';
import Icons from 'react-native-vector-icons/MaterialCommunityIcons';

export default function PrivacyPolicyScreen() {
  const {i18n, t} = useTranslation();
  const navigation = useNavigation();

  const source = {
    uri:
      i18n.language === 'bg'
        ? 'https://malkotohuski.github.io/legal-pages/privacy-policy-bg.html'
        : 'https://malkotohuski.github.io/legal-pages/privacy-policy-eng.html',
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* 🔙 Custom Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icons name="keyboard-backspace" size={26} color="#000" />
        </TouchableOpacity>

        <Text style={styles.title}>{t('privacyPolicy')}</Text>
      </View>

      {/* 📄 WebView */}
      <WebView originWhitelist={['*']} source={source} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1},

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#fff',
  },

  title: {
    fontSize: 18,
    marginLeft: 10,
    fontWeight: 'bold',
  },
});
