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
import Icons from 'react-native-vector-icons/MaterialCommunityIcons';
import * as Animatable from 'react-native-animatable';
import {useAuth} from '../../context/AuthContext';
import {DarkModeContext} from '../../navigation/DarkModeContext';
import ProblemInput from '../../componets/ProblemInput';

const ReportingScreen = ({navigation}) => {
  const {darkMode} = useContext(DarkModeContext);
  const [problemDescription, setProblemDescription] = useState('');
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [attachment, setAttachment] = useState(null);
  const [profilePicture, setProfilePicture] = useState('');
  /*   const [isValidVehicleNumber, setValidVehicleNumber] = useState(true); */
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [isButtonDisabled, setIsButtonDisabled] = useState(false); // Добавено състояние
  const {t} = useTranslation();

  const {user} = useAuth();
  const userEmail = user?.email;
  const userName = user?.username;
  const userId = user?.id;

  /*   const getHeaderStyles = () => ({
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    padding: 16,
    backgroundColor: darkMode ? '#333232FF' : '#f4511e',
  }); */

  /*  const validateVehicleNumber = text => {
    const regex = /^([A-ZА-Я]{1,2})([0-9]{4})([A-ZА-Я]{2})$/;
    const isValid = regex.test(text);
    setValidVehicleNumber(isValid);
    setVehicleNumber(text);
  }; */

  const chooseMedia = async () => {
    try {
      const media = await ImagePicker.openPicker({
        mediaType: 'any', // ✅ Позволява снимки и видеа
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
    if (isButtonDisabled) return; // Бутонът не е активен

    if (!problemDescription.trim()) {
      Alert.alert(t('Missing Fields'), t('Please fill out all fields!'));
      return;
    }

    if (problemDescription.trim().length < 20) {
      Alert.alert(
        t('Too short'),
        t('Please describe the problem in more detail.'),
      );
      return;
    }

    try {
      setIsButtonDisabled(true); // Деактивиране на бутона
      const serverEndpoint = 'http://10.0.2.2:3000/send-request-to-email';
      const emailBody = `
                ${t('Problem Description')}: ${problemDescription} 
                ${t('User email:')}: ${userEmail || 'N/A'} ${t(
        'Username:',
      )}: ${userName} with ID: ${userId}
            `;

      await fetch(serverEndpoint, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          email: 'malkotohuski@gmail.com',
          text: emailBody,
          image: profilePicture, // 🟢 ВАЖНО: изпращаш изображението като Base64
        }),
      });

      setShowSuccessMessage(true);

      setTimeout(() => {
        setShowSuccessMessage(false);
        setProblemDescription(''); // Изчистване на полето
        setVehicleNumber(''); // Изчистване на полето
        setIsButtonDisabled(false); // Активиране на бутона отново, ако е нужно
        navigation.navigate('Home');
      }, 5000);
    } catch (error) {
      console.error('Error sending report:', error);
      setIsButtonDisabled(false); // Активиране на бутона при грешка
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={{flexGrow: 1, padding: 16}}>
        {/* Success message */}
        {showSuccessMessage && (
          <Animatable.Text
            animation="pulse"
            iterationCount="infinite"
            style={styles.successMessage}>
            {t('The signal has been sent!')}
          </Animatable.Text>
        )}

        {/* Problem Description */}
        <ProblemInput
          value={problemDescription}
          onChangeText={setProblemDescription}
          maxLength={400}
        />

        {/* Vehicle Number */}
        {/*   <TextInput
          style={[styles.input]}
          placeholder={t('Enter your vehicle registration number or username')}
          placeholderTextColor={'#999'}
          value={vehicleNumber}
          onChangeText={validateVehicleNumber}
          textAlign="center"
        /> */}

        {/* Image / Video picker */}
        <TouchableOpacity onPress={chooseMedia} style={styles.imagePicker}>
          <Text style={styles.buttonText}>{t('Choose Photo or Video')}</Text>
        </TouchableOpacity>

        {/* Preview */}
        {profilePicture ? (
          <View style={styles.previewContainer}>
            {profilePicture.startsWith('data:video') ? (
              <Text style={styles.previewText}>
                📹 {t('Video selected (preview not available)')}
              </Text>
            ) : (
              <Image
                source={{uri: profilePicture}}
                style={styles.attachmentPreview}
              />
            )}
          </View>
        ) : null}

        {/* Send button */}
        <TouchableOpacity
          onPress={sendReport}
          style={[styles.sendButton, isButtonDisabled && styles.disabledButton]}
          disabled={isButtonDisabled}>
          <Text style={styles.buttonText}>{t('Send the Signal')}</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1e1e2f', // светъл и чист фон
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    width: '100%',
    padding: 16,
    backgroundColor: '#f4511e',
  },
  headerText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  input: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    fontSize: 16,
    marginBottom: 16,
    textAlignVertical: 'top',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: {width: 0, height: 2},
    shadowRadius: 4,
    elevation: 2,
  },
  invalidInput: {
    borderColor: 'red',
  },
  inputVehicle: {
    height: 100,
    borderColor: 'white',
    borderWidth: 2,
    marginBottom: 16,
    padding: 8,
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center', // Центриране на текста
  },
  imagePicker: {
    backgroundColor: '#f4511e',
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 16,
  },
  previewContainer: {
    marginBottom: 16,
  },
  previewText: {
    color: '#333',
    textAlign: 'center',
    fontSize: 14,
    marginBottom: 8,
  },
  attachmentPreview: {
    width: '100%',
    height: 250,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  show_image: {},
  invalidInput: {
    borderColor: 'red',
  },
  sendButton: {
    backgroundColor: '#f4511e',
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 20,
  },
  disabledButton: {
    backgroundColor: 'gray', // Стил за неактивен бутон
  },
  footer_container: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    padding: 10,
    marginTop: 'auto',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  successMessage: {
    color: '#4BB543', // зелено за успех
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 10,
  },
});

export default ReportingScreen;
