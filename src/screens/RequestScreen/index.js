import React, {useEffect, useState, useCallback, useRef} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
} from 'react-native';
import {useFocusEffect} from '@react-navigation/native';
import {useTranslation} from 'react-i18next';
import {useNavigation, useRoute} from '@react-navigation/native';
import {useAuth} from '../../context/AuthContext';
import LinearGradient from 'react-native-linear-gradient';
import Toast from 'react-native-toast-message';
import api from '../../api/api';
import {formatSeatsLabel} from '../../utils/seatPolicy';

function RouteDetails({route}) {
  const {t, i18n} = useTranslation();
  const navigation = useNavigation();
  const scrollViewRef = useRef(null);
  const {user} = useAuth();
  const params = route.params || {};
  const details = params.routeDetailsData || {};
  const owner = details.owner || {};
  const routeId = params.routeId ?? details.routeId ?? details.id;
  const username = params.username ?? owner.username ?? details.username;
  const userFname = params.userFname ?? owner.fName ?? details.userFname;
  const userLname = params.userLname ?? owner.lName ?? details.userLname;
  const userEmail = params.userEmail ?? owner.email ?? details.userEmail;
  const userImage = owner.userImage ?? details.userImage ?? null;
  const [loading, setLoading] = useState(false);

  const requesterUsername = user?.username;
  const departureCityId =
    params.departureCityId || details.departureCityId || null;
  const arrivalCityId = params.arrivalCityId || details.arrivalCityId || null;

  const departureCity =
    params.departureCity ||
    details.departureCityRef?.name ||
    details.departureCity;
  const arrivalCity =
    params.arrivalCity || details.arrivalCityRef?.name || details.arrivalCity;
  const totalSeats = params.totalSeats ?? details.totalSeats ?? 1;
  const availableSeats =
    params.availableSeats ?? details.availableSeats ?? totalSeats;
  const hasFreeSeats = Number(availableSeats) > 0;
  const maxRequestedSeats = Math.max(1, Number(availableSeats) || 1);
  const selectedDateTime = params.selectedDateTime || details.selectedDateTime;
  const routeTitle = params.routeTitle || details.routeTitle;

  const [tripRequestText, setTripRequestText] = useState('');
  const [requestedSeats, setRequestedSeats] = useState(1);
  const [hasRequested, setHasRequested] = useState(false);
  const isOwnRoute = requesterUsername === username;

  useFocusEffect(
    useCallback(() => {
      setTripRequestText('');
      setRequestedSeats(1);
    }, []),
  );

  const updateRequestedSeats = nextSeats => {
    const safeSeats = Math.min(
      Math.max(Number(nextSeats) || 1, 1),
      maxRequestedSeats,
    );
    setRequestedSeats(safeSeats);
  };

  useEffect(() => {
    const checkIfAlreadyRequested = async () => {
      try {
        if (!routeId || !user?.id) return;
        const response = await api.get('/api/requests');
        const alreadyRequested = response.data.some(
          req =>
            req.routeId === routeId &&
            req.userID === user.id &&
            req.status !== 'rejected',
        );
        setHasRequested(alreadyRequested);
      } catch (err) {
        console.error('Failed to check existing requests:', err);
      }
    };
    checkIfAlreadyRequested();
  }, [routeId, user?.id]);

  const handlerTripRequest = async () => {
    if (loading) return;
    if (isOwnRoute) {
      Alert.alert(
        t('Error'),
        t('You cannot apply for this route because you created it.'),
      );
      return;
    }
    if (hasRequested) {
      Alert.alert(
        t('Error'),
        t('You have already submitted a request for this route.'),
      );
      return;
    }
    if (!routeId) {
      Alert.alert(
        t('Error'),
        t('Route ID is missing. Please reopen the route.'),
      );
      return;
    }
    if (!hasFreeSeats) {
      Alert.alert(t('Error'), t('No free seats left for this route.'));
      return;
    }
    if (requestedSeats > Number(availableSeats)) {
      Alert.alert(t('Error'), t('Not enough free seats left for this route.'));
      return;
    }
    if (!tripRequestText.trim()) {
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
              setLoading(true);
              const payload = {
                routeId,
                username: user.username,
                userFname: user.fName,
                userLname: user.lName,
                userEmail: user.email,
                userRouteId: params.userId || owner.id || details.userId || 0,
                departureCityId,
                departureCity: departureCity || '',
                arrivalCityId,
                arrivalCity: arrivalCity || '',
                dataTime: params.selectedDateTime || details.selectedDateTime,
                requestComment: tripRequestText,
                requestedSeats,
              };
              await api.post('/api/send-request-to-user', payload);
              setHasRequested(true);
              Toast.show({
                type: 'success',
                text1: 'Success',
                text2: 'Request sent successfully!',
              });
              navigation.navigate('Home');
            } catch (err) {
              console.error('API error:', err);
              Toast.show({
                type: 'error',
                text1: 'Error',
                text2: err.response?.data?.error || 'Something went wrong',
              });
            } finally {
              setLoading(false);
            }
          },
        },
      ],
    );
  };

  // Форматиране на дата/час
  const getDate = dateStr => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return `${String(d.getDate()).padStart(2, '0')}.${String(
      d.getMonth() + 1,
    ).padStart(2, '0')}`;
  };

  const getDayOfWeek = dateStr => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString(i18n.language, {
      weekday: 'long',
    });
  };

  const getTime = dateStr => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleTimeString(i18n.language, {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  };

  return (
    <KeyboardAvoidingView
      style={{flex: 1}}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <LinearGradient colors={['#1b1b1b', '#2a2a2a']} style={{flex: 1}}>
        <ScrollView
          ref={scrollViewRef}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled">
          {/* ── Карточка: Шофьор ── */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              {userImage ? (
                <Image source={{uri: userImage}} style={styles.avatar} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Text style={styles.avatarInitial}>
                    {(userFname || username || '?')[0].toUpperCase()}
                  </Text>
                </View>
              )}
              <View style={styles.headerInfo}>
                <Text style={styles.ownerName}>
                  {userFname} {userLname}
                </Text>
                <Text style={styles.ownerUsername}>@{username}</Text>
              </View>
              {/* Свободни места badge */}
              <View
                style={[
                  styles.seatsBadge,
                  !hasFreeSeats && {backgroundColor: '#666'},
                ]}>
                <Text style={styles.seatsNumber}>
                  {formatSeatsLabel(availableSeats, totalSeats)}
                </Text>
                <Text style={styles.seatsLabel}>{t('Free seats')}</Text>
              </View>
            </View>
          </View>

          {/* ── Карточка: Маршрут ── */}
          <View style={styles.card}>
            <Text style={styles.cardSectionLabel}>{t('Route')}</Text>
            <View style={styles.routeRow}>
              <View style={styles.routeIcons}>
                <View style={[styles.dot, styles.dotGreen]} />
                <View style={styles.routeLine} />
                <View style={[styles.dot, styles.dotOrange]} />
              </View>
              <View style={styles.citiesColumn}>
                <Text style={styles.cityName}>{departureCity}</Text>
                <Text style={styles.cityName}>{arrivalCity}</Text>
              </View>
            </View>
          </View>

          {/* ── Карточка: Дата и час ── */}
          {selectedDateTime && (
            <View style={styles.card}>
              <Text style={styles.cardSectionLabel}>
                {t('Time and date of departure')}
              </Text>
              <View style={styles.dateRow}>
                <View style={styles.dateBlock}>
                  <Text style={styles.dateValue}>
                    {getDate(selectedDateTime)}
                  </Text>
                  <Text style={styles.dateSubLabel}>
                    {getDayOfWeek(selectedDateTime).toUpperCase()}
                  </Text>
                </View>
                <View style={styles.dateSep} />
                <View style={styles.dateBlock}>
                  <Text style={styles.dateValue}>
                    {getTime(selectedDateTime)}
                  </Text>
                  <Text style={styles.dateSubLabel}>{t('DEPARTURETIME')}</Text>
                </View>
              </View>
              {routeTitle ? (
                <View style={styles.routeTitleDetails}>
                  <Text style={styles.routeTitleText}>{routeTitle}</Text>
                  <Text style={styles.dateSubLabel}>
                    {t('Route Title').toUpperCase()}
                  </Text>
                </View>
              ) : null}
            </View>
          )}

          {/* ── Карточка: Брой места ── */}
          <View style={styles.card}>
            <Text style={styles.cardSectionLabel}>{t('SeatsNeeded')}</Text>
            <Text style={styles.cardHint}>
              {t('ChooseHowManySeatsYouNeed')}
            </Text>
            <View style={styles.seatStepper}>
              <TouchableOpacity
                style={[
                  styles.seatButton,
                  requestedSeats <= 1 && styles.seatButtonDisabled,
                ]}
                disabled={requestedSeats <= 1}
                onPress={() => updateRequestedSeats(requestedSeats - 1)}>
                <Text style={styles.seatButtonText}>−</Text>
              </TouchableOpacity>
              <View style={styles.seatCountPill}>
                <Text style={styles.seatCountText}>{requestedSeats}</Text>
              </View>
              <TouchableOpacity
                style={[
                  styles.seatButton,
                  requestedSeats >= maxRequestedSeats &&
                    styles.seatButtonDisabled,
                ]}
                disabled={requestedSeats >= maxRequestedSeats}
                onPress={() => updateRequestedSeats(requestedSeats + 1)}>
                <Text style={styles.seatButtonText}>+</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* ── Коментар ── */}
          <View style={styles.card}>
            <Text style={styles.cardSectionLabel}>
              {t('Enter your travel request comment here :')}
            </Text>
            <TextInput
              style={styles.input}
              onChangeText={text => setTripRequestText(text)}
              value={tripRequestText}
              placeholder={t('WriteSomethingAboutYourselfOrYourTrip')}
              placeholderTextColor="#666"
              multiline
              textAlignVertical="top"
              onFocus={() => {
                setTimeout(() => {
                  scrollViewRef.current?.scrollToEnd({animated: true});
                }, 300);
              }}
            />
          </View>

          {/* Предупреждение - собствен маршрут */}
          {isOwnRoute && (
            <View style={styles.warningCard}>
              <Text style={styles.warningText}>
                {t('This route was created by you, and you cannot request it!')}
              </Text>
            </View>
          )}

          {/* Вече кандидатствал */}
          {hasRequested && (
            <View style={styles.infoCard}>
              <Text style={styles.infoText}>
                {t('You have already applied for this route.')}
              </Text>
            </View>
          )}

          {/* ── Бутони ── */}
          <TouchableOpacity
            style={styles.buttonUserInfo}
            onPress={() =>
              navigation.navigate('UserInfo', {
                userId: params.userId || owner.id || details.userId,
                username,
                userFname,
                userLname,
                userEmail,
                departureCityId,
                departureCity,
                arrivalCityId,
                arrivalCity,
                selectedVehicle:
                  params.selectedVehicle || details.selectedVehicle,
                registrationNumber:
                  params.registrationNumber || details.registrationNumber,
                selectedDateTime:
                  params.selectedDateTime || details.selectedDateTime,
                routeTitle: params.routeTitle || details.routeTitle,
                totalSeats,
                availableSeats,
                routeId,
                routeDetailsData: details,
              })
            }>
            <Text style={styles.buttonUserInfoText}>{t('viewUserInfo')}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.buttonConfirm,
              (isOwnRoute || hasRequested || loading || !hasFreeSeats) &&
                styles.buttonDisabled,
            ]}
            onPress={() => {
              if (isOwnRoute) {
                Alert.alert(
                  t('Error'),
                  t('You cannot apply for this route because you created it.'),
                );
              } else if (hasRequested) {
                Alert.alert(
                  t('Error'),
                  t('You have already submitted a request for this route.'),
                );
              } else if (!hasFreeSeats) {
                Alert.alert(
                  t('Error'),
                  t('No free seats left for this route.'),
                );
              } else {
                handlerTripRequest();
              }
            }}
            disabled={isOwnRoute || hasRequested || loading || !hasFreeSeats}>
            <Text style={styles.buttonText}>
              {loading ? t('Sending...') : t('Trip request')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.buttonBack}
            onPress={() => navigation.navigate('ViewRoutes')}
            disabled={loading}>
            <Text style={styles.buttonText}>{t('Back')}</Text>
          </TouchableOpacity>
        </ScrollView>

        {loading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#27ae60" />
          </View>
        )}
      </LinearGradient>
    </KeyboardAvoidingView>
  );
}

