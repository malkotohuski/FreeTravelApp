import React, {useState, useLayoutEffect} from 'react';
import Icons from 'react-native-vector-icons/MaterialIcons';
import {useFocusEffect} from '@react-navigation/native';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Alert,
  Image,
  FlatList,
  Modal,
  ScrollView,
  SafeAreaView,
  TouchableWithoutFeedback,
} from 'react-native';
import DatePicker from 'react-native-date-picker';
import {useTranslation} from 'react-i18next';
import CitySelector from '../../server/Cities/cities';
import LinearGradient from 'react-native-linear-gradient';

function SelectRouteScreen({route, navigation}) {
  const {t, i18n} = useTranslation();
  const {selectedVehicle, registrationNumber} = route.params;

  const cities = CitySelector();
  const [filteredCities, setFilteredCities] = useState(cities.slice(0, 7));
  const [arrivalFilteredCities, setArrivalFilteredCities] = useState(
    cities.slice(0, 7),
  );

  const [departureSearchText, setDepartureSearchText] = useState('');
  const [arrivalSearchText, setArrivalSearchText] = useState('');

  const [date, setDate] = useState(new Date());
  const [open, setOpen] = useState(false);
  const [selectedDateTime, setSelectedDateTime] = useState(null);

  const [departureCity, setdepartureCity] = useState(null);
  const [departureStreet, setDepartureStreet] = useState('');
  const [departureNumber, setDepartureNumber] = useState('');

  const [arrivalCity, setarrivalCity] = useState(null);
  const [arrivalStreet, setArrivalStreet] = useState('');
  const [arrivalNumber, setArrivalNumber] = useState('');
  const [routeTitle, setRouteTitle] = useState('');

  const [modalVisibleDeparture, setModalVisibleDeparture] = useState(false);
  const [modalVisibleArrival, setModalVisibleArrival] = useState(false);

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
          <Text style={styles.headerText}>{t('Step 3 of 4')}</Text>
          <Icons name="keyboard-backspace" size={22} color="white" />
        </TouchableOpacity>
      ),
    });
  }, [navigation, selectedVehicle, registrationNumber]);

  useFocusEffect(
    React.useCallback(() => {
      setDepartureSearchText('');
      setArrivalSearchText('');
      setdepartureCity(null);
      setDepartureStreet('');
      setDepartureNumber('');
      setarrivalCity(null);
      setArrivalStreet('');
      setArrivalNumber('');
      setSelectedDateTime(null);
      setDate(new Date());
      setRouteTitle('');

      // 🧠 добави това:
      setFilteredCities(cities.slice(0, 7));
      setArrivalFilteredCities(cities.slice(0, 7));
    }, []),
  );

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
      selectedDateTime: formattedDateTime,
      departureCity,
      departureStreet,
      departureNumber,
      arrivalCity,
      arrivalStreet,
      arrivalNumber,
      routeTitle,
    });
  };

  const filterDepartureCities = text => {
    setDepartureSearchText(text);
    setFilteredCities(
      text.trim() === ''
        ? cities.slice(0, 7)
        : cities
            .filter(c => c.label.toLowerCase().includes(text.toLowerCase()))
            .slice(0, 7),
    );
  };

  const filterArrivalCities = text => {
    setArrivalSearchText(text);
    setArrivalFilteredCities(
      text.trim() === ''
        ? cities.slice(0, 7)
        : cities
            .filter(c => c.label.toLowerCase().includes(text.toLowerCase()))
            .slice(0, 7),
    );
  };

  const renderCityItem = ({item, onSelect}) => (
    <TouchableOpacity
      style={styles.cityItem}
      onPress={() => onSelect(item.label)}>
      <Text style={styles.cityItemText}>{item.label}</Text>
    </TouchableOpacity>
  );

  return (
    <LinearGradient
      colors={['#1b1b1b', '#2b2b2b', '#3b3b3b']}
      style={{flex: 1}}>
      <SafeAreaView style={{flex: 1}}>
        <ScrollView contentContainerStyle={styles.container}>
          {/* DEPARTURE */}
          <Text style={styles.sectionTitle}>{t('Departure')}</Text>
          <View style={styles.row}>
            <TouchableOpacity
              style={styles.citySelect}
              onPress={() => setModalVisibleDeparture(true)}>
              <Text style={styles.citySelectText}>
                {departureCity || t('Select City')}
              </Text>
            </TouchableOpacity>

            <TextInput
              placeholder={t('Street')}
              placeholderTextColor="#888"
              value={departureStreet}
              onChangeText={setDepartureStreet}
              style={styles.input}
            />
            <TextInput
              placeholder={t('No.')}
              placeholderTextColor="#888"
              value={departureNumber}
              onChangeText={setDepartureNumber}
              style={[styles.input, {width: 55}]}
            />
          </View>

          {/* ARRIVAL */}
          <Text style={styles.sectionTitle}>{t('Arrival')}</Text>
          <View style={styles.row}>
            <TouchableOpacity
              style={styles.citySelect}
              onPress={() => setModalVisibleArrival(true)}>
              <Text style={styles.citySelectText}>
                {arrivalCity || t('Select City')}
              </Text>
            </TouchableOpacity>

            <TextInput
              placeholder={t('Street')}
              placeholderTextColor="#888"
              value={arrivalStreet}
              onChangeText={setArrivalStreet}
              style={styles.input}
            />
            <TextInput
              placeholder={t('No.')}
              placeholderTextColor="#888"
              value={arrivalNumber}
              onChangeText={setArrivalNumber}
              style={[styles.input, {width: 55}]}
            />
          </View>

          {/* TITLE */}
          <Text style={styles.sectionTitle}>{t('Route Title')}</Text>
          <TextInput
            style={styles.titleInput}
            placeholder={t('Enter route title')}
            placeholderTextColor="#888"
            value={routeTitle}
            onChangeText={setRouteTitle}
            maxLength={40}
          />

          {/* DATE PICKER */}
          <TouchableOpacity
            style={styles.dateButton}
            onPress={() => setOpen(true)}>
            <Text style={styles.dateButtonText}>
              {t('Select date and time of departure')}
            </Text>
          </TouchableOpacity>

          <DatePicker
            modal
            open={open}
            date={date}
            mode="datetime"
            theme="dark"
            minimumDate={new Date()}
            locale="bg"
            onConfirm={selected => {
              setOpen(false);
              setDate(selected);
              setSelectedDateTime(selected);
            }}
            onCancel={() => setOpen(false)}
          />

          {selectedDateTime && (
            <View style={styles.dateDisplay}>
              <Text style={styles.dateText}>
                {selectedDateTime.toLocaleDateString(i18n.language, {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </Text>
              <Text style={styles.dateText}>
                {selectedDateTime.toLocaleTimeString(i18n.language, {
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: false,
                })}
              </Text>
            </View>
          )}

          {/* CONTINUE BUTTON */}
          <TouchableOpacity onPress={handleContinue} style={styles.continueBtn}>
            <Text style={styles.continueText}>{t('Continue')}</Text>
          </TouchableOpacity>

          {/* DEPARTURE MODAL */}
          <Modal transparent visible={modalVisibleDeparture}>
            <TouchableOpacity
              style={styles.modalOverlay}
              onPressOut={() => setModalVisibleDeparture(false)}>
              <TouchableWithoutFeedback>
                <View style={styles.modalContainer}>
                  <TextInput
                    placeholder={t('Search City')}
                    placeholderTextColor="#888"
                    value={departureSearchText}
                    onChangeText={filterDepartureCities}
                    style={styles.modalInput}
                  />
                  <FlatList
                    data={filteredCities}
                    renderItem={({item}) =>
                      renderCityItem({
                        item,
                        onSelect: city => {
                          setdepartureCity(city);
                          setModalVisibleDeparture(false);
                        },
                      })
                    }
                    keyExtractor={item => item.value}
                  />
                </View>
              </TouchableWithoutFeedback>
            </TouchableOpacity>
          </Modal>

          {/* ARRIVAL MODAL */}
          <Modal transparent visible={modalVisibleArrival}>
            <TouchableOpacity
              style={styles.modalOverlay}
              onPressOut={() => setModalVisibleArrival(false)}>
              <TouchableWithoutFeedback>
                <View style={styles.modalContainer}>
                  <TextInput
                    placeholder={t('Search City')}
                    placeholderTextColor="#888"
                    value={arrivalSearchText}
                    onChangeText={filterArrivalCities}
                    style={styles.modalInput}
                  />
                  <FlatList
                    data={arrivalFilteredCities}
                    renderItem={({item}) =>
                      renderCityItem({
                        item,
                        onSelect: city => {
                          setarrivalCity(city);
                          setModalVisibleArrival(false);
                        },
                      })
                    }
                    keyExtractor={item => item.value}
                  />
                </View>
              </TouchableWithoutFeedback>
            </TouchableOpacity>
          </Modal>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

export default SelectRouteScreen;

const styles = StyleSheet.create({
  container: {
    padding: 16,
    alignItems: 'center',
  },
  sectionTitle: {
    fontWeight: '700',
    fontSize: 18,
    marginVertical: 12,
    color: '#fff',
    alignSelf: 'flex-start',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    width: '100%',
    justifyContent: 'space-between',
  },
  citySelect: {
    flex: 1,
    height: 50,
    borderWidth: 1,
    borderColor: '#555',
    borderRadius: 8,
    justifyContent: 'center',
    paddingHorizontal: 10,
    backgroundColor: 'rgba(255,255,255,0.07)',
    marginRight: 8,
  },
  citySelectText: {
    color: '#fff',
    fontWeight: '600',
  },
  input: {
    flex: 1,
    height: 50,
    borderWidth: 1,
    borderColor: '#555',
    borderRadius: 8,
    paddingHorizontal: 10,
    backgroundColor: 'rgba(255,255,255,0.07)',
    color: '#fff',
    fontWeight: '600',
    marginHorizontal: 4,
  },
  titleInput: {
    width: '100%',
    height: 55,
    borderWidth: 1,
    borderColor: '#555',
    borderRadius: 8,
    paddingHorizontal: 10,
    backgroundColor: 'rgba(255,255,255,0.07)',
    color: '#fff',
    fontWeight: '600',
  },
  dateButton: {
    marginTop: 25,
    backgroundColor: '#f4511e',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 1.3,
    borderColor: '#fff',
  },
  dateButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
  },
  dateDisplay: {
    marginTop: 15,
    alignItems: 'center',
  },
  dateText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  continueBtn: {
    marginTop: 35,
    backgroundColor: '#f4511e',
    paddingVertical: 16,
    paddingHorizontal: 40,
    borderRadius: 10,
    borderWidth: 1.3,
    borderColor: '#fff',
  },
  continueText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 17,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: '#2c2c2c',
    borderRadius: 10,
    padding: 15,
    width: '90%',
    maxHeight: '70%',
  },
  modalInput: {
    height: 45,
    borderWidth: 1,
    borderColor: '#555',
    borderRadius: 8,
    paddingHorizontal: 10,
    marginBottom: 10,
    backgroundColor: 'rgba(255,255,255,0.07)',
    color: '#fff',
    fontWeight: '600',
  },
  cityItem: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#444',
  },
  cityItemText: {
    fontSize: 16,
    color: '#fff',
  },
  headerButton: {marginRight: 16, flexDirection: 'row', alignItems: 'center'},
  headerText: {color: 'white', marginRight: 6, fontSize: 16},
});
