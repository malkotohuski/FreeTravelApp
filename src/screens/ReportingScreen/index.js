import {useTranslation} from 'react-i18next';
import React, {useState, useContext} from 'react';
import {
  View,
  TextInput,
  Alert,
  Image,
  TouchableOpacity,
  StyleSheet,
  Text,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import ImagePicker from 'react-native-image-crop-picker';
import * as Animatable from 'react-native-animatable';
import {useAuth} from '../../context/AuthContext';
import {DarkModeContext} from '../../navigation/DarkModeContext';
import ProblemInput from '../../componets/ProblemInput';
import api from '../../api/api';

const ReportingScreen = ({navigation}) => {
  const {darkMode} = useContext(DarkModeContext);
  const [problemDescription, setProblemDescription] = useState('');
  const [reportedUsername, setReportedUsername] = useState('');
  const [profilePicture, setProfilePicture] = useState(null);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [isButtonDisabled, setIsButtonDisabled] = useState(false);
  const {t} = useTranslation();
  const {user} = useAuth();

  const chooseMedia = async () => {
    try {
      const media = await ImagePicker.openPicker({
        mediaType: 'any',
        includeBase64: true,
      });

      if (media.data) {
        const base64Data = `data:${media.mime};base64,${media.data}`;
        setProfilePicture(base64Data);
      }
    } catch (error) {
      console.warn('Media picker error:', error);
    }
  };

  const sendReport = async () => {
    if (!problemDescription.trim() || !reportedUsername.trim()) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }

    try {
      setIsButtonDisabled(true);

      await api.post('/api/report', {
        reportedUsername: reportedUsername.trim(),
        text: problemDescription,
        image: profilePicture || null,
      });

      setShowSuccessMessage(true);
      setProblemDescription('');
      setReportedUsername('');
      setProfilePicture(null);

      setTimeout(() => setShowSuccessMessage(false), 2000);
      setIsButtonDisabled(false);
    } catch (error) {
      console.log(error.response?.data);
      Alert.alert('Error', error.response?.data?.error || 'Server error');
      setIsButtonDisabled(false);
    }
  };

  const theme = {
    background: darkMode ? '#1e1e2f' : '#f2f2f2',
    textPrimary: darkMode ? '#fff' : '#222',
    textSecondary: darkMode ? '#aaa' : '#555',
    inputBackground: darkMode ? '#333' : '#fff',
    buttonBackground: '#f4511e',
  };

  return (
    <SafeAreaView
      style={[styles.container, {backgroundColor: theme.background}]}>
      <ScrollView contentContainerStyle={{flexGrow: 1, padding: 16}}>
        {showSuccessMessage && (
          <Animatable.Text
            animation="pulse"
            iterationCount="infinite"
            style={[styles.successMessage, {color: '#4BB543'}]}>
            {t('The signal has been sent!')}
          </Animatable.Text>
        )}

        <ProblemInput
          value={problemDescription}
          onChangeText={setProblemDescription}
          maxLength={400}
          style={{
            backgroundColor: theme.inputBackground,
            color: theme.textPrimary,
            placeholderTextColor: theme.textSecondary,
          }}
        />

        <TextInput
          placeholder={t('Username of the user')}
          placeholderTextColor={theme.textSecondary}
          value={reportedUsername}
          onChangeText={setReportedUsername}
          style={[
            styles.input,
            {backgroundColor: theme.inputBackground, color: theme.textPrimary},
          ]}
        />

        <TouchableOpacity
          onPress={chooseMedia}
          style={[
            styles.imagePicker,
            {backgroundColor: theme.buttonBackground},
          ]}>
          <Text style={styles.buttonText}>{t('Choose Photo or Video')}</Text>
        </TouchableOpacity>

        {profilePicture && (
          <View style={styles.previewContainer}>
            {profilePicture.startsWith('data:video') ? (
              <Text style={[styles.previewText, {color: theme.textPrimary}]}>
                📹 {t('Video selected (preview not available)')}
              </Text>
            ) : (
              <Image
                source={{uri: profilePicture}}
                style={styles.attachmentPreview}
              />
            )}
          </View>
        )}

        <TouchableOpacity
          onPress={sendReport}
          disabled={isButtonDisabled}
          style={[
            styles.sendButton,
            {backgroundColor: theme.buttonBackground},
            isButtonDisabled && styles.disabledButton,
          ]}>
          <Text style={styles.buttonText}>{t('Send the Signal')}</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1},
  input: {
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    fontSize: 16,
    marginBottom: 16,
  },
  imagePicker: {
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 16,
  },
  previewContainer: {marginBottom: 16},
  previewText: {textAlign: 'center', fontSize: 14, marginBottom: 8},
  attachmentPreview: {
    width: '100%',
    height: 250,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  sendButton: {
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 20,
  },
  disabledButton: {backgroundColor: 'gray'},
  buttonText: {color: '#fff', fontSize: 16, fontWeight: 'bold'},
  successMessage: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 10,
  },
});

export default ReportingScreen;
