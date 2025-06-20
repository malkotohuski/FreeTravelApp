import React, {useState} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  Image,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import {useFocusEffect} from '@react-navigation/native';
import {useCallback} from 'react';
import axios from 'axios';
import styles from './styles';
import {useTranslation} from 'react-i18next';
import ImagePicker from 'react-native-image-crop-picker';
import {useAuth} from '../../context/AuthContext';

const API_BASE_URL = 'http://10.0.2.2:3000'; // JSON server
const api = axios.create({
  baseURL: API_BASE_URL,
});

export default function Register({navigation}) {
  const {t} = useTranslation();
  const {login} = useAuth();

  const [name, setName] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [confirmationCode, setConfirmationCode] = useState('');
  const [showConfirmationCodeInput, setShowConfirmationCodeInput] =
    useState(false);
  const [profilePicture, setProfilePicture] = useState('');

  const resendConfirmationCode = async () => {
    try {
      const response = await api.post('/resend-confirmation-code', {email});
      if (response.status === 200) {
        Alert.alert(
          t('Code resent'),
          t('A new confirmation code has been sent to your email.'),
        );
      }
    } catch (err) {
      Alert.alert(
        t('Error'),
        t('Could not resend confirmation code. Check your email.'),
      );
    }
  };

  useFocusEffect(
    useCallback(() => {
      setName('');
      setFirstName('');
      setLastName('');
      setEmail('');
      setPassword('');
      setConfirmPassword('');
      setConfirmationCode('');
      setProfilePicture('');
      setShowConfirmationCodeInput(false);
    }, []),
  );

  const handleImagePicker = async () => {
    try {
      const image = await ImagePicker.openPicker({
        width: 300,
        height: 300,
        cropping: true,
      });

      if (image.path) {
        // Local image
        setProfilePicture(image.path);
      } else if (image.uri) {
        // Remote image
        setProfilePicture(image.uri);
      }
    } catch (error) {
      console.log('ImagePicker Error: ', error);
    }
  };

  const handleRegister = async () => {
    if (!showConfirmationCodeInput) {
      if (password === confirmPassword) {
        if (email.includes('@') && email.includes('.') && email.length >= 5) {
          try {
            const response = await api.post('/register', {
              username: name,
              useremail: email,
              userpassword: password,
              fName: firstName,
              lName: lastName,
              userImage: profilePicture,
            });

            console.log('Registration Response:', response);

            if (response.status === 201 && response.data?.confirmationCode) {
              login(response.data.user); // само ако има успешна регистрация
              setShowConfirmationCodeInput(true);
            } else {
              Alert.alert(
                t('Registration Error'),
                t('Failed to register. Please try again.'),
              );
            }
          } catch (error) {
            console.error('Registration Error:', error);

            if (
              error.response &&
              error.response.data &&
              error.response.data.error
            ) {
              Alert.alert(t('Registration Error'), error.response.data.error);
            } else {
              Alert.alert(
                t('Registration Error'),
                t('An unexpected error occurred. Please try again.'),
              );
            }

            // ❗ ВАЖНО: НЕ показвай полето за код, ако има грешка
            setShowConfirmationCodeInput(false);
          }
        } else {
          Alert.alert(
            t('Invalid email address'),
            t('Please enter a valid email address.'),
          );
        }
      } else {
        Alert.alert(
          t('Password mismatch'),
          t('Password and confirm password do not match.'),
        );
      }
    } else {
      // Потвърждаване на кода
      try {
        const verificationResponse = await api.post(
          '/verify-confirmation-code',
          {
            email,
            confirmationCode,
          },
        );

        if (verificationResponse.status === 200) {
          navigation.navigate('WelcomeScreen', {name});
        } else {
          Alert.alert(
            t('Verification Error'),
            t('Invalid confirmation code. Please try again.'),
          );
        }
      } catch (error) {
        console.error('Verification Error:', error);
        Alert.alert(
          t('Verification Error'),
          t('Failed to verify confirmation code. Please try again.'),
        );
      }
    }
  };

  const handlerBackLogin = () => {
    navigation.navigate('Login');
  };

  return (
    <SafeAreaView style={{flex: 1}}>
      <ScrollView contentContainerStyle={{flexGrow: 1}}>
        <View style={styles.container}>
          <Image
            source={require('../../../images/login-background.jpg')}
            style={styles.backgroundImage}
          />
          <TouchableOpacity
            onPress={handleImagePicker}
            style={[styles.profilePictureContainer, styles.topRight]}>
            {profilePicture ? (
              <Image
                source={{uri: profilePicture}}
                style={styles.profilePicture}
              />
            ) : (
              <Text style={styles.addPhotoText}>
                {t('Add Profile Picture')}
              </Text>
            )}
          </TouchableOpacity>
          <Text style={styles.title}>{t('Register here')}:</Text>
          <TextInput
            placeholderTextColor={'#F5FDFE'}
            style={styles.input}
            placeholder={t('User name')}
            value={name}
            onChangeText={text => setName(text)}
          />
          <TextInput
            placeholderTextColor={'#F5FDFE'}
            style={styles.input}
            placeholder={t('First name')}
            value={firstName}
            onChangeText={text => setFirstName(text)}
          />
          <TextInput
            placeholderTextColor={'#F5FDFE'}
            style={styles.input}
            placeholder={t('Last name')}
            value={lastName}
            onChangeText={text => setLastName(text)}
          />
          <TextInput
            placeholderTextColor={'#F5FDFE'}
            style={styles.input}
            placeholder={t('Email')}
            value={email}
            onChangeText={setEmail}
          />
          <TextInput
            placeholderTextColor={'#F5FDFE'}
            style={styles.input}
            placeholder={t('Password')}
            secureTextEntry={true}
            value={password}
            onChangeText={text => setPassword(text)}
          />
          <TextInput
            placeholderTextColor={'#F5FDFE'}
            style={styles.input}
            placeholder={t('Confirm Password')}
            secureTextEntry={true}
            value={confirmPassword}
            onChangeText={text => setConfirmPassword(text)}
          />
          {showConfirmationCodeInput && (
            <TextInput
              placeholderTextColor={'#F5FDFE'}
              style={styles.input}
              placeholder={t('Confirmation Code')}
              value={confirmationCode}
              onChangeText={text => setConfirmationCode(text)}
            />
          )}
          <View style={styles.buttonsContent}>
            <TouchableOpacity
              style={styles.loginButtons}
              onPress={handleRegister}>
              <Text style={styles.textButtons}>
                {!showConfirmationCodeInput
                  ? t('Continue')
                  : t('Verify Confirmation Code')}
              </Text>
            </TouchableOpacity>

            <View style={{padding: 10}} />

            <TouchableOpacity
              style={styles.loginButtons}
              onPress={handlerBackLogin}>
              <Text style={styles.textButtons}>{t('I have an account')}</Text>
            </TouchableOpacity>

            {showConfirmationCodeInput && (
              <TouchableOpacity
                style={styles.loginButtons}
                onPress={resendConfirmationCode}>
                <Text style={styles.textButtons}>
                  {t('Resend confirmation code')}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
