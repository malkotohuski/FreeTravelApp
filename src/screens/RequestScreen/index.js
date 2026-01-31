import React, {useEffect, useState, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  TextInput,
} from 'react-native';
import {useFocusEffect} from '@react-navigation/native';
import {useTranslation} from 'react-i18next';
import {useNavigation, useRoute} from '@react-navigation/native';
import {useAuth} from '../../context/AuthContext';
import api from '../../api/api';

function RouteDetails({route}) {
  const {t} = useTranslation();
  const navigation = useNavigation();
  const {user} = useAuth();
  const routeInfo = useRoute();
  const loggedInUser = route.params.loggedInUser;

  console.log(loggedInUser, '2221');

  const {
    username,
    userFname,
    userLname,
    userEmail,
    departureCity,
    arrivalCity,
    routeId,
  } = route.params;
  const loginUser = user?.username;

  const requesterUsername = user?.username;
  const requestUserFirstName = user?.fName;
  const requestUserLastName = user?.lName;
  const requestUserEmail = user?.email;
  const departureCityEmail = route.params.departureCity;
  const arrivalCityEmail = route.params.arrivalCity;

  const routeDateTime = route.params.selectedDateTime;
  const dataTime = routeDateTime.replace('T', ' ').replace('.000Z', '');

  const [tripRequestText, setTripRequestText] = useState('');
  const [notificationCount, setNotificationCount] = useState(0);
  const [hasRequested, setHasRequested] = useState(false);
  const isOwnRoute = requesterUsername === username;

  useFocusEffect(
    useCallback(() => {
      setTripRequestText(''); // нулира стойността всеки път при фокус
    }, []),
  );

  // Проверка за съществуваща заявка
  useEffect(() => {
    const checkIfAlreadyRequested = async () => {
      try {
        if (!routeId || !user?.id) return;

        const response = await api.get('/requests');

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

    if (!tripRequestText.trim()) {
      Alert.alert(t('Error'), t('Please enter a comment before submitting.'));
      return;
    }

    Alert.alert(
      t('Confirm'),
      t('Would you like to submit a request for this route?'),
      [
        {text: t('Cancel'), style: 'cancel'},
        {
          text: 'OK',
          onPress: async () => {
            try {
              await api.post('/send-request-to-user', {
                requestingUser: {
                  username: user.username,
                  userFname: user.fName,
                  userLname: user.lName,
                  userEmail: user.email,
                  userID: user.id,
                  userRouteId: route.params.userId,
                  departureCity,
                  arrivalCity,
                  routeId,
                  dataTime: route.params.selectedDateTime,
                  requestComment: tripRequestText,
                  status: 'pending',
                },
              });

              setHasRequested(true);

              Alert.alert(
                t('Success'),
                t('You have successfully applied for this route!'),
                [{text: 'OK', onPress: () => navigation.navigate('Home')}],
              );
            } catch (err) {
              console.error('API error:', err);
              Alert.alert(
                t('Error'),
                err.response?.data?.error || 'Failed to send trip request.',
              );
            }
          },
        },
      ],
    );
  };

  const handlerBackToViewRoute = () => {
    navigation.navigate('View routes');
  };

  return (
    <View style={styles.container}>
      <Image
        source={require('../../../images/confirm2-background.jpg')}
        style={{
          flex: 1,
          width: '100%',
          height: '100%',
          resizeMode: 'cover',
          position: 'absolute',
        }}
      />

      <Text style={styles.headerText}>{t('Route Details')}:</Text>
      <Text style={styles.text}>
        {' '}
        {t('Nick name')} : {username}
      </Text>
      <Text style={styles.text}>
        {' '}
        {t('Names')} : {userFname} {userLname}
      </Text>
      <Text style={styles.text}>
        {' '}
        {t('Route')} : {departureCity}-{arrivalCity}{' '}
      </Text>

      <TextInput
        style={styles.input}
        onChangeText={text => setTripRequestText(text)}
        value={tripRequestText}
        placeholder={t('Enter your travel request comment here :')}
        multiline={true}
        numberOfLines={4}
      />

      <TouchableOpacity
        style={[
          styles.buttonConfirm,
          (isOwnRoute || hasRequested) && {backgroundColor: '#ccc'},
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
          } else {
            handlerTripRequest();
          }
        }}
        disabled={isOwnRoute || hasRequested}>
        <Text style={styles.buttonText}>{t('Trip request')}</Text>
      </TouchableOpacity>
      {hasRequested && (
        <Text style={styles.requestedText}>
          {t('You have already applied for this route.')}
        </Text>
      )}

      <TouchableOpacity
        style={styles.buttonBack}
        onPress={handlerBackToViewRoute}>
        <Text style={styles.buttonText}>{t('Back')}</Text>
      </TouchableOpacity>
      {requesterUsername === username && (
        <Text style={styles.warningText}>
          {t('This route was created by you, and you cannot request it!')}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    backgroundColor: 'grey',
  },
  headerText: {
    fontWeight: 'bold',
    fontSize: 24,
    paddingBottom: 10,
    color: '#1b1c1e',
    borderBottomWidth: 3,
    borderBottomColor: '#1b1c1e',
  },
  text: {
    fontWeight: 'bold',
    fontSize: 18,
    paddingBottom: 10,
    color: '#1b1c1e',
    borderBottomWidth: 1,
    borderBottomColor: '#1b1c1e',
  },
  buttonConfirm: {
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
  buttonBack: {
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
    marginTop: 10,
    padding: 10,
    width: '90%',
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 5,
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
});

export {RouteDetails};
