import React, {useState, useEffect, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TouchableWithoutFeedback,
  TextInput,
  Modal,
  Pressable,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import {useTranslation} from 'react-i18next';
import {useAuth} from '../../context/AuthContext';
import api from '../../api/api';
import LinearGradient from 'react-native-linear-gradient';
import {useTheme} from '../../theme/useTheme';

function ViewRoutes({navigation}) {
  const {t, i18n} = useTranslation();
  const theme = useTheme();
  const styles = createStyles(theme);

  const [enteredDepartureCity, setEnteredDepartureCity] = useState('');
  const [enteredArrivalCity, setEnteredArrivalCity] = useState('');
  const {user} = useAuth();
  const [sortByDate, setSortByDate] = useState(false);
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const usernameRequest = user?.username;
  const userFnameRequest = user?.fName;
  const userLnameRequest = user?.lName;
  const fullUserInfo = {usernameRequest, userFnameRequest, userLnameRequest};

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
      // филтрираме само маршрути, които НЕ са seeking-driver
      const offeredRoutes = response.data.filter(
        route => route.selectedVehicle !== 'seeking-driver',
      );
      setRoutes(offeredRoutes);
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
      const unsubscribe = navigation.addListener('focus', fetchRoutes);
      return unsubscribe;
    }
  }, [navigation]);

  const filteredRoutes = routes.filter(route => {
    const isFuture = new Date(route.selectedDateTime) >= new Date();

    const depMatch = route.departureCity
      ?.toLowerCase()
      .includes(enteredDepartureCity.toLowerCase());

    const arrMatch = route.arrivalCity
      ?.toLowerCase()
      .includes(enteredArrivalCity.toLowerCase());

    return (
      isFuture &&
      route.status !== 'completed' &&
      route.selectedVehicle !== 'seeking-driver' &&
      depMatch &&
      arrMatch
    );
  });

  const sortedRoutes = [...filteredRoutes].sort((a, b) => {
    return sortByDate
      ? new Date(a.selectedDateTime) - new Date(b.selectedDateTime)
      : new Date(b.selectedDateTime) - new Date(a.selectedDateTime);
  });

  if (loading) {
    return (
      <View
        style={[styles.loadingContainer, {backgroundColor: theme.background}]}>
        <ActivityIndicator size="large" color={theme.primaryButton} />
      </View>
    );
  }

  return (
    <LinearGradient colors={theme.gradient} style={styles.mainContainer}>
      <View style={styles.searchContainer}>
        <TextInput
          style={[
            styles.searchInput,
            {
              backgroundColor: theme.inputBackground,
              color: theme.textPrimary,
            },
          ]}
          placeholder={t('From')}
          placeholderTextColor={theme.textSecondary}
          value={enteredDepartureCity}
          onChangeText={setEnteredDepartureCity}
        />

        <TextInput
          style={[
            styles.searchInput,
            {
              backgroundColor: theme.inputBackground,
              color: theme.textPrimary,
            },
          ]}
          placeholder={t('To')}
          placeholderTextColor={theme.textSecondary}
          value={enteredArrivalCity}
          onChangeText={setEnteredArrivalCity}
        />
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              fetchRoutes();
            }}
            tintColor={theme.primaryButton}
          />
        }>
        <View style={styles.routesContainer}>
          {sortedRoutes.map((route, index) => {
            console.log('ROUTE:', route);
            const isOwnRoute = route.owner.id === user.id;
            return (
              <TouchableOpacity
                key={index}
                style={[
                  styles.routeCard,
                  {backgroundColor: theme.cardBackground},
                  isOwnRoute && {
                    borderColor: theme.primaryButton,
                    borderWidth: 2,
                  },
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
                    userId: route.owner.id,
                    username: route.owner.username,
                    userFname: route.owner.fName,
                    userLname: route.owner.lName,
                    userEmail: route.owner.email,
                    routeId: route.id,
                    user_id: route.userId,
                  })
                }>
                <Text style={[styles.routeTitle, {color: theme.textPrimary}]}>
                  {route.routeTitle}
                </Text>
                <Text style={[styles.routeDate, {color: theme.textSecondary}]}>
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
                <Text style={[styles.routeInfo, {color: theme.textPrimary}]}>
                  {route.departureCity} → {route.arrivalCity}
                </Text>
                <View style={styles.creatorContainer}>
                  {route.owner?.userImage ? (
                    <Image
                      source={{uri: route.owner.userImage}}
                      style={styles.userImage}
                    />
                  ) : (
                    <View style={styles.placeholderImage} />
                  )}

                  <Text
                    style={[styles.creatorText, {color: theme.textPrimary}]}>
                    {t('Created by')}: {route.owner.fName} {route.owner.lName}{' '}
                    (@
                    {route.owner.username})
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const createStyles = theme =>
  StyleSheet.create({
    mainContainer: {flex: 1},
    loadingContainer: {flex: 1, justifyContent: 'center', alignItems: 'center'},
    filterButton: {
      padding: 12,
      borderRadius: 12,
      margin: 12,
      alignSelf: 'center',
      width: '75%',
      alignItems: 'center',
    },
    filterButtonText: {color: '#fff', fontWeight: '700', fontSize: 18},
    routesContainer: {alignItems: 'center', paddingVertical: 10},
    routeCard: {
      width: '90%',
      borderRadius: 16,
      padding: 16,
      marginVertical: 8,
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.1)',
    },
    routeTitle: {fontSize: 20, fontWeight: '700'},
    routeDate: {fontSize: 16, marginTop: 4},
    routeInfo: {fontSize: 17, marginTop: 4},
    scrollView: {flex: 1},
    modalContainer: {flex: 1, justifyContent: 'center', paddingHorizontal: 20},
    modalContent: {padding: 25, borderRadius: 15},
    modalHeader: {
      fontSize: 20,
      fontWeight: '700',
      textAlign: 'center',
      marginBottom: 15,
    },
    input: {borderRadius: 10, padding: 12, marginVertical: 8, fontSize: 16},
    applyFiltersButton: {
      borderRadius: 10,
      padding: 12,
      marginVertical: 6,
      alignItems: 'center',
    },
    sortByDateButton: {
      borderRadius: 10,
      padding: 12,
      marginVertical: 6,
      alignItems: 'center',
    },
    clearFiltersButton: {
      borderRadius: 10,
      padding: 12,
      marginVertical: 6,
      alignItems: 'center',
    },
    closeModalButton: {
      borderRadius: 10,
      padding: 12,
      marginVertical: 6,
      alignItems: 'center',
    },
    buttonText: {color: '#fff', fontWeight: '600', fontSize: 16},
    searchContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      margin: 12,
    },

    searchInput: {
      flex: 1,
      padding: 10,
      borderRadius: 8,
      marginHorizontal: 5,
    },

    creatorContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 8,
    },

    creatorText: {
      marginLeft: 8,
      fontSize: 14,
    },

    userImage: {
      width: 36,
      height: 36,
      borderRadius: 18,
    },

    placeholderImage: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: '#666',
    },
  });

export default ViewRoutes;
