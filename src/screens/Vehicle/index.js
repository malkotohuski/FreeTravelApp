import React, {useState, useCallback, useMemo} from 'react';
import RNPickerSelect from 'react-native-picker-select';
import {useTranslation} from 'react-i18next';
import {useFocusEffect, useNavigation} from '@react-navigation/native';
import {View, Text, TouchableOpacity, Alert, StyleSheet} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {useTheme} from '../../theme/useTheme';

const Vehicle = () => {
  const {t} = useTranslation();
  const navigation = useNavigation();
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const theme = useTheme();

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

  // ✅ Същите функции, но четат от theme

  const getGradientColors = () => theme.gradient;

  const getContainerStyle = () => ({
    width: '85%',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: theme.cardBorder,
    backgroundColor: theme.cardBackground,
  });

  const getTextColor = () => theme.textPrimary;

  const getPrimaryButtonStyle = () => ({
    borderRadius: 10,
    width: 200,
    height: 55,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#fff',
    backgroundColor: theme.primaryButton,
  });

  const getSecondaryButtonStyle = () => ({
    borderRadius: 10,
    width: 200,
    height: 55,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#fff',
    backgroundColor: theme.secondaryButton,
  });

  const getSecondaryButtonTextColor = () => theme.textPrimary;

  return (
    <LinearGradient
      colors={getGradientColors()}
      style={styles.gradientBackground}>
      <View style={getContainerStyle()}>
        <Text style={[styles.title, {color: getTextColor()}]}>
          {t('vehicleТype')}
        </Text>

        <RNPickerSelect
          items={vehicleTypes}
          placeholder={{label: t('chooseVehicle'), value: null}}
          onValueChange={setSelectedVehicle}
          value={selectedVehicle}
          style={{
            inputIOS: [pickerSelectStyles.inputIOS, {color: getTextColor()}],
            inputAndroid: [
              pickerSelectStyles.inputAndroid,
              {color: getTextColor()},
            ],
          }}
          useNativeAndroidPickerStyle={false}
        />

        <View style={styles.buttonsContainer}>
          <TouchableOpacity
            style={getPrimaryButtonStyle()}
            onPress={handleContinue}>
            <Text style={styles.buttonText}>{t('Continue')}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={getSecondaryButtonStyle()}
            onPress={handleBackHome}>
            <Text
              style={[
                styles.buttonText,
                {color: getSecondaryButtonTextColor()},
              ]}>
              {t('Back')}
            </Text>
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
  title: {
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 20,
  },
  buttonsContainer: {
    marginTop: 30,
    alignItems: 'center',
    gap: 15,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: '600',
  },
});

const pickerSelectStyles = StyleSheet.create({
  inputIOS: {
    fontSize: 18,
    paddingVertical: 10,
    textAlign: 'center',
  },
  inputAndroid: {
    fontSize: 18,
    textAlign: 'center',
  },
});
