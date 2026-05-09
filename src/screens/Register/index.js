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
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {useFocusEffect} from '@react-navigation/native';
import {useCallback} from 'react';
import api from '../../api/api';
import styles from './styles';
import {useTranslation} from 'react-i18next';
import i18next from 'i18next';
import ImagePicker from 'react-native-image-crop-picker';
import TermsModal from '../../componets/TermsModal';
import Icons from 'react-native-vector-icons/MaterialCommunityIcons';

export default function Register({navigation}) {
  const {t} = useTranslation();

  const [name, setName] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [confirmationCode, setConfirmationCode] = useState('');
  const [showConfirmationCodeInput, setShowConfirmationCodeInput] =
    useState(false);
  const [profilePicture, setProfilePicture] = useState(null);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [termsType, setTermsType] = useState('terms'); // 'terms' или 'privacy'
  const [isBulgaria, setisBulgaria] = useState(false);

  const changeLanguage = lng => {
    i18next.changeLanguage(lng);
    setisBulgaria(lng === 'bg');
  };

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
      setShowPassword(false);
      setShowConfirmPassword(false);
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
        includeBase64: false,
      });

      setProfilePicture(image?.path ? image : null);
    } catch (error) {
      setProfilePicture(null);
    }
  };
  const handleRegister = async () => {
    if (!showConfirmationCodeInput) {
      if (password === confirmPassword) {
        if (email.includes('@') && email.includes('.') && email.length >= 5) {
          try {
            const formData = new FormData();
            formData.append('username', name);
            formData.append('useremail', email);
            formData.append('userpassword', password);
            formData.append('fName', firstName);
            formData.append('lName', lastName);

            if (profilePicture?.path) {
              formData.append('avatar', {
                uri: profilePicture.path,
                type: profilePicture.mime || 'image/jpeg',
                name: `avatar-${Date.now()}.jpg`,
              });
            }

            const response = await api.post('/api/auth/register', formData);

            if (response.status === 201) {
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
        const verificationResponse = await api.post('/api/auth/confirm', {
          email,
          confirmationCode,
        });

        if (verificationResponse.status === 200) {
          navigation.navigate('Login');
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
      <KeyboardAvoidingView
        style={{flex: 1}}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}>
        <ScrollView style={{flex: 1}} contentContainerStyle={{flexGrow: 1}}>
          <View style={styles.container}>
            <Image
              source={require('../../../images/login-background.jpg')}
              style={styles.backgroundImage}
            />
            <View style={{marginTop: 20}}>
              <View style={styles.languageSwitchContainer}>
                <TouchableOpacity
                  style={styles.languageButton}
                  onPress={() => changeLanguage('en')}>
                  <Image
                    source={require('../../../images/eng1-flag.png')}
                    style={styles.flagImage}
                  />
                  <Text style={styles.languageText}>{t('English')}</Text>
                </TouchableOpacity>
                <View style={{margin: 60}} />
                <TouchableOpacity
                  style={styles.languageButton}
                  onPress={() => changeLanguage('bg')}>
                  <Image
                    source={require('../../../images/bulg-flag.png')}
                    style={styles.flagImage}
                  />
                  <Text style={styles.languageText}>{t('Bulgarian')}</Text>
                </TouchableOpacity>
              </View>
              <TouchableOpacity
                onPress={handleImagePicker}
                style={styles.profilePictureContainer}>
                {profilePicture ? (
                  <Image
                    source={{uri: profilePicture.path}}
                    style={styles.profilePicture}
                  />
                ) : (
                  <Text style={styles.addPhotoText}>
                    {t('Add Profile Picture')}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
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
            <View style={styles.passwordInputWrapper}>
              <TextInput
                placeholderTextColor={'#F5FDFE'}
                style={styles.passwordInput}
                placeholder={t('Password')}
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={text => setPassword(text)}
              />
              <TouchableOpacity
                style={styles.passwordToggleButton}
                onPress={() => setShowPassword(prev => !prev)}>
                <Icons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={22}
                  color="#fff"
                />
              </TouchableOpacity>
            </View>
            <View style={styles.passwordInputWrapper}>
              <TextInput
                placeholderTextColor={'#F5FDFE'}
                style={styles.passwordInput}
                placeholder={t('Confirm Password')}
                secureTextEntry={!showConfirmPassword}
                value={confirmPassword}
                onChangeText={text => setConfirmPassword(text)}
              />
              <TouchableOpacity
                style={styles.passwordToggleButton}
                onPress={() => setShowConfirmPassword(prev => !prev)}>
                <Icons
                  name={
                    showConfirmPassword ? 'eye-off-outline' : 'eye-outline'
                  }
                  size={22}
                  color="#fff"
                />
              </TouchableOpacity>
            </View>
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
              <View style={{marginTop: 20, paddingHorizontal: 10}}>
                <Text
                  style={{
                    textAlign: 'center',
                    fontSize: 14,
                    color: '#F5FDFE',
                    lineHeight: 20,
                  }}>
                  {t('byCreatingAccount')}{' '}
                  <Text
                    style={{color: '#4da6ff', textDecorationLine: 'underline'}}
                    onPress={() => navigation.navigate('TermsOfServiceScreen')}>
                    {t('termsOfService')}
                  </Text>{' '}
                  {t('and')}{' '}
                  <Text
                    style={{color: '#4da6ff', textDecorationLine: 'underline'}}
                    onPress={() => navigation.navigate('PrivacyPolicyScreen')}>
                    {t('privacyPolicy')}
                  </Text>
                  .
                </Text>
              </View>

              {/* TermsModal */}
              <TermsModal
                visible={showTermsModal}
                type={termsType}
                isBulgaria={isBulgaria} // <<< добавено
                onClose={() => setShowTermsModal(false)}
              />
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
