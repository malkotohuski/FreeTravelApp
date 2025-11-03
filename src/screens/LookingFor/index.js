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
} from 'react-native';
import DatePicker from 'react-native-date-picker';
import LinearGradient from 'react-native-linear-gradient';
import {useTranslation} from 'react-i18next';
import CitySelector from '../../server/Cities/cities';
import {useFocusEffect} from '@react-navigation/native';
import {useAuth} from '../../context/AuthContext';

function Looking({navigation}) {
  const {t, i18n} = useTranslation();
  const cities = CitySelector();
  const {user} = useAuth();

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

  const userId = user?.user?.id;
  const username = user?.user?.username;
  const userFname = user?.user?.fName;
  const userLname = user?.user?.lName;
  const userEmail = user?.user?.email;
  const userImage = user?.user?.userImage;

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
      setRouteTitle('');
    }, []),
  );

  const handleSearch = async () => {
    if (isSubmitting || isGenerating) return;

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

    const newRoute = {
      departureCity,
      arrivalCity,
      selectedDateTime,
      routeTitle,
      userId,
      username,
      userFname,
      userLname,
      userEmail,
      userImage,
    };

    setIsGenerating(true);

    try {
      const response = await fetch('http://10.0.2.2:3000/seekers-route', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({seeker: newRoute}),
      });

      setIsGenerating(false);
      setIsSubmitting(true);

      if (response.ok) {
        const responseData = await response.json();
        setSuccessMessage(t('The route has been created!'));
        setTimeout(() => {
          setSuccessMessage('');
          navigation.navigate('Seekers', {seeker: responseData.seeker});
        }, 2000);
      } else {
        const errorData = await response.json();
        Alert.alert(t('Error'), errorData.error || 'Failed to create route.');
      }
    } catch (error) {
      Alert.alert(t('Error'), 'An error occurred while creating the route.');
    } finally {
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
      style={styles.cityItem}
      onPress={() => {
        setCity(item.label);
        closeModal(false);
        setSearch('');
      }}>
      <Text style={styles.cityItemText}>{item.label}</Text>
    </TouchableOpacity>
  );

  return (
    <LinearGradient colors={['#0d0d0d', '#1a1a1a']} style={styles.gradient}>
      <SafeAreaView style={{flex: 1}}>
        <ScrollView contentContainerStyle={styles.scroll}>
          <Text style={styles.title}>{t('Looking for a route')}</Text>

          {/* Departure */}
          <Text style={styles.label}>{t('Departure')}</Text>
          <TouchableOpacity
            style={styles.selectButton}
            onPress={() => setModalDeparture(true)}>
            <Text style={styles.selectButtonText}>
              {departureCity || t('Select City')}
            </Text>
          </TouchableOpacity>

          {/* Departure Modal */}
          <Modal visible={modalDeparture} transparent animationType="slide">
            <View style={styles.modalContainer}>
              <TextInput
                placeholder={t('Search City')}
                placeholderTextColor="#999"
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
                  renderCityItem(
                    item,
                    setDepartureCity,
                    setModalDeparture,
                    setDepartureSearch,
                  )
                }
              />
            </View>
          </Modal>

          {/* Arrival */}
          <Text style={styles.label}>{t('Arrival')}</Text>
          <TouchableOpacity
            style={styles.selectButton}
            onPress={() => setModalArrival(true)}>
            <Text style={styles.selectButtonText}>
              {arrivalCity || t('Select City')}
            </Text>
          </TouchableOpacity>

          {/* Arrival Modal */}
          <Modal visible={modalArrival} transparent animationType="slide">
            <View style={styles.modalContainer}>
              <TextInput
                placeholder={t('Search City')}
                placeholderTextColor="#999"
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
                  renderCityItem(
                    item,
                    setArrivalCity,
                    setModalArrival,
                    setArrivalSearch,
                  )
                }
              />
            </View>
          </Modal>

          {/* Route Info */}
          <Text style={styles.label}>{t('Route Information')}</Text>
          <TextInput
            style={styles.routeInput}
            placeholder={t('Enter route title')}
            placeholderTextColor="#888"
            value={routeTitle}
            onChangeText={setRouteTitle}
          />

          {/* Date Picker */}
          {selectedDateTime && (
            <View style={styles.selectedDateContainer}>
              <Text style={styles.selectedDateLabel}>
                {t('Selected Date:')}
              </Text>
              <Text style={styles.selectedDateText}>
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
            <Text style={styles.buttonText}>{t('Select date')}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
            <Text style={styles.searchButtonText}>{t('Continue')}</Text>
          </TouchableOpacity>

          {isGenerating && (
            <Text style={styles.loadingText}>{t('Generating route...')}</Text>
          )}

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
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {flex: 1, justifyContent: 'center', alignItems: 'center'},
  scroll: {alignItems: 'center', paddingVertical: 30, gap: 15},
  title: {fontSize: 24, fontWeight: '700', color: '#fff', marginBottom: 10},
  label: {fontSize: 18, color: '#ddd', fontWeight: '600', marginTop: 10},

  selectButton: {
    height: 55,
    width: 320,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: '#777',
  },
  selectButtonText: {color: '#fff', fontSize: 17, fontWeight: '600'},

  input: {
    backgroundColor: '#222',
    color: '#fff',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#555',
    marginBottom: 10,
  },
  modalContainer: {
    marginTop: 100,
    backgroundColor: '#111',
    padding: 20,
    marginHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#444',
  },
  cityItem: {padding: 12, borderBottomWidth: 1, borderColor: '#333'},
  cityItemText: {color: '#fff', fontSize: 16, fontWeight: '500'},

  routeInput: {
    width: 320,
    height: 60,
    backgroundColor: 'rgba(255,255,255,0.1)',
    color: '#fff',
    paddingHorizontal: 15,
    fontSize: 17,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#777',
  },
  selectedDateContainer: {
    marginTop: 15,
    backgroundColor: 'rgba(255,255,255,0.1)',
    padding: 10,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#777',
  },
  selectedDateLabel: {color: '#bbb', fontSize: 16},
  selectedDateText: {color: '#ff6600', fontSize: 18, fontWeight: '700'},

  button: {
    backgroundColor: '#ff6600',
    borderRadius: 10,
    width: 200,
    height: 55,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {fontSize: 18, fontWeight: '600', color: '#fff'},

  searchButton: {
    backgroundColor: '#ff6600',
    borderRadius: 10,
    width: 200,
    height: 55,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 15,
  },
  searchButtonText: {fontSize: 18, fontWeight: '600', color: '#fff'},
  loadingText: {color: '#ff6600', marginTop: 10, fontWeight: '600'},
});

export default Looking;
