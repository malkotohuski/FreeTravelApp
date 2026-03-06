import React, {useState, useCallback} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Alert,
  FlatList,
  Modal,
  Image,
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {useTranslation} from 'react-i18next';
import {useFocusEffect} from '@react-navigation/native';
import {useAuth} from '../../context/AuthContext';
import api from '../../api/api';

export default function Seekers({navigation}) {
  const {t, i18n} = useTranslation();
  const {user} = useAuth();

  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [searchDeparture, setSearchDeparture] = useState('');
  const [searchArrival, setSearchArrival] = useState('');
  const [messageInput, setMessageInput] = useState('');

  // 🔹 Fetch Seekers
  const fetchSeekers = async () => {
    try {
      setLoading(true);
      console.log(
        'Fetching seekers from:',
        api.defaults.baseURL + '/api/seekers',
      );

      const response = await api.get('/api/seekers');
      console.log('Response data:', response.data);

      const seekers = Array.isArray(response.data.seekers)
        ? response.data.seekers
        : [];
      const now = new Date();

      const updatedRoutes = await Promise.all(
        seekers.map(async route => {
          const routeDate = new Date(route.selectedDateTime);
          if (routeDate < now) {
            try {
              await api.delete(`/api/seekers/${route.id}`);
              return null;
            } catch (deleteErr) {
              console.error('Неуспешно изтриване на стар маршрут:', deleteErr);
              return route;
            }
          }
          return route;
        }),
      );

      setRoutes(updatedRoutes.filter(route => route !== null));
    } catch (err) {
      console.error('Error fetching seekers:', err);
      setError(t('Error fetching route data.'));
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchSeekers();
    }, []),
  );

  // 🔹 Филтриране
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

  // 🔹 Изпращане на покана
  const sendInvite = async () => {
    if (!selectedRoute) return;

    const recipient = selectedRoute.username;
    if (recipient === user?.username) {
      Alert.alert(t('Грешка'), t('Не можете да изпращате покана на себе си.'));
      return;
    }

    try {
      const res = await api.get('/api/notifications');
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

      const notificationMessage = `Имате нова покана от ${user.fName} ${user.lName}`;

      await api.post('/api/notifications', {
        recipient,
        message: notificationMessage,
        routeChecker: true,
        status: 'active',
        requester: {
          username: user?.username,
          userFname: user?.fName,
          userLname: user?.lName,
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

  const renderRoute = ({item: route}) => {
    const formattedDate = new Date(route.selectedDateTime).toLocaleDateString(
      i18n.language,
      {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      },
    );

    return (
      <TouchableOpacity
        style={styles.routeCard}
        onPress={() => setSelectedRoute(route)}>
        <Text style={styles.routeTitle}>{route.routeTitle}</Text>
        <Text style={styles.dateText}>{formattedDate}</Text>
        <Text style={styles.routeInfo}>
          {route.departureCity} ➝ {route.arrivalCity}
        </Text>
        <View style={styles.creatorContainer}>
          {route.userImage ? (
            <Image source={{uri: route.userImage}} style={styles.userImage} />
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
  };

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
        ) : filteredRoutes.length === 0 ? (
          <Text style={styles.errorText}>{t('No routes available.')}</Text>
        ) : (
          <FlatList
            data={filteredRoutes}
            renderItem={renderRoute}
            keyExtractor={route => route.id.toString()}
            contentContainerStyle={{paddingBottom: 50}}
          />
        )}

        {/* 🔹 Modal */}
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

        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.navigate('Home')}>
          <Text style={styles.backButtonText}>{t('Back')}</Text>
        </TouchableOpacity>
      </SafeAreaView>
    </LinearGradient>
  );
}

// 🔹 Добави стилове тук
const styles = StyleSheet.create({
  gradientBackground: {flex: 1},
  container: {flex: 1, padding: 16},
  searchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    backgroundColor: '#222',
    color: '#fff',
    padding: 10,
    marginHorizontal: 5,
    borderRadius: 8,
  },
  routeCard: {
    backgroundColor: '#333',
    padding: 12,
    marginBottom: 12,
    borderRadius: 10,
  },
  routeTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  dateText: {fontSize: 14, color: '#ccc', marginBottom: 4},
  routeInfo: {fontSize: 14, color: '#fff', marginBottom: 6},
  creatorContainer: {flexDirection: 'row', alignItems: 'center'},
  creatorText: {color: '#fff', marginLeft: 8},
  userImage: {width: 36, height: 36, borderRadius: 18},
  placeholderImage: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#666',
  },
  errorText: {color: 'red', textAlign: 'center', marginTop: 20},
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {backgroundColor: '#222', borderRadius: 12, padding: 16},
  messageInput: {
    backgroundColor: '#333',
    color: '#fff',
    padding: 10,
    borderRadius: 8,
    marginBottom: 12,
  },
  modalRouteTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  modalDate: {color: '#ccc', marginBottom: 4},
  modalRouteText: {color: '#fff', marginBottom: 12},
  modalButtons: {flexDirection: 'row', justifyContent: 'space-between'},
  mainButton: {
    backgroundColor: '#f4511e',
    padding: 10,
    borderRadius: 8,
    flex: 1,
    marginRight: 8,
    alignItems: 'center',
  },
  secondaryButton: {
    backgroundColor: '#555',
    padding: 10,
    borderRadius: 8,
    flex: 1,
    alignItems: 'center',
  },
  buttonText: {color: '#fff', fontWeight: 'bold'},
  infoText: {color: '#ccc', flex: 1, textAlign: 'center'},
  backButton: {
    alignItems: 'center',
    bottom: 20,
    padding: 12,
    backgroundColor: '#f4511e',
    borderRadius: 8,
  },
  backButtonText: {color: '#fff', fontWeight: 'bold'},
});
