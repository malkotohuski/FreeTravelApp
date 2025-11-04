import React, {useState, useCallback, useMemo} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Alert,
  ScrollView,
  SafeAreaView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {
  useNavigation,
  useRoute,
  useFocusEffect,
} from '@react-navigation/native';
import {useTranslation} from 'react-i18next';
import LinearGradient from 'react-native-linear-gradient';

const MarkSeatsScreen = () => {
  const {t} = useTranslation();
  const navigation = useNavigation();
  const route = useRoute();
  const selectedVehicle = route.params?.selectedVehicle;

  const [registrationNumber, setRegistrationNumber] = useState('');

  const regex = useMemo(
    () => /^([ABCEHKMOPTXY]{1,2})(\d{4})([ABCEHKMOPTXY]{2})$/i,
    [],
  );

  const isValidRegistrationNumber = useCallback(
    () => regex.test(registrationNumber.trim()),
    [registrationNumber, regex],
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

  const handleBack = useCallback(() => {
    navigation.navigate('Vehicle');
  }, [navigation]);

  // Нулиране при връщане към екрана
  useFocusEffect(
    useCallback(() => {
      setRegistrationNumber('');
    }, []),
  );

  return (
    <LinearGradient colors={['#2b2b2b', '#444']} style={{flex: 1}}>
      <SafeAreaView style={{flex: 1}}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{flex: 1}}>
          <ScrollView contentContainerStyle={styles.scrollContainer}>
            <View style={styles.card}>
              <Text style={styles.title}>
                {t('Vehicle Type')}:{' '}
                <Text style={styles.highlight}>{selectedVehicle}</Text>
              </Text>

              <TextInput
                placeholder={t('Enter Registration Number')}
                placeholderTextColor="rgba(255,255,255,0.6)"
                value={registrationNumber}
                onChangeText={setRegistrationNumber}
                style={[
                  styles.input,
                  {
                    borderColor: isValidRegistrationNumber()
                      ? '#4CAF50'
                      : 'rgba(255,255,255,0.3)',
                  },
                ]}
                maxLength={10}
                autoCapitalize="characters"
                keyboardType="default"
                returnKeyType="done"
              />

              {registrationNumber.length > 0 &&
                !isValidRegistrationNumber() && (
                  <Text style={styles.warningText}>
                    {t('Invalid format, example: CA1234AB')}
                  </Text>
                )}

              <View style={styles.buttonsContainer}>
                <TouchableOpacity
                  onPress={handleContinue}
                  style={[
                    styles.button,
                    {
                      backgroundColor: isValidRegistrationNumber()
                        ? '#f4511e'
                        : '#777',
                    },
                  ]}>
                  <Text style={styles.buttonText}>{t('Continue')}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleBack}
                  style={styles.secondaryButton}>
                  <Text style={styles.buttonText}>{t('Back to Vehicle')}</Text>
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
    backgroundColor: 'rgba(255,255,255,0.08)',
    width: '85%',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    color: '#fff',
    fontWeight: '600',
    marginBottom: 20,
    textAlign: 'center',
  },
  highlight: {
    color: '#f4511e',
    fontWeight: '700',
  },
  input: {
    height: 55,
    width: '90%',
    borderWidth: 2,
    borderRadius: 10,
    textAlign: 'center',
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    backgroundColor: 'rgba(0,0,0,0.5)',
    marginVertical: 15,
  },
  warningText: {
    color: '#FF6347',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 10,
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
    backgroundColor: '#555',
    paddingHorizontal: 10,
  },
  buttonText: {
    fontSize: 18,
    color: '#fff',
    fontWeight: '600',
    textAlign: 'center', // ✅ центрира текста
    flexWrap: 'wrap',
  },
});
