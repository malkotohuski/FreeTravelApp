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
  ScrollView,
  SafeAreaView,
  TouchableWithoutFeedback,
} from 'react-native';
import DatePicker from 'react-native-date-picker';
import LinearGradient from 'react-native-linear-gradient';
import {useTranslation} from 'react-i18next';
import CitySelector from '../../server/Cities/cities';
import {useFocusEffect} from '@react-navigation/native';
import {useAuth} from '../../context/AuthContext';
import {useTheme} from '../../theme/useTheme';
import api from '../../api/api';

function Looking({navigation}) {
  const {t, i18n} = useTranslation();
  const cities = CitySelector();
  const {user, token} = useAuth();
  const theme = useTheme();

  const [isGenerating, setIsGenerating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const [departureCity, setDepartureCity] = useState(null);
  const [arrivalCity, setArrivalCity] = useState(null);
  const [departureSearch, setDepartureSearch] = useState('');
  const [arrivalSearch, setArrivalSearch] = useState('');
  const [modalDeparture, setModalDeparture] = useState(false);
  const [modalArrival, setModalArrival] = useState(false);
  const [routeTitle, setRouteTitle] = useState('');

  const [filteredDepartureCities, setFilteredDepartureCities] = useState(
    cities.slice(0, 7),
  );
  const [filteredArrivalCities, setFilteredArrivalCities] = useState(
    cities.slice(0, 7),
  );

  const [date, setDate] = useState(new Date());
  const [open, setOpen] = useState(false);
  const [selectedDateTime, setSelectedDateTime] = useState(null);

  const locale = i18n.language === 'bg' ? 'bg-BG' : 'en-US';

  useFocusEffect(
    useCallback(() => {
      setDepartureCity(null);
      setArrivalCity(null);
      setDepartureSearch('');
      setArrivalSearch('');
      setSelectedDateTime(null);
      setRouteTitle('');
    }, []),
  );

  const handleSearch = async () => {
    if (isGenerating || isSubmitting) return;

    if (!departureCity || !arrivalCity) {
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
        departureCity,
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

  const filterCities = (text, setFiltered, setSearch) => {
    setSearch(text);
    const filtered = cities.filter(city =>
      city.label.toLowerCase().includes(text.toLowerCase()),
    );
    setFiltered(filtered.slice(0, 7));
  };

  const renderCityItem = (item, setCity, closeModal, setSearch) => (
    <TouchableOpacity
      style={[styles.cityItem, {borderColor: theme.cardBorder}]}
      onPress={() => {
        setCity(item.label);
        closeModal(false);
        setSearch('');
      }}>
      <Text style={[styles.cityItemText, {color: theme.textPrimary}]}>
        {item.label}
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
            <TouchableWithoutFeedback onPress={() => setModalDeparture(false)}>
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
                      onChangeText={text =>
                        filterCities(
                          text,
                          setFilteredDepartureCities,
                          setDepartureSearch,
                        )
                      }
                    />
                    <FlatList
                      data={filteredDepartureCities}
                      keyExtractor={item => item.value}
                      renderItem={({item}) =>
                        renderCityItem(
                          item,
                          setDepartureCity,
                          setModalDeparture,
                          setDepartureSearch,
                        )
                      }
                    />
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
            <TouchableWithoutFeedback onPress={() => setModalArrival(false)}>
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
                      onChangeText={text =>
                        filterCities(
                          text,
                          setFilteredArrivalCities,
                          setArrivalSearch,
                        )
                      }
                    />
                    <FlatList
                      data={filteredArrivalCities}
                      keyExtractor={item => item.value}
                      renderItem={({item}) =>
                        renderCityItem(
                          item,
                          setArrivalCity,
                          setModalArrival,
                          setArrivalSearch,
                        )
                      }
                    />
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
