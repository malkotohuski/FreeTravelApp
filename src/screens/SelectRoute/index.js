import React, {useEffect, useState, useLayoutEffect} from 'react';
import Icons from 'react-native-vector-icons/MaterialIcons';
import {useFocusEffect} from '@react-navigation/native';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Alert,
  FlatList,
  Keyboard,
  Modal,
  ScrollView,
  SafeAreaView,
  TouchableWithoutFeedback,
} from 'react-native';
import DatePicker from 'react-native-date-picker';
import {useTranslation} from 'react-i18next';
import LinearGradient from 'react-native-linear-gradient';
import {searchCities as searchCitiesApi} from '../../api/cities.api';
import {useTheme} from '../../theme/useTheme';

function SelectRouteScreen({route, navigation}) {
  const {t, i18n} = useTranslation();
  const {selectedVehicle, registrationNumber} = route.params;
  const theme = useTheme();

  const [departureSearchText, setDepartureSearchText] = useState('');
  const [arrivalSearchText, setArrivalSearchText] = useState('');
  const [debouncedDepartureSearch, setDebouncedDepartureSearch] = useState('');
  const [debouncedArrivalSearch, setDebouncedArrivalSearch] = useState('');
  const [departureCities, setDepartureCities] = useState([]);
  const [arrivalCities, setArrivalCities] = useState([]);

  const [date, setDate] = useState(new Date());
  const [open, setOpen] = useState(false);
  const [selectedDateTime, setSelectedDateTime] = useState(null);

  const [departureCityId, setDepartureCityId] = useState(null);
  const [departureCity, setDepartureCity] = useState(null);
  const [departureStreet, setDepartureStreet] = useState('');
  const [departureNumber, setDepartureNumber] = useState('');

  const [arrivalCityId, setArrivalCityId] = useState(null);
  const [arrivalCity, setArrivalCity] = useState(null);
  const [arrivalStreet, setArrivalStreet] = useState('');
  const [arrivalNumber, setArrivalNumber] = useState('');
  const [routeTitle, setRouteTitle] = useState('');

  const [modalVisibleDeparture, setModalVisibleDeparture] = useState(false);
  const [modalVisibleArrival, setModalVisibleArrival] = useState(false);

  const closeDepartureModal = () => {
    Keyboard.dismiss();
    setDepartureSearchText('');
    setDebouncedDepartureSearch('');
    setDepartureCities([]);
    setModalVisibleDeparture(false);
  };

  const closeArrivalModal = () => {
    Keyboard.dismiss();
    setArrivalSearchText('');
    setDebouncedArrivalSearch('');
    setArrivalCities([]);
    setModalVisibleArrival(false);
  };

  const clearDepartureSearch = () => {
    setDepartureSearchText('');
    setDebouncedDepartureSearch('');
  };

  const clearArrivalSearch = () => {
    setArrivalSearchText('');
    setDebouncedArrivalSearch('');
  };

  const highlightMatch = (cityName, searchText) => {
    if (!searchText) {
      return cityName;
    }

    return cityName
      .split(new RegExp(`(${searchText})`, 'i'))
      .map((part, index) =>
        part.toLowerCase() === searchText.toLowerCase() ? (
          <Text
            key={`${part}-${index}`}
            style={{
              fontWeight: 'bold',
              color: theme.primaryButton,
            }}>
            {part}
          </Text>
        ) : (
          part
        ),
      );
  };

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() =>
            navigation.navigate('Mark Seats', {
              selectedVehicle,
              registrationNumber,
            })
          }>
          <Text style={[styles.headerText, {color: theme.textPrimary}]}>
            {t('Step 3 of 4')}
          </Text>
          <Icons
            name="keyboard-backspace"
            size={22}
            color={theme.textPrimary}
          />
        </TouchableOpacity>
      ),
    });
  }, [navigation, selectedVehicle, registrationNumber, theme]);

  useFocusEffect(
    React.useCallback(() => {
      setDepartureSearchText('');
      setArrivalSearchText('');
      setDebouncedDepartureSearch('');
      setDebouncedArrivalSearch('');
      setDepartureCityId(null);
      setDepartureCity(null);
      setDepartureStreet('');
      setDepartureNumber('');
      setDepartureCities([]);
      setArrivalCityId(null);
      setArrivalCity(null);
      setArrivalStreet('');
      setArrivalNumber('');
      setArrivalCities([]);
      setSelectedDateTime(null);
      setDate(new Date());
      setRouteTitle('');
    }, [i18n.language]),
  );

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setDebouncedDepartureSearch(departureSearchText);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [departureSearchText]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setDebouncedArrivalSearch(arrivalSearchText);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [arrivalSearchText]);

  useEffect(() => {
    if (!modalVisibleDeparture) {
      return;
    }

    let isActive = true;

    const loadDepartureCities = async () => {
      try {
        const data = await searchCitiesApi(debouncedDepartureSearch);
        if (isActive) {
          setDepartureCities(data);
        }
      } catch (error) {
        console.error('Failed to load departure cities:', error);
        if (isActive) {
          setDepartureCities([]);
        }
      }
    };

    loadDepartureCities();

    return () => {
      isActive = false;
    };
  }, [debouncedDepartureSearch, modalVisibleDeparture]);

  useEffect(() => {
    if (!modalVisibleArrival) {
      return;
    }

    let isActive = true;

    const loadArrivalCities = async () => {
      try {
        const data = await searchCitiesApi(debouncedArrivalSearch);
        if (isActive) {
          setArrivalCities(data);
        }
      } catch (error) {
        console.error('Failed to load arrival cities:', error);
        if (isActive) {
          setArrivalCities([]);
        }
      }
    };

    loadArrivalCities();

    return () => {
      isActive = false;
    };
  }, [debouncedArrivalSearch, modalVisibleArrival]);

  const handleContinue = () => {
    if (!departureCity)
      return Alert.alert(t('Error'), t('Please select a city!'));
    if (!arrivalCity)
      return Alert.alert(t('Error'), t('Please select a city!'));
    if (!selectedDateTime || isNaN(selectedDateTime.getTime()))
      return Alert.alert(t('Error'), t('Please select a date and time!'));

    const formattedDateTime = selectedDateTime.toISOString();

    navigation.navigate('Confirm', {
      selectedVehicle,
      registrationNumber,
      departureCityId,
      selectedDateTime: formattedDateTime,
      departureCity,
      departureStreet,
      departureNumber,
      arrivalCityId,
      arrivalCity,
      arrivalStreet,
      arrivalNumber,
      routeTitle,
    });
  };

  return (
    <LinearGradient colors={theme.gradient} style={{flex: 1}}>
      <SafeAreaView style={{flex: 1}}>
        <ScrollView
          contentContainerStyle={styles.wrapper}
          keyboardShouldPersistTaps="handled">
          <View
            style={[
              styles.card,
              {
                backgroundColor: theme.cardBackground,
                borderColor: theme.inputBorder,
              },
            ]}>
            <Text style={[styles.mainTitle, {color: theme.textPrimary}]}>
              {t('Create Route')}
            </Text>

            <Text style={[styles.label, {color: theme.textSecondary}]}>
              {t('Departure')}
            </Text>

            <TouchableOpacity
              style={[
                styles.selectBox,
                {
                  backgroundColor: theme.inputBackground,
                  borderColor: theme.inputBorder,
                },
              ]}
              onPress={() => setModalVisibleDeparture(true)}>
              <Text style={{color: theme.textPrimary}}>
                {departureCity || t('Select City')}
              </Text>
            </TouchableOpacity>

            <View style={styles.inlineRow}>
              <TextInput
                placeholder={t('Street')}
                placeholderTextColor={theme.placeholder}
                value={departureStreet}
                onChangeText={setDepartureStreet}
                style={[
                  styles.input,
                  {
                    backgroundColor: theme.inputBackground,
                    borderColor: theme.inputBorder,
                    color: theme.textPrimary,
                  },
                ]}
              />

              <TextInput
                placeholder={t('No.')}
                placeholderTextColor={theme.placeholder}
                value={departureNumber}
                onChangeText={setDepartureNumber}
                style={[
                  styles.inputSmall,
                  {
                    backgroundColor: theme.inputBackground,
                    borderColor: theme.inputBorder,
                    color: theme.textPrimary,
                  },
                ]}
              />
            </View>

            <Text style={[styles.label, {color: theme.textSecondary}]}>
              {t('Arrival')}
            </Text>

            <TouchableOpacity
              style={[
                styles.selectBox,
                {
                  backgroundColor: theme.inputBackground,
                  borderColor: theme.inputBorder,
                },
              ]}
              onPress={() => setModalVisibleArrival(true)}>
              <Text style={{color: theme.textPrimary}}>
                {arrivalCity || t('Select City')}
              </Text>
            </TouchableOpacity>

            <View style={styles.inlineRow}>
              <TextInput
                placeholder={t('Street')}
                placeholderTextColor={theme.placeholder}
                value={arrivalStreet}
                onChangeText={setArrivalStreet}
                style={[
                  styles.input,
                  {
                    backgroundColor: theme.inputBackground,
                    borderColor: theme.inputBorder,
                    color: theme.textPrimary,
                  },
                ]}
              />

              <TextInput
                placeholder={t('No.')}
                placeholderTextColor={theme.placeholder}
                value={arrivalNumber}
                onChangeText={setArrivalNumber}
                style={[
                  styles.inputSmall,
                  {
                    backgroundColor: theme.inputBackground,
                    borderColor: theme.inputBorder,
                    color: theme.textPrimary,
                  },
                ]}
              />
            </View>

            <Text style={[styles.label, {color: theme.textSecondary}]}>
              {t('Route Title')}
            </Text>

            <TextInput
              placeholder={t('Enter route title')}
              placeholderTextColor={theme.placeholder}
              value={routeTitle}
              onChangeText={setRouteTitle}
              style={[
                styles.inputFull,
                {
                  backgroundColor: theme.inputBackground,
                  borderColor: theme.inputBorder,
                  color: theme.textPrimary,
                },
              ]}
            />

            <TouchableOpacity
              style={[
                styles.primaryButton,
                {backgroundColor: theme.primaryButton},
              ]}
              onPress={() => setOpen(true)}>
              <Text style={styles.primaryButtonText}>
                {t('Select Date & Time')}
              </Text>
            </TouchableOpacity>

            {selectedDateTime && (
              <Text style={[styles.datePreview, {color: theme.textPrimary}]}>
                {selectedDateTime.toLocaleString('bg-BG', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: false,
                })}
              </Text>
            )}

            <TouchableOpacity
              style={[
                styles.continueButton,
                {backgroundColor: theme.primaryButton},
              ]}
              onPress={handleContinue}>
              <Text style={styles.continueText}>{t('Continue')}</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        <Modal
          transparent
          visible={modalVisibleDeparture}
          animationType="slide">
          <TouchableWithoutFeedback onPress={closeDepartureModal}>
            <View style={styles.modalOverlay}>
              <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                <View
                  style={[
                    styles.modalContainer,
                    {backgroundColor: theme.cardBackground},
                  ]}>
                  <View
                    style={[
                      styles.searchInputWrapper,
                      {
                        backgroundColor: theme.isDark ? '#333' : '#fff',
                        borderColor: theme.isDark ? '#555' : '#ccc',
                      },
                    ]}>
                    <TextInput
                      placeholder={t('Search City')}
                      placeholderTextColor={theme.isDark ? '#aaa' : '#888'}
                      value={departureSearchText}
                      onChangeText={setDepartureSearchText}
                      onBlur={clearDepartureSearch}
                      style={[
                        styles.modalInput,
                        {
                          color: theme.isDark ? '#fff' : '#000',
                        },
                      ]}
                    />
                    {departureSearchText ? (
                      <TouchableOpacity
                        onPress={clearDepartureSearch}
                        hitSlop={{
                          top: 10,
                          bottom: 10,
                          left: 10,
                          right: 10,
                        }}>
                        <Icons
                          name="close"
                          size={20}
                          color={theme.isDark ? '#aaa' : '#666'}
                        />
                      </TouchableOpacity>
                    ) : null}
                  </View>

                  <FlatList
                    data={departureCities}
                    keyExtractor={item => String(item.id)}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                    renderItem={({item}) => {
                      const isMatch = departureSearchText
                        ? item.name
                            .toLowerCase()
                            .includes(departureSearchText.toLowerCase())
                        : false;

                      return (
                        <TouchableOpacity
                          style={{
                            paddingVertical: 14,
                            paddingHorizontal: 12,
                            borderBottomWidth: 1,
                            borderBottomColor: theme.isDark ? '#444' : '#ccc',
                            backgroundColor: theme.isDark ? '#222' : '#fff',
                          }}
                          activeOpacity={0.6}
                          onPress={() => {
                            setDepartureCityId(item.id);
                            setDepartureCity(item.name);
                            closeDepartureModal();
                          }}>
                          <Text
                            style={{
                              color: theme.isDark ? '#fff' : '#000',
                              fontSize: 16,
                          }}>
                            {isMatch
                              ? highlightMatch(item.name, departureSearchText)
                              : item.name}
                          </Text>
                        </TouchableOpacity>
                      );
                    }}
                  />
                </View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </Modal>

        <Modal transparent visible={modalVisibleArrival} animationType="slide">
          <TouchableWithoutFeedback onPress={closeArrivalModal}>
            <View style={styles.modalOverlay}>
              <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                <View
                  style={[
                    styles.modalContainer,
                    {backgroundColor: theme.cardBackground},
                  ]}>
                  <View
                    style={[
                      styles.searchInputWrapper,
                      {
                        backgroundColor: theme.isDark ? '#333' : '#fff',
                        borderColor: theme.isDark ? '#555' : '#ccc',
                      },
                    ]}>
                    <TextInput
                      placeholder={t('Search City')}
                      placeholderTextColor={theme.isDark ? '#aaa' : '#888'}
                      value={arrivalSearchText}
                      onChangeText={setArrivalSearchText}
                      onBlur={clearArrivalSearch}
                      style={[
                        styles.modalInput,
                        {
                          color: theme.isDark ? '#fff' : '#000',
                        },
                      ]}
                    />
                    {arrivalSearchText ? (
                      <TouchableOpacity
                        onPress={clearArrivalSearch}
                        hitSlop={{
                          top: 10,
                          bottom: 10,
                          left: 10,
                          right: 10,
                        }}>
                        <Icons
                          name="close"
                          size={20}
                          color={theme.isDark ? '#aaa' : '#666'}
                        />
                      </TouchableOpacity>
                    ) : null}
                  </View>

                  <FlatList
                    data={arrivalCities}
                    keyExtractor={item => String(item.id)}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                    renderItem={({item}) => {
                      const isMatch = arrivalSearchText
                        ? item.name
                            .toLowerCase()
                            .includes(arrivalSearchText.toLowerCase())
                        : false;

                      return (
                        <TouchableOpacity
                          style={{
                            paddingVertical: 14,
                            paddingHorizontal: 12,
                            borderBottomWidth: 1,
                            borderBottomColor: theme.isDark ? '#444' : '#ccc',
                            backgroundColor: theme.isDark ? '#222' : '#fff',
                          }}
                          activeOpacity={0.6}
                          onPress={() => {
                            setArrivalCityId(item.id);
                            setArrivalCity(item.name);
                            closeArrivalModal();
                          }}>
                          <Text
                            style={{
                              color: theme.isDark ? '#fff' : '#000',
                              fontSize: 16,
                          }}>
                            {isMatch
                              ? highlightMatch(item.name, arrivalSearchText)
                              : item.name}
                          </Text>
                        </TouchableOpacity>
                      );
                    }}
                  />
                </View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </Modal>

        <DatePicker
          modal
          open={open}
          date={date}
          mode="datetime"
          locale="bg-BG"
          is24hour={true}
          minimumDate={new Date()}
          theme={theme.isDark ? 'dark' : 'light'}
          onConfirm={selected => {
            setOpen(false);
            setDate(selected);
            setSelectedDateTime(selected);
          }}
          onCancel={() => setOpen(false)}
        />
      </SafeAreaView>
    </LinearGradient>
  );
}

