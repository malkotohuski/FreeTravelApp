import React, {useState, useCallback} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Alert,
  ScrollView,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from 'react-native';
import {
  useNavigation,
  useRoute,
  useFocusEffect,
} from '@react-navigation/native';
import {useTranslation} from 'react-i18next';
import LinearGradient from 'react-native-linear-gradient';
import {useTheme} from '../../theme/useTheme';
import Icons from 'react-native-vector-icons/MaterialCommunityIcons';
import {clampSeatCount, getSeatLimitForVehicle} from '../../utils/seatPolicy';
import {
  LUGGAGE_SIZES,
  PRICE_TYPES,
  RIDE_PREFERENCES,
} from '../../utils/routePreferences';

const REGISTRATION_NUMBER_REGEX =
  /^[\u0410-\u042fA-Z]{1,2}\d{4}[\u0410-\u042fA-Z]{2}$/;
const MAX_ESTIMATED_PRICE = 999;

const MarkSeatsScreen = () => {
  const {t} = useTranslation();
  const navigation = useNavigation();
  const route = useRoute();
  const theme = useTheme();

  const selectedVehicle = route.params?.selectedVehicle;
  const initialSeats = clampSeatCount(
    route.params?.totalSeats || 1,
    selectedVehicle,
  );
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [totalSeats, setTotalSeats] = useState(initialSeats);
  const [petsAllowed, setPetsAllowed] = useState(false);
  const [smokingAllowed, setSmokingAllowed] = useState(false);
  const [ridePreference, setRidePreference] = useState('conversation');
  const [luggageSize, setLuggageSize] = useState('small');
  const [priceType, setPriceType] = useState('free');
  const [estimatedPrice, setEstimatedPrice] = useState('');
  const maxSeats = getSeatLimitForVehicle(selectedVehicle);

  const isValidRegistrationNumber = useCallback(
    () => REGISTRATION_NUMBER_REGEX.test(registrationNumber.trim()),
    [registrationNumber],
  );

  useFocusEffect(
    useCallback(() => {
      setRegistrationNumber(route.params?.registrationNumber || '');
      setTotalSeats(initialSeats);
      setPetsAllowed(route.params?.petsAllowed === true);
      setSmokingAllowed(route.params?.smokingAllowed === true);
      setRidePreference(route.params?.ridePreference || 'conversation');
      setLuggageSize(route.params?.luggageSize || 'small');
      setPriceType(route.params?.priceType || 'free');
      setEstimatedPrice(
        route.params?.estimatedPrice === undefined ||
          route.params?.estimatedPrice === null
          ? ''
          : String(route.params.estimatedPrice),
      );
    }, [
      initialSeats,
      route.params?.estimatedPrice,
      route.params?.luggageSize,
      route.params?.petsAllowed,
      route.params?.priceType,
      route.params?.registrationNumber,
      route.params?.ridePreference,
      route.params?.smokingAllowed,
    ]),
  );

  const handleSeatChange = useCallback(
    nextValue => {
      setTotalSeats(clampSeatCount(nextValue, selectedVehicle));
    },
    [selectedVehicle],
  );

  const handleEstimatedPriceChange = value => {
    const digitsOnly = value.replace(/\D/g, '').slice(0, 3);
    const parsedPrice = Number(digitsOnly);

    if (digitsOnly && parsedPrice > MAX_ESTIMATED_PRICE) {
      setEstimatedPrice(String(MAX_ESTIMATED_PRICE));
      return;
    }

    setEstimatedPrice(digitsOnly);
  };

  const handleContinue = useCallback(() => {
    if (!isValidRegistrationNumber()) {
      Alert.alert(
        t('Invalid Registration Number'),
        t('PleaseEnterValidRegistrationNumber'),
      );
      return;
    }

    if (priceType !== 'free' && !estimatedPrice) {
      Alert.alert(t('Error'), t('Please enter an estimated trip cost.'));
      return;
    }

    navigation.navigate('SelectRoute', {
      selectedVehicle,
      registrationNumber,
      totalSeats,
      petsAllowed,
      smokingAllowed,
      ridePreference,
      luggageSize,
      priceType,
      estimatedPrice: estimatedPrice ? Number(estimatedPrice) : null,
    });
  }, [
    estimatedPrice,
    isValidRegistrationNumber,
    luggageSize,
    registrationNumber,
    navigation,
    petsAllowed,
    priceType,
    ridePreference,
    selectedVehicle,
    smokingAllowed,
    totalSeats,
    t,
  ]);

  const handleBack = () => navigation.navigate('Vehicle');

  const renderChoiceChip = (option, selectedValue, onPress) => {
    const isSelected = option.value === selectedValue;

    return (
      <TouchableOpacity
        key={option.value}
        style={[
          styles.preferenceChip,
          {
            borderColor: isSelected ? theme.primaryButton : theme.inputBorder,
            backgroundColor: isSelected
              ? theme.primaryButton + '22'
              : theme.cardBackground,
          },
        ]}
        onPress={() => onPress(option.value)}>
        <Icons
          name={option.icon}
          size={18}
          color={isSelected ? theme.primaryButton : theme.textSecondary}
        />
        <Text
          style={[
            styles.preferenceChipText,
            {color: isSelected ? theme.textPrimary : theme.textSecondary},
          ]}>
          {t(option.labelKey)}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <LinearGradient colors={theme.gradient} style={{flex: 1}}>
      <SafeAreaView style={{flex: 1}}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{flex: 1}}>
          <ScrollView contentContainerStyle={styles.scrollContainer}>
            <View
              style={[
                styles.card,
                {
                  backgroundColor: theme.cardBackground,
                  borderColor: theme.cardBorder,
                },
              ]}>
              <Text style={[styles.title, {color: theme.textPrimary}]}>
                {t('vehicleТype')}:{' '}
                <Text
                  style={{
                    color: theme.highlight,
                    fontWeight: '700',
                  }}>
                  {t(selectedVehicle)}
                </Text>
              </Text>

              <TextInput
                placeholder={t('enterRegistrationNumber')}
                placeholderTextColor={theme.placeholder}
                value={registrationNumber}
                onChangeText={setRegistrationNumber}
                style={[
                  styles.input,
                  {
                    backgroundColor: theme.inputBackground,
                    borderColor: isValidRegistrationNumber()
                      ? '#4CAF50'
                      : theme.inputBorder,
                    color: theme.textPrimary,
                  },
                ]}
                maxLength={10}
                autoCapitalize="characters"
                returnKeyType="done"
              />

              {registrationNumber.length > 0 &&
                !isValidRegistrationNumber() && (
                  <Text
                    style={{
                      color: theme.warning,
                      fontSize: 15,
                      marginBottom: 10,
                      textAlign: 'center',
                    }}>
                    {t('invalidFormatExample')}
                  </Text>
                )}

              <View style={styles.preferencesHeader}>
                <Text
                  style={[
                    styles.preferencesTitle,
                    {color: theme.textPrimary},
                  ]}>
                  {t('Trip settings')}
                </Text>
                <View style={styles.swipeHint}>
                  <Text
                    style={[
                      styles.swipeHintText,
                      {color: theme.textSecondary},
                    ]}>
                    {t('Swipe for more')}
                  </Text>
                  <Icons
                    name="gesture-swipe-horizontal"
                    size={20}
                    color={theme.primaryButton}
                  />
                </View>
              </View>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.preferencesScroll}
                snapToInterval={276}
                decelerationRate="fast">
                <View
                  style={[
                    styles.preferenceCard,
                    {
                      backgroundColor: theme.inputBackground,
                      borderColor: theme.inputBorder,
                    },
                  ]}>
                  <Icons name="car-seat" size={30} color={theme.primaryButton} />
                  <Text style={[styles.seatsLabel, {color: theme.textPrimary}]}>
                    {t('FreeSeats')}
                  </Text>
                  <Text
                    style={[styles.seatsHint, {color: theme.textSecondary}]}>
                    {t('HowManyPeopleCanJoinThisTrip')}
                  </Text>

                  <View style={styles.seatStepper}>
                    <TouchableOpacity
                      style={[
                        styles.seatButton,
                        {
                          backgroundColor:
                            totalSeats > 1 ? theme.primaryButton : '#777',
                        },
                      ]}
                      disabled={totalSeats <= 1}
                      onPress={() => handleSeatChange(totalSeats - 1)}>
                      <Icons name="minus" size={26} color="#fff" />
                    </TouchableOpacity>

                    <View style={styles.seatCountPill}>
                      <Text style={styles.seatCount}>{totalSeats}</Text>
                    </View>

                    <TouchableOpacity
                      style={[
                        styles.seatButton,
                        {
                          backgroundColor:
                            totalSeats < maxSeats
                              ? theme.primaryButton
                              : '#777',
                        },
                      ]}
                      disabled={totalSeats >= maxSeats}
                      onPress={() => handleSeatChange(totalSeats + 1)}>
                      <Icons name="plus" size={26} color="#fff" />
                    </TouchableOpacity>
                  </View>

                  <Text
                    style={[styles.seatsHint, {color: theme.textSecondary}]}>
                    {t('MaximumForThisVehicle')}: {maxSeats}
                  </Text>
                </View>

                <View
                  style={[
                    styles.preferenceCard,
                    {
                      backgroundColor: theme.inputBackground,
                      borderColor: theme.inputBorder,
                    },
                  ]}>
                  <Icons name="dog" size={30} color={theme.primaryButton} />
                  <Text style={[styles.seatsLabel, {color: theme.textPrimary}]}>
                    {t('Pets')}
                  </Text>
                  <Text
                    style={[styles.seatsHint, {color: theme.textSecondary}]}>
                    {t('Can passengers travel with pets?')}
                  </Text>
                  <View style={styles.preferenceChips}>
                    {renderChoiceChip(
                      {value: false, icon: 'dog', labelKey: 'Not allowed'},
                      petsAllowed,
                      setPetsAllowed,
                    )}
                    {renderChoiceChip(
                      {value: true, icon: 'dog', labelKey: 'Allowed'},
                      petsAllowed,
                      setPetsAllowed,
                    )}
                  </View>
                </View>

                <View
                  style={[
                    styles.preferenceCard,
                    {
                      backgroundColor: theme.inputBackground,
                      borderColor: theme.inputBorder,
                    },
                  ]}>
                  <Icons
                    name={smokingAllowed ? 'smoking' : 'smoking-off'}
                    size={30}
                    color={theme.primaryButton}
                  />
                  <Text style={[styles.seatsLabel, {color: theme.textPrimary}]}>
                    {t('Smoking')}
                  </Text>
                  <Text
                    style={[styles.seatsHint, {color: theme.textSecondary}]}>
                    {t('Smoking preference for this trip')}
                  </Text>
                  <View style={styles.preferenceChips}>
                    {renderChoiceChip(
                      {value: false, icon: 'smoking-off', labelKey: 'No smoking'},
                      smokingAllowed,
                      setSmokingAllowed,
                    )}
                    {renderChoiceChip(
                      {value: true, icon: 'smoking', labelKey: 'Allowed'},
                      smokingAllowed,
                      setSmokingAllowed,
                    )}
                  </View>
                </View>

                <View
                  style={[
                    styles.preferenceCard,
                    {
                      backgroundColor: theme.inputBackground,
                      borderColor: theme.inputBorder,
                    },
                  ]}>
                  <Icons
                    name={RIDE_PREFERENCES.find(
                      option => option.value === ridePreference,
                    )?.icon || 'chat-outline'}
                    size={30}
                    color={theme.primaryButton}
                  />
                  <Text style={[styles.seatsLabel, {color: theme.textPrimary}]}>
                    {t('Ride vibe')}
                  </Text>
                  <Text
                    style={[styles.seatsHint, {color: theme.textSecondary}]}>
                    {t('Choose the atmosphere in the car')}
                  </Text>
                  <View style={styles.preferenceChips}>
                    {RIDE_PREFERENCES.map(option =>
                      renderChoiceChip(
                        option,
                        ridePreference,
                        setRidePreference,
                      ),
                    )}
                  </View>
                </View>

                <View
                  style={[
                    styles.preferenceCard,
                    {
                      backgroundColor: theme.inputBackground,
                      borderColor: theme.inputBorder,
                    },
                  ]}>
                  <Icons
                    name={LUGGAGE_SIZES.find(
                      option => option.value === luggageSize,
                    )?.icon || 'bag-suitcase'}
                    size={30}
                    color={theme.primaryButton}
                  />
                  <Text style={[styles.seatsLabel, {color: theme.textPrimary}]}>
                    {t('Max luggage')}
                  </Text>
                  <Text
                    style={[styles.seatsHint, {color: theme.textSecondary}]}>
                    {t('How much luggage can passengers bring?')}
                  </Text>
                  <View style={styles.preferenceChips}>
                    {LUGGAGE_SIZES.map(option =>
                      renderChoiceChip(option, luggageSize, setLuggageSize),
                    )}
                  </View>
                </View>

                <View
                  style={[
                    styles.preferenceCard,
                    {
                      backgroundColor: theme.inputBackground,
                      borderColor: theme.inputBorder,
                    },
                  ]}>
                  <Icons
                    name={PRICE_TYPES.find(option => option.value === priceType)
                      ?.icon || 'cash-off'}
                    size={30}
                    color={theme.primaryButton}
                  />
                  <Text style={[styles.seatsLabel, {color: theme.textPrimary}]}>
                    {t('Trip cost')}
                  </Text>
                  <Text
                    style={[styles.seatsHint, {color: theme.textSecondary}]}>
                    {t('No payments are handled through the app.')}
                  </Text>
                  <View style={styles.preferenceChips}>
                    {PRICE_TYPES.map(option =>
                      renderChoiceChip(option, priceType, setPriceType),
                    )}
                  </View>
                  {priceType !== 'free' ? (
                    <View style={styles.priceRow}>
                      <TextInput
                        placeholder="0"
                        placeholderTextColor={theme.placeholder}
                        keyboardType="number-pad"
                        value={estimatedPrice}
                        onChangeText={handleEstimatedPriceChange}
                        style={[
                          styles.priceInput,
                          {
                            backgroundColor: theme.cardBackground,
                            borderColor: theme.inputBorder,
                            color: theme.textPrimary,
                          },
                        ]}
                        maxLength={3}
                      />
                      <Text
                        style={[
                          styles.priceCurrency,
                          {color: theme.textSecondary},
                        ]}>
                        {t('EUR')}
                      </Text>
                    </View>
                  ) : null}
                </View>
              </ScrollView>

              <View style={styles.buttonsContainer}>
                <TouchableOpacity
                  onPress={handleContinue}
                  style={[
                    styles.button,
                    {
                      backgroundColor: isValidRegistrationNumber()
                        ? theme.primaryButton
                        : '#777',
                    },
                  ]}>
                  <Text style={styles.buttonText}>{t('Continue')}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleBack}
                  style={[
                    styles.secondaryButton,
                    {backgroundColor: theme.secondaryButton},
                  ]}>
                  <Text style={[styles.buttonText, {color: theme.textPrimary}]}>
                    {t('Back to Vehicle')}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
};

