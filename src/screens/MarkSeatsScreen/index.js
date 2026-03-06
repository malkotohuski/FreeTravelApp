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

const MarkSeatsScreen = () => {
  const {t} = useTranslation();
  const navigation = useNavigation();
  const route = useRoute();
  const theme = useTheme();

  const selectedVehicle = route.params?.selectedVehicle;
  const [registrationNumber, setRegistrationNumber] = useState('');

  const regex = /^[А-ЯA-Z]{1,2}\d{4}[А-ЯA-Z]{2}$/;

  const isValidRegistrationNumber = useCallback(
    () => regex.test(registrationNumber.trim()),
    [registrationNumber],
  );

  useFocusEffect(
    useCallback(() => {
      setRegistrationNumber('');
    }, []),
  );

  const handleContinue = useCallback(() => {
    if (!isValidRegistrationNumber()) {
      Alert.alert(
        t('Invalid Registration Number'),
        t('Please enter a valid registration number (e.g. CA1234AB).'),
      );
      return;
    }

    navigation.navigate('SelectRoute', {
      selectedVehicle,
      registrationNumber,
    });
  }, [
    isValidRegistrationNumber,
    registrationNumber,
    navigation,
    selectedVehicle,
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
