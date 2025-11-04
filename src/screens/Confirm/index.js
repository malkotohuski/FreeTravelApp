import React, {useState, useLayoutEffect} from 'react';
import Icons from 'react-native-vector-icons/MaterialIcons';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {useTranslation} from 'react-i18next';
import LottieView from 'lottie-react-native';
import {useRoute, useNavigation} from '@react-navigation/native';
import {useRouteContext} from '../../context/RouteContext';
import {useAuth} from '../../context/AuthContext';

function Confirm() {
  const {t} = useTranslation();
  const navigation = useNavigation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const routeContext = useRouteContext();
  const {addRoute} = routeContext;
  const {user} = useAuth();
  const route = useRoute();

  const selectedDateTime = route.params.selectedDateTime
    ? new Date(route.params.selectedDateTime)
    : null;

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
    id: routeId,
    userId: user_id,
    showConfirmButton = true,
    showChangesButton = true,
    showBackButton = false,
  } = route.params;

  const userId = user?.user?.id;
  const username = user?.user?.username;
  const userFname = user?.user?.fName;
  const userLname = user?.user?.lName;
  const userEmail = user?.user?.email;

  const handleConfirm = async () => {
    if (isSubmitting || isGenerating) return;

    setIsGenerating(true);
    setTimeout(async () => {
      setIsGenerating(false);
      setIsSubmitting(true);

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
        userId,
        username,
        userFname,
        userLname,
        userEmail,
        routeId,
        user_id,
      };

      try {
        const response = await fetch('http://10.0.2.2:3000/create-route', {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({route: newRoute}),
        });

        if (response.ok) {
          const responseData = await response.json();
          addRoute(responseData.route);
          setSuccessMessage(t('The route has been created!'));
          setTimeout(() => {
            setSuccessMessage('');
            navigation.navigate('View routes');
          }, 2000);
        } else {
          const errorData = await response.json();
          console.error('Failed to create route:', errorData.error);
        }
      } catch (error) {
        console.error('Error creating route:', error);
      } finally {
        setIsSubmitting(false);
      }
    }, 2500);
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
    <LinearGradient
      colors={['#0d0d0d', '#1a1a1a']}
      style={styles.gradientBackground}>
      <SafeAreaView style={styles.mainContainer}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Text style={styles.headerText}>{t('Review route')}</Text>

          <View style={styles.card}>
            <View style={styles.cardHeaderRow}>
              <Icon name="account-circle" size={24} color="#f4511e" />
              <Text style={styles.cardHeader}>{t('Driver')}</Text>
            </View>
            <Text style={styles.text}>
              {t('Username')}: {username}
            </Text>
            <Text style={styles.text}>
              {t('Names')}: {userFname} {userLname}
            </Text>
          </View>

          <View style={styles.card}>
            <View style={styles.cardHeaderRow}>
              <Icon name="car-arrow-right" size={24} color="#f4511e" />
              <Text style={styles.cardHeader}>{t('Departure')}</Text>
            </View>
            <Text style={styles.text}>
              {departureCity} {departureStreet}
              {departureNumber ? ` - ${departureNumber}` : ''}
            </Text>
          </View>

          <View style={styles.card}>
            <View style={styles.cardHeaderRow}>
              <Icon name="car-select" size={24} color="#f4511e" />
              <Text style={styles.cardHeader}>{t('Arrival')}</Text>
            </View>
            <Text style={styles.text}>
              {arrivalCity} {arrivalStreet}
              {arrivalNumber ? ` - ${arrivalNumber}` : ''}
            </Text>
          </View>

          <View style={styles.card}>
            <View style={styles.cardHeaderRow}>
              <Icon name="calendar" size={24} color="#f4511e" />
              <Text style={styles.cardHeader}>
                {t('Time and date of departure')}
              </Text>
            </View>
            <Text style={styles.text}>
              {selectedDateTime?.toLocaleString()}
            </Text>
          </View>

          {showChangesButton && (
            <TouchableOpacity
              style={styles.buttonSecondary}
              onPress={() => navigation.navigate('Vehicle')}>
              <Text style={styles.buttonText}>{t('Make changes')}</Text>
            </TouchableOpacity>
          )}
          {showConfirmButton && !isSubmitting && (
            <TouchableOpacity
              style={styles.buttonPrimary}
              onPress={handleConfirm}>
              <Text style={styles.buttonText}>{t('Confirm')}</Text>
            </TouchableOpacity>
          )}
          {showBackButton && (
            <TouchableOpacity
              style={styles.buttonSecondary}
              onPress={() => navigation.navigate('View routes')}>
              <Text style={styles.buttonText}>{t('Back')}</Text>
            </TouchableOpacity>
          )}

          {isGenerating && (
            <View style={styles.loadingOverlay}>
              <View style={styles.loadingModal}>
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
    backgroundColor: '#222',
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
