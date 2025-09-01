import React, {useState, useLayoutEffect} from 'react';
import Icons from 'react-native-vector-icons/MaterialIcons';
import {useFocusEffect} from '@react-navigation/native';
import {
  View,
  Text,
  TouchableOpacity,
  Button,
  TextInput,
  StyleSheet,
  Alert,
  Image,
  FlatList,
  Modal,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import DatePicker from 'react-native-date-picker';
import {useTranslation} from 'react-i18next';
import CitySelector from '../../server/Cities/cities';

function SelectRouteScreen({route, navigation}) {
  const {t, i18n} = useTranslation();
  const {selectedVehicle, registrationNumber} = route.params;

  const cities = CitySelector();
  const [filteredCities, setFilteredCities] = useState(cities.slice(0, 7)); // Load the first 7 cities initially
  const [arrivalFilteredCities, setArrivalFilteredCities] = useState(
    cities.slice(0, 7),
  ); // Load the first 7 arrival cities initially
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

  const [searchText, setSearchText] = useState('');

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity
          style={{marginRight: 16, flexDirection: 'row', alignItems: 'center'}}
          onPress={() =>
            navigation.navigate('Mark Seats', {
              selectedVehicle,
              registrationNumber,
            })
          }>
          <Text style={{color: 'white', marginRight: 8, fontSize: 18}}>
            {t('Step 3 of 4')}
          </Text>
          <Icons name="keyboard-backspace" size={24} color="white" />
        </TouchableOpacity>
      ),
    });
  }, [navigation, selectedVehicle, registrationNumber]);

  useFocusEffect(
    React.useCallback(() => {
      // Нулиране на състоянието, когато екранът стане активен
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
      // Връщане на функция за "почистване", ако е нужно
      return () => {
        // Тук може да се добавят действия за почистване (ако има такива)
      };
    }, []),
  );

  const continueButtonStyle = {
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
  };

  const handleContinue = () => {
    // Validate that a city is selected
    if (!departureCity) {
      Alert.alert(t('Error'), t('Please select a city!'));
      return;
    }

    // Validate that departure street is entered
    /*    if (!departureStreet.trim()) {
               Alert.alert(t('Error'), t('Please select a street!'));
               return;
           }
   
           // Validate that departure number is entered
           if (!departureNumber.trim()) {
               Alert.alert(t('Error'), t('Please enter a number!'));
               return;
           } */

    if (!arrivalCity) {
      Alert.alert(t('Error'), t('Please select a city!'));
      return;
    }

    // Validate that arrival street is entered
    /*      if (!arrivalStreet.trim()) {
                 Alert.alert(t('Error'), t('Please select a street!'));
                 return;
             }
     
             // Validate that arrival number is entered
             if (!arrivalNumber.trim()) {
                 Alert.alert(t('Error'), t('Please enter a number!'));
                 return;
             } */

    // Validate that a valid date and time are selected
    if (!selectedDateTime || isNaN(selectedDateTime.getTime())) {
      Alert.alert(t('Error'), t('Please select a date and time!'));
      return;
    }

    // If all validations pass, proceed to the next screen
    console.log(
      selectedVehicle,
      registrationNumber,
      selectedDateTime,
      departureCity,
      departureStreet,
      departureNumber,
      arrivalCity,
      arrivalStreet,
      arrivalNumber,
      routeTitle,
    );

    // Navigate to the "Confirm" screen and pass the necessary parameters
    if (selectedDateTime) {
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
    } else {
      console.error('selectedDateTime is null or undefined');
    }
  };

  const renderCityItem = ({item, setModalVisible}) =>
    item && (
      <TouchableOpacity
        style={styles.cityItem}
        onPress={() => {
          setdepartureCity(item.label);
          setModalVisible(false);
          setSearchText('');
        }}>
        <Text style={styles.cityItemText}>{item.label}</Text>
      </TouchableOpacity>
    );

  const renderArrivalCityItem = ({
    item,
    setModalVisible: setModalVisibleArrival,
  }) =>
    item && (
      <TouchableOpacity
        style={styles.cityItem}
        onPress={() => {
          setarrivalCity(item.label);
          setModalVisibleArrival(false);
          setSearchText('');
        }}>
        <Text style={styles.cityItemText}>{item.label}</Text>
      </TouchableOpacity>
    );

  const filterDepartureCities = text => {
    setDepartureSearchText(text);
    if (text === '') {
      setFilteredCities(cities.slice(0, 7));
    } else {
      const filteredCities = cities.filter(city =>
        city.label.toLowerCase().includes(text.toLowerCase()),
      );
      setFilteredCities(filteredCities.slice(0, 7));
    }
  };

  const filterArrivalCities = text => {
    setArrivalSearchText(text);
    if (text === '') {
      setArrivalFilteredCities(cities.slice(0, 7));
    } else {
      const filteredCities = cities.filter(city =>
        city.label.toLowerCase().includes(text.toLowerCase()),
      );
      setArrivalFilteredCities(filteredCities.slice(0, 7));
    }
  };

  return (
    <SafeAreaView style={{flex: 1}}>
      <ScrollView contentContainerStyle={{flexGrow: 1}}>
        <View
          style={{flex: 1, justifyContent: 'flex-start', alignItems: 'center'}}>
          <Image
            source={require('../../../images/forests.jpg')}
            style={{
              flex: 1,
              width: '100%',
              height: '100%',
              resizeMode: 'cover',
              position: 'absolute',
            }}
          />
          <Text
            style={{
              fontWeight: 'bold',
              fontSize: 20,
              marginTop: 20,
              color: 'black',
            }}>
            {t('Departure:')}
          </Text>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              marginBottom: 25,
            }}>
            <View style={{flex: 1, marginRight: 10, color: 'black'}}>
              <TouchableOpacity
                style={styles.citySelectButton}
                onPress={() => setModalVisibleDeparture(true)}>
                <Text style={styles.citySelectButtonText}>
                  {departureCity ? departureCity : t('Select City')}
                </Text>
              </TouchableOpacity>
              <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisibleDeparture}
                onRequestClose={() => {
                  setModalVisibleDeparture(false);
                }}>
                <View style={styles.modalContainer}>
                  <TextInput
                    placeholder="Search City"
                    placeholderTextColor={'#010101'}
                    value={departureSearchText}
                    onChangeText={text => filterDepartureCities(text)}
                    style={{
                      height: 40,
                      borderColor: 'black',
                      backgroundColor: 'grey',
                      borderWidth: 1.5,
                      borderRadius: 8,
                      paddingHorizontal: 8,
                      fontSize: 16,
                      fontWeight: 'bold',
                      marginBottom: 10,
                    }}
                  />
                  <FlatList
                    style={{zIndex: 1, position: 'relative'}}
                    data={filteredCities}
                    renderItem={({item}) =>
                      renderCityItem({
                        item,
                        setModalVisible: setModalVisibleDeparture,
                      })
                    }
                    keyExtractor={item => item.value}
                  />
                </View>
              </Modal>
            </View>
            <View style={{flex: 1, marginLeft: 10}}>
              <TextInput
                placeholder={t('Street')}
                placeholderTextColor={'#010101'}
                value={departureStreet}
                onChangeText={text => setDepartureStreet(text)}
                style={{
                  height: 70,
                  width: 100,
                  borderColor: 'black',
                  borderWidth: 1.5,
                  borderRadius: 8,
                  paddingHorizontal: 8,
                  fontSize: 16,
                  fontWeight: 'bold',
                }}
              />
            </View>
            <TextInput
              placeholder={t('Number')}
              placeholderTextColor={'#010101'}
              value={departureNumber}
              onChangeText={text => setDepartureNumber(text)}
              keyboardType="default"
              style={{
                height: 70,
                width: 50,
                borderColor: 'black',
                borderWidth: 1.5,
                borderRadius: 8,
                paddingHorizontal: 8,
                fontSize: 16,
                fontWeight: 'bold',
              }}
            />
          </View>

          <View style={{padding: 20}}></View>
          <Text
            style={{
              fontWeight: 'bold',
              fontSize: 20,
              marginTop: 20,
              color: 'black',
            }}>
            {t('Arrival:')}
          </Text>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              marginBottom: 10,
            }}>
            <View style={{flex: 1, marginRight: 10}}>
              <TouchableOpacity
                style={styles.citySelectButton}
                onPress={() => setModalVisibleArrival(true)}>
                <Text style={styles.citySelectButtonText}>
                  {arrivalCity ? arrivalCity : t('Select City')}
                </Text>
              </TouchableOpacity>
              <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisibleArrival}
                onRequestClose={() => {
                  setModalVisibleArrival(false);
                }}>
                <View style={styles.modalContainer}>
                  <TextInput
                    placeholder="Search City"
                    placeholderTextColor={'#010101'}
                    value={arrivalSearchText}
                    onChangeText={text => filterArrivalCities(text)}
                    style={{
                      height: 40,
                      borderColor: 'black',
                      backgroundColor: 'grey',
                      borderWidth: 1.5,
                      borderRadius: 8,
                      paddingHorizontal: 8,
                      fontSize: 16,
                      fontWeight: 'bold',
                      marginBottom: 10,
                    }}
                  />
                  <FlatList
                    style={{zIndex: 1, position: 'relative'}}
                    data={arrivalFilteredCities}
                    renderItem={({item}) =>
                      renderArrivalCityItem({
                        item,
                        setModalVisible: setModalVisibleArrival,
                      })
                    }
                    keyExtractor={item => item.value}
                  />
                </View>
              </Modal>
            </View>
            <View style={{flex: 1, marginLeft: 10}}>
              <TextInput
                placeholder={t('Street')}
                placeholderTextColor={'#010101'}
                value={arrivalStreet}
                onChangeText={text => setArrivalStreet(text)}
                style={{
                  height: 70,
                  width: 100,
                  borderColor: 'black',
                  borderWidth: 1.5,
                  borderRadius: 8,
                  paddingHorizontal: 8,
                  fontSize: 16,
                  fontWeight: 'bold',
                  color: 'black',
                }}
              />
            </View>
            <TextInput
              placeholder={t('Number')}
              placeholderTextColor={'#010101'}
              value={arrivalNumber}
              onChangeText={text => setArrivalNumber(text)}
              keyboardType="default"
              style={{
                height: 70,
                width: 50,
                borderColor: 'black',
                borderWidth: 1.5,
                borderRadius: 8,
                paddingHorizontal: 8,
                fontSize: 16,
                fontWeight: 'bold',
              }}
            />
          </View>

          <Text
            style={{
              fontWeight: 'bold',
              fontSize: 20,
              marginTop: 20,
              color: 'black',
            }}>
            {t('Route Title:')}
          </Text>
          <TextInput
            style={{
              height: 60,
              width: '90%',
              borderColor: 'black',
              borderWidth: 1.5,
              borderRadius: 8,
              paddingHorizontal: 10,
              fontSize: 18,
              fontWeight: 'bold',
              color: 'black',
              backgroundColor: '#fff',
              marginBottom: 20,
            }}
            placeholder={t('Enter route title')}
            placeholderTextColor="#888"
            value={routeTitle}
            onChangeText={setRouteTitle}
          />
          <View
            style={{
              flex: 1,
              justifyContent: 'center',
              alignItems: 'center',
              marginTop: 100,
              paddingBottom: 1,
            }}>
            <Button
              style={[styles.button, {marginTop: 10}]}
              title={t('Select date and time of departure')}
              onPress={() => setOpen(true)}
              color="#f4511e"
              titleStyle={{marginHorizontal: 30, color: 'black'}}
            />

            <DatePicker
              modal
              open={open}
              date={date}
              theme="dark"
              is24Hour={true}
              mode="datetime"
              minimumDate={new Date()}
              onConfirm={selectedDate => {
                setOpen(false);
                setDate(selectedDate);
                setSelectedDateTime(selectedDate);
              }}
              onCancel={() => {
                setOpen(false);
              }}
            />

            {selectedDateTime && (
              <View style={{marginTop: 10, alignItems: 'center'}}>
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
                  })}
                </Text>
              </View>
            )}

            <TouchableOpacity
              onPress={handleContinue}
              style={[continueButtonStyle, {marginTop: 50}]} // Move the button further down
            >
              <Text style={{color: '#fff', fontSize: 16, fontWeight: 'bold'}}>
                {t('Continue')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

export default SelectRouteScreen;

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f0f0f0',
    padding: 16,
  },
  dropdown: {
    height: 70,
    width: 180,
    borderColor: 'black',
    borderWidth: 1.5,
    borderRadius: 8,
    paddingHorizontal: 8,
  },
  icon: {
    marginRight: 5,
  },
  label: {
    position: 'absolute',
    backgroundColor: '#f0f0f0',
    left: 22,
    top: 8,
    zIndex: 999,
    paddingHorizontal: 8,
    fontSize: 14,
  },
  placeholderStyle: {
    fontSize: 14,
    fontWeight: 900,
    color: 'black',
  },
  selectedTextStyle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'black',
  },
  iconStyle: {
    width: 20,
    height: 20,
  },
  inputSearchStyle: {
    height: 40,
    fontSize: 16,
  },
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 8,
    elevation: 3,
    backgroundColor: 'black',
    fontSize: 16,
    fontWeight: 'bold',
    borderWidth: 2,
    borderColor: '#f1f1f1',
  },
  modalContainer: {
    backgroundColor: '#f0f0f0',
    padding: 16,
    marginTop: 100,
  },
  citySelectButton: {
    height: 70,
    width: 150,
    borderColor: 'black',
    borderWidth: 1.5,
    borderRadius: 8,
    paddingHorizontal: 8,
    justifyContent: 'center',
  },
  citySelectButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: 'black',
  },
  cityItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f1f1',
  },
  cityItemText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'black',
  },
  dateText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#030303',
    textAlign: 'center',
    marginVertical: 5,
  },
});
