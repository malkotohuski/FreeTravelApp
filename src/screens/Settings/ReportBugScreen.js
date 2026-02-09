import React, {useState} from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  Platform,
} from 'react-native';
import DeviceInfo from 'react-native-device-info';
import {launchImageLibrary} from 'react-native-image-picker';
import {useAuth} from '../../context/AuthContext';
import {useTranslation} from 'react-i18next';
import {submitBugReport} from '../../api/bugReport.api';

const ReportBugScreen = () => {
  const {t} = useTranslation();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [steps, setSteps] = useState('');
  const [screenshot, setScreenshot] = useState(null);
  const [loading, setLoading] = useState(false);
  const [screenshots, setScreenshots] = useState([]);

  const appVersion = DeviceInfo.getVersion();
  const systemVersion = DeviceInfo.getSystemVersion();
  const deviceModel = DeviceInfo.getModel();

  const pickImage = async () => {
    const result = await launchImageLibrary({
      mediaType: 'photo',
      quality: 0.8,
      includeBase64: true,
    });

    if (!result.didCancel && result.assets?.length) {
      setScreenshots(prev => [...prev, ...result.assets]);
    }
  };

  const submitBug = async () => {
    if (!title.trim()) {
      Alert.alert(t('validation'), t('titleRequired'));
      return;
    }

    setLoading(true);

    const payload = {
      title,
      description,
      steps,
      appVersion,
      platform: Platform.OS,
      systemVersion,
      deviceModel,
      screenshot: screenshots.map(s => s.base64),
    };

    try {
      await submitBugReport(payload);

      Alert.alert(t('thankYou'), t('bugSent'));
      setTitle('');
      setDescription('');
      setSteps('');
      setScreenshot(null);
    } catch (e) {
      console.log('Bug submit error:', e);
      Alert.alert(t('error'), t('bugSendFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.label}>{t('Title')} *</Text>
      <TextInput
        style={styles.input}
        placeholder={t('shortSummary')}
        value={title}
        onChangeText={setTitle}
      />

      <Text style={styles.label}>{t('detailedDescription')}</Text>
      <TextInput
        style={[styles.input, styles.multiline]}
        multiline
        value={description}
        onChangeText={setDescription}
      />

      <Text style={styles.label}>{t('stepsReproduce')}</Text>
      <TextInput
        style={[styles.input, styles.multiline]}
        placeholder="1. Open app
2. Go to Settings
3. App crashes"
        multiline
        value={steps}
        onChangeText={setSteps}
      />

      <TouchableOpacity style={styles.attachBtn} onPress={pickImage}>
        <Text>{t('attachScreenshot')}</Text>
      </TouchableOpacity>

      {screenshot && (
        <Image source={{uri: screenshot.uri}} style={styles.preview} />
      )}

      <View style={styles.infoBox}>
        <Text>App version: {appVersion}</Text>
        <Text>
          OS: {Platform.OS} {systemVersion}
        </Text>
        <Text>Device: {deviceModel}</Text>
      </View>

      <TouchableOpacity
        style={styles.sendBtn}
        onPress={submitBug}
        disabled={loading}>
        <Text style={{color: '#fff'}}>
          {loading ? t('sending') : t('sendReport')}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {padding: 16},
  label: {fontWeight: 'bold', marginTop: 15},
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 10,
    marginTop: 5,
  },
  multiline: {height: 100, textAlignVertical: 'top'},
  attachBtn: {
    marginTop: 15,
    padding: 12,
    backgroundColor: '#6e6d6d',
    borderRadius: 8,
    alignItems: 'center',
  },
  preview: {height: 200, marginTop: 10, borderRadius: 8},
  infoBox: {marginTop: 20, opacity: 0.7},
  sendBtn: {
    marginTop: 25,
    backgroundColor: '#f4511e',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
});

export default ReportBugScreen;
