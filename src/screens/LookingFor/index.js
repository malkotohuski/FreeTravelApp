import React, {useState, useLayoutEffect} from 'react';
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
  Image,
} from 'react-native';
import DatePicker from 'react-native-date-picker';
import {useTranslation} from 'react-i18next';
import CitySelector from '../../server/Cities/cities';
import {useFocusEffect} from '@react-navigation/native';
import {useCallback} from 'react';

function Looking({navigation}) {
  const {t} = useTranslation();
  const cities = CitySelector();

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

  useFocusEffect(
    useCallback(() => {
      setDepartureCity(null);
      setArrivalCity(null);
      setDepartureSearch('');
      setArrivalSearch('');
      setSelectedDateTime(null);
    }, []),
  );

  const handleSearch = () => {
    if (!departureCity || !arrivalCity) {
      Alert.alert(
        t('Error'),
        t('Please select both departure and arrival cities.'),
      );
      return;
    }

    if (!selectedDateTime || isNaN(selectedDateTime.getTime())) {
      Alert.alert(t('Error'), t('Please select a valid date and time.'));
      return;
    }

    navigation.navigate('SearchResults', {
      departureCity,
      arrivalCity,
      date: selectedDateTime.toISOString(),
      routeTitle, // 👈 добавено
    });
  };

  const filterCities = (text, setFiltered, listSetter) => {
    listSetter(text);
    const filtered = cities.filter(city =>
      city.label.toLowerCase().includes(text.toLowerCase()),
    );
    setFiltered(filtered.slice(0, 7));
  };

  const renderCityItem = (item, setCity, closeModal) => (
    <TouchableOpacity
      style={styles.cityItem}
      onPress={() => {
        setCity(item.label);
        closeModal(false);
      }}>
      <Text style={styles.cityItemText}>{item.label}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={{flex: 1}}>
      <ScrollView contentContainerStyle={{flexGrow: 1}}>
        <View style={{flex: 1, alignItems: 'center'}}>
          <Image
            source={require('../../../images/road-wallpapers-reporting.jpg')}
            style={{
              position: 'absolute',
              width: '100%',
              height: '100%',
              resizeMode: 'cover',
            }}
          />
          <Text style={styles.label}>{t('Departure')}</Text>
          <TouchableOpacity
            style={styles.citySelectButton}
            onPress={() => setModalDeparture(true)}>
            <Text style={styles.citySelectButtonText}>
              {departureCity || t('Select City')}
            </Text>
          </TouchableOpacity>
          <Modal visible={modalDeparture} transparent animationType="slide">
            <View style={styles.modalContainer}>
              <TextInput
                placeholder={t('Search City')}
                style={styles.input}
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
                  renderCityItem(item, setDepartureCity, setModalDeparture)
                }
              />
            </View>
          </Modal>

          <Text style={styles.label}>{t('Arrival')}</Text>
          <TouchableOpacity
            style={styles.citySelectButton}
            onPress={() => setModalArrival(true)}>
            <Text style={styles.citySelectButtonText}>
              {arrivalCity || t('Select City')}
            </Text>
          </TouchableOpacity>
          <Modal visible={modalArrival} transparent animationType="slide">
            <View style={styles.modalContainer}>
              <TextInput
                placeholder={t('Search City')}
                style={styles.input}
                value={arrivalSearch}
                onChangeText={text =>
                  filterCities(text, setFilteredArrivalCities, setArrivalSearch)
                }
              />
              <FlatList
                data={filteredArrivalCities}
                keyExtractor={item => item.value}
                renderItem={({item}) =>
                  renderCityItem(item, setArrivalCity, setModalArrival)
                }
              />
            </View>
          </Modal>

          <Text style={styles.label}>{t('Route Information')}</Text>
          <TextInput
            style={styles.routeTitleInput}
            placeholder={t('Enter route title')}
            value={routeTitle}
            onChangeText={setRouteTitle}
            placeholderTextColor="#888"
          />

          {/* Секция с дата и бутони */}
          <View style={{marginTop: 60, alignItems: 'center', gap: 12}}>
            {selectedDateTime && (
              <View style={styles.selectedDateContainer}>
                <Text style={styles.selectedDateLabel}>
                  {t('Selected Date:')}
                </Text>
                <Text style={styles.selectedDateText}>
                  {selectedDateTime.toLocaleDateString('bg-BG', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </Text>
              </View>
            )}

            <TouchableOpacity
              style={styles.button}
              onPress={() => setOpen(true)}>
              <Text style={styles.buttonText}>{t('Select date:')}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.searchButton}
              onPress={handleSearch}>
              <Text style={styles.searchButtonText}>{t('Continue')}</Text>
            </TouchableOpacity>
          </View>

          <DatePicker
            modal
            open={open}
            date={date}
            theme="dark"
            mode="date"
            minimumDate={new Date()}
            onConfirm={selected => {
              setOpen(false);
              setSelectedDateTime(selected);
            }}
            onCancel={() => setOpen(false)}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  citySelectButton: {
    height: 60,
    width: 350,
    borderColor: 'black',
    borderWidth: 1.5,
    borderRadius: 8,
    paddingHorizontal: 8,
    justifyContent: 'center',
    backgroundColor: 'white',
    marginTop: 10,
  },
  citySelectButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'black',
    textAlign: 'center',
  },
  modalContainer: {
    marginTop: 100,
    backgroundColor: 'white',
    padding: 20,
  },
  cityItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderColor: '#ccc',
  },
  cityItemText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  input: {
    backgroundColor: '#f0f0f0',
    padding: 10,
    marginBottom: 10,
    borderRadius: 8,
  },
  label: {
    fontSize: 20,
    marginTop: 20,
    fontWeight: 'bold',
    color: 'black',
  },
  searchButton: {
    marginTop: 10,
    padding: 12,
    backgroundColor: '#f4511e',
    alignItems: 'center',
    justifyContent: 'center',
    width: 180,
    height: 60,
    borderWidth: 2,
    borderColor: '#f1f1f1',
    borderRadius: 8,
  },
  searchButtonText: {
    fontSize: 18,
    color: 'white',
    fontWeight: 'bold',
  },
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 10,
    elevation: 3,
    backgroundColor: '#f4511e',
    borderWidth: 2,
    borderColor: '#f1f1f1',
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  routeTitleInput: {
    width: 350,
    height: 70,
    backgroundColor: '#ffffffcc', // лек прозрачен бял
    paddingHorizontal: 15,
    paddingVertical: 10,
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#ccc',
    marginBottom: 20,
  },

  selectedDateContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  selectedDateLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  selectedDateText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#f4511e',
    textAlign: 'center',
  },
});

export default Looking;
