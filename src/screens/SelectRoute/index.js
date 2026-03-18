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
import {useTheme} from '../../theme/useTheme';

function SelectRouteScreen({route, navigation}) {
  const {t, i18n} = useTranslation();
  const {selectedVehicle, registrationNumber} = route.params;
  const theme = useTheme();

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

  const [departureCity, setDepartureCity] = useState(null);
  const [departureStreet, setDepartureStreet] = useState('');
  const [departureNumber, setDepartureNumber] = useState('');

  const [arrivalCity, setArrivalCity] = useState(null);
  const [arrivalStreet, setArrivalStreet] = useState('');
  const [arrivalNumber, setArrivalNumber] = useState('');
  const [routeTitle, setRouteTitle] = useState('');

  const [modalVisibleDeparture, setModalVisibleDeparture] = useState(false);
  const [modalVisibleArrival, setModalVisibleArrival] = useState(false);

  const locale = i18n.language === 'bg' ? 'bg-BG' : 'en-US';

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
      setDepartureCity(null);
      setDepartureStreet('');
      setDepartureNumber('');
      setArrivalCity(null);
      setArrivalStreet('');
      setArrivalNumber('');
      setSelectedDateTime(null);
      setDate(new Date());
      setRouteTitle('');
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
      style={[styles.cityItem, {borderBottomColor: theme.inputBorder}]}
      onPress={() => onSelect(item.label)}>
      <Text style={[styles.cityItemText, {color: theme.textPrimary}]}>
        {item.label}
      </Text>
    </TouchableOpacity>
  );

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
            {/* HEADER */}
            <Text style={[styles.mainTitle, {color: theme.textPrimary}]}>
              {t('Create Route')}
            </Text>

            {/* DEPARTURE */}
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

            {/* ARRIVAL */}
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

            {/* ROUTE TITLE */}
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

            {/* DATE BUTTON */}
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
                  hour12: false, // 24-часов формат
                })}
              </Text>
            )}

            {/* CONTINUE */}
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
        {/* DEPARTURE CITY MODAL */}
        <Modal
          transparent
          visible={modalVisibleDeparture}
          animationType="slide">
          <TouchableWithoutFeedback
            onPress={() => setModalVisibleDeparture(false)}>
            <View style={styles.modalOverlay}>
              <View
                style={[
                  styles.modalContainer,
                  {backgroundColor: theme.cardBackground},
                ]}>
                {/* Search bar */}
                <TextInput
                  placeholder={t('Search City')}
                  placeholderTextColor={theme.isDark ? '#aaa' : '#888'}
                  value={departureSearchText}
                  onChangeText={filterDepartureCities}
                  style={[
                    styles.modalInput,
                    {
                      backgroundColor: theme.isDark ? '#333' : '#fff', // тъмна за dark, бяла за light
                      borderColor: theme.isDark ? '#555' : '#ccc',
                      color: theme.isDark ? '#fff' : '#000',
                    },
                  ]}
                />

                {/* Cities List */}
                <FlatList
                  data={filteredCities}
                  keyExtractor={item => item.value}
                  keyboardShouldPersistTaps="handled"
                  showsVerticalScrollIndicator={false}
                  renderItem={({item}) => {
                    const isMatch = departureSearchText
                      ? item.label
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
                          setDepartureCity(item.label);
                          setModalVisibleDeparture(false);
                        }}>
                        <Text
                          style={{
                            color: theme.isDark ? '#fff' : '#000',
                            fontSize: 16,
                          }}>
                          {isMatch
                            ? item.label
                                .split(
                                  new RegExp(`(${departureSearchText})`, 'i'),
                                )
                                .map((part, i) =>
                                  part.toLowerCase() ===
                                  departureSearchText.toLowerCase() ? (
                                    <Text
                                      key={i}
                                      style={{
                                        fontWeight: 'bold',
                                        color: theme.primaryButton,
                                      }}>
                                      {part}
                                    </Text>
                                  ) : (
                                    part
                                  ),
                                )
                            : item.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  }}
                />
              </View>
            </View>
          </TouchableWithoutFeedback>
        </Modal>

        {/* ARRIVAL CITY MODAL */}
        <Modal transparent visible={modalVisibleArrival} animationType="slide">
          <TouchableWithoutFeedback
            onPress={() => setModalVisibleArrival(false)}>
            <View style={styles.modalOverlay}>
              <View
                style={[
                  styles.modalContainer,
                  {backgroundColor: theme.cardBackground},
                ]}>
                {/* Search bar */}
                <TextInput
                  placeholder={t('Search City')}
                  placeholderTextColor={theme.isDark ? '#aaa' : '#888'}
                  value={arrivalSearchText}
                  onChangeText={filterArrivalCities}
                  style={[
                    styles.modalInput,
                    {
                      backgroundColor: theme.isDark ? '#333' : '#fff', // тъмна за dark, бяла за light
                      borderColor: theme.isDark ? '#555' : '#ccc',
                      color: theme.isDark ? '#fff' : '#000',
                    },
                  ]}
                />

                {/* Cities List */}
                <FlatList
                  data={arrivalFilteredCities}
                  keyExtractor={item => item.value}
                  keyboardShouldPersistTaps="handled"
                  showsVerticalScrollIndicator={false}
                  renderItem={({item}) => {
                    const isMatch = arrivalSearchText
                      ? item.label
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
                          setArrivalCity(item.label);
                          setModalVisibleArrival(false);
                        }}>
                        <Text
                          style={{
                            color: theme.isDark ? '#fff' : '#000',
                            fontSize: 16,
                          }}>
                          {isMatch
                            ? item.label
                                .split(
                                  new RegExp(`(${arrivalSearchText})`, 'i'),
                                )
                                .map((part, i) =>
                                  part.toLowerCase() ===
                                  arrivalSearchText.toLowerCase() ? (
                                    <Text
                                      key={i}
                                      style={{
                                        fontWeight: 'bold',
                                        color: theme.primaryButton,
                                      }}>
                                      {part}
                                    </Text>
                                  ) : (
                                    part
                                  ),
                                )
                            : item.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  }}
                />
              </View>
            </View>
          </TouchableWithoutFeedback>
        </Modal>
        <DatePicker
          modal
          open={open}
          date={date}
          mode="datetime"
          locale="bg-BG" // Български език
          is24hour={true} // 24-часов формат, няма AM/PM
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
    height: 45,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    marginBottom: 12,
    fontWeight: '600',
  },

  cityItem: {
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
});