export default SelectRouteScreen;

const styles = StyleSheet.create({
  wrapper: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },

  card: {
    borderRadius: 20,
    padding: 22,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 15,
    elevation: 8,
  },

  mainTitle: {
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 25,
    textAlign: 'center',
  },

  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 6,
    marginTop: 12,
  },

  selectBox: {
    height: 50,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
    paddingHorizontal: 15,
    marginBottom: 10,
  },

  inlineRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  input: {
    flex: 1,
    height: 50,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 15,
    marginRight: 8,
  },

  inputSmall: {
    width: 70,
    height: 50,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 10,
  },

  inputFull: {
    height: 50,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 15,
  },

  primaryButton: {
    marginTop: 20,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },

  primaryButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },

  continueButton: {
    marginTop: 20,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
  },

  continueText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 17,
  },

  datePreview: {
    textAlign: 'center',
    marginTop: 12,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  modalContainer: {
    width: '85%',
    maxHeight: '70%',
    borderRadius: 16,
    padding: 16,
  },

  modalInput: {
    flex: 1,
    height: 45,
    paddingHorizontal: 12,
    fontWeight: '600',
  },
  searchInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 45,
    borderWidth: 1,
    borderRadius: 12,
    paddingRight: 12,
    marginBottom: 12,
  },

  cityItem: {
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
});
