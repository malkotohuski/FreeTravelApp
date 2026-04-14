import React, {useState, useCallback, useEffect} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Alert,
  FlatList,
  Modal,
  ScrollView,
  SafeAreaView,
  TouchableWithoutFeedback,
  Keyboard,
  ActivityIndicator,
} from 'react-native';
import DatePicker from 'react-native-date-picker';
import LinearGradient from 'react-native-linear-gradient';
import {useTranslation} from 'react-i18next';
import {useFocusEffect} from '@react-navigation/native';
import {useAuth} from '../../context/AuthContext';
import {useTheme} from '../../theme/useTheme';
import api from '../../api/api';
import {searchCities} from '../../api/cities.api';

function Looking({navigation}) {
  const {t, i18n} = useTranslation();
  const {user, token} = useAuth();
  const theme = useTheme();

  const [isGenerating, setIsGenerating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const [departureCityId, setDepartureCityId] = useState(null);
  const [departureCity, setDepartureCity] = useState(null);
  const [arrivalCityId, setArrivalCityId] = useState(null);
  const [arrivalCity, setArrivalCity] = useState(null);
  const [departureSearch, setDepartureSearch] = useState('');
  const [arrivalSearch, setArrivalSearch] = useState('');
  const [debouncedDepartureSearch, setDebouncedDepartureSearch] = useState('');
  const [debouncedArrivalSearch, setDebouncedArrivalSearch] = useState('');
  const [modalDeparture, setModalDeparture] = useState(false);
  const [modalArrival, setModalArrival] = useState(false);
  const [routeTitle, setRouteTitle] = useState('');
  const [filteredDepartureCities, setFilteredDepartureCities] = useState([]);
  const [filteredArrivalCities, setFilteredArrivalCities] = useState([]);
  const [departureLoading, setDepartureLoading] = useState(false);
  const [arrivalLoading, setArrivalLoading] = useState(false);

  const [date, setDate] = useState(new Date());
  const [open, setOpen] = useState(false);
  const [selectedDateTime, setSelectedDateTime] = useState(null);

  const locale = i18n.language === 'bg' ? 'bg-BG' : 'en-US';

  useFocusEffect(
    useCallback(() => {
      setDepartureCityId(null);
      setDepartureCity(null);
      setArrivalCityId(null);
      setArrivalCity(null);
      setDepartureSearch('');
      setArrivalSearch('');
      setDebouncedDepartureSearch('');
      setDebouncedArrivalSearch('');
      setFilteredDepartureCities([]);
      setFilteredArrivalCities([]);
      setSelectedDateTime(null);
      setRouteTitle('');
    }, []),
  );

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setDebouncedDepartureSearch(departureSearch);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [departureSearch]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setDebouncedArrivalSearch(arrivalSearch);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [arrivalSearch]);

  useEffect(() => {
    const loadDepartureCities = async () => {
      if (!modalDeparture) return;

      try {
        setDepartureLoading(true);
        const cities = await searchCities(debouncedDepartureSearch);
        setFilteredDepartureCities(cities);
      } catch (error) {
        console.error('Failed to load departure cities:', error);
        setFilteredDepartureCities([]);
      } finally {
        setDepartureLoading(false);
      }
    };

    loadDepartureCities();
  }, [debouncedDepartureSearch, modalDeparture]);

  useEffect(() => {
    const loadArrivalCities = async () => {
      if (!modalArrival) return;

      try {
        setArrivalLoading(true);
        const cities = await searchCities(debouncedArrivalSearch);
        setFilteredArrivalCities(cities);
      } catch (error) {
        console.error('Failed to load arrival cities:', error);
        setFilteredArrivalCities([]);
      } finally {
        setArrivalLoading(false);
      }
    };

    loadArrivalCities();
  }, [debouncedArrivalSearch, modalArrival]);

  const clearDepartureSearch = () => {
    setDepartureSearch('');
    setDebouncedDepartureSearch('');
    setFilteredDepartureCities([]);
  };

  const clearArrivalSearch = () => {
    setArrivalSearch('');
    setDebouncedArrivalSearch('');
    setFilteredArrivalCities([]);
  };

  const closeDepartureModal = () => {
    Keyboard.dismiss();
    clearDepartureSearch();
    setModalDeparture(false);
  };

  const closeArrivalModal = () => {
    Keyboard.dismiss();
    clearArrivalSearch();
    setModalArrival(false);
  };

  const handleSearch = async () => {
    if (isGenerating || isSubmitting) return;

    if (!departureCity || !arrivalCity || !departureCityId || !arrivalCityId) {
      Alert.alert(t('Error'), t('pleaseSelectBothDepartureArrivalCities'));
      return;
    }

    if (!selectedDateTime || isNaN(selectedDateTime.getTime())) {
      Alert.alert(t('Error'), t('selectDateTime'));
      return;
    }

    if (!token) {
      Alert.alert(t('Error'), t('User is not logged in.'));
      return;
    }

    setIsGenerating(true);
    setIsSubmitting(true);

    try {
      const response = await api.post('/api/seekers', {
        departureCityId,
        departureCity,
        arrivalCityId,
        arrivalCity,
        selectedDateTime,
        routeTitle,
      });

      const responseData = response.data;

      setSuccessMessage(t('The route has been created!'));

      Alert.alert(
        t('Success'),
        t('The route has been created!'),
        [
          {
            text: t('OK'),
            onPress: () => {
              setSuccessMessage('');
              setIsGenerating(false);
              setIsSubmitting(false);
              navigation.navigate('Seekers', {seeker: responseData});
            },
          },
        ],
        {cancelable: false},
      );
    } catch (error) {
      console.log('FULL ERROR:', error);

      if (error.response?.status === 429) {
        Alert.alert(t('limitReached'), t('youHaveReachedMaximum'));
      } else {
        Alert.alert(
          t('Error'),
          error.response?.data?.error || 'Failed to create route.',
        );
      }

      setIsGenerating(false);
      setIsSubmitting(false);
    }
  };

  const renderCityItem = (item, setCityId, setCity, closeModal) => (
    <TouchableOpacity
      style={[styles.cityItem, {borderColor: theme.cardBorder}]}
      onPress={() => {
        setCityId(item.id);
        setCity(item.name);
        closeModal();
      }}>
      <Text style={[styles.cityItemText, {color: theme.textPrimary}]}>
        {item.name}
      </Text>
    </TouchableOpacity>
  );

  return (
    <LinearGradient colors={theme.gradient} style={styles.gradient}>
      <SafeAreaView style={{flex: 1}}>
        <ScrollView contentContainerStyle={styles.scroll}>
          <Text style={[styles.title, {color: theme.textPrimary}]}>
            {t('lookingRorARoute')}
          </Text>

          <Text style={[styles.label, {color: theme.textSecondary}]}>
            {t('Departure')}
          </Text>
          <TouchableOpacity
            style={[
              styles.selectButton,
              {
                backgroundColor: theme.inputBackground,
                borderColor: theme.cardBorder,
              },
            ]}
            onPress={() => setModalDeparture(true)}>
            <Text style={[styles.selectButtonText, {color: theme.textPrimary}]}>
              {departureCity || t('Select City')}
            </Text>
          </TouchableOpacity>

          <Modal visible={modalDeparture} transparent animationType="slide">
            <TouchableWithoutFeedback onPress={closeDepartureModal}>
              <View
                style={{
                  flex: 1,
                  backgroundColor: 'rgba(0,0,0,0.5)',
                  justifyContent: 'center',
                  alignItems: 'center',
                }}>
                <TouchableWithoutFeedback>
                  <View
                    style={[
                      styles.modalContainer,
                      {
                        backgroundColor: theme.cardBackground,
                        borderColor: theme.cardBorder,
                      },
                    ]}>
                    <TextInput
                      placeholder={t('Search City')}
                      placeholderTextColor={theme.textSecondary}
                      style={[
                        styles.input,
                        {
                          backgroundColor: theme.inputBackground,
                          color: theme.textPrimary,
                          borderColor: theme.cardBorder,
                        },
                      ]}
                      value={departureSearch}
                      onChangeText={setDepartureSearch}
                    />
                    {departureLoading ? (
                      <ActivityIndicator
                        size="small"
                        color={theme.primaryButton}
                        style={{marginVertical: 12}}
                      />
                    ) : (
                      <FlatList
                        data={filteredDepartureCities}
                        keyExtractor={item => item.id.toString()}
                        keyboardShouldPersistTaps="handled"
                        ListEmptyComponent={
                          <Text
                            style={{
                              color: theme.textSecondary,
                              textAlign: 'center',
                              paddingVertical: 12,
                            }}>
                            {t('No cities found')}
                          </Text>
                        }
                        renderItem={({item}) =>
                          renderCityItem(
                            item,
                            setDepartureCityId,
                            setDepartureCity,
                            closeDepartureModal,
                          )
                        }
                      />
                    )}
                  </View>
                </TouchableWithoutFeedback>
              </View>
            </TouchableWithoutFeedback>
          </Modal>

          <Text style={[styles.label, {color: theme.textSecondary}]}>
            {t('Arrival')}
          </Text>
          <TouchableOpacity
            style={[
              styles.selectButton,
              {
                backgroundColor: theme.inputBackground,
                borderColor: theme.cardBorder,
              },
            ]}
            onPress={() => setModalArrival(true)}>
            <Text style={[styles.selectButtonText, {color: theme.textPrimary}]}>
              {arrivalCity || t('Select City')}
            </Text>
          </TouchableOpacity>

          <Modal visible={modalArrival} transparent animationType="slide">
            <TouchableWithoutFeedback onPress={closeArrivalModal}>
              <View
                style={{
                  flex: 1,
                  backgroundColor: 'rgba(0,0,0,0.5)',
                  justifyContent: 'center',
                  alignItems: 'center',
                }}>
                <TouchableWithoutFeedback>
                  <View
                    style={[
                      styles.modalContainer,
                      {
                        backgroundColor: theme.cardBackground,
                        borderColor: theme.cardBorder,
                      },
                    ]}>
                    <TextInput
                      placeholder={t('Search City')}
                      placeholderTextColor={theme.textSecondary}
                      style={[
                        styles.input,
                        {
                          backgroundColor: theme.inputBackground,
                          color: theme.textPrimary,
                          borderColor: theme.cardBorder,
                        },
                      ]}
                      value={arrivalSearch}
                      onChangeText={setArrivalSearch}
                    />
                    {arrivalLoading ? (
                      <ActivityIndicator
                        size="small"
                        color={theme.primaryButton}
                        style={{marginVertical: 12}}
                      />
                    ) : (
                      <FlatList
                        data={filteredArrivalCities}
                        keyExtractor={item => item.id.toString()}
                        keyboardShouldPersistTaps="handled"
                        ListEmptyComponent={
                          <Text
                            style={{
                              color: theme.textSecondary,
                              textAlign: 'center',
                              paddingVertical: 12,
                            }}>
                            {t('No cities found')}
                          </Text>
                        }
                        renderItem={({item}) =>
                          renderCityItem(
                            item,
                            setArrivalCityId,
                            setArrivalCity,
                            closeArrivalModal,
                          )
                        }
                      />
                    )}
                  </View>
                </TouchableWithoutFeedback>
              </View>
            </TouchableWithoutFeedback>
          </Modal>

          <Text style={[styles.label, {color: theme.textSecondary}]}>
            {t('Route Information')}
          </Text>
          <TextInput
            style={[
              styles.routeInput,
              {
                backgroundColor: theme.inputBackground,
                color: theme.textPrimary,
                borderColor: theme.cardBorder,
                textAlign: 'center',
              },
            ]}
            placeholder={t('Enter route title')}
            placeholderTextColor={theme.textSecondary}
            value={routeTitle}
            onChangeText={setRouteTitle}
            maxLength={30}
          />

          {selectedDateTime && (
            <View
              style={[
                styles.selectedDateContainer,
                {
                  backgroundColor: theme.inputBackground,
                  borderColor: theme.cardBorder,
                },
              ]}>
              <Text
                style={[
                  styles.selectedDateLabel,
                  {color: theme.textSecondary},
                ]}>
                {t('selectedDate')}
              </Text>
              <Text
                style={[styles.selectedDateText, {color: theme.primaryButton}]}>
                {selectedDateTime.toLocaleDateString(i18n.language, {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </Text>
            </View>
          )}

          <TouchableOpacity style={styles.button} onPress={() => setOpen(true)}>
            <Text style={styles.buttonText}>{t('selectDate')}</Text>
          </TouchableOpacity>

          {/*  <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
            <Text style={styles.searchButtonText}>{t('Continue')}</Text>
          </TouchableOpacity> */}

          {isGenerating ? (
            <Text style={[styles.loadingText, {color: theme.primaryButton}]}>
              {t('Generating route...')}
            </Text>
          ) : (
            <TouchableOpacity
              style={styles.searchButton}
              onPress={handleSearch}>
              <Text style={styles.searchButtonText}>{t('Continue')}</Text>
            </TouchableOpacity>
          )}

          <DatePicker
            modal
            open={open}
            date={date}
            mode="date" // <- само дата, без час и минути
            theme="dark"
            minimumDate={new Date()}
            locale={locale}
            title={t('selectDate')}
            cancelText={t('Cancel')}
            confirmText={t('Confirm')}
            onConfirm={selected => {
              setOpen(false);
              setDate(selected);
              setSelectedDateTime(selected);
            }}
            onCancel={() => setOpen(false)}
          />
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {flex: 1, justifyContent: 'center', alignItems: 'center'},
  scroll: {alignItems: 'center', paddingVertical: 30, gap: 15},
  title: {fontSize: 24, fontWeight: '700', marginBottom: 10},
  label: {fontSize: 18, fontWeight: '600', marginTop: 10},

  selectButton: {
    height: 55,
    width: 340,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    marginTop: 5,
  },
  selectButtonText: {fontSize: 17, fontWeight: '600'},

  input: {
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 10,
  },

  modalContainer: {
    width: '90%', // по-широк модал
    maxHeight: '80%', // да не заема целия екран, ако има много градове
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ccc', // по-мека рамка
    backgroundColor: '#fff', // временно, после theme.cardBackground
  },
  cityItem: {padding: 12, borderBottomWidth: 1},
  cityItemText: {fontSize: 16, fontWeight: '500'},

  routeInput: {
    width: '90%',
    height: 60,
    paddingHorizontal: 15,
    fontSize: 17,
    borderRadius: 10,
    borderWidth: 1,
    marginTop: 5,
  },
  selectedDateContainer: {
    marginTop: 15,
    padding: 10,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
  },
  selectedDateLabel: {fontSize: 16},
  selectedDateText: {fontSize: 18, fontWeight: '700'},

  button: {
    backgroundColor: '#f4511e',
    borderRadius: 10,
    width: 200,
    height: 55,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    textAlign: 'center',
  },

  searchButton: {
    backgroundColor: '#f4511e',
    borderRadius: 10,
    width: 200,
    height: 55,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 15,
  },
  searchButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    textAlign: 'center',
  },
  loadingText: {marginTop: 10, fontWeight: '600'},
});

export default Looking;
