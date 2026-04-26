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

  // Reset Ð¿Ð¾Ð»ÐµÑ‚Ð° Ð¿Ñ€Ð¸ Ð²Ð»Ð¸Ð·Ð°Ð½Ðµ Ð² ÐµÐºÑ€Ð°Ð½Ð°
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
      quality: 0.5, // Ð¿Ð¾-Ð½Ð¸ÑÐºÐ° ÐºÐ°Ñ‡ÐµÑÑ‚Ð²ÐµÐ½Ð¾ÑÑ‚ â†’ Ð¿Ð¾-Ð¼Ð°Ð»ÑŠÐº Ñ€Ð°Ð·Ð¼ÐµÑ€
      includeBase64: true,
    });

    if (!result.didCancel && result.assets?.length) {
      const asset = result.assets[0];

      // ÐŸÑ€Ð¾Ð²ÐµÑ€ÐºÐ° Ð´Ð°Ð»Ð¸ Base64 Ð½Ðµ Ðµ Ñ‚Ð²ÑŠÑ€Ð´Ðµ Ð³Ð¾Ð»ÑÐ¼Ð¾
      const base64SizeKB = (asset.base64.length * (3 / 4)) / 1024; // approx KB
      if (base64SizeKB > 1000) {
        // >1 MB
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

    const payload = {
      title: title.trim(),
      description: description.trim(),
      steps: steps.trim(),
      image: screenshots.length ? screenshots[0].base64 : null, // âš¡ Ð¸Ð·Ð¿Ð¾Ð»Ð·Ð²Ð°Ð¼Ðµ "image"
      appVersion,
      platform: Platform.OS,
      systemVersion,
      deviceModel,
    };

    try {
      await submitBugReport(payload);
      Alert.alert(t('thankYou'), t('bugSent'));
      setTitle('');
      setDescription('');
      setSteps('');
      setScreenshots([]);
    } catch (error) {
      console.error('Bug submit error:', error?.response?.data || error);

      // ÐŸÑ€Ð¾Ð²ÐµÑ€ÐºÐ° Ð·Ð° Ð»Ð¸Ð¼Ð¸Ñ‚ ÑÑŠÐ¾Ð±Ñ‰ÐµÐ½Ð¸Ðµ
      if (
        error.response?.data?.error ===
        'You can only submit 2 bug reports per day'
      ) {
        Alert.alert(t('Error'), t('dailyLimitReached')); // Ð´Ð¾Ð±Ð°Ð²ÑÑˆ t('dailyLimitReached') Ð² i18n
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
  disabledButton: {backgroundColor: 'gray'},
});

export default ReportBugScreen;

