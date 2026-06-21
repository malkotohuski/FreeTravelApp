import React, {useState, useEffect, useContext, useRef} from 'react';
import {useTranslation} from 'react-i18next';
import ViewShot from 'react-native-view-shot';
import Share from 'react-native-share';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  ScrollView,
  Alert,
  SafeAreaView,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import Icons from 'react-native-vector-icons/MaterialCommunityIcons';
import {useAuth} from '../../context/AuthContext';
import api from '../../api/api';
import {DarkModeContext} from '../../navigation/DarkModeContext';
import Toast from 'react-native-toast-message';
import {formatSeatsLabel} from '../../utils/seatPolicy';

const RouteHistory = ({navigation}) => {
  const {user} = useAuth();
  const {darkMode} = useContext(DarkModeContext);
  const {t} = useTranslation();
  const [originalRoutesState, setOriginalRoutesState] = useState([]);
  const [filteredRoutesState, setFilteredRoutesState] = useState([]);
  const [searchDepartureText, setSearchDepartureText] = useState('');
  const [searchArrivalText, setSearchArrivalText] = useState('');
  const [debouncedDepartureText, setDebouncedDepartureText] = useState('');
  const [debouncedArrivalText, setDebouncedArrivalText] = useState('');
  const [loading, setLoading] = useState(true);

  const shareRefs = useRef({});

  const handleShareRoute = async route => {
    const ref = shareRefs.current[route.id];
    if (!ref) return;

    try {
      const uri = await ref.capture();
      await Share.open({
        url: `file://${uri}`,
        type: 'image/png',
        message: '🚗 Намери място в колата ми чрез FreeTravelApp!',
        failOnCancel: false,
      });
    } catch (err) {
      console.error('Share error:', err);
    }
  };

  const getCityName = (route, key) =>
    route?.[key]?.name ||
    route?.[key === 'departureCityRef' ? 'departureCity' : 'arrivalCity'] ||
    '';

  const getHeaderStyles = () => ({
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    padding: 16,
    backgroundColor: darkMode ? '#333232FF' : '#f4511e',
  });

  // Проверка дали маршрутът може да бъде отбелязан като завършен
  // (разрешено само след тръгване + 1 час)
  const isCompletionAllowed = route => {
    const departureTime = new Date(route.selectedDateTime).getTime();
    const allowedTime = departureTime + 60 * 60 * 1000; // +1 час в милисекунди
    return Date.now() >= allowedTime;
  };

  useEffect(() => {
    const fetchRoutes = async () => {
      try {
        setLoading(true);
        const response = await api.get('/api/routes/my');

        const routes = response.data.filter(route => {
          return route.status === 'active';
        });

        setOriginalRoutesState(routes);
        setFilteredRoutesState(routes);
      } catch (error) {
        console.error('Error fetching routes:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user?.id) {
      fetchRoutes();
    }
  }, [user]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setDebouncedDepartureText(searchDepartureText);
    }, 250);

    return () => clearTimeout(timeoutId);
  }, [searchDepartureText]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setDebouncedArrivalText(searchArrivalText);
    }, 250);

    return () => clearTimeout(timeoutId);
  }, [searchArrivalText]);

  useEffect(() => {
    // Филтрирай маршрути на база на текста за търсене и сортирай по дата
    const filteredRoutes = originalRoutesState
      .filter(route => {
        const matchesDeparture = getCityName(route, 'departureCityRef')
          ?.toLowerCase()
          .includes(debouncedDepartureText.toLowerCase());
        const matchesArrival = getCityName(route, 'arrivalCityRef')
          ?.toLowerCase()
          .includes(debouncedArrivalText.toLowerCase());
        return matchesDeparture && matchesArrival;
      })
      .sort(
        (a, b) => new Date(b.selectedDateTime) - new Date(a.selectedDateTime),
      ); // Сортирай по най-нова дата

    setFilteredRoutesState(filteredRoutes);
  }, [debouncedDepartureText, debouncedArrivalText, originalRoutesState]);

  const handleDeleteRoute = routeId => {
    Alert.alert(
      t('Delete Route'),
      t('Are you sure you want to delete this route?'),
      [
        {
          text: t('Cancel'),
          style: 'cancel',
        },
        {
          text: t('Delete'),
          onPress: async () => {
            try {
              await api.patch(`/api/routes/${routeId}/delete`);
              const updatedRoutes = originalRoutesState.filter(
                route => route.id !== routeId,
              );

              setOriginalRoutesState(updatedRoutes);
              setFilteredRoutesState(updatedRoutes);
            } catch (error) {
              console.error('Error deleting route:', error);
              Alert.alert(
                t('Error'),
                t('Failed to delete route. Please try again.'),
              );
            }
          },
        },
      ],
      {cancelable: false},
    );
  };

  const handleMarkAsCompleted = routeId => {
    const routeToComplete = originalRoutesState.find(r => r.id === routeId);
    if (!routeToComplete) return;

    Alert.alert(
      t('Complete Route'),
      t('Are you sure you want to mark this route as completed?'),
      [
        {text: t('Cancel'), style: 'cancel'},
        {
          text: t('OK'),
          onPress: async () => {
            try {
              // 1️⃣ Обновяваме бекенд статуса на маршрута
              await api.patch(`/api/routes/${routeId}/complete`);

              // 2️⃣ Обновяваме локалния state
              const updatedRoutes = originalRoutesState.filter(
                r => r.id !== routeId,
              );
              setOriginalRoutesState(updatedRoutes);
              setFilteredRoutesState(updatedRoutes);

              // 3️⃣ Показваме toast (информираме шофьора)
              Toast.show({
                type: 'success',
                text1: t('Route marked as completed'),
                text2: t('Notifications have been sent to rate passengers'),
                visibilityTime: 4000,
              });
            } catch (error) {
              console.error(error);
              Alert.alert(t('Error'), t('Failed to complete the route.'));
            }
          },
        },
      ],
      {cancelable: false},
    );
  };

  return (
    <SafeAreaView style={styles.mainContainer}>
      <Image
        source={require('../../../images/roadHistory2.png')}
        style={styles.backgroundImage}
      />
      <View style={styles.mainContent}>
        <View style={getHeaderStyles()}>
          <Text style={{color: 'white', fontSize: 18, fontWeight: 'bold'}}>
            {t('Routes History')}
          </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Home')}>
            <Icons name="keyboard-backspace" size={24} color="white" />
          </TouchableOpacity>
        </View>
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder={t('Search by Departure City')}
            value={searchDepartureText}
            onChangeText={setSearchDepartureText}
          />
          <TextInput
            style={styles.searchInput}
            placeholder={t('Search by Arrival City')}
            value={searchArrivalText}
            onChangeText={setSearchArrivalText}
          />
        </View>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#f4511e" />
          </View>
        ) : (
          <ScrollView style={styles.scrollView}>
            <View style={styles.container}>
              {filteredRoutesState.length === 0 ? (
                <Text style={styles.emptyText}>{t('No routes found')}</Text>
              ) : (
                filteredRoutesState.map((route, index) => {
                  const completionAllowed = isCompletionAllowed(route);
                  return (
                    <TouchableOpacity key={index} style={styles.routeContainer}>
                      <Text style={styles.routeText}>
                        {new Date(route.selectedDateTime).toLocaleString()}{' '}
                        {/* Displaying date without time */}
                      </Text>
                      <Text style={styles.routeText}>
                        {getCityName(route, 'departureCityRef')}-
                        {getCityName(route, 'arrivalCityRef')}
                      </Text>
                      <Text style={styles.routeText}>
                        {t('Free seats')}:{' '}
                        {formatSeatsLabel(
                          route.availableSeats,
                          route.totalSeats,
                        )}
                      </Text>
                      <View style={styles.buttonContainer}>
                        <TouchableOpacity
                          style={styles.button_delete}
                          onPress={() => handleDeleteRoute(route.id)}>
                          <Text style={styles.buttonText}>
                            {t('Delete Route')}
                          </Text>
                        </TouchableOpacity>
                        {/* Скрита карточка за share - не се вижда на екрана */}
                        <ViewShot
                          ref={el => (shareRefs.current[route.id] = el)}
                          options={{format: 'png', quality: 1}}
                          style={styles.shareCardHidden}>
                          <View style={styles.shareCard}>
                            {/* Горна лента */}
                            <View style={styles.shareCardHeader}>
                              <Text style={styles.shareCardHeaderText}>
                                🚗 Предлагам място в кола
                              </Text>
                              <Image
                                source={require('../../../images/app-logo.png')} // <- сложи правилния path към логото
                                style={styles.shareCardLogo}
                              />
                            </View>

                            {/* Маршрут */}
                            <View style={styles.shareCardBody}>
                              <View style={styles.shareRouteRow}>
                                <View style={styles.shareRouteIcons}>
                                  <View style={styles.shareDotGreen} />
                                  <View style={styles.shareRouteLine} />
                                  <View style={styles.shareDotOrange} />
                                </View>
                                <View style={{flex: 1}}>
                                  <Text style={styles.shareCityText}>
                                    {getCityName(route, 'departureCityRef')}
                                  </Text>
                                  <Text style={styles.shareCityText}>
                                    {getCityName(route, 'arrivalCityRef')}
                                  </Text>
                                </View>
                              </View>

                              {/* Дата / Ден / Час */}
                              <View style={styles.shareDateRow}>
                                <View style={styles.shareDateBlock}>
                                  <Text style={styles.shareDateValue}>
                                    {`${String(
                                      new Date(
                                        route.selectedDateTime,
                                      ).getDate(),
                                    ).padStart(2, '0')}.${String(
                                      new Date(
                                        route.selectedDateTime,
                                      ).getMonth() + 1,
                                    ).padStart(2, '0')}`}
                                  </Text>
                                  <Text style={styles.shareDateLabel}>
                                    ДАТА
                                  </Text>
                                </View>
                                <View style={styles.shareVerticalLine} />
                                <View style={styles.shareDateBlock}>
                                  <Text style={styles.shareDateValue}>
                                    {new Date(route.selectedDateTime)
                                      .toLocaleDateString('bg-BG', {
                                        weekday: 'long',
                                      })
                                      .toUpperCase()}
                                  </Text>
                                  <Text style={styles.shareDateLabel}>ДЕН</Text>
                                </View>
                                <View style={styles.shareVerticalLine} />
                                <View style={styles.shareDateBlock}>
                                  <Text style={styles.shareDateValue}>
                                    {new Date(
                                      route.selectedDateTime,
                                    ).toLocaleTimeString('bg-BG', {
                                      hour: '2-digit',
                                      minute: '2-digit',
                                      hour12: false,
                                    })}
                                  </Text>
                                  <Text style={styles.shareDateLabel}>ЧАС</Text>
                                </View>
                              </View>

                              {/* Места */}
                              <View style={styles.shareSeatsRow}>
                                <Text style={styles.shareSeatsText}>
                                  💺 Свободни места:{' '}
                                  {formatSeatsLabel(
                                    route.availableSeats,
                                    route.totalSeats,
                                  )}
                                </Text>
                              </View>

                              {route.routeTitle ? (
                                <Text style={styles.shareRouteTitleText}>
                                  📌 {route.routeTitle}
                                </Text>
                              ) : null}
                            </View>

                            {/* Footer */}
                            <View style={styles.shareCardFooter}>
                              <Text style={styles.shareFooterText}>
                                Изтегли FreeTravelApp и кандидатствай 👇
                              </Text>
                              <Text style={styles.shareFooterLink}>
                                play.google.com/store/apps/details?id=com.freetravelapp3
                              </Text>
                            </View>
                          </View>
                        </ViewShot>

                        {/* Share бутон - видим на екрана */}
                        <TouchableOpacity
                          style={styles.button_share}
                          onPress={() => handleShareRoute(route)}>
                          <Text style={styles.buttonText}>📤 Сподели</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[
                            styles.button_completed,
                            !completionAllowed && styles.button_disabled,
                          ]}
                          disabled={!completionAllowed}
                          onPress={() => handleMarkAsCompleted(route.id)}>
                          <Text style={styles.buttonText}>
                            {t('Mark as Completed')}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </TouchableOpacity>
                  );
                })
              )}
            </View>
          </ScrollView>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
  },
  mainContent: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    padding: 16,
    backgroundColor: '#f4511e',
  },
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
    position: 'absolute',
  },
  searchContainer: {
    width: '90%',
    marginVertical: 10,
  },
  searchInput: {
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 10,
    marginVertical: 5,
    backgroundColor: 'white',
  },
  scrollView: {
    width: '100%',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    flex: 1,
    alignItems: 'center',
  },
  emptyText: {
    marginTop: 20,
    fontSize: 16,
    color: '#fff',
    textAlign: 'center',
  },
  routeContainer: {
    width: '90%',
    backgroundColor: '#f8f8f8',
    padding: 10,
    borderRadius: 10,
    marginVertical: 5,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 3,
  },
  routeText: {
    fontSize: 16,
    color: '#333',
  },
  buttonContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 10,
    marginTop: 10,
  },

  button_completed: {
    backgroundColor: '#2ecc71',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 5,
    flexGrow: 1,
    flexBasis: '48%', // за да стоят 2 бутона на ред
    alignItems: 'center',
  },

  button_disabled: {
    backgroundColor: '#b0b0b0',
    opacity: 0.6,
  },

  button_delete: {
    backgroundColor: '#e74c3c',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 5,
    flexGrow: 1,
    flexBasis: '48%',
    alignItems: 'center',
  },

  buttonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
    flexWrap: 'wrap',
  },
  button_share: {
    backgroundColor: '#3b5998',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 5,
    marginTop: 8,
    alignItems: 'center',
  },
  shareCardHidden: {
    position: 'absolute',
    opacity: 0,
    top: 0,
    left: 0,
    zIndex: -1,
  },
  shareCard: {
    width: 380,
    backgroundColor: '#1a1a2e',
    borderRadius: 20,
    overflow: 'hidden',
  },
  shareCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f4511e',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  shareCardHeaderText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
    flex: 1,
  },
  shareCardLogo: {
    width: 44,
    height: 44,
    borderRadius: 10,
  },
  shareCardBody: {
    padding: 16,
  },
  shareRouteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  shareRouteIcons: {
    alignItems: 'center',
    height: 52,
    justifyContent: 'space-between',
  },
  shareDotGreen: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#2ecc71',
  },
  shareDotOrange: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#f4511e',
  },
  shareRouteLine: {
    width: 2,
    flex: 1,
    backgroundColor: '#555',
    marginVertical: 3,
  },
  shareCityText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '800',
  },
  shareDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#16213e',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  shareDateBlock: {
    flex: 1,
    alignItems: 'center',
  },
  shareDateValue: {
    color: '#f4511e',
    fontSize: 15,
    fontWeight: '800',
  },
  shareDateLabel: {
    color: '#888',
    fontSize: 9,
    fontWeight: '600',
    marginTop: 3,
    letterSpacing: 0.5,
  },
  shareVerticalLine: {
    width: 1,
    height: 32,
    backgroundColor: '#333',
  },
  shareSeatsRow: {
    backgroundColor: '#16213e',
    borderRadius: 12,
    padding: 10,
    marginBottom: 8,
    alignItems: 'center',
  },
  shareSeatsText: {
    color: '#2ecc71',
    fontSize: 15,
    fontWeight: '700',
  },
  shareRouteTitleText: {
    color: '#ccc',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 4,
  },
  shareCardFooter: {
    backgroundColor: '#0f3460',
    padding: 12,
    alignItems: 'center',
  },
  shareFooterText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  shareFooterLink: {
    color: '#f4511e',
    fontSize: 12,
    marginTop: 2,
  },
});

export default RouteHistory;
