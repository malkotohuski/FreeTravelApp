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
import {useTheme} from '../../theme/useTheme';

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
  const [messageInput, setMessageInput] = useState('');

  const fetchSeekers = async () => {
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
  };

  useFocusEffect(
    useCallback(() => {
      fetchSeekers();
    }, []),
  );

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
              // 1 Реалната заявка за маршрута
              const tripRequestPayload = {
                seekerRequestId: selectedRoute.id,
                routeId: selectedRoute.routeId,
                username: user.username,
                userFname: user.fName,
                userLname: user.lName,
                userEmail: user.email,
                departureCity: selectedRoute.departureCity,
                arrivalCity: selectedRoute.arrivalCity,
                dataTime: selectedRoute.selectedDateTime,
                requestComment: messageInput,
              };

              await api.post('/api/send-request-to-user', tripRequestPayload);

              // 2 UI update
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
        style={[styles.routeCard, {backgroundColor: theme.cardBackground}]}
        onPress={() => setSelectedRoute(route)}>
        <Text style={[styles.routeTitle, {color: theme.textPrimary}]}>
          {route.routeTitle}
        </Text>
        <Text style={[styles.dateText, {color: theme.textSecondary}]}>
          {formattedDate}
        </Text>
        <Text style={[styles.routeInfo, {color: theme.textPrimary}]}>
          {route.departureCity} ➝ {route.arrivalCity}
        </Text>
        <View style={styles.creatorContainer}>
          {route.userImage ? (
            <Image source={{uri: route.userImage}} style={styles.userImage} />
          ) : (
            <View style={styles.placeholderImage} />
          )}
          <Text style={[styles.creatorText, {color: theme.textPrimary}]}>
            {t('Created by')}: {route.userFname} {route.userLname} (@
            {route.username})
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <LinearGradient colors={theme.gradient} style={styles.gradientBackground}>
      <SafeAreaView style={styles.container}>
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
            contentContainerStyle={{paddingBottom: 50}}
          />
        )}

        {/* Modal */}
        <Modal visible={!!selectedRoute} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              {selectedRoute && (
                <>
                  <TextInput
                    style={[
                      styles.messageInput,
                      {
                        backgroundColor: theme.inputBackground,
                        color: theme.textPrimary,
                      },
                    ]}
                    placeholder={t('writePersonalMessage')}
                    multiline
                    numberOfLines={4}
                    value={messageInput}
                    onChangeText={setMessageInput}
                    placeholderTextColor={theme.textSecondary}
                  />
                  <Text
                    style={[
                      styles.modalRouteTitle,
                      {color: theme.textPrimary},
                    ]}>
                    {selectedRoute.routeTitle}
                  </Text>
                  <Text
                    style={[styles.modalDate, {color: theme.textSecondary}]}>
                    {new Date(
                      selectedRoute.selectedDateTime,
                    ).toLocaleDateString('bg-BG', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </Text>
                  <Text
                    style={[styles.modalRouteText, {color: theme.textPrimary}]}>
                    {selectedRoute.departureCity} ➝ {selectedRoute.arrivalCity}
                  </Text>
                  <TouchableOpacity
                    style={[
                      styles.viewProfileButton,
                      {
                        backgroundColor: theme.secondaryButton,
                        marginBottom: 10,
                      },
                    ]}
                    onPress={() => {
                      setSelectedRoute(null); // затваряме modal-а

                      navigation.navigate('UserInfo', {
                        username: selectedRoute.username,
                        userFname: selectedRoute.userFname,
                        userLname: selectedRoute.userLname,
                        userEmail: selectedRoute.userEmail,
                        userId: selectedRoute.userId,

                        // ако имаш тези данни ги подай, ако не – махни ги
                        departureCity: selectedRoute.departureCity,
                        arrivalCity: selectedRoute.arrivalCity,
                        selectedVehicle: selectedRoute.selectedVehicle,
                        registrationNumber: selectedRoute.registrationNumber,
                        routeDetailsData: selectedRoute,
                      });
                    }}>
                    <View style={styles.creatorContainer}>
                      <Text style={styles.buttonText}>{t('View Profile')}</Text>
                    </View>
                  </TouchableOpacity>
                  <View style={styles.modalButtons}>
                    {selectedRoute.username !== user?.username ? (
                      <TouchableOpacity
                        style={[
                          styles.mainButton,
                          {backgroundColor: theme.primaryButton},
                        ]}
                        onPress={sendInvite}>
                        <Text style={styles.buttonText}>{t('Invitation')}</Text>
                      </TouchableOpacity>
                    ) : (
                      <Text
                        style={[styles.infoText, {color: theme.textSecondary}]}>
                        {t('You cannot send an invitation to your own route.')}
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
    container: {flex: 1, padding: 16},
    searchContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 16,
    },
    searchInput: {flex: 1, padding: 10, borderRadius: 8, marginHorizontal: 5},
    routeCard: {padding: 12, marginBottom: 12, borderRadius: 10},
    routeTitle: {fontSize: 16, fontWeight: 'bold', marginBottom: 4},
    dateText: {fontSize: 14, marginBottom: 4},
    routeInfo: {fontSize: 14, marginBottom: 6},
    creatorContainer: {flexDirection: 'row', alignItems: 'center'},
    creatorText: {marginLeft: 8},
    userImage: {width: 36, height: 36, borderRadius: 18},
    placeholderImage: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: '#666',
    },
    modalOverlay: {
      flex: 1,
      justifyContent: 'center',
      padding: 20,
      backgroundColor: 'rgba(0,0,0,0.85)', // по-тъмен фон
    },
    modalContent: {
      borderRadius: 12,
      padding: 16,
      backgroundColor: '#888888', // тъмен фон за модалната кутия
      shadowColor: '#000',
      shadowOffset: {width: 0, height: 2},
      shadowOpacity: 0.5,
      shadowRadius: 4,
      elevation: 8,
    },
    modalRouteTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      marginBottom: 4,
      color: '#fff',
    },
    modalDate: {marginBottom: 4, color: '#ccc'},
    modalRouteText: {marginBottom: 12, color: '#fff'},
    modalButtons: {flexDirection: 'row', justifyContent: 'space-between'},
    messageInput: {
      padding: 10,
      borderRadius: 8,
      marginBottom: 12,
      backgroundColor: '#2c2c2e',
      color: '#fff',
    },
    buttonText: {color: '#fff', fontWeight: 'bold'},
    mainButton: {
      padding: 10,
      borderRadius: 8,
      flex: 1,
      marginRight: 8,
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: {width: 0, height: 2},
      shadowOpacity: 0.4,
      shadowRadius: 3,
      elevation: 5,
    },
    viewProfileButton: {
      padding: 10,
      borderRadius: 8,
      alignItems: 'center',
    },
    secondaryButton: {
      padding: 10,
      borderRadius: 8,
      flex: 1,
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: {width: 0, height: 2},
      shadowOpacity: 0.4,
      shadowRadius: 3,
      elevation: 5,
    },
    infoText: {flex: 1, textAlign: 'center'},
    backButton: {
      alignItems: 'center',
      bottom: 20,
      padding: 12,
      borderRadius: 8,
    },
    backButtonText: {color: '#fff', fontWeight: 'bold'},
  });
