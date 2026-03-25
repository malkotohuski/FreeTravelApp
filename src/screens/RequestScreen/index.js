import React, {useEffect, useState, useCallback} from 'react';
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

function RouteDetails({route}) {
  const {t} = useTranslation();
  const navigation = useNavigation();
  const {user} = useAuth();
  const {username, userFname, userLname, userEmail, routeId} = route.params;
  const [loading, setLoading] = useState(false);

  const requesterUsername = user?.username;

  const departureCity = route.params.departureCity;
  const arrivalCity = route.params.arrivalCity;

  const [tripRequestText, setTripRequestText] = useState('');
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
                userRouteId: route.params?.userId || 0,
                departureCity: departureCity || '',
                arrivalCity: arrivalCity || '',
                dataTime: route.params?.selectedDateTime,
                requestComment: tripRequestText,
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

          <TextInput
            style={[styles.input, {minHeight: 80, maxHeight: 200}]}
            onChangeText={text => setTripRequestText(text)}
            value={tripRequestText}
            placeholder={t('Enter your travel request comment here :')}
            multiline
            textAlignVertical="top"
          />

          <TouchableOpacity
            style={styles.buttonUserInfo}
            onPress={() =>
              navigation.navigate('UserDetails', {userId: route.params.userId})
            }>
            <Text style={styles.infoButtonText}>{t('viewUserInfo')}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.buttonConfirm,
              (isOwnRoute || hasRequested || loading) && {
                backgroundColor: '#ccc',
              },
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
            disabled={isOwnRoute || hasRequested || loading}>
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
