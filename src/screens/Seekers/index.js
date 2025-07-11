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
import {useTranslation} from 'react-i18next';
import {useFocusEffect} from '@react-navigation/native';
import {useAuth} from '../../context/AuthContext';
import axios from 'axios';

const API_BASE_URL = 'http://10.0.2.2:3000';

function Seekers({navigation}) {
  const {t} = useTranslation();
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [searchDeparture, setSearchDeparture] = useState('');
  const [searchArrival, setSearchArrival] = useState('');

  const {user} = useAuth();

  const loggedUser = user?.user?.username;
  const loggedUserName = user?.user?.fName;
  const loggedUserFname = user?.user?.lName;

  const fetchSeekers = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/seekers`);

      if (response.status === 200) {
        const updatedRoutes = await Promise.all(
          response.data.map(async route => {
            const routeDate = new Date(route.selectedDateTime);
            const now = new Date();

            // Ако датата е в миналото и маршрутът не е вече маркиран като deleted
            if (routeDate < now && route.status !== 'deleted') {
              try {
                await axios.patch(`${API_BASE_URL}/seekers/${route.id}`, {
                  status: 'deleted',
                });
                return {...route, status: 'deleted'};
              } catch (patchErr) {
                console.error('Неуспешно маркиране като deleted:', patchErr);
              }
            }

            return route;
          }),
        );

        setRoutes(updatedRoutes);
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

  const sendInvite = async () => {
    const recipient = selectedRoute.username;

    if (recipient === user?.user?.username) {
      Alert.alert('Грешка', 'Не можете да изпращате покана на себе си.');
      return;
    }

    try {
      // Провери дали вече има такава покана в notifications
      const res = await axios.get(`${API_BASE_URL}/notifications`);
      const alreadyInvited = res.data.some(
        n =>
          n.recipient === recipient &&
          n.requester?.username === user?.user?.username &&
          n.routeTitle === selectedRoute.routeTitle, // или избери нещо по-сигурно като ID, ако имаш
      );

      if (alreadyInvited) {
        Alert.alert(
          'Вече сте кандидатствали',
          'Не може да изпратите покана отново.',
        );
        return;
      }

      const notificationMessage = `Имате нова покана от ${loggedUserName} ${loggedUserFname}`;

      await axios.post(`${API_BASE_URL}/notifications`, {
        recipient: recipient,
        message: notificationMessage,
        routeChecker: true,
        status: 'active',
        requester: {
          username: user?.user?.username,
          userFname: user?.user?.userFname,
          userLname: user?.user?.userLname,
          email: user?.user?.email,
        },
        routeTitle: selectedRoute.routeTitle, // добави ако нямаш
        createdAt: new Date().toISOString(),
      });

      Alert.alert('Успех', 'Поканата е изпратена успешно.');
      setSelectedRoute(null);
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
    const depMatch = route.departureCity
      ?.toLowerCase()
      .includes(searchDeparture.toLowerCase());
    const arrMatch = route.arrivalCity
      ?.toLowerCase()
      .includes(searchArrival.toLowerCase());
    return isActive && depMatch && arrMatch;
  });

  return (
    <SafeAreaView style={styles.container}>
      <Image
        source={require('../../../images/d7.png')}
        style={styles.backgroundImage}
      />

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Търси по начална точка"
          value={searchDeparture}
          onChangeText={setSearchDeparture}
          placeholderTextColor="#999"
        />
        <TextInput
          style={styles.searchInput}
          placeholder="Търси по крайна точка"
          value={searchArrival}
          onChangeText={setSearchArrival}
          placeholderTextColor="#999"
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
              ).toLocaleDateString('bg-BG', {
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
                  <Text style={styles.routeText}>{route.routeTitle}</Text>
                  <Text style={styles.dateText}>{formattedDate}</Text>
                  <Text style={styles.routeText}>
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
                      {t('Created by')}: {route.userFname} {route.userLname} (@
                      {route.username})
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
                <Text style={styles.routeText}>{selectedRoute.routeTitle}</Text>
                <Text style={styles.dateText}>
                  {new Date(selectedRoute.selectedDateTime).toLocaleDateString(
                    'bg-BG',
                    {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    },
                  )}
                </Text>
                <Text style={styles.routeText}>
                  {selectedRoute.departureCity} ➝ {selectedRoute.arrivalCity}
                </Text>
                <View style={styles.creatorContainer}>
                  {selectedRoute.userImage ? (
                    <Image
                      source={{uri: selectedRoute.userImage}}
                      style={styles.userImage}
                    />
                  ) : (
                    <View style={styles.placeholderImage} />
                  )}
                  <Text style={styles.creatorText}>
                    {t('Created by')}: {selectedRoute.userFname}{' '}
                    {selectedRoute.userLname} (@{selectedRoute.username})
                  </Text>
                </View>

                <View style={styles.modalButtons}>
                  {selectedRoute.username !== user?.user?.username ? (
                    <TouchableOpacity
                      style={styles.inviteButton}
                      onPress={sendInvite}>
                      <Text style={styles.buttonText}>Покана</Text>
                    </TouchableOpacity>
                  ) : (
                    <Text style={styles.infoText}>
                      Не можете да изпращате покана към собствен маршрут.
                    </Text>
                  )}

                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={() => setSelectedRoute(null)}>
                    <Text style={styles.buttonText}>Назад</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>

      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}>
        <Text style={styles.backButtonText}>{t('Back')}</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1},
  scrollContainer: {padding: 16, paddingBottom: 100},
  routeCard: {
    backgroundColor: '#ffffffcc',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    elevation: 3,
  },
  routeText: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 6,
    color: '#1b1c1e',
  },
  dateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#f4511e',
    marginBottom: 6,
  },
  creatorContainer: {flexDirection: 'row', alignItems: 'center', marginTop: 10},
  creatorText: {fontSize: 16, marginLeft: 10, color: '#555', flexShrink: 1},
  userImage: {width: 40, height: 40, borderRadius: 20, backgroundColor: '#ccc'},
  placeholderImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#999',
  },
  errorText: {fontSize: 18, color: 'red', textAlign: 'center', marginTop: 20},
  backgroundImage: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  backButton: {
    margin: 20,
    backgroundColor: '#f4511e',
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  backButtonText: {fontSize: 18, color: '#fff', fontWeight: 'bold'},

  modalOverlay: {
    flex: 1,
    backgroundColor: '#000000aa',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    elevation: 10,
  },
  modalButtons: {
    flexDirection: 'column',
    alignItems: 'center',
    marginTop: 20,
    gap: 12,
  },
  inviteButton: {
    backgroundColor: '#28a745',
    padding: 12,
    borderRadius: 8,
    width: 150,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f4511e',
    padding: 12,
    borderRadius: 8,
    width: 150,
    alignItems: 'center',
  },
  buttonText: {color: '#fff', fontWeight: 'bold'},
  infoText: {
    color: '#888',
    fontSize: 16,
    fontStyle: 'italic',
    textAlign: 'center',
    maxWidth: 260,
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingTop: 20,
    gap: 10,
  },
  searchInput: {
    backgroundColor: '#ffffffcc',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 16,
    color: '#000',
  },
});

export default Seekers;
