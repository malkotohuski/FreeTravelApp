import React, {useState, useCallback, useMemo} from 'react';
import RNPickerSelect from 'react-native-picker-select';
import {useTranslation} from 'react-i18next';
import {useFocusEffect, useNavigation} from '@react-navigation/native';
import {View, Text, TouchableOpacity, Alert, StyleSheet} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

const Vehicle = () => {
  const {t} = useTranslation();
  const navigation = useNavigation();
  const [selectedVehicle, setSelectedVehicle] = useState(null);

  // ✅ Memoize vehicle options
  const vehicleTypes = useMemo(
    () => [
      {label: t('Car'), value: 'Car'},
      {label: t('Motorcycle'), value: 'Motorcycle'},
      {label: t('A minibus'), value: 'A minibus'},
      {label: t('A bus'), value: 'A bus'},
      {label: t('Other'), value: 'Other'},
    ],
    [t],
  );

  // ✅ Reset selection when screen regains focus
  useFocusEffect(
    useCallback(() => {
      setSelectedVehicle(null);
    }, []),
  );

  const handleContinue = useCallback(() => {
    if (!selectedVehicle) {
      Alert.alert(t('Error'), t('Please select a vehicle before continuing!'));
      return;
    }
    navigation.navigate('Mark Seats', {
      selectedVehicle,
      vehicleTypes,
    });
  }, [selectedVehicle, navigation, t, vehicleTypes]);

  const handleBackHome = useCallback(() => {
    navigation.navigate('Home');
  }, [navigation]);

  return (
    <LinearGradient
      colors={['#2b2b2b', '#444']}
      style={styles.gradientBackground}>
      <View style={styles.container}>
        <Text style={styles.title}>{t('Select Vehicle')}</Text>

        <RNPickerSelect
          items={vehicleTypes}
          placeholder={{label: t('Choose vehicle...'), value: null}}
          onValueChange={setSelectedVehicle}
          value={selectedVehicle}
          style={pickerSelectStyles}
          useNativeAndroidPickerStyle={false}
        />

        <View style={styles.buttonsContainer}>
          <TouchableOpacity onPress={handleContinue} style={styles.button}>
            <Text style={styles.buttonText}>{t('Continue')}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleBackHome}
            style={styles.buttonSecondary}>
            <Text style={styles.buttonText}>{t('Back')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </LinearGradient>
  );
};

export default Vehicle;

const styles = StyleSheet.create({
  gradientBackground: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: '85%',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 20,
  },
  buttonsContainer: {
    marginTop: 30,
    alignItems: 'center',
    gap: 15,
  },
  button: {
    backgroundColor: '#f4511e',
    borderRadius: 10,
    width: 200,
    height: 55,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#fff',
  },
  buttonSecondary: {
    backgroundColor: '#777',
    borderRadius: 10,
    width: 200,
    height: 55,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#fff',
  },
  buttonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
});

const pickerSelectStyles = StyleSheet.create({
  inputIOS: {
    color: 'white',
    fontSize: 18,
    paddingVertical: 10,
    textAlign: 'center',
  },
  inputAndroid: {
    color: 'white',
    fontSize: 18,
    textAlign: 'center',
  },
});
