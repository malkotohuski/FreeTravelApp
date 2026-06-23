import React, {useEffect, useState, useCallback} from 'react';
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
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {useTranslation} from 'react-i18next';
import {useFocusEffect} from '@react-navigation/native';
import {useAuth} from '../../context/AuthContext';
import api from '../../api/api';
import {useTheme} from '../../theme/useTheme';

const ACCENT = '#f4511e';

export default function Seekers({navigation}) {
  const {t, i18n} = useTranslation();
  const {user} = useAuth();
  const theme = useTheme();
  const styles = createStyles(theme);

  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [searchDeparture, setSearchDeparture] = useState('');
  const [searchArrival, setSearchArrival] = useState('');
  const [debouncedSearchDeparture, setDebouncedSearchDeparture] = useState('');
  const [debouncedSearchArrival, setDebouncedSearchArrival] = useState('');
  const [messageInput, setMessageInput] = useState('');

  const getCityName = (route, key) =>
    route?.route?.[key]?.name ||
    route?.[key === 'departureCityRef' ? 'departureCity' : 'arrivalCity'] ||
    '';

  const fetchSeekers = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/seekers');
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
            } catch {
              return route;
            }
          }
          return route;
        }),
      );
      setRoutes(updatedRoutes.filter(route => route !== null));
    } catch (err) {
      setError(t('Error fetching route data.'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useFocusEffect(
    useCallback(() => {
      fetchSeekers();
    }, [fetchSeekers]),
  );

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setDebouncedSearchDeparture(searchDeparture);
    }, 250);
    return () => clearTimeout(timeoutId);
  }, [searchDeparture]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setDebouncedSearchArrival(searchArrival);
    }, 250);
    return () => clearTimeout(timeoutId);
  }, [searchArrival]);

  const filteredRoutes = routes.filter(route => {
    const isActive = !route.status || route.status === 'active';
    const routeDate = new Date(route.selectedDateTime);
    const isFuture = routeDate >= new Date();
    const depMatch = getCityName(route, 'departureCityRef')
      ?.toLowerCase()
      .includes(debouncedSearchDeparture.toLowerCase());
    const arrMatch = getCityName(route, 'arrivalCityRef')
      ?.toLowerCase()
      .includes(debouncedSearchArrival.toLowerCase());
    return isActive && isFuture && depMatch && arrMatch;
  });

  // Помощни функции за дата/час - същите като ViewRoutes
  const getDate = dateStr => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return `${String(d.getDate()).padStart(2, '0')}.${String(
      d.getMonth() + 1,
    ).padStart(2, '0')}`;
  };

  const getDayOfWeek = dateStr => {
    if (!dateStr) return '';
    return new Date(dateStr)
      .toLocaleDateString(i18n.language, {weekday: 'long'})
      .toUpperCase();
  };

  const getTime = dateStr => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleTimeString(i18n.language, {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  };

  const sendInvite = async () => {
    if (!selectedRoute) return;

    if (selectedRoute.username === user?.username) {
      Alert.alert(t('Error'), t('You cannot apply for your own route.'));
      return;
    }

    if (!messageInput.trim()) {
      Alert.alert(t('Error'), t('Please enter a comment before submitting.'));
      return;
    }

    Alert.alert(
      t('Confirm'),
      t('Would you like to submit a request for this route?'),
      [
        {text: t('Cancel'), style: 'cancel'},
        {
          text: 'OK',
          onPress: async () => {
            try {
              const tripRequestPayload = {
                seekerRequestId: selectedRoute.id,
                routeId: selectedRoute.routeId,
                username: user.username,
                userFname: user.fName,
                userLname: user.lName,
                userEmail: user.email,
                departureCityId: selectedRoute.departureCityId || null,
                departureCity: selectedRoute.departureCity,
                arrivalCityId: selectedRoute.arrivalCityId || null,
                arrivalCity: selectedRoute.arrivalCity,
                dataTime: selectedRoute.selectedDateTime,
                requestComment: messageInput,
              };

              await api.post('/api/send-request-to-user', tripRequestPayload);

              setSelectedRoute(null);
              setMessageInput('');

              Alert.alert(
                t('Success'),
                t('You have successfully applied for this route!'),
                [{text: 'OK'}],
              );
            } catch (err) {
              console.error('API error:', err);
              Alert.alert(
                t('Error'),
                err.response?.data?.error || 'Failed to send trip request.',
              );
            }
          },
        },
      ],
    );
  };

  const renderRoute = ({item: route}) => {
    const isOwnRoute = route.username === user?.username;
    const dateStr = route.selectedDateTime;

    return (
      <TouchableOpacity
        style={[
          styles.routeCard,
          {backgroundColor: theme.cardBackground},
          isOwnRoute && {borderColor: ACCENT, borderWidth: 2},
        ]}
        onPress={() => setSelectedRoute(route)}>
        {/* Header: Аватар + Инфо */}
        <View style={styles.cardHeader}>
          {route.userImage ? (
            <Image source={{uri: route.userImage}} style={styles.avatar} />
          ) : (
            <View
              style={[
                styles.avatarPlaceholder,
                {backgroundColor: ACCENT + '33'},
              ]}>
              <Text style={[styles.avatarInitial, {color: ACCENT}]}>
                {(route.userFname || route.username || '?')[0].toUpperCase()}
              </Text>
            </View>
          )}
          <View style={styles.headerInfo}>
            <Text style={[styles.ownerName, {color: theme.textPrimary}]}>
              {route.userFname} {route.userLname}
            </Text>
            <Text style={[styles.ownerUsername, {color: theme.textSecondary}]}>
              @{route.username}
            </Text>
          </View>
          {/* Passenger badge */}
          <View style={[styles.passengerBadge, {backgroundColor: ACCENT}]}>
            <Text style={styles.passengerBadgeText}>🧳</Text>
            <Text style={styles.passengerLabel}>{t('Passenger')}</Text>
          </View>
        </View>

        {/* Разделител */}
        <View
          style={[
            styles.divider,
            {
              backgroundColor: theme.cardBorder || 'rgba(255,255,255,0.1)',
            },
          ]}
        />

        {/* Маршрут с точки */}
        <View style={styles.routeRow}>
          <View style={styles.routeIcons}>
            <View style={[styles.dot, styles.dotGreen]} />
            <View
              style={[styles.routeLine, {backgroundColor: theme.textSecondary}]}
            />
            <View style={[styles.dot, {backgroundColor: ACCENT}]} />
          </View>
          <View style={styles.citiesColumn}>
            <Text style={[styles.cityName, {color: theme.textPrimary}]}>
              {route.departureCity}
            </Text>
            <Text style={[styles.cityName, {color: theme.textPrimary}]}>
              {route.arrivalCity}
            </Text>
          </View>
        </View>

        {/* Разделител */}
        <View
          style={[
            styles.divider,
            {
              backgroundColor: theme.cardBorder || 'rgba(255,255,255,0.1)',
            },
          ]}
        />

        {/* Дата / Ден / Час */}
        <View style={styles.dateRow}>
          <View style={styles.dateBlock}>
            <Text style={[styles.dateValue, {color: ACCENT}]}>
              {getDate(dateStr)}
            </Text>
            <Text style={[styles.dateSubLabel, {color: theme.textSecondary}]}>
              {getDayOfWeek(dateStr)}
            </Text>
          </View>

          <View
            style={[
              styles.dateSep,
              {
                backgroundColor: theme.cardBorder || 'rgba(255,255,255,0.1)',
              },
            ]}
          />

          <View style={styles.dateBlock}>
            <Text style={[styles.dateValue, {color: ACCENT}]}>
              {getTime(dateStr)}
            </Text>
            <Text style={[styles.dateSubLabel, {color: theme.textSecondary}]}>
              {t('DEPARTURE TIME')}
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
                  style={[styles.routeTitleText, {color: theme.textPrimary}]}
                  numberOfLines={2}>
                  {route.routeTitle}
                </Text>
                <Text
                  style={[styles.dateSubLabel, {color: theme.textSecondary}]}>
                  {t('Route Title').toUpperCase()}
                </Text>
              </View>
            </>
          ) : null}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <LinearGradient colors={theme.gradient} style={styles.gradientBackground}>
      <SafeAreaView style={styles.container}>
        {/* Search */}
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
            value={searchDeparture}
            onChangeText={setSearchDeparture}
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
            value={searchArrival}
            onChangeText={setSearchArrival}
          />
        </View>

        {loading ? (
          <ActivityIndicator
            size="large"
            color={theme.primaryButton}
            style={{marginTop: 40}}
          />
        ) : error ? (
          <Text
            style={{
              color: theme.errorText,
              textAlign: 'center',
              marginTop: 20,
            }}>
            {error}
          </Text>
        ) : filteredRoutes.length === 0 ? (
          <Text
            style={{
              color: theme.textSecondary,
              textAlign: 'center',
              marginTop: 20,
            }}>
            {t('No routes available.')}
          </Text>
        ) : (
          <FlatList
            data={filteredRoutes}
            renderItem={renderRoute}
            keyExtractor={route => route.id.toString()}
            contentContainerStyle={{paddingBottom: 80, paddingHorizontal: 12}}
          />
        )}

        {/* Modal */}
        <Modal visible={!!selectedRoute} transparent animationType="slide">
          <KeyboardAvoidingView
            style={{flex: 1}}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            <View style={styles.modalOverlay}>
              <View
                style={[
                  styles.modalContent,
                  {backgroundColor: theme.cardBackground},
                ]}>
                {selectedRoute && (
                  <>
                    {/* Modal Header */}
                    <View style={styles.modalHeader}>
                      {selectedRoute.userImage ? (
                        <Image
                          source={{uri: selectedRoute.userImage}}
                          style={styles.modalAvatar}
                        />
                      ) : (
                        <View
                          style={[
                            styles.modalAvatarPlaceholder,
                            {backgroundColor: ACCENT + '33'},
                          ]}>
                          <Text
                            style={[
                              styles.modalAvatarInitial,
                              {color: ACCENT},
                            ]}>
                            {(selectedRoute.userFname ||
                              selectedRoute.username ||
                              '?')[0].toUpperCase()}
                          </Text>
                        </View>
                      )}
                      <View style={{flex: 1, marginLeft: 12}}>
                        <Text
                          style={[
                            styles.modalOwnerName,
                            {color: theme.textPrimary},
                          ]}>
                          {selectedRoute.userFname} {selectedRoute.userLname}
                        </Text>
                        <Text
                          style={[
                            styles.modalOwnerUsername,
                            {color: theme.textSecondary},
                          ]}>
                          @{selectedRoute.username}
                        </Text>
                      </View>
                    </View>

                    <View
                      style={[
                        styles.divider,
                        {backgroundColor: theme.cardBorder || '#444'},
                      ]}
                    />

                    {/* Маршрут в модала */}
                    <View style={[styles.routeRow, {paddingVertical: 12}]}>
                      <View style={styles.routeIcons}>
                        <View style={[styles.dot, styles.dotGreen]} />
                        <View
                          style={[
                            styles.routeLine,
                            {backgroundColor: theme.textSecondary},
                          ]}
                        />
                        <View style={[styles.dot, {backgroundColor: ACCENT}]} />
                      </View>
                      <View style={styles.citiesColumn}>
                        <Text
                          style={[styles.cityName, {color: theme.textPrimary}]}>
                          {selectedRoute.departureCity}
                        </Text>
                        <Text
                          style={[styles.cityName, {color: theme.textPrimary}]}>
                          {selectedRoute.arrivalCity}
                        </Text>
                      </View>
                    </View>

                    <View
                      style={[
                        styles.divider,
                        {backgroundColor: theme.cardBorder || '#444'},
                      ]}
                    />

                    {/* Дата в модала */}
                    <View style={[styles.dateRow, {paddingVertical: 12}]}>
                      <View style={styles.dateBlock}>
                        <Text style={[styles.dateValue, {color: ACCENT}]}>
                          {getDate(selectedRoute.selectedDateTime)}
                        </Text>
                        <Text
                          style={[
                            styles.dateSubLabel,
                            {color: theme.textSecondary},
                          ]}>
                          {getDayOfWeek(selectedRoute.selectedDateTime)}
                        </Text>
                      </View>
                      <View
                        style={[
                          styles.dateSep,
                          {backgroundColor: theme.cardBorder || '#444'},
                        ]}
                      />
                      <View style={styles.dateBlock}>
                        <Text style={[styles.dateValue, {color: ACCENT}]}>
                          {getTime(selectedRoute.selectedDateTime)}
                        </Text>
                        <Text
                          style={[
                            styles.dateSubLabel,
                            {color: theme.textSecondary},
                          ]}>
                          {t('DEPARTURE TIME')}
                        </Text>
                      </View>
                    </View>

                    {/* ✅ НОВО: Route Title в модала */}
                    {selectedRoute.routeTitle ? (
                      <>
                        <View
                          style={[
                            styles.divider,
                            {backgroundColor: theme.cardBorder || '#444'},
                          ]}
                        />
                        <View style={styles.routeTitleRow}>
                          <Text
                            style={[
                              styles.dateSubLabel,
                              {color: theme.textSecondary},
                            ]}>
                            {t('Route Title').toUpperCase()}
                          </Text>
                          <Text
                            style={[
                              styles.routeTitleValue,
                              {color: theme.textPrimary},
                            ]}>
                            {selectedRoute.routeTitle}
                          </Text>
                        </View>
                      </>
                    ) : null}

                    <View
                      style={[
                        styles.divider,
                        {backgroundColor: theme.cardBorder || '#444'},
                      ]}
                    />

                    {/* Коментар input */}
                    <TextInput
                      style={[
                        styles.messageInput,
                        {
                          backgroundColor: theme.inputBackground,
                          color: theme.textPrimary,
                          borderColor: theme.cardBorder || '#444',
                        },
                      ]}
                      placeholder={t('writePersonalMessage')}
                      multiline
                      numberOfLines={4}
                      value={messageInput}
                      onChangeText={setMessageInput}
                      placeholderTextColor={theme.textSecondary}
                    />

                    {/* Бутони */}
                    <TouchableOpacity
                      style={[
                        styles.viewProfileButton,
                        {backgroundColor: theme.secondaryButton},
                      ]}
                      onPress={() => {
                        setSelectedRoute(null);
                        navigation.navigate('UserInfo', {
                          username: selectedRoute.username,
                          userFname: selectedRoute.userFname,
                          userLname: selectedRoute.userLname,
                          userEmail: selectedRoute.userEmail,
                          userId: selectedRoute.userId,
                          departureCityId: selectedRoute.departureCityId,
                          departureCity: selectedRoute.departureCity,
                          arrivalCityId: selectedRoute.arrivalCityId,
                          arrivalCity: selectedRoute.arrivalCity,
                          selectedVehicle: selectedRoute.selectedVehicle,
                          registrationNumber: selectedRoute.registrationNumber,
                          routeDetailsData: selectedRoute,
                          fromScreen: 'Seekers',
                        });
                      }}>
                      <Text style={styles.buttonText}>{t('View Profile')}</Text>
                    </TouchableOpacity>

                    <View style={styles.modalButtons}>
                      {selectedRoute.username !== user?.username ? (
                        <TouchableOpacity
                          style={[
                            styles.mainButton,
                            {backgroundColor: theme.primaryButton},
                          ]}
                          onPress={sendInvite}>
                          <Text style={styles.buttonText}>
                            {t('Invitation')}
                          </Text>
                        </TouchableOpacity>
                      ) : (
                        <Text
                          style={[
                            styles.infoText,
                            {color: theme.textSecondary},
                          ]}>
                          {t(
                            'You cannot send an invitation to your own route.',
                          )}
                        </Text>
                      )}

                      <TouchableOpacity
                        style={[
                          styles.secondaryButton,
                          {backgroundColor: theme.secondaryButton},
                        ]}
                        onPress={() => setSelectedRoute(null)}>
                        <Text style={styles.buttonText}>{t('Back')}</Text>
                      </TouchableOpacity>
                    </View>
                  </>
                )}
              </View>
            </View>
          </KeyboardAvoidingView>
        </Modal>

        <TouchableOpacity
          style={[styles.backButton, {backgroundColor: theme.primaryButton}]}
          onPress={() => navigation.navigate('Home')}>
          <Text style={styles.backButtonText}>{t('Back')}</Text>
        </TouchableOpacity>
      </SafeAreaView>
    </LinearGradient>
  );
}

