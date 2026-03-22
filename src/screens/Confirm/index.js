import React, {useState, useLayoutEffect, useRef, useEffect} from 'react';
import Icons from 'react-native-vector-icons/MaterialIcons';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {useTranslation} from 'react-i18next';
import LottieView from 'lottie-react-native';
import {useRoute, useNavigation} from '@react-navigation/native';
import {useRouteContext} from '../../context/RouteContext';
import {useAuth} from '../../context/AuthContext';
import {useTheme} from '../../theme/useTheme';
import api from '../../api/api';

function Confirm() {
  const submitLock = useRef(false); // предотвратява двойно изпращане
  const {t} = useTranslation();
  const navigation = useNavigation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const idempotencyKeyRef = useRef(null);
  const theme = useTheme();

  const routeContext = useRouteContext();
  const {addRoute} = routeContext;
  const {user, token} = useAuth();
  const route = useRoute();

  const selectedDateTime = route.params.selectedDateTime
    ? new Date(route.params.selectedDateTime)
    : null;

  // Генерираме уникален key за фронтенд защита
  useEffect(() => {
    if (!idempotencyKeyRef.current && user && selectedDateTime) {
      idempotencyKeyRef.current = `${user.id}-${selectedDateTime.getTime()}`;
    }
  }, [user, selectedDateTime]);

  const {
    selectedVehicle,
    registrationNumber,
    departureCity,
    departureStreet,
    departureNumber,
    arrivalCity,
    arrivalStreet,
    arrivalNumber,
    routeTitle,
    showConfirmButton = true,
    showChangesButton = true,
    showBackButton = false,
  } = route.params;

  const userId = user?.id;
  const username = user?.username;
  const userFname = user?.fName;
  const userLname = user?.lName;
  const userEmail = user?.email;

  const getGradientColors = () => theme.gradient;

  const getCardStyle = () => ({
    width: '90%',
    borderRadius: 16,
    padding: 16,
    marginVertical: 10,
    borderWidth: 1,
    borderColor: theme.cardBorder,
    backgroundColor: theme.cardBackground,
  });

  const getTextColor = () => theme.textPrimary;

  const getSecondaryTextColor = () => theme.textSecondary;

  const getPrimaryButtonStyle = () => ({
    borderRadius: 10,
    width: 200,
    height: 55,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 15,
    borderWidth: 1.5,
    borderColor: '#fff',
    backgroundColor: theme.primaryButton,
  });

  const getSecondaryButtonStyle = () => ({
    borderRadius: 10,
    width: 200,
    height: 55,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    borderWidth: 1.5,
    borderColor: '#fff',
    backgroundColor: theme.secondaryButton,
  });

  const handleConfirm = async () => {
    if (submitLock.current) return;

    if (!user) {
      Alert.alert(t('Error'), t('User not authenticated'));
      return;
    }

    submitLock.current = true;
    setIsSubmitting(true);

    try {
      const newRoute = {
        selectedVehicle,
        registrationNumber,
        selectedDateTime,
        departureCity,
        departureStreet,
        departureNumber,
        arrivalCity,
        arrivalStreet,
        arrivalNumber,
        routeTitle,
        username,
        userFname,
        userLname,
        userEmail,
        idempotencyKey: idempotencyKeyRef.current,
      };

      // --- Използваме api wrapper вместо fetch ---
      const response = await api.post('/api/routes', newRoute, {
        headers: {
          Authorization: `Bearer ${token}`, // backend ще вземе userId от JWT
        },
      });

      if (!response?.data?.route) {
        throw new Error(t('Invalid server response'));
      }

      addRoute(response.data.route);

      setSuccessMessage(t('The route has been created!'));

      setTimeout(() => {
        navigation.navigate('ViewRoutes', {refresh: true});
      }, 1500);
    } catch (err) {
      console.error(err);
      const message =
        err.response?.data?.error ||
        err.message ||
        t('Failed to create route.');
      Alert.alert(t('Error'), message);
    } finally {
      submitLock.current = false;
      setIsSubmitting(false);
    }
  };

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity
          style={{marginRight: 16, flexDirection: 'row', alignItems: 'center'}}
          onPress={() =>
            navigation.navigate('SelectRoute', {
              selectedVehicle,
              registrationNumber,
            })
          }>
          <Text style={{color: 'white', marginRight: 8, fontSize: 18}}>
            {t('Step 4 of 4')}
          </Text>
          <Icons name="keyboard-backspace" size={24} color="white" />
        </TouchableOpacity>
      ),
    });
  }, [navigation, selectedVehicle, registrationNumber]);

  return (
    <View style={{flex: 1}} pointerEvents={isSubmitting ? 'none' : 'auto'}>
      <LinearGradient
        colors={getGradientColors()}
        style={styles.gradientBackground}>
        <SafeAreaView style={styles.mainContainer}>
          <ScrollView contentContainerStyle={styles.scrollContent}>
            <Text style={[styles.headerText, {color: getTextColor()}]}>
              {t('Review route')}
            </Text>

            <View style={getCardStyle()}>
              <View style={styles.cardHeaderRow}>
                <Icon name="account-circle" size={24} color="#f4511e" />
                <Text style={[styles.cardHeader, {color: getTextColor()}]}>
                  {t('Driver')}
                </Text>
              </View>
              <Text style={[styles.text, {color: getSecondaryTextColor()}]}>
                {t('Username')}: {username}
              </Text>
              <Text style={[styles.text, {color: getSecondaryTextColor()}]}>
                {t('Names')}: {userFname} {userLname}
              </Text>
            </View>

            <View style={getCardStyle()}>
              <View style={styles.cardHeaderRow}>
                <Icon name="car-arrow-right" size={24} color="#f4511e" />
                <Text style={[styles.cardHeader, {color: getTextColor()}]}>
                  {t('Departure')}
                </Text>
              </View>
              <Text style={[styles.text, {color: getSecondaryTextColor()}]}>
                {departureCity} {departureStreet}
                {departureNumber ? ` - ${departureNumber}` : ''}
              </Text>
            </View>

            <View style={getCardStyle()}>
              <View style={styles.cardHeaderRow}>
                <Icon name="car-select" size={24} color="#f4511e" />
                <Text style={[styles.cardHeader, {color: getTextColor()}]}>
                  {t('Arrival')}
                </Text>
              </View>
              <Text style={[styles.text, {color: getSecondaryTextColor()}]}>
                {arrivalCity} {arrivalStreet}
                {arrivalNumber ? ` - ${arrivalNumber}` : ''}
              </Text>
            </View>

            <View style={getCardStyle()}>
              <View style={styles.cardHeaderRow}>
                <Icon name="calendar" size={24} color="#f4511e" />
                <Text style={[styles.cardHeader, {color: getTextColor()}]}>
                  {t('Time and date of departure')}
                </Text>
              </View>
              <Text style={[styles.text, {color: getSecondaryTextColor()}]}>
                {selectedDateTime?.toLocaleString()}
              </Text>
            </View>

            {showChangesButton && (
              <TouchableOpacity
                style={getSecondaryButtonStyle()}
                onPress={() => navigation.navigate('Vehicle')}>
                <Text style={styles.buttonText}>{t('Make changes')}</Text>
              </TouchableOpacity>
            )}
            {showConfirmButton && (
              <TouchableOpacity
                style={[
                  getPrimaryButtonStyle(),
                  isSubmitting && {opacity: 0.5},
                ]}
                disabled={isSubmitting}
                onPress={handleConfirm}>
                <Text style={styles.buttonText}>
                  {isSubmitting ? t('Creating...') : t('Confirm')}
                </Text>
              </TouchableOpacity>
            )}
            {showBackButton && (
              <TouchableOpacity
                style={getSecondaryButtonStyle()}
                onPress={() => navigation.navigate('View routes')}>
                <Text style={styles.buttonText}>{t('Back')}</Text>
              </TouchableOpacity>
            )}

            {isSubmitting && (
              <View style={styles.loadingOverlay} pointerEvents="auto">
                <View
                  style={[
                    styles.loadingModal,
                    {backgroundColor: theme.cardBackground},
                  ]}>
                  <LottieView
                    source={require('../../../assets/animations/road.json')}
                    autoPlay
                    loop
                    style={styles.generatingImage}
                  />
                  <Text style={styles.generatingText}>
                    {t('Generating your route...')}
                  </Text>
                </View>
              </View>
            )}

            {successMessage && (
              <Text style={styles.successMessage}>{successMessage}</Text>
            )}
          </ScrollView>
        </SafeAreaView>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  gradientBackground: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mainContainer: {
    flex: 1,
    width: '100%',
  },
  scrollContent: {
    padding: 20,
    alignItems: 'center',
  },
  headerText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 20,
  },
  card: {
    width: '90%',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 16,
    padding: 16,
    marginVertical: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  cardHeader: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    marginLeft: 8,
  },
  text: {
    fontSize: 16,
    color: '#ddd',
    marginTop: 4,
  },
  buttonPrimary: {
    backgroundColor: '#f4511e',
    borderRadius: 10,
    width: 200,
    height: 55,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 15,
    borderWidth: 1.5,
    borderColor: '#fff',
  },
  buttonSecondary: {
    backgroundColor: '#777',
    borderRadius: 10,
    width: 200,
    height: 55,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    borderWidth: 1.5,
    borderColor: '#fff',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  loadingModal: {
    padding: 20,
    borderRadius: 15,
    alignItems: 'center',
  },
  generatingImage: {width: 300, height: 300},
  generatingText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 8,
  },
  successMessage: {
    backgroundColor: '#27ae60',
    color: '#fff',
    padding: 15,
    borderRadius: 10,
    marginTop: 20,
    textAlign: 'center',
    fontSize: 16,
  },
});

export default Confirm;
