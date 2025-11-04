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
} from 'react-native';
import {useRouteContext} from '../../context/RouteContext';
import {useTranslation} from 'react-i18next';
import {useAuth} from '../../context/AuthContext';
import axios from 'axios';
import LinearGradient from 'react-native-linear-gradient';

const API_BASE_URL = 'http://10.0.2.2:3000';

function ViewRoutes({navigation}) {
  const {t, i18n} = useTranslation();
  const [enteredDepartureCity, setEnteredDepartureCity] = useState('');
  const [enteredArrivalCity, setEnteredArrivalCity] = useState('');
  const {routes, deleteRoute} = useRouteContext();
  const {user} = useAuth();
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [sortByDate, setSortByDate] = useState(false);
  const [filteredRoutesState, setFilteredRoutesState] = useState(
    routes.filter(route => route.userRouteId !== 'deleted'),
  );

  const usernameRequest = user?.user?.username;
  const userFnameRequest = user?.user?.fName;
  const userLnameRequest = user?.user?.lName;
  const fullUserInfo = {usernameRequest, userFnameRequest, userLnameRequest};

  const toggleFilterModal = () => {
    setShowFilterModal(!showFilterModal);
  };

  const clearFilters = () => {
    setEnteredDepartureCity('');
    setEnteredArrivalCity('');
    toggleFilterModal();
  };

  const applyFilters = () => {
    toggleFilterModal();
    const filteredRoutesWithoutSort = routes.filter(
      route =>
        route.departureCity
          .toLowerCase()
          .includes(enteredDepartureCity.toLowerCase()) &&
        route.arrivalCity
          .toLowerCase()
          .includes(enteredArrivalCity.toLowerCase()),
    );
    const sortedRoutes = filteredRoutesWithoutSort.slice().sort((a, b) => {
      const dateA = new Date(a.selectedDateTime);
      const dateB = new Date(b.selectedDateTime);
      return sortByDate ? dateA - dateB : dateB - dateA;
    });
    setFilteredRoutesState(sortedRoutes);
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

  useEffect(() => {
    const fetchAndCleanRoutes = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/routes`);
        if (response.status === 200) {
          const currentDate = new Date();
          const filteredRoutes = await Promise.all(
            response.data.map(async route => {
              const routeDate = new Date(route.selectedDateTime);
              const expirationThreshold = new Date(routeDate);
              expirationThreshold.setDate(expirationThreshold.getDate() + 5);

              if (
                routeDate < currentDate &&
                expirationThreshold >= currentDate &&
                route.userRouteId !== 'deleted'
              ) {
                try {
                  await axios.patch(`${API_BASE_URL}/routes/${route.id}`, {
                    userRouteId: 'deleted',
                  });
                } catch (patchErr) {
                  console.error('❌ Patch error:', patchErr);
                }
                return null;
              }

              if (expirationThreshold < currentDate) {
                try {
                  await axios.delete(`${API_BASE_URL}/routes/${route.id}`);
                  return null;
                } catch (deleteErr) {
                  console.error('❌ Delete error:', deleteErr);
                  return null;
                }
              }
              return route;
            }),
          );
          const cleanedRoutes = filteredRoutes.filter(
            r =>
              r !== null &&
              r.selectedDateTime &&
              !isNaN(new Date(r.selectedDateTime)) &&
              !r.isDeleted &&
              r.userRouteId !== 'deleted' &&
              r.userRouteId !== 'completed',
          );
          setFilteredRoutesState(cleanedRoutes);
        }
      } catch (error) {
        console.error('❌ Fetch error:', error);
      }
    };
    fetchAndCleanRoutes();
  }, [routes]);

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

      <ScrollView style={styles.scrollView}>
        <View style={styles.routesContainer}>
          {filteredRoutesState.map((route, index) => {
            const isOwnRoute = route.username === usernameRequest;
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
                    username: route.username,
                    userFname: route.userFname,
                    userLname: route.userLname,
                    userEmail: route.userEmail,
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
