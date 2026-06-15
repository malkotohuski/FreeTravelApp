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

const REGISTRATION_NUMBER_REGEX =
  /^[\u0410-\u042fA-Z]{1,2}\d{4}[\u0410-\u042fA-Z]{2}$/;

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
  const maxSeats = getSeatLimitForVehicle(selectedVehicle);

  const isValidRegistrationNumber = useCallback(
    () => REGISTRATION_NUMBER_REGEX.test(registrationNumber.trim()),
    [registrationNumber],
  );

  useFocusEffect(
    useCallback(() => {
      setRegistrationNumber(route.params?.registrationNumber || '');
      setTotalSeats(initialSeats);
    }, [initialSeats, route.params?.registrationNumber]),
  );

  const handleSeatChange = useCallback(
    nextValue => {
      setTotalSeats(clampSeatCount(nextValue, selectedVehicle));
    },
    [selectedVehicle],
  );

  const handleContinue = useCallback(() => {
    if (!isValidRegistrationNumber()) {
      Alert.alert(
        t('Invalid Registration Number'),
        t('PleaseEnterValidRegistrationNumber'),
      );
      return;
    }

    navigation.navigate('SelectRoute', {
      selectedVehicle,
      registrationNumber,
      totalSeats,
    });
  }, [
    isValidRegistrationNumber,
    registrationNumber,
    navigation,
    selectedVehicle,
    totalSeats,
    t,
  ]);

  const handleBack = () => navigation.navigate('Vehicle');

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

              <View
                style={[
                  styles.seatsCard,
                  {
                    backgroundColor: theme.inputBackground,
                    borderColor: theme.inputBorder,
                  },
                ]}>
                <Text style={[styles.seatsLabel, {color: theme.textPrimary}]}>
                  {t('FreeSeats')}
                </Text>
                <Text style={[styles.seatsHint, {color: theme.textSecondary}]}>
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
                          totalSeats < maxSeats ? theme.primaryButton : '#777',
                      },
                    ]}
                    disabled={totalSeats >= maxSeats}
                    onPress={() => handleSeatChange(totalSeats + 1)}>
                    <Icons name="plus" size={26} color="#fff" />
                  </TouchableOpacity>
                </View>

                <Text style={[styles.seatsHint, {color: theme.textSecondary}]}>
                  {t('MaximumForThisVehicle')}: {maxSeats}
                </Text>
              </View>

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
