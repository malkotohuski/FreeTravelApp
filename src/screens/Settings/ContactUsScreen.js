import React, {useRef, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Animated,
  SafeAreaView,
  TouchableOpacity,
  Linking,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {useTranslation} from 'react-i18next';
import Icon from 'react-native-vector-icons/MaterialIcons';

export default function ContactUsScreen() {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const {t} = useTranslation();

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, []);

  const handleEmailPress = () => {
    const subject = encodeURIComponent('FreeTravelApp Support');
    const email = 'appfreetravel@gmail.com';
    const url = `mailto:${email}?subject=${subject}`;

    Linking.openURL(url).catch(err => console.log('Error opening email:', err));
  };

  return (
    <LinearGradient
      colors={['#0f2027', '#203a43', '#2c5364']}
      style={styles.container}>
      <SafeAreaView style={{flex: 1}}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Animated.View style={{opacity: fadeAnim}}>
            {/* Title */}
            <Text style={styles.title}>{t('contactUs')}</Text>
            <Text style={styles.subtitle}>{t('contactSubtitle')}</Text>

            {/* Card */}
            <View style={styles.card}>
              <Icon
                name="email"
                size={40}
                color="#4CAF50"
                style={styles.icon}
              />

              <Text style={styles.cardText}>{t('contactDescription')}</Text>

              {/* Email */}
              <Text style={styles.emailText}>appfreetravel@gmail.com</Text>

              {/* Button */}
              <TouchableOpacity
                style={styles.button}
                onPress={handleEmailPress}>
                <Text style={styles.buttonText}>{t('sendEmail')}</Text>
              </TouchableOpacity>

              <Text style={styles.responseTime}>{t('responseTime')}</Text>
            </View>
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingTop: 40,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 15,
    color: '#cfd8dc',
    textAlign: 'center',
    marginBottom: 30,
  },
  card: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 16,
    padding: 25,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: {width: 0, height: 5},
    elevation: 5,
  },
  icon: {
    marginBottom: 15,
  },
  cardText: {
    fontSize: 14,
    color: '#e0f7fa',
    textAlign: 'center',
    marginBottom: 15,
    lineHeight: 20,
  },
  emailText: {
    fontSize: 15,
    color: '#4CAF50',
    marginBottom: 20,
    fontWeight: 'bold',
  },
  button: {
    backgroundColor: '#4CAF50',
    paddingVertical: 12,
    paddingHorizontal: 35,
    borderRadius: 30,
    marginBottom: 15,
  },
  buttonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  responseTime: {
    fontSize: 12,
    color: '#90a4ae',
    textAlign: 'center',
  },
});