const createStyles = theme =>
  StyleSheet.create({
    gradientBackground: {flex: 1},
    container: {flex: 1, paddingTop: 12},

    searchContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 12,
      paddingHorizontal: 12,
      gap: 8,
    },
    searchInput: {
      flex: 1,
      padding: 10,
      borderRadius: 10,
      fontSize: 15,
    },

    routeTitleRow: {
      paddingHorizontal: 16,
      paddingVertical: 12,
      alignItems: 'center',
    },
    routeTitleValue: {
      fontSize: 16,
      fontWeight: '700',
      marginTop: 4,
      textAlign: 'center',
    },

    // ── Карточка ──
    routeCard: {
      borderRadius: 16,
      marginVertical: 8,
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.08)',
      overflow: 'hidden',
    },

    cardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 14,
      gap: 10,
    },
    avatar: {width: 46, height: 46, borderRadius: 23},
    avatarPlaceholder: {
      width: 46,
      height: 46,
      borderRadius: 23,
      justifyContent: 'center',
      alignItems: 'center',
    },
    avatarInitial: {fontSize: 20, fontWeight: '700'},
    headerInfo: {flex: 1},
    ownerName: {fontSize: 16, fontWeight: '700'},
    ownerUsername: {fontSize: 13, marginTop: 1},

    passengerBadge: {
      borderRadius: 10,
      paddingHorizontal: 10,
      paddingVertical: 6,
      alignItems: 'center',
      minWidth: 52,
    },
    passengerBadgeText: {fontSize: 16},
    passengerLabel: {
      color: 'rgba(255,255,255,0.85)',
      fontSize: 9,
      fontWeight: '600',
      marginTop: 1,
    },

    divider: {height: 1},

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
    dot: {width: 12, height: 12, borderRadius: 6},
    dotGreen: {backgroundColor: '#2ecc71'},
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
    cityName: {fontSize: 17, fontWeight: '700'},

    dateRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 14,
      paddingVertical: 12,
    },
    dateBlock: {flex: 1, alignItems: 'center'},
    dateValue: {fontSize: 18, fontWeight: '800'},
    routeTitleText: {fontSize: 15, fontWeight: '700'},
    dateSubLabel: {
      fontSize: 9,
      fontWeight: '600',
      marginTop: 3,
      letterSpacing: 0.5,
    },
    dateSep: {width: 1, height: 32, marginHorizontal: 4},

    // ── Modal ──
    modalOverlay: {
      flex: 1,
      justifyContent: 'center',
      padding: 20,
      backgroundColor: 'rgba(0,0,0,0.85)',
    },
    modalContent: {
      borderRadius: 16,
      padding: 16,
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.1)',
    },
    modalHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingBottom: 12,
    },
    modalAvatar: {width: 48, height: 48, borderRadius: 24},
    modalAvatarPlaceholder: {
      width: 48,
      height: 48,
      borderRadius: 24,
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalAvatarInitial: {fontSize: 20, fontWeight: '700'},
    modalOwnerName: {fontSize: 16, fontWeight: '700'},
    modalOwnerUsername: {fontSize: 13, marginTop: 2},

    messageInput: {
      padding: 12,
      borderRadius: 10,
      marginVertical: 12,
      borderWidth: 1,
      minHeight: 80,
      textAlignVertical: 'top',
    },

    viewProfileButton: {
      padding: 12,
      borderRadius: 10,
      alignItems: 'center',
      marginBottom: 10,
    },
    modalButtons: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: 10,
    },
    mainButton: {
      padding: 12,
      borderRadius: 10,
      flex: 1,
      alignItems: 'center',
    },
    secondaryButton: {
      padding: 12,
      borderRadius: 10,
      flex: 1,
      alignItems: 'center',
    },
    buttonText: {color: '#fff', fontWeight: '700', fontSize: 15},
    infoText: {flex: 1, textAlign: 'center', fontSize: 13},

    backButton: {
      margin: 12,
      padding: 14,
      borderRadius: 10,
      alignItems: 'center',
    },
    backButtonText: {color: '#fff', fontWeight: '700', fontSize: 16},
  });
