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

const API_BASE_URL = 'http://10.0.2.2:3000';

const ReportBugScreen = () => {
  const {user} = useAuth();
  const {t} = useTranslation();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [steps, setSteps] = useState('');
  const [screenshot, setScreenshot] = useState(null);
  const [loading, setLoading] = useState(false);

  const appVersion = DeviceInfo.getVersion();
  const systemVersion = DeviceInfo.getSystemVersion();
  const deviceModel = DeviceInfo.getModel();

  const pickImage = async () => {
    const result = await launchImageLibrary({
      mediaType: 'photo',
      quality: 0.8,
    });

    if (!result.didCancel && result.assets?.length) {
      setScreenshot(result.assets[0]);
    }
  };

  const submitBug = async () => {
    if (!title.trim()) {
      Alert.alert('Validation', 'Title is required');
      return;
    }

    setLoading(true);

    const payload = {
      userId: user?.id,
      title,
      description,
      steps,
      appVersion,
      platform: Platform.OS,
      systemVersion,
      deviceModel,
      screenshot: screenshot?.base64 || null,
    };

    try {
      const res = await fetch(`${API_BASE_URL}/report-bug`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error();

      Alert.alert('Thank you 🙏', 'Bug report sent successfully');
      setTitle('');
      setDescription('');
      setSteps('');
      setScreenshot(null);
    } catch (e) {
      Alert.alert('Error', 'Could not send report');
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
