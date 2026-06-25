import React, {useState, useEffect, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Image,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import {useTranslation} from 'react-i18next';
import {useAuth} from '../../context/AuthContext';
import api from '../../api/api';
import LinearGradient from 'react-native-linear-gradient';
import {useTheme} from '../../theme/useTheme';
import {formatSeatsLabel} from '../../utils/seatPolicy';

function ViewRoutes({navigation}) {
  const {t, i18n} = useTranslation();
  const theme = useTheme();
  const styles = createStyles(theme);

  const [enteredDepartureCity, setEnteredDepartureCity] = useState('');
  const [enteredArrivalCity, setEnteredArrivalCity] = useState('');
  const [debouncedDepartureCity, setDebouncedDepartureCity] = useState('');
  const [debouncedArrivalCity, setDebouncedArrivalCity] = useState('');
  const {user} = useAuth();
  const [sortByDate, setSortByDate] = useState(false);
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const usernameRequest = user?.username;
  const userFnameRequest = user?.fName;
  const userLnameRequest = user?.lName;
  const fullUserInfo = {usernameRequest, userFnameRequest, userLnameRequest};

  const getCityName = (route, key) =>
    route?.[key]?.name ||
    route?.[key === 'departureCityRef' ? 'departureCity' : 'arrivalCity'] ||
    '';

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
    const timeoutId = setTimeout(() => {
      setDebouncedDepartureCity(enteredDepartureCity);
    }, 250);
    return () => clearTimeout(timeoutId);
  }, [enteredDepartureCity]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setDebouncedArrivalCity(enteredArrivalCity);
    }, 250);
    return () => clearTimeout(timeoutId);
  }, [enteredArrivalCity]);

  useEffect(() => {
    if (navigation?.addListener) {
      const unsubscribe = navigation.addListener('focus', fetchRoutes);
      return unsubscribe;
    }
  }, [navigation]);

  const filteredRoutes = routes.filter(route => {
    const departureCityName = getCityName(route, 'departureCityRef');
    const arrivalCityName = getCityName(route, 'arrivalCityRef');
    const isFuture = new Date(route.selectedDateTime) >= new Date();

    const depMatch = departureCityName
      .toLowerCase()
      .includes(debouncedDepartureCity.toLowerCase());

    const arrMatch = arrivalCityName
      .toLowerCase()
      .includes(debouncedArrivalCity.toLowerCase());

    return (
      isFuture &&
      route.status !== 'completed' &&
      route.selectedVehicle !== 'seeking-driver' &&
      Number(route.availableSeats ?? route.totalSeats ?? 1) > 0 &&
      depMatch &&
      arrMatch
    );
  });

  const sortedRoutes = [...filteredRoutes].sort((a, b) => {
    return sortByDate
      ? new Date(a.selectedDateTime) - new Date(b.selectedDateTime)
      : new Date(b.selectedDateTime) - new Date(a.selectedDateTime);
  });

  // Форматира деня от седмицата
  const getDayOfWeek = dateStr => {
    return new Date(dateStr).toLocaleDateString(i18n.language, {
      weekday: 'long',
    });
  };

  // Форматира датата
  const getDate = dateStr => {
    const d = new Date(dateStr);
    return `${String(d.getDate()).padStart(2, '0')}.${String(
      d.getMonth() + 1,
    ).padStart(2, '0')}`;
  };

  // Форматира часа
  const getTime = dateStr => {
    return new Date(dateStr).toLocaleTimeString(i18n.language, {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  };

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
      {/* Search Bar */}
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
          {sortedRoutes.length === 0 ? (
            <Text style={[styles.emptyText, {color: theme.textSecondary}]}>
              {t('No routes found')}
            </Text>
          ) : (
            sortedRoutes.map((route, index) => {
              const isOwnRoute = route.owner.id === user.id;
              const departureCityName = getCityName(route, 'departureCityRef');
              const arrivalCityName = getCityName(route, 'arrivalCityRef');
              const dateStr = route.selectedDateTime;

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
                      totalSeats: route.totalSeats,
                      availableSeats: route.availableSeats,
                      registrationNumber: route.registrationNumber,
                      selectedDateTime: route.selectedDateTime,
                      departureCityId: route.departureCityId,
                      departureCity: departureCityName,
                      departureStreet: route.departureStreet,
                      departureNumber: route.departureNumber,
                      arrivalCityId: route.arrivalCityId,
                      arrivalCity: arrivalCityName,
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
                      routeDetailsData: route,
                    })
                  }>
                  {/* Header: Avatar + Име + Заглавие */}
                  <View style={styles.cardHeader}>
                    {route.owner?.userImage ? (
                      <Image
                        source={{uri: route.owner.userImage}}
                        style={styles.avatar}
                      />
                    ) : (
                      <View
                        style={[
                          styles.avatarPlaceholder,
                          {backgroundColor: theme.primaryButton + '33'},
                        ]}>
                        <Text
                          style={[
                            styles.avatarInitial,
                            {color: theme.primaryButton},
                          ]}>
                          {(route.owner.fName ||
                            route.owner.username ||
                            '?')[0].toUpperCase()}
                        </Text>
                      </View>
                    )}
                    <View style={styles.headerInfo}>
                      <Text
                        style={[styles.ownerName, {color: theme.textPrimary}]}>
                        {route.owner.fName} {route.owner.lName}
                      </Text>
                      <Text
                        style={[
                          styles.ownerUsername,
                          {color: theme.textSecondary},
                        ]}>
                        @{route.owner.username}
                      </Text>
                    </View>
                    {/* Свободни места badge */}
                    <View
                      style={[
                        styles.seatsBadge,
                        {backgroundColor: theme.primaryButton},
                      ]}>
                      <Text style={styles.seatsNumber}>
                        {formatSeatsLabel(
                          route.availableSeats,
                          route.totalSeats,
                        )}
                      </Text>
                      <Text style={styles.seatsLabel}>{t('Free seats')}</Text>
                    </View>
                  </View>

                  {/* Разделител */}
                  <View
                    style={[
                      styles.divider,
                      {
                        backgroundColor:
                          theme.cardBorder || 'rgba(255,255,255,0.1)',
                      },
                    ]}
                  />

                  {/* Маршрут: Тръгване → Пристигане */}
                  <View style={styles.routeRow}>
                    {/* Иконки за точки */}
                    <View style={styles.routeIcons}>
                      <View style={[styles.dot, styles.dotGreen]} />
                      <View
                        style={[
                          styles.routeLine,
                          {backgroundColor: theme.textSecondary},
                        ]}
                      />
                      <View
                        style={[
                          styles.dot,
                          styles.dotOrange,
                          {backgroundColor: theme.primaryButton},
                        ]}
                      />
                    </View>

                    {/* Градове */}
                    <View style={styles.citiesColumn}>
                      <Text
                        style={[styles.cityName, {color: theme.textPrimary}]}>
                        {departureCityName}
                      </Text>
                      <Text
                        style={[styles.cityName, {color: theme.textPrimary}]}>
                        {arrivalCityName}
                      </Text>
                    </View>
                  </View>

                  {/* Разделител */}
                  <View
                    style={[
                      styles.divider,
                      {
                        backgroundColor:
                          theme.cardBorder || 'rgba(255,255,255,0.1)',
                      },
                    ]}
                  />

                  {/* Дата / Ден / Час */}
                  <View style={styles.dateRow}>
                    <View style={styles.dateBlock}>
                      <Text
                        style={[
                          styles.dateValue,
                          {color: theme.primaryButton},
                        ]}>
                        {getDate(dateStr)}
                      </Text>
                      <Text
                        style={[
                          styles.dateSubLabel,
                          {color: theme.textSecondary},
                        ]}>
                        {getDayOfWeek(dateStr).toUpperCase()}
                      </Text>
                    </View>

                    <View
                      style={[
                        styles.dateSep,
                        {
                          backgroundColor:
                            theme.cardBorder || 'rgba(255,255,255,0.1)',
                        },
                      ]}
                    />

                    <View style={styles.dateBlock}>
                      <Text
                        style={[
                          styles.dateValue,
                          {color: theme.primaryButton},
                        ]}>
                        {getTime(dateStr)}
                      </Text>
                      <Text
                        style={[
                          styles.dateSubLabel,
                          {color: theme.textSecondary},
                        ]}>
                        {t('DEPARTURETIME')}
                      </Text>
                    </View>

                    {route.routeTitle ? (
                      <>
                        <View
                          style={[
                            styles.dateSep,
                            {
                              backgroundColor:
                                theme.cardBorder || 'rgba(255,255,255,0.1)',
                            },
                          ]}
                        />
                        <View style={[styles.dateBlock, {flex: 1.5}]}>
                          <Text
                            style={[
                              styles.routeTitleText,
                              {color: theme.textPrimary},
                            ]}
                            numberOfLines={1}>
                            {route.routeTitle}
                          </Text>
                          <Text
                            style={[
                              styles.dateSubLabel,
                              {color: theme.textSecondary},
                            ]}>
                            {t('Route Title').toUpperCase()}
                          </Text>
                        </View>
                      </>
                    ) : null}
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const createStyles = theme =>
  StyleSheet.create({
    mainContainer: {flex: 1},
    loadingContainer: {flex: 1, justifyContent: 'center', alignItems: 'center'},
    scrollView: {flex: 1},
    routesContainer: {
      alignItems: 'center',
      paddingVertical: 10,
      paddingBottom: 20,
    },
    emptyText: {marginTop: 40, fontSize: 16, textAlign: 'center'},

    searchContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      margin: 12,
      gap: 8,
    },
    searchInput: {
      flex: 1,
      padding: 10,
      borderRadius: 10,
      fontSize: 15,
    },

    // Карточка
    routeCard: {
      width: '92%',
      borderRadius: 16,
      marginVertical: 8,
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.08)',
      overflow: 'hidden',
    },

    // Header
    cardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 14,
      gap: 10,
    },
    avatar: {
      width: 46,
      height: 46,
      borderRadius: 23,
    },
    avatarPlaceholder: {
      width: 46,
      height: 46,
      borderRadius: 23,
      justifyContent: 'center',
      alignItems: 'center',
    },
    avatarInitial: {
      fontSize: 20,
      fontWeight: '700',
    },
    headerInfo: {
      flex: 1,
    },
    ownerName: {
      fontSize: 16,
      fontWeight: '700',
    },
    ownerUsername: {
      fontSize: 13,
      marginTop: 1,
    },
    seatsBadge: {
      borderRadius: 10,
      paddingHorizontal: 12,
      paddingVertical: 6,
      alignItems: 'center',
      minWidth: 52,
    },
    seatsNumber: {
      color: '#fff',
      fontSize: 17,
      fontWeight: '800',
    },
    seatsLabel: {
      color: 'rgba(255,255,255,0.8)',
      fontSize: 9,
      fontWeight: '600',
      marginTop: 1,
    },

    divider: {
      height: 1,
      marginHorizontal: 0,
    },

    // Маршрут
    routeRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 14,
      gap: 12,
    },
    routeIcons: {
      alignItems: 'center',
      height: 52,
      justifyContent: 'space-between',
    },
    dot: {
      width: 12,
      height: 12,
      borderRadius: 6,
    },
    dotGreen: {
      backgroundColor: '#2ecc71',
    },
    dotOrange: {
      backgroundColor: '#f4511e',
    },
    routeLine: {
      width: 2,
      flex: 1,
      marginVertical: 3,
      opacity: 0.4,
    },
    citiesColumn: {
      flex: 1,
      justifyContent: 'space-between',
      height: 52,
    },
    cityName: {
      fontSize: 17,
      fontWeight: '700',
    },

    // Дата ред
    dateRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 14,
      paddingVertical: 12,
    },
    dateBlock: {
      flex: 1,
      alignItems: 'center',
    },
    dateValue: {
      fontSize: 18,
      fontWeight: '800',
    },
    routeTitleText: {
      fontSize: 15,
      fontWeight: '700',
    },
    dateSubLabel: {
      fontSize: 9,
      fontWeight: '600',
      marginTop: 3,
      letterSpacing: 0.5,
    },
    dateSep: {
      width: 1,
      height: 32,
      marginHorizontal: 4,
    },
  });

export default ViewRoutes;
