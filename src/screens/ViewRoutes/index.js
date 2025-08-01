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

const API_BASE_URL = 'http://10.0.2.2:3000';

function ViewRoutes({navigation}) {
  const {t} = useTranslation();
  const [enteredDepartureCity, setEnteredDepartureCity] = useState('');
  const [enteredArrivalCity, setEnteredArrivalCity] = useState('');
  const {routes, deleteRoute, refreshRoutesData} = useRouteContext();
  const {user} = useAuth();
  const [loggingUser, setLoggingUser] = useState([]);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [sortByDate, setSortByDate] = useState(false);
  const [filteredRoutes, setFilteredRoutes] = useState([]);
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

    // Създай нов списък с филтрирани маршрути без сортиране
    const filteredRoutesWithoutSort = routes.filter(
      route =>
        route.departureCity
          .toLowerCase()
          .includes(enteredDepartureCity.toLowerCase()) &&
        route.arrivalCity
          .toLowerCase()
          .includes(enteredArrivalCity.toLowerCase()),
    );

    // Създай нов списък със сортирани маршрути
    const sortedRoutes = filteredRoutesWithoutSort.slice().sort((a, b) => {
      const dateA = new Date(a.selectedDateTime);
      const dateB = new Date(b.selectedDateTime);

      // Зависи от това дали трябва да сортираш във възходящ или низходящ ред
      return sortByDate ? dateA - dateB : dateB - dateA;
    });

    // Замени текущия филтриран списък със сортирания
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
    console.log('Route view clicked !');
  };

  const filterAndDeleteExpiredRoutes = () => {
    const currentDate = new Date();

    filteredRoutesState.forEach(route => {
      const routeDate = new Date(route.selectedDateTime);
      if (routeDate <= currentDate) {
        deleteRoute(route.id);
      }
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
              const isOutdated = routeDate < currentDate;

              if (isOutdated) {
                try {
                  await axios.delete(`${API_BASE_URL}/routes/${route.id}`);
                  return null; // изтрит, не го връщаме
                } catch (deleteError) {
                  console.error('Грешка при изтриване:', deleteError);
                  return route; // ако не може да го изтрие, все пак го връщаме
                }
              }

              return route; // запази активните
            }),
          );

          // филтрирай null стойностите (изтритите маршрути)
          const cleanedRoutes = filteredRoutes.filter(
            r =>
              r !== null &&
              !r.isDeleted &&
              r.userRouteId !== 'deleted' &&
              r.userRouteId !== 'completed',
          );

          setFilteredRoutesState(cleanedRoutes);
        } else {
          throw new Error('Failed to fetch routes');
        }
      } catch (error) {
        console.error('Error fetching/cleaning routes:', error);
      }
    };

    fetchAndCleanRoutes();
  }, [routes]);

  useEffect(() => {
    const filteredRoutesWithoutDeleted = routes.filter(
      route => route.userRouteId !== 'deleted',
    );
    const filteredRoutes = filteredRoutesWithoutDeleted
      .filter(
        route =>
          route.departureCity &&
          route.arrivalCity &&
          route.departureCity
            .toLowerCase()
            .includes(enteredDepartureCity.toLowerCase()) &&
          route.arrivalCity
            .toLowerCase()
            .includes(enteredArrivalCity.toLowerCase()),
      )
      .filter(route => {
        const routeDate = new Date(route.selectedDateTime);
        return routeDate >= new Date();
      });

    setFilteredRoutesState(filteredRoutes);
  }, [routes, enteredDepartureCity, enteredArrivalCity]);

  return (
    <SafeAreaView style={styles.mainContainer}>
      <Image
        source={require('../../../images/d7.png')}
        style={styles.backgroundImage}
      />
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

            {/* Search Inputs */}
            <View style={styles.searchContainer}>
              <TextInput
                style={styles.input}
                placeholder={t('Departure City')}
                placeholderTextColor="grey"
                value={enteredDepartureCity}
                onChangeText={text => setEnteredDepartureCity(text)}
              />
              <TextInput
                style={styles.input}
                placeholder={t('Arrival City')}
                placeholderTextColor="grey"
                value={enteredArrivalCity}
                onChangeText={text => setEnteredArrivalCity(text)}
              />
            </View>

            {/* Add additional filter options here */}

            {/* Buttons */}
            <Pressable style={styles.applyFiltersButton} onPress={applyFilters}>
              <Text style={styles.applyFiltersButtonText}>
                {t('Apply Filters')}
              </Text>
            </Pressable>
            <Pressable
              style={styles.sortByDateButton}
              onPress={() => setSortByDate(!sortByDate)}>
              <Text style={styles.sortByDateButtonText}>
                {sortByDate ? t('Sort by Oldest') : t('Sort by Newest')}
              </Text>
            </Pressable>
            <Pressable style={styles.clearFiltersButton} onPress={clearFilters}>
              <Text style={styles.clearFiltersButtonText}>
                {t('Clear Filters')}
              </Text>
            </Pressable>
            <Pressable
              style={styles.closeModalButton}
              onPress={toggleFilterModal}>
              <Text style={styles.closeModalButtonText}>{t('Close')}</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
      <ScrollView style={styles.scrollView}>
        <View style={styles.container}>
          {filteredRoutesState.map((route, index) => {
            const isOwnRoute = route.username === usernameRequest;

            return (
              <TouchableOpacity
                key={index}
                style={[
                  styles.routeContainer,
                  isOwnRoute && styles.ownRouteContainer, // Добави различен стил, ако е негов маршрут
                ]}
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
                <Text style={styles.routeText}>{route.routeTitle}</Text>
                <Text style={styles.routeText}>
                  {new Date(route.selectedDateTime).toLocaleString()}
                </Text>
                <Text style={styles.routeText}>
                  {route.departureCity}-{route.arrivalCity}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
  },
  container: {
    flex: 1,
    alignItems: 'flex-start',
  },
  routeContainer: {
    margin: 10,
    padding: 10,
    backgroundColor: '#f4511e',
    borderRadius: 10,
  },
  ownRouteContainer: {
    backgroundColor: '#f33233', // Светло синьо, може да смениш цвета
    borderWidth: 2,
    borderColor: '#1b1c1e',
  },
  searchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    padding: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
  },
  input: {
    flex: 1,
    height: 70, // Увеличена височина
    borderColor: 'gray',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    marginHorizontal: 5,
    backgroundColor: '#fff',
    textAlignVertical: 'center', // Подравняване на текста
    multiline: true, // Разрешава няколко реда
    alignItems: 'center',
    justifyContent: 'center',
  },
  routeText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
    position: 'absolute',
  },
  section: {
    paddingHorizontal: 24,
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 12,
  },
  routeContainer: {
    margin: 10,
    padding: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 15,
    elevation: 3,
  },
  routeText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1b1c1e',
  },
  filterButton: {
    backgroundColor: '#3498db',
    padding: 10,
    borderRadius: 10,
    margin: 10,
    alignSelf: 'center',
    width: '75%',
  },
  filterButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 17,
    alignSelf: 'center',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-start',
    marginTop: 60,
  },
  modalContent: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
    elevation: 5,
    width: '100%',
    alignSelf: 'center',
  },
  modalHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  clearFiltersButton: {
    backgroundColor: '#e74c3c',
    padding: 10,
    borderRadius: 5,
    marginVertical: 5,
  },
  clearFiltersButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  closeModalButton: {
    backgroundColor: '#3498db',
    padding: 10,
    borderRadius: 5,
    marginVertical: 5,
  },
  closeModalButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  sortByDateButton: {
    backgroundColor: '#2ecc71',
    padding: 10,
    borderRadius: 5,
    marginVertical: 5,
  },
  sortByDateButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default ViewRoutes;
