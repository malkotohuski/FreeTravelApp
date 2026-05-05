import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  SafeAreaView,
  ScrollView,
  Animated,
} from 'react-native';
import {useTranslation} from 'react-i18next';
import {useFocusEffect} from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import styles from './styles';
import i18next from 'i18next';
import {useAuth} from '../../context/AuthContext';
import api from '../../api/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icons from 'react-native-vector-icons/MaterialCommunityIcons';

export default function Login({navigation}) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const {t} = useTranslation();
  const {login} = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const opacity = useState(new Animated.Value(0))[0];

  const changeLanguage = lng => {
    i18next.changeLanguage(lng);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 3000);

    const animateOpacity = () => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(opacity, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 0,
            duration: 500,
            useNativeDriver: true,
          }),
        ]),
      ).start();
    };

    animateOpacity();

    return () => clearTimeout(timer);
  }, [opacity]);

  const handleLogin = async () => {
    if (!email || !password) {
      Toast.show({
        type: 'error',
        text1: t('Please enter email and password.'),
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await api.post('/api/auth/login', {email, password});

      if (response.status === 200) {
        const user = response.data.user;
        const token = response.data.accessToken;
        const refreshToken = response.data.refreshToken;

        if (!token || !refreshToken) {
          throw new Error('Token or refresh token is missing.');
        }

        await AsyncStorage.setItem('@token', token);
        await AsyncStorage.setItem('@refreshToken', refreshToken);
        await AsyncStorage.setItem('@user', JSON.stringify(user));

        login(user, token, refreshToken);
      }
    } catch (error) {
      console.error('Login failed:', error);
      Toast.show({
        type: 'error',
        text1: t('Email or password is incorrect. Please try again.'),
      });
    } finally {
      setIsLoading(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      setPassword('');
      setShowPassword(false);
    }, []),
  );

  return (
    <SafeAreaView style={{flex: 1}}>
      <ScrollView contentContainerStyle={{flexGrow: 1}}>
        <View style={styles.container}>
          {isLoading ? (
            <>
              <Image
                source={require('../../../images/loading_image.png')}
                style={styles.backgroundImage}
              />
              <Animated.Text
                style={{
                  fontSize: 42,
                  color: '#010101',
                  fontWeight: 'bold',
                  position: 'absolute',
                  top: '50%',
                  alignSelf: 'center',
                  opacity,
                }}>
                {t('Loading...')}
              </Animated.Text>
            </>
          ) : (
            <>
              <Image
                source={require('../../../images/login-background.jpg')}
                style={styles.backgroundImage}
              />
              <View>
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
              </View>
              <TextInput
                placeholderTextColor={'white'}
                style={styles.input}
                placeholder={t('Email')}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
              />
              <View style={styles.passwordInputWrapper}>
                <TextInput
                  placeholderTextColor={'white'}
                  style={styles.passwordInput}
                  placeholder={t('Password')}
                  secureTextEntry={!showPassword}
                  value={password}
                  onChangeText={setPassword}
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
              <View style={styles.buttonsContent}>
                <TouchableOpacity
                  style={styles.loginButtons}
                  onPress={handleLogin}>
                  <Text style={styles.textButtons}>{t('Login')}</Text>
                </TouchableOpacity>
                <View style={styles.buttonSeparator} />
                <TouchableOpacity
                  style={styles.loginButtons}
                  onPress={() => navigation.navigate('Register')}>
                  <Text style={styles.textButtons}>{t('Registration')}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => navigation.navigate('ResetPassword')}
                  style={styles.forgotPasswordContainer}>
                  <Text style={styles.forgotPasswordText}>
                    {t('Forgot password?')}
                  </Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
