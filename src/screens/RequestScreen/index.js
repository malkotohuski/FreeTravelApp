import React, {useEffect, useState, useCallback, useRef} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import {useFocusEffect} from '@react-navigation/native';
import {useTranslation} from 'react-i18next';
import {useNavigation, useRoute} from '@react-navigation/native';
import {useAuth} from '../../context/AuthContext';
import LinearGradient from 'react-native-linear-gradient';
import Toast from 'react-native-toast-message';
import api from '../../api/api';
import {formatSeatsLabel} from '../../utils/seatPolicy';

function RouteDetails({route}) {
  const {t} = useTranslation();
  const navigation = useNavigation();
  const scrollViewRef = useRef(null);
  const {user} = useAuth();
  const params = route.params || {};
  const details = params.routeDetailsData || {};
  const owner = details.owner || {};
  const routeId = params.routeId ?? details.routeId ?? details.id;
  const username = params.username ?? owner.username ?? details.username;
  const userFname = params.userFname ?? owner.fName ?? details.userFname;
  const userLname = params.userLname ?? owner.lName ?? details.userLname;
  const userEmail = params.userEmail ?? owner.email ?? details.userEmail;
  const [loading, setLoading] = useState(false);

  const requesterUsername = user?.username;
  const departureCityId =
    params.departureCityId || details.departureCityId || null;
  const arrivalCityId = params.arrivalCityId || details.arrivalCityId || null;

  const departureCity =
    params.departureCity ||
    details.departureCityRef?.name ||
    details.departureCity;
  const arrivalCity =
    params.arrivalCity || details.arrivalCityRef?.name || details.arrivalCity;
  const totalSeats = params.totalSeats ?? details.totalSeats ?? 1;
  const availableSeats =
    params.availableSeats ?? details.availableSeats ?? totalSeats;
  const hasFreeSeats = Number(availableSeats) > 0;
  const maxRequestedSeats = Math.max(1, Number(availableSeats) || 1);

  const [tripRequestText, setTripRequestText] = useState('');
  const [requestedSeats, setRequestedSeats] = useState(1);
  const [hasRequested, setHasRequested] = useState(false);
  const isOwnRoute = requesterUsername === username;

  useFocusEffect(
    useCallback(() => {
      setTripRequestText(''); // нулира стойността всеки път при фокус
      setRequestedSeats(1);
    }, []),
  );

  const updateRequestedSeats = nextSeats => {
    const safeSeats = Math.min(
      Math.max(Number(nextSeats) || 1, 1),
      maxRequestedSeats,
    );
    setRequestedSeats(safeSeats);
  };

  // Проверка за съществуваща заявка
  useEffect(() => {
    const checkIfAlreadyRequested = async () => {
      try {
        if (!routeId || !user?.id) return;

        const response = await api.get('/api/requests');

        const alreadyRequested = response.data.some(
          req =>
            req.routeId === routeId &&
            req.userID === user.id &&
            req.status !== 'rejected',
        );

        setHasRequested(alreadyRequested);
      } catch (err) {
        console.error('Failed to check existing requests:', err);
      }
    };

    checkIfAlreadyRequested();
  }, [routeId, user?.id]);

  const handlerTripRequest = async () => {
    if (loading) return;
    // 1️⃣ Проверки преди изпращане
    if (isOwnRoute) {
      Alert.alert(
        t('Error'),
        t('You cannot apply for this route because you created it.'),
      );
      return;
    }

    if (hasRequested) {
      Alert.alert(
        t('Error'),
        t('You have already submitted a request for this route.'),
      );
      return;
    }

    if (!routeId) {
      Alert.alert(
        t('Error'),
        t('Route ID is missing. Please reopen the route.'),
      );
      return;
    }

    if (!hasFreeSeats) {
      Alert.alert(t('Error'), t('No free seats left for this route.'));
      return;
    }

    if (requestedSeats > Number(availableSeats)) {
      Alert.alert(t('Error'), t('Not enough free seats left for this route.'));
      return;
    }

    if (!tripRequestText.trim()) {
      Alert.alert(t('Error'), t('Please enter a comment before submitting.'));
      return;
    }

    // 2️⃣ Потвърждение
    Alert.alert(
      t('Confirm'),
      t('Would you like to submit a request for this route?'),
      [
        {text: t('Cancel'), style: 'cancel'},
        {
          text: 'OK',
          onPress: async () => {
            try {
              setLoading(true); // 🔥 старт

              const payload = {
                routeId,
                username: user.username,
                userFname: user.fName,
                userLname: user.lName,
                userEmail: user.email,
                userRouteId: params.userId || owner.id || details.userId || 0,
                departureCityId,
                departureCity: departureCity || '',
                arrivalCityId,
                arrivalCity: arrivalCity || '',
                dataTime: params.selectedDateTime || details.selectedDateTime,
                requestComment: tripRequestText,
                requestedSeats,
              };

              await api.post('/api/send-request-to-user', payload);

              setHasRequested(true);

              Toast.show({
                type: 'success',
                text1: 'Success',
                text2: 'Request sent successfully!',
              });
              navigation.navigate('Home');
            } catch (err) {
              console.error('API error:', err);
              Toast.show({
                type: 'error',
                text1: 'Error',
                text2: err.response?.data?.error || 'Something went wrong',
              });
            } finally {
              setLoading(false); // 🔥 край
            }
          },
        },
      ],
    );
  };

  const handlerBackToViewRoute = () => {
    navigation.navigate('ViewRoutes');
  };

  return (
    <KeyboardAvoidingView
      style={{flex: 1}}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <LinearGradient colors={['#1b1b1b', '#2a2a2a']} style={{flex: 1}}>
        <ScrollView
          ref={scrollViewRef}
          contentContainerStyle={{
            flexGrow: 1,
            paddingHorizontal: 20,
            paddingVertical: 30,
            justifyContent: 'flex-start',
          }}
          keyboardShouldPersistTaps="handled">
          <Text style={styles.headerText}>{t('Route Details')}:</Text>

          <Text style={styles.text}>
            {t('Nick name')} : {username}
          </Text>
          <Text style={styles.text}>
            {t('Names')} : {userFname} {userLname}
          </Text>
          <Text style={styles.text}>
            {t('Route')} : {departureCity}-{arrivalCity}
          </Text>
          <View style={styles.seatsCard}>
            <Text style={styles.seatsText}>
              {t('Free seats')}: {formatSeatsLabel(availableSeats, totalSeats)}
            </Text>
          </View>

          <View style={styles.requestedSeatsCard}>
            <Text style={styles.requestedSeatsTitle}>{t('SeatsNeeded')}</Text>
            <Text style={styles.requestedSeatsHint}>
              {t('ChooseHowManySeatsYouNeed')}
            </Text>
            <View style={styles.seatStepper}>
              <TouchableOpacity
                style={[
                  styles.seatButton,
                  requestedSeats <= 1 && styles.seatButtonDisabled,
                ]}
                disabled={requestedSeats <= 1}
                onPress={() => updateRequestedSeats(requestedSeats - 1)}>
                <Text style={styles.seatButtonText}>-</Text>
              </TouchableOpacity>

              <View style={styles.seatCountPill}>
                <Text style={styles.seatCountText}>{requestedSeats}</Text>
              </View>

              <TouchableOpacity
                style={[
                  styles.seatButton,
                  requestedSeats >= maxRequestedSeats &&
                    styles.seatButtonDisabled,
                ]}
                disabled={requestedSeats >= maxRequestedSeats}
                onPress={() => updateRequestedSeats(requestedSeats + 1)}>
                <Text style={styles.seatButtonText}>+</Text>
              </TouchableOpacity>
            </View>
          </View>

          <TextInput
            style={[styles.input, {minHeight: 80, maxHeight: 200}]}
            onChangeText={text => setTripRequestText(text)}
            value={tripRequestText}
            placeholder={t('Enter your travel request comment here :')}
            multiline
            textAlignVertical="top"
            onFocus={() => {
              setTimeout(() => {
                scrollViewRef.current?.scrollToEnd({animated: true});
              }, 300);
            }}
          />

          <TouchableOpacity
            style={styles.buttonUserInfo}
            onPress={() =>
              navigation.navigate('UserInfo', {
                userId: params.userId || owner.id || details.userId,
                username: username,
                userFname: userFname,
                userLname: userLname,
                userEmail: userEmail,
                departureCityId,
                departureCity,
                arrivalCityId,
                arrivalCity,
                selectedVehicle:
                  params.selectedVehicle || details.selectedVehicle,
                registrationNumber:
                  params.registrationNumber || details.registrationNumber,
                selectedDateTime:
                  params.selectedDateTime || details.selectedDateTime,
                routeTitle: params.routeTitle || details.routeTitle,
                totalSeats,
                availableSeats,
                routeId,
                routeDetailsData: details,
              })
            }>
            <Text style={styles.infoButtonText}>{t('viewUserInfo')}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.buttonConfirm,
              (isOwnRoute || hasRequested || loading) && {
                backgroundColor: '#ccc',
              },
              !hasFreeSeats && {backgroundColor: '#999'},
            ]}
            onPress={() => {
              if (isOwnRoute) {
                Alert.alert(
                  t('Error'),
                  t('You cannot apply for this route because you created it.'),
                );
              } else if (hasRequested) {
                Alert.alert(
                  t('Error'),
                  t('You have already submitted a request for this route.'),
                );
              } else if (!hasFreeSeats) {
                Alert.alert(
                  t('Error'),
                  t('No free seats left for this route.'),
                );
              } else {
                handlerTripRequest();
              }
            }}
            disabled={isOwnRoute || hasRequested || loading || !hasFreeSeats}>
            <Text style={styles.buttonText}>
              {loading ? 'Sending...' : t('Trip request')}
            </Text>
          </TouchableOpacity>

          {hasRequested && (
            <Text style={styles.requestedText}>
              {t('You have already applied for this route.')}
            </Text>
          )}

          <TouchableOpacity
            style={styles.buttonBack}
            onPress={handlerBackToViewRoute}
            disabled={loading}>
            <Text style={styles.buttonText}>{t('Back')}</Text>
          </TouchableOpacity>

          {requesterUsername === username && (
            <Text style={styles.warningText}>
              {t('This route was created by you, and you cannot request it!')}
            </Text>
          )}
        </ScrollView>

        {loading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#27ae60" />
          </View>
        )}
      </LinearGradient>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
  },
  container: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  headerText: {
    alignSelf: 'center',
    fontWeight: 'bold',
    fontSize: 24,
    paddingBottom: 10,
    color: '#e0e0e0',
    borderBottomWidth: 3,
    borderBottomColor: '#cacaca',
  },
  text: {
    alignSelf: 'center',
    fontWeight: 'bold',
    fontSize: 18,
    paddingBottom: 10,
    color: '#b9b9b9',
    borderBottomWidth: 1,
    borderBottomColor: '#919191',
  },
  buttonUserInfo: {
    alignSelf: 'center',
    marginTop: 10,
    padding: 15,
    backgroundColor: '#e3e9e5',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 18,
    fontWeight: 'bold',
    width: '90%',
    borderRadius: 10,
  },
  buttonConfirm: {
    alignSelf: 'center',
    marginTop: 10,
    padding: 15,
    backgroundColor: '#27ae60',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 18,
    fontWeight: 'bold',
    width: '90%',
    borderRadius: 10,
  },
  seatsCard: {
    alignSelf: 'center',
    marginTop: 10,
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: '#1f6f43',
    borderRadius: 999,
  },
  seatsText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  requestedSeatsCard: {
    alignSelf: 'center',
    width: '90%',
    marginTop: 12,
    padding: 14,
    backgroundColor: '#242424',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#4a4a4a',
  },
  requestedSeatsTitle: {
    color: '#f1f1f1',
    fontWeight: '700',
    fontSize: 17,
    textAlign: 'center',
  },
  requestedSeatsHint: {
    color: '#b9b9b9',
    marginTop: 6,
    fontSize: 13,
    textAlign: 'center',
  },
  seatStepper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 18,
    marginTop: 14,
  },
  seatButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#27ae60',
    alignItems: 'center',
    justifyContent: 'center',
  },
  seatButtonDisabled: {
    backgroundColor: '#777',
  },
  seatButtonText: {
    color: '#fff',
    fontSize: 28,
    lineHeight: 30,
    fontWeight: '800',
  },
  seatCountPill: {
    minWidth: 64,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
  },
  seatCountText: {
    color: '#27ae60',
    fontSize: 25,
    fontWeight: '800',
  },
  infoButtonText: {
    color: '#464646',
    fontSize: 16,
  },
  buttonBack: {
    alignSelf: 'center',
    marginTop: 10,
    padding: 15,
    backgroundColor: '#AE2727FF',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 18,
    fontWeight: 'bold',
    width: '90%',
    borderRadius: 10,
  },
  buttonText: {
    color: '#F1F1F1',
    fontSize: 16,
  },
  input: {
    alignSelf: 'center',
    marginTop: 10,
    padding: 10,
    width: '90%',
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 5,
    color: '#e9e9e9',
    backgroundColor: '#929090',
    textAlignVertical: 'top',
  },
  warningText: {
    marginTop: 10,
    fontSize: 16,
    color: 'red',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  requestedText: {
    marginTop: 10,
    marginBottom: 5,
    fontSize: 16,
    color: 'red',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)', // затъмнение
  },
});

export {RouteDetails};
