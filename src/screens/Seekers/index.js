import React, {useCallback, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Modal,
  Alert,
  TextInput,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {useTranslation} from 'react-i18next';
import {useFocusEffect} from '@react-navigation/native';
import {useAuth} from '../../context/AuthContext';
import axios from 'axios';

const API_BASE_URL = 'http://10.0.2.2:3000';

function Seekers({navigation}) {
  const {t, i18n} = useTranslation();
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [searchDeparture, setSearchDeparture] = useState('');
  const [searchArrival, setSearchArrival] = useState('');
  const [messageInput, setMessageInput] = useState('');

  const {user} = useAuth();

  const loggedUser = user?.username;
  const loggedUserName = user?.fName;
  const loggedUserFname = user?.lName;

  const fetchSeekers = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/seekers`);
      if (response.status === 200) {
        const now = new Date();
        const updatedRoutes = await Promise.all(
          response.data.map(async route => {
            const routeDate = new Date(route.selectedDateTime);
            if (routeDate < now) {
              try {
                await axios.delete(`${API_BASE_URL}/seekers/${route.id}`);
                return null;
              } catch (deleteErr) {
                console.error(
                  'Неуспешно изтриване на стар маршрут:',
                  deleteErr,
                );
                return route;
              }
            }
            return route;
          }),
        );
        setRoutes(updatedRoutes.filter(route => route !== null));
      } else {
        setError(t('Failed to fetch routes.'));
      }
    } catch (err) {
      console.error('Error fetching seekers:', err);
      setError(t('Error fetching route data.'));
    } finally {
      setLoading(false);
    }
  };

  const handlerBackHome = () => {
    navigation.navigate('Home');
  };

  const sendInvite = async () => {
    const recipient = selectedRoute.username;

    if (recipient === user?.username) {
      Alert.alert(t('Грешка'), t('Не можете да изпращате покана на себе си.'));
      return;
    }

    try {
      const res = await axios.get(`${API_BASE_URL}/notifications`);
      const alreadyInvited = res.data.some(
        n =>
          n.recipient === recipient &&
          n.requester?.username === user?.username &&
          n.routeTitle === selectedRoute.routeTitle,
      );

      if (alreadyInvited) {
        Alert.alert(
          t('You have already applied.'),
          t('You cannot resend an invitation.'),
        );
        return;
      }

      const notificationMessage = `Имате нова покана от ${loggedUserName} ${loggedUserFname}`;

      await axios.post(`${API_BASE_URL}/notifications`, {
        recipient,
        message: notificationMessage,
        routeChecker: true,
        status: 'active',
        requester: {
          username: user?.username,
          userFname: user?.userFname,
          userLname: user?.userLname,
          email: user?.email,
        },
        routeTitle: selectedRoute.routeTitle,
        createdAt: new Date().toISOString(),
        personalMessage: messageInput,
      });

      setSelectedRoute(null);
      setMessageInput('');
      Alert.alert('✅', t('The invitation was sent successfully.'));
    } catch (err) {
      console.error('Грешка при изпращане:', err);
      Alert.alert('Грешка', 'Възникна проблем при изпращането на поканата.');
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchSeekers();
    }, []),
  );

  const filteredRoutes = routes.filter(route => {
    const isActive = !route.status || route.status === 'active';
    const routeDate = new Date(route.selectedDateTime);
    const isFuture = routeDate >= new Date();
    const depMatch = route.departureCity
      ?.toLowerCase()
      .includes(searchDeparture.toLowerCase());
    const arrMatch = route.arrivalCity
      ?.toLowerCase()
      .includes(searchArrival.toLowerCase());
    return isActive && isFuture && depMatch && arrMatch;
  });

  return (
    <LinearGradient
      colors={['#0d0d0d', '#1a1a1a']}
      style={styles.gradientBackground}>
      <SafeAreaView style={styles.container}>
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder={t('Search by starting point')}
            value={searchDeparture}
            onChangeText={setSearchDeparture}
            placeholderTextColor="#888"
          />
          <TextInput
            style={styles.searchInput}
            placeholder={t('Search by endpoint')}
            value={searchArrival}
            onChangeText={setSearchArrival}
            placeholderTextColor="#888"
          />
        </View>

        {loading ? (
          <ActivityIndicator
            size="large"
            color="#f4511e"
            style={{marginTop: 40}}
          />
        ) : error ? (
          <Text style={styles.errorText}>{error}</Text>
        ) : (
          <ScrollView contentContainerStyle={styles.scrollContainer}>
            {filteredRoutes.length === 0 ? (
              <Text style={styles.errorText}>{t('No routes available.')}</Text>
            ) : (
              filteredRoutes.map((route, index) => {
                const formattedDate = new Date(
                  route.selectedDateTime,
                ).toLocaleDateString(i18n.language, {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                });

                return (
                  <TouchableOpacity
                    key={index}
                    style={styles.routeCard}
                    onPress={() => setSelectedRoute(route)}>
                    <Text style={styles.routeTitle}>{route.routeTitle}</Text>
                    <Text style={styles.dateText}>{formattedDate}</Text>
                    <Text style={styles.routeInfo}>
                      {route.departureCity} ➝ {route.arrivalCity}
                    </Text>
                    <View style={styles.creatorContainer}>
                      {route.userImage ? (
                        <Image
                          source={{uri: route.userImage}}
                          style={styles.userImage}
                        />
                      ) : (
                        <View style={styles.placeholderImage} />
                      )}
                      <Text style={styles.creatorText}>
                        {t('Created by')}: {route.userFname} {route.userLname}{' '}
                        (@{route.username})
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })
            )}
          </ScrollView>
        )}

        <Modal visible={!!selectedRoute} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              {selectedRoute && (
                <>
                  <TextInput
                    style={styles.messageInput}
                    placeholder={t('Write a personal message (optional)')}
                    multiline
                    numberOfLines={4}
                    value={messageInput}
                    onChangeText={setMessageInput}
                    placeholderTextColor="#aaa"
                  />
                  <Text style={styles.modalRouteTitle}>
                    {selectedRoute.routeTitle}
                  </Text>
                  <Text style={styles.modalDate}>
                    {new Date(
                      selectedRoute.selectedDateTime,
                    ).toLocaleDateString('bg-BG', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </Text>
                  <Text style={styles.modalRouteText}>
                    {selectedRoute.departureCity} ➝ {selectedRoute.arrivalCity}
                  </Text>

                  <View style={styles.modalButtons}>
                    {selectedRoute.username !== user?.username ? (
                      <TouchableOpacity
                        style={styles.mainButton}
                        onPress={sendInvite}>
                        <Text style={styles.buttonText}>{t('Invitation')}</Text>
                      </TouchableOpacity>
                    ) : (
                      <Text style={styles.infoText}>
                        {t('You cannot send an invitation to your own route.')}
                      </Text>
                    )}

                    <TouchableOpacity
                      style={styles.secondaryButton}
                      onPress={() => setSelectedRoute(null)}>
                      <Text style={styles.buttonText}>{t('Back')}</Text>
                    </TouchableOpacity>
                  </View>
                </>
              )}
            </View>
          </View>
        </Modal>

        <TouchableOpacity style={styles.backButton} onPress={handlerBackHome}>
          <Text style={styles.backButtonText}>{t('Back')}</Text>
        </TouchableOpacity>
      </SafeAreaView>
    </LinearGradient>
  );
}

export default Seekers;

const styles = StyleSheet.create({
  gradientBackground: {flex: 1},
  container: {flex: 1},
  scrollContainer: {padding: 16, paddingBottom: 100},
  searchContainer: {paddingHorizontal: 20, paddingTop: 20, gap: 12},
  searchInput: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    color: '#fff',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  routeCard: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  routeTitle: {fontSize: 20, fontWeight: '700', color: '#fff', marginBottom: 8},
  routeInfo: {fontSize: 18, color: '#ccc', marginBottom: 6},
  dateText: {fontSize: 16, color: '#f4511e', marginBottom: 6},
  creatorContainer: {flexDirection: 'row', alignItems: 'center', marginTop: 10},
  creatorText: {fontSize: 15, color: '#bbb', marginLeft: 10, flexShrink: 1},
  userImage: {width: 40, height: 40, borderRadius: 20},
  placeholderImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#444',
  },
  errorText: {fontSize: 18, color: '#ccc', textAlign: 'center', marginTop: 20},
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: 'rgba(30,30,30,0.95)',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  messageInput: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 10,
    padding: 10,
    color: '#fff',
    height: 100,
    textAlignVertical: 'top',
  },
  modalRouteTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    marginTop: 15,
  },
  modalRouteText: {fontSize: 17, color: '#ccc', marginBottom: 8},
  modalDate: {fontSize: 16, color: '#f4511e', marginBottom: 10},
  modalButtons: {marginTop: 20, alignItems: 'center', gap: 12},
  mainButton: {
    backgroundColor: '#f4511e',
    borderRadius: 10,
    paddingVertical: 14,
    width: 180,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#fff',
  },
  secondaryButton: {
    backgroundColor: '#777',
    borderRadius: 10,
    paddingVertical: 14,
    width: 180,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#fff',
  },
  buttonText: {color: '#fff', fontSize: 17, fontWeight: '600'},
  infoText: {color: '#aaa', textAlign: 'center', marginTop: 10},
  backButton: {
    margin: 20,
    backgroundColor: '#f4511e',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#fff',
  },
  backButtonText: {color: '#fff', fontSize: 18, fontWeight: '600'},
});
