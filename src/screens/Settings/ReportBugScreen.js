import React, {useState, useCallback} from 'react';
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
import {useTranslation} from 'react-i18next';
import {submitBugReport} from '../../api/bugReport.api';
import {useFocusEffect} from '@react-navigation/native';

const ReportBugScreen = () => {
  const {t} = useTranslation();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [steps, setSteps] = useState('');
  const [screenshots, setScreenshots] = useState([]);
  const [loading, setLoading] = useState(false);

  const appVersion = DeviceInfo.getVersion();
  const systemVersion = DeviceInfo.getSystemVersion();
  const deviceModel = DeviceInfo.getModel();

  useFocusEffect(
    useCallback(() => {
      setTitle('');
      setDescription('');
      setSteps('');
      setScreenshots([]);
    }, []),
  );

  const pickImage = async () => {
    const result = await launchImageLibrary({
      mediaType: 'photo',
      quality: 0.5,
      includeBase64: false,
    });

    if (!result.didCancel && result.assets?.length) {
      const asset = result.assets[0];

      if ((asset.fileSize || 0) > 5 * 1024 * 1024) {
        Alert.alert(
          'Error',
          'Image is too large. Please select a smaller one.',
        );
        return;
      }

      setScreenshots([asset]);
    }
  };

  const submitBug = async () => {
    if (!title.trim() || !description.trim()) {
      Alert.alert(t('Error'), t('pleaseFill'));
      return;
    }

    setLoading(true);

    const payload = new FormData();
    payload.append('title', title.trim());
    payload.append('description', description.trim());
    payload.append('steps', steps.trim());
    payload.append('appVersion', appVersion);
    payload.append('platform', Platform.OS);
    payload.append('systemVersion', systemVersion);
    payload.append('deviceModel', deviceModel);

    if (screenshots.length > 0) {
      const screenshot = screenshots[0];
      payload.append('image', {
        uri: screenshot.uri,
        type: screenshot.type || 'image/jpeg',
        name: screenshot.fileName || `bug-report-${Date.now()}.jpg`,
      });
    }

    try {
      await submitBugReport(payload);
      Alert.alert(t('thankYou'), t('bugSent'));
      setTitle('');
      setDescription('');
      setSteps('');
      setScreenshots([]);
    } catch (error) {
      console.error('Bug submit error:', error?.response?.data || error);

      if (
        error.response?.data?.error ===
        'You can only submit 2 bug reports per day'
      ) {
        Alert.alert(t('Error'), t('dailyLimitReached'));
      } else {
        Alert.alert(t('error'), t('bugSendFailed'));
      }
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
        placeholderTextColor="#000"
        value={title}
        onChangeText={setTitle}
      />

      <Text style={styles.label}>{t('detailedDescription')} *</Text>
      <TextInput
        style={[styles.input, styles.multiline]}
        multiline
        value={description}
        onChangeText={setDescription}
      />

      <Text style={styles.label}>{t('stepsReproduce')}</Text>
      <TextInput
        style={[styles.input, styles.multiline]}
        placeholder="1. Open app\n2. Go to Settings\n3. App crashes"
        multiline
        value={steps}
        onChangeText={setSteps}
      />

      <TouchableOpacity style={styles.attachBtn} onPress={pickImage}>
        <Text>{t('attachScreenshot')}</Text>
      </TouchableOpacity>

      {screenshots.length > 0 && (
        <Image source={{uri: screenshots[0].uri}} style={styles.preview} />
      )}

      <View style={styles.infoBox}>
        <Text>App version: {appVersion}</Text>
        <Text>
          OS: {Platform.OS} {systemVersion}
        </Text>
        <Text>Device: {deviceModel}</Text>
      </View>

      <TouchableOpacity
        style={[styles.sendBtn, loading && styles.disabledButton]}
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
  label: {fontWeight: 'bold', marginTop: 15, color: '#000'},
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
  disabledButton: {backgroundColor: 'gray'},
});

export default ReportBugScreen;