export default MarkSeatsScreen;

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  card: {
    width: '85%',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    height: 55,
    width: '90%',
    borderWidth: 2,
    borderRadius: 10,
    textAlign: 'center',
    fontSize: 20,
    fontWeight: 'bold',
    marginVertical: 15,
  },
  seatsCard: {
    width: '90%',
    borderWidth: 1,
    borderRadius: 14,
    padding: 16,
    marginTop: 8,
    alignItems: 'center',
  },
  seatsLabel: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  seatsHint: {
    marginTop: 6,
    fontSize: 13,
    textAlign: 'center',
  },
  preferencesHeader: {
    width: '90%',
    marginTop: 8,
    marginBottom: 10,
  },
  preferencesTitle: {
    fontSize: 17,
    fontWeight: '800',
    textAlign: 'center',
  },
  swipeHint: {
    marginTop: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  swipeHintText: {
    fontSize: 12,
    fontWeight: '600',
  },
  preferencesScroll: {
    paddingHorizontal: 4,
    gap: 12,
  },
  preferenceCard: {
    width: 264,
    minHeight: 250,
    borderWidth: 1,
    borderRadius: 18,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  preferenceChips: {
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    marginTop: 14,
  },
  preferenceChip: {
    minHeight: 40,
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  preferenceChipText: {
    fontSize: 12,
    fontWeight: '700',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 14,
    gap: 8,
  },
  priceInput: {
    width: 86,
    height: 44,
    borderWidth: 1,
    borderRadius: 12,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '800',
  },
  priceCurrency: {
    fontSize: 14,
    fontWeight: '800',
  },
  seatStepper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 14,
    gap: 18,
  },
  seatButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  seatCountPill: {
    minWidth: 72,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
  },
  seatCount: {
    fontSize: 28,
    fontWeight: '800',
    color: '#f4511e',
  },
  buttonsContainer: {
    marginTop: 30,
    alignItems: 'center',
    gap: 15,
  },
  button: {
    width: 230,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#fff',
  },
  secondaryButton: {
    width: 230,
    minHeight: 60,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#fff',
    paddingHorizontal: 10,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
});
