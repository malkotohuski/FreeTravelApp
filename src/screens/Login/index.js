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
import styles from './styles';
import i18next from 'i18next';
import {useAuth} from '../../context/AuthContext';
import api from '../../api/api';

export default function Login({navigation, route}) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const {t} = useTranslation();
  const {login} = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const opacity = useState(new Animated.Value(0))[0];

  const [isBulgaria, setisBulgaria] = useState(false);

  const changeLanguage = lng => {
    i18next.changeLanguage(lng);
    setisBulgaria(lng === 'bg');
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
  }, []);

  const handleLogin = async () => {
    try {
      setIsLoading(true);

      const response = await api.post('/login', {
        useremail: email,
        userpassword: password,
      });

      const {user, token} = response.data;

      // ✅ само това
      login(user, token);

      // ❌ НЕ navigation.navigate('Home')
    } catch (error) {
      if (error.response?.status === 401) {
        alert(t('Invalid email or password'));
      } else if (error.response?.status === 403) {
        alert(t(error.response.data.error));
      } else {
        alert(t('Server error'));
      }
    } finally {
      setIsLoading(false);
    }
  };

  /*  const skipLogin = () => {
    navigation.navigate('Home'); // да се премахне за тестване само !!!
  }; */

  useFocusEffect(
    React.useCallback(() => {
      setPassword(''); // чистим само паролата
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
              {/*  <TouchableOpacity onPress={skipLogin}>
                <Text style={styles.title}>{t('Login')}</Text>
              </TouchableOpacity> */}
              <TextInput
                placeholderTextColor={'white'}
                style={styles.input}
                placeholder={t('Email')}
                value={email}
                onChangeText={text => setEmail(text)}
              />
              <TextInput
                placeholderTextColor={'white'}
                style={styles.input}
                placeholder={t('Password')}
                secureTextEntry={true}
                value={password}
                onChangeText={text => setPassword(text)}
              />
              <View style={styles.buttonsContent}>
                <TouchableOpacity
                  style={styles.loginButtons}
                  onPress={handleLogin}>
                  <Text style={styles.textButtons}>{t('Log in')}</Text>
                </TouchableOpacity>
                <View style={styles.buttonSeparator} />
                <TouchableOpacity
                  style={styles.loginButtons}
                  onPress={() => navigation.navigate('Register')}>
                  <Text style={styles.textButtons}>
                    {t('Create your account')}
                  </Text>
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