const ACCENT = '#27ae60';
const ORANGE = '#f4511e';

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingVertical: 20,
    gap: 12,
  },

  // ── Карточка ──
  card: {
    backgroundColor: '#242424',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#3a3a3a',
    padding: 16,
  },
  cardSectionLabel: {
    color: '#888',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  cardHint: {
    color: '#777',
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 10,
  },

  // ── Хедър: аватар + инфо ──
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
  },
  avatarPlaceholder: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: ACCENT + '33',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitial: {
    fontSize: 22,
    fontWeight: '700',
    color: ACCENT,
  },
  headerInfo: {
    flex: 1,
  },
  ownerName: {
    color: '#f0f0f0',
    fontSize: 17,
    fontWeight: '700',
  },
  ownerUsername: {
    color: '#888',
    fontSize: 13,
    marginTop: 2,
  },
  seatsBadge: {
    backgroundColor: ACCENT,
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

  // ── Маршрут ──
  routeRow: {
    flexDirection: 'row',
    alignItems: 'center',
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
  dotGreen: {backgroundColor: ACCENT},
  dotOrange: {backgroundColor: ORANGE},
  routeLine: {
    width: 2,
    flex: 1,
    marginVertical: 3,
    backgroundColor: '#555',
    opacity: 0.5,
  },
  citiesColumn: {
    flex: 1,
    justifyContent: 'space-between',
    height: 52,
  },
  cityName: {
    color: '#f0f0f0',
    fontSize: 18,
    fontWeight: '700',
  },

  // ── Дата ──
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateBlock: {
    flex: 1,
    alignItems: 'center',
  },
  dateValue: {
    color: ACCENT,
    fontSize: 20,
    fontWeight: '800',
  },
  routeTitleText: {
    color: '#f0f0f0',
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
  },
  routeTitleDetails: {
    alignItems: 'center',
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#3a3a3a',
  },
  dateSubLabel: {
    color: '#666',
    fontSize: 9,
    fontWeight: '600',
    marginTop: 3,
    letterSpacing: 0.5,
  },
  dateSep: {
    width: 1,
    height: 32,
    backgroundColor: '#3a3a3a',
    marginHorizontal: 4,
  },

  // ── Stepper ──
  seatStepper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 18,
    marginTop: 4,
  },
  seatButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: ACCENT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  seatButtonDisabled: {backgroundColor: '#444'},
  seatButtonText: {
    color: '#fff',
    fontSize: 28,
    lineHeight: 30,
    fontWeight: '800',
  },
  seatCountPill: {
    minWidth: 64,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
  },
  seatCountText: {
    color: ACCENT,
    fontSize: 25,
    fontWeight: '800',
  },

  // ── Input ──
  input: {
    minHeight: 90,
    maxHeight: 200,
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#3a3a3a',
    borderRadius: 10,
    padding: 12,
    color: '#e9e9e9',
    fontSize: 15,
    textAlignVertical: 'top',
  },

  // ── Предупреждения ──
  warningCard: {
    backgroundColor: 'rgba(174,39,39,0.15)',
    borderWidth: 1,
    borderColor: '#AE2727',
    borderRadius: 12,
    padding: 12,
  },
  warningText: {
    color: '#ff6b6b',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  infoCard: {
    backgroundColor: 'rgba(39,174,96,0.1)',
    borderWidth: 1,
    borderColor: ACCENT,
    borderRadius: 12,
    padding: 12,
  },
  infoText: {
    color: ACCENT,
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },

  // ── Бутони ──
  buttonUserInfo: {
    padding: 15,
    backgroundColor: '#2e2e2e',
    borderWidth: 1,
    borderColor: '#444',
    alignItems: 'center',
    borderRadius: 12,
  },
  buttonUserInfoText: {
    color: '#d0d0d0',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonConfirm: {
    padding: 16,
    backgroundColor: ACCENT,
    alignItems: 'center',
    borderRadius: 12,
  },
  buttonDisabled: {
    backgroundColor: '#444',
  },
  buttonBack: {
    padding: 16,
    backgroundColor: '#AE2727',
    alignItems: 'center',
    borderRadius: 12,
    marginBottom: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },

  // ── Loading ──
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
});

export {RouteDetails};
