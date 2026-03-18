import React, {useRef, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Animated,
  SafeAreaView,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {useTranslation} from 'react-i18next';
import DeviceInfo from 'react-native-device-info';

export default function AboutUsScreen() {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const {t} = useTranslation();

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <LinearGradient
      colors={['#0f2027', '#203a43', '#2c5364']}
      style={styles.container}>
      <SafeAreaView style={{flex: 1}}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Animated.View style={{opacity: fadeAnim}}>
            {/* App Title */}
            <Text style={styles.title}>🌍 FreeTravelApp</Text>
            <Text style={styles.subtitle}>{t('discoverConnectTravel')}</Text>

            {/* Description Card */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>{t('aboutTheApp')}</Text>
              <Text style={styles.cardText}>{t('aboutTheAppText1')}</Text>
            </View>

            {/* Mission Card */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>{t('ourMission')}</Text>
              <Text style={styles.cardText}>{t('ourMissionText')}</Text>
            </View>

            {/* Vision Card */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>{t('ourVision')}</Text>
              <Text style={styles.cardText}>{t('ourVisionText')}</Text>
            </View>

            {/* Developer Card */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>{t('createdBy')}</Text>
              <Text style={styles.cardText}>{t('createdByText')}</Text>
              <Text style={styles.cardText}>{t('foundedIn')}</Text>
            </View>

            {/* Version */}
            <Text style={styles.version}>
              Version {DeviceInfo.getVersion()} ({DeviceInfo.getBuildNumber()})
            </Text>
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
    paddingBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: '#cfd8dc',
    textAlign: 'center',
    marginBottom: 30,
  },
  card: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: {width: 0, height: 5},
    elevation: 5,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 10,
  },
  cardText: {
    fontSize: 14,
    color: '#e0f7fa',
    lineHeight: 20,
  },
  version: {
    textAlign: 'center',
    color: '#90a4ae',
    marginTop: 20,
    fontSize: 13,
  },
});
