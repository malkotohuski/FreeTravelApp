import React, {useRef, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Dimensions,
  ImageBackground,
} from 'react-native';
import {useTranslation} from 'react-i18next';
import {useAuth} from '../../context/AuthContext';

const {width, height} = Dimensions.get('window');

const WelcomeScreen = ({navigation}) => {
  const {user} = useAuth();
  const userNickName = user ? user.username : 'Guest';
  const captionAnim = useRef(new Animated.Value(-width)).current;
  const {t} = useTranslation();

  // Анимация на текста
  useEffect(() => {
    Animated.timing(captionAnim, {
      toValue: 0,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, []);

  const handleContinue = () => {
    navigation.navigate('Home');
  };

  // За бъдещи празници можеш да сменяш тази променлива
  const isHoliday = false; // примерно Великден, Коледа и т.н.
  const holidayImage = require('../../../images/cats.png');

  return (
    <ImageBackground
      source={isHoliday ? holidayImage : null}
      style={styles.container}
      imageStyle={{resizeMode: 'cover'}}>
      <View style={styles.overlay}>
        {/* Welcome Caption */}
        <Animated.View
          style={[
            styles.captionContainer,
            {transform: [{translateX: captionAnim}]},
          ]}>
          <Text style={styles.captionText}>
            {t('Welcome')}, {userNickName}!
          </Text>
          <Text style={styles.subText}>
            {t('Ready to explore your next adventure?')}
          </Text>
        </Animated.View>

        {/* Continue Button */}
        <TouchableOpacity style={styles.button} onPress={handleContinue}>
          <Text style={styles.buttonText}>{t('LetTravel')}</Text>
        </TouchableOpacity>
      </View>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width,
    height,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f2f7ff', // светъл фон по default
  },
  overlay: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(242,247,255,0.9)', // лек overlay за текст видимост
    paddingHorizontal: 20,
  },
  captionContainer: {
    alignItems: 'center',
    marginBottom: 50,
  },
  captionText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 10,
  },
  subText: {
    fontSize: 16,
    color: '#555',
    textAlign: 'center',
    lineHeight: 22,
  },
  button: {
    backgroundColor: '#4da6ff',
    paddingVertical: 15,
    paddingHorizontal: 50,
    borderRadius: 30,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 3},
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  buttonText: {
    fontSize: 20,
    color: '#fff',
    fontWeight: '600',
  },
});

export default WelcomeScreen;
