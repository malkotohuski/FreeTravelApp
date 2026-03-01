import React, {useState, useEffect, useContext} from 'react';
import {useTranslation} from 'react-i18next';
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
} from 'react-native';
import Icons from 'react-native-vector-icons/MaterialCommunityIcons';
import {useAuth} from '../../context/AuthContext';
import {useRouteContext} from '../../context/RouteContext';
import api from '../../api/api';
import {DarkModeContext} from '../../navigation/DarkModeContext';

const RouteHistory = ({navigation}) => {
  const {user} = useAuth();
  const {darkMode} = useContext(DarkModeContext);
  const {requests} = useRouteContext();
  const {t} = useTranslation();
  const [originalRoutesState, setOriginalRoutesState] = useState([]);
  const [filteredRoutesState, setFilteredRoutesState] = useState([]);
  const [completedRoutes, setCompletedRoutes] = useState([]);
  const [searchDepartureText, setSearchDepartureText] = useState('');
  const [searchArrivalText, setSearchArrivalText] = useState('');

  const getHeaderStyles = () => ({
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    padding: 16,
    backgroundColor: darkMode ? '#333232FF' : '#f4511e',
  });

  useEffect(() => {
    const fetchRoutes = async () => {
      try {
        const response = await api.get('/api/routes/my');

        const routes = response.data.filter(route => {
          return route.status === 'active';
        });

        setOriginalRoutesState(routes);
        setFilteredRoutesState(routes);
      } catch (error) {
        console.error('Error fetching routes:', error);
      }
    };

    if (user?.id) {
      fetchRoutes();
    }
  }, [user]);

  useEffect(() => {
    // Филтрирай маршрути на база на текста за търсене и сортирай по дата
    const filteredRoutes = originalRoutesState
      .filter(route => {
        const matchesDeparture = route.departureCity
          ?.toLowerCase()
          .includes(searchDepartureText.toLowerCase());
        const matchesArrival = route.arrivalCity
          ?.toLowerCase()
          .includes(searchArrivalText.toLowerCase());
        return matchesDeparture && matchesArrival;
      })
      .sort(
        (a, b) => new Date(b.selectedDateTime) - new Date(a.selectedDateTime),
      ); // Сортирай по най-нова дата

    setFilteredRoutesState(filteredRoutes);
  }, [searchDepartureText, searchArrivalText, originalRoutesState]);

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
              console.log('Deleted route:', routeId);
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

  const handleMarkAsCompleted = async routeId => {
    try {
      await api.patch(`/api/routes/${routeId}/complete`);

      const updatedRoutes = originalRoutesState.filter(
        route => route.id !== routeId,
      );

      setOriginalRoutesState(updatedRoutes);
      setFilteredRoutesState(updatedRoutes);
    } catch (error) {
      console.error(error);
    }
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
        <ScrollView style={styles.scrollView}>
          <View style={styles.container}>
            {filteredRoutesState.map((route, index) => (
              <TouchableOpacity key={index} style={styles.routeContainer}>
                <Text style={styles.routeText}>
                  {new Date(route.selectedDateTime).toLocaleString()}{' '}
                  {/* Displaying date without time */}
                </Text>
                <Text style={styles.routeText}>
                  {route.departureCity}-{route.arrivalCity}
                </Text>
                <View style={styles.buttonContainer}>
                  <TouchableOpacity
                    style={styles.button_delete}
                    onPress={() => handleDeleteRoute(route.id)}>
                    <Text style={styles.buttonText}>{t('Delete Route')}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.button_completed}
                    onPress={() => handleMarkAsCompleted(route.id)}>
                    <Text style={styles.buttonText}>
                      {t('Mark as Completed')}
                    </Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
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
  container: {
    flex: 1,
    alignItems: 'center',
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
});

export default RouteHistory;
