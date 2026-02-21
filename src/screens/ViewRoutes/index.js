import React, {useState, useEffect, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  SafeAreaView,
  TextInput,
  Modal,
  Pressable,
  RefreshControl,
} from 'react-native';
import {useTranslation} from 'react-i18next';
import {useAuth} from '../../context/AuthContext';
import api from '../../api/api';
import LinearGradient from 'react-native-linear-gradient';
import {ActivityIndicator} from 'react-native';

function ViewRoutes({navigation}) {
  const {t, i18n} = useTranslation();
  const [enteredDepartureCity, setEnteredDepartureCity] = useState('');
  const [enteredArrivalCity, setEnteredArrivalCity] = useState('');
  const {user} = useAuth();
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [sortByDate, setSortByDate] = useState(false);
  const [routes, setRoutes] = useState([]);
  const [filteredRoutesState, setFilteredRoutesState] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const usernameRequest = user?.username;
  const userFnameRequest = user?.fName;
  const userLnameRequest = user?.lName;
  const fullUserInfo = {usernameRequest, userFnameRequest, userLnameRequest};

  const toggleFilterModal = () => {
    setShowFilterModal(!showFilterModal);
  };

  const clearFilters = () => {
    setEnteredDepartureCity('');
    setEnteredArrivalCity('');
    setFilteredRoutesState(routes);
    toggleFilterModal();
  };

  const applyFilters = () => {
    toggleFilterModal();

    let filtered = routes.filter(
      route =>
        route.departureCity
          .toLowerCase()
          .includes(enteredDepartureCity.toLowerCase()) &&
        route.arrivalCity
          .toLowerCase()
          .includes(enteredArrivalCity.toLowerCase()),
    );

    filtered = filtered.filter(
      route =>
        new Date(route.selectedDateTime) >= new Date() &&
        route.status !== 'completed',
    );

    if (sortByDate) {
      filtered.sort(
        (a, b) => new Date(a.selectedDateTime) - new Date(b.selectedDateTime),
      );
    } else {
      filtered.sort(
        (a, b) => new Date(b.selectedDateTime) - new Date(a.selectedDateTime),
      );
    }

    setFilteredRoutesState(filtered);
  };

  const handlerSeeView = routeParams => {
    navigation.navigate('RouteDetails', {
      ...routeParams,
      showConfirmButton: false,
      showChangesButton: false,
      showBackButton: true,
      routeRequestButton: true,
      loggedInUser: fullUserInfo,
    });
  };

  const fetchRoutes = async () => {
    try {
      setLoading(true);
      const response = await api.get('api/routes');
      setRoutes(response.data);
      setFilteredRoutesState(response.data);
    } catch (error) {
      console.error('Fetch error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchRoutes();
  }, []);

  useEffect(() => {
    if (navigation?.addListener) {
      const unsubscribe = navigation.addListener('focus', () => {
        fetchRoutes();
      });

      return unsubscribe;
    }
  }, [navigation]);

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: '#1b1b1b',
        }}>
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  return (
    <LinearGradient
      colors={['#1b1b1b', '#2a2a2a']}
      style={styles.mainContainer}>
      {/*   <Image
        source={require('../../../images/d7.png')}
        style={styles.backgroundImage}
      /> */}

      <TouchableOpacity style={styles.filterButton} onPress={toggleFilterModal}>
        <Text style={styles.filterButtonText}>{t('Filter')}</Text>
      </TouchableOpacity>

      {/* Filter Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showFilterModal}
        onRequestClose={toggleFilterModal}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalHeader}>{t('Filter Options')}</Text>

            <TextInput
              style={styles.input}
              placeholder={t('Departure City')}
              placeholderTextColor="#aaa"
              value={enteredDepartureCity}
              onChangeText={setEnteredDepartureCity}
            />
            <TextInput
              style={styles.input}
              placeholder={t('Arrival City')}
              placeholderTextColor="#aaa"
              value={enteredArrivalCity}
              onChangeText={setEnteredArrivalCity}
            />

            <Pressable style={styles.applyFiltersButton} onPress={applyFilters}>
              <Text style={styles.buttonText}>{t('Apply Filters')}</Text>
            </Pressable>
            <Pressable
              style={styles.sortByDateButton}
              onPress={() => setSortByDate(!sortByDate)}>
              <Text style={styles.buttonText}>
                {sortByDate ? t('Sort by Oldest') : t('Sort by Newest')}
              </Text>
            </Pressable>
            <Pressable style={styles.clearFiltersButton} onPress={clearFilters}>
              <Text style={styles.buttonText}>{t('Clear Filters')}</Text>
            </Pressable>
            <Pressable
              style={styles.closeModalButton}
              onPress={toggleFilterModal}>
              <Text style={styles.buttonText}>{t('Close')}</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              fetchRoutes();
            }}
            tintColor="#fff"
          />
        }>
        <View style={styles.routesContainer}>
          {filteredRoutesState.map((route, index) => {
            const isOwnRoute = route.owner.id === user.id;
            return (
              <TouchableOpacity
                key={index}
                style={[styles.routeCard, isOwnRoute && styles.ownRouteCard]}
                onPress={() =>
                  handlerSeeView({
                    selectedVehicle: route.selectedVehicle,
                    markedSeats: route.markedSeats,
                    registrationNumber: route.registrationNumber,
                    selectedDateTime: route.selectedDateTime,
                    departureCity: route.departureCity,
                    departureStreet: route.departureStreet,
                    departureNumber: route.departureNumber,
                    arrivalCity: route.arrivalCity,
                    arrivalStreet: route.arrivalStreet,
                    arrivalNumber: route.arrivalNumber,
                    routeTitle: route.routeTitle,
                    userId: route.userId,
                    username: route.owner.username,
                    userFname: route.owner.fName,
                    userLname: route.owner.lName,
                    userEmail: route.owner.email,
                    routeId: route.id,
                    user_id: route.userId,
                  })
                }>
                <Text style={styles.routeTitle}>{route.routeTitle}</Text>
                <Text style={styles.routeDate}>
                  {route.selectedDateTime
                    ? new Date(route.selectedDateTime).toLocaleString(
                        i18n.language,
                        {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                          hour12: i18n.language !== 'bg',
                        },
                      )
                    : ''}
                </Text>
                <Text style={styles.routeInfo}>
                  {route.departureCity} → {route.arrivalCity}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
  },
  backgroundImage: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.2,
  },
  filterButton: {
    backgroundColor: '#f4511e',
    padding: 12,
    borderRadius: 12,
    margin: 12,
    alignSelf: 'center',
    width: '75%',
    alignItems: 'center',
  },
  filterButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 18,
  },
  routesContainer: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  routeCard: {
    width: '90%',
    backgroundColor: 'rgba(40,40,40,0.9)',
    borderRadius: 16,
    padding: 16,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  ownRouteCard: {
    borderColor: '#f4511e',
    borderWidth: 2,
  },
  routeTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
  },
  routeDate: {
    fontSize: 16,
    color: '#bbb',
    marginTop: 4,
  },
  routeInfo: {
    fontSize: 17,
    color: '#eee',
    marginTop: 4,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 20,
  },
  modalContent: {
    backgroundColor: '#2b2b2b',
    padding: 25,
    borderRadius: 15,
  },
  modalHeader: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 15,
  },
  input: {
    backgroundColor: '#3a3a3a',
    color: '#fff',
    borderRadius: 10,
    padding: 12,
    marginVertical: 8,
    fontSize: 16,
  },
  applyFiltersButton: {
    backgroundColor: '#ff7b00',
    borderRadius: 10,
    padding: 12,
    marginVertical: 6,
    alignItems: 'center',
  },
  sortByDateButton: {
    backgroundColor: '#3498db',
    borderRadius: 10,
    padding: 12,
    marginVertical: 6,
    alignItems: 'center',
  },
  clearFiltersButton: {
    backgroundColor: '#e74c3c',
    borderRadius: 10,
    padding: 12,
    marginVertical: 6,
    alignItems: 'center',
  },
  closeModalButton: {
    backgroundColor: '#777',
    borderRadius: 10,
    padding: 12,
    marginVertical: 6,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
});

export default ViewRoutes;
