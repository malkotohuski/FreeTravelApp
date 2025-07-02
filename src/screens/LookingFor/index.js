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
  Button,
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
      // Ресет на стойностите при завръщане на екрана
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

    // Можеш да изпратиш заявка към сървъра тук или да навигираш към списък с резултати
    navigation.navigate('SearchResults', {
      departureCity,
      arrivalCity,
      date: selectedDateTime.toISOString(),
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

          <View style={{marginTop: 330}}>
            <Button
              title={t('Select date:')}
              onPress={() => setOpen(true)}
              color="#f4511e"
            />
            <DatePicker
              modal
              open={open}
              date={date}
              theme="dark"
              mode="date" // 👈 Само дата
              minimumDate={new Date()}
              onConfirm={selected => {
                setOpen(false);
                setSelectedDateTime(selected);
              }}
              onCancel={() => setOpen(false)}
            />
          </View>

          {selectedDateTime && (
            <Text
              style={{
                fontSize: 20,
                color: '#030303',
                fontWeight: 'bold',
                textAlign: 'center',
              }}>
              {t('Selected Date:')}{' '}
              {selectedDateTime.toLocaleDateString('bg-BG', {
                weekday: 'long',
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              })}
            </Text>
          )}

          <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
            <Text style={styles.searchButtonText}>{t('Continue')}</Text>
          </TouchableOpacity>
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
    marginTop: 20,
    padding: 10,
    backgroundColor: '#f4511e',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 20,
    fontWeight: 'bold',
    width: 150, // Adjust the width as needed
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
  dateText: {
    marginTop: 20,
    fontSize: 16,
    fontWeight: 'bold',
    color: 'black',
  },
});

export default Looking;
