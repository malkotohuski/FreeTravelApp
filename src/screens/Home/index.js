import i18next from 'i18next';
import React, {useState, useEffect, useContext} from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  Alert,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import {useRoute} from '@react-navigation/native';
import {useTranslation} from 'react-i18next';
import styles from './styles';
import Icons from 'react-native-vector-icons/MaterialCommunityIcons';
import api from '../../api/api';
import {useAuth} from '../../context/AuthContext';
import {DarkModeContext} from '../../navigation/DarkModeContext';

function HomePage({navigation}) {
  const {darkMode} = useContext(DarkModeContext);
  const route = useRoute();
  const {user} = useAuth();

  const {t} = useTranslation();
  const [isBulgaria, setisBulgaria] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);
  const [reqestsCount, setReqestsCount] = useState(0);

  const loginUser = user?.username;

  const getContainerStyle = () => ({
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'space-between',
    height: '100%',
    backgroundColor: darkMode ? '#121212' : '#fff', // Поставяме условие за тъмен/светъл фон
  });

  const getBackgroundImage = () => {
    return darkMode
      ? require('../../../images/roadHistory2.png')
      : require('../../../images/home2-background.jpg');
  };

  const getTextStyle = () => ({
    fontSize: 30,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
    color: darkMode ? '#FFFDFDFF' : '#010101', // Текстовият цвят ще бъде по-светъл в тъмния режим
  });

  const getButtonStyle = (color = '#000') => ({
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    paddingVertical: 14,
    paddingHorizontal: 10,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: darkMode ? '#444' : '#000',
    backgroundColor: darkMode
      ? 'rgba(255, 255, 255, 0.1)'
      : 'rgba(255, 255, 255, 0.3)',
  });

  const getTextButtonStyles = () => ({
    fontSize: 20,
    fontWeight: '800',
    color: darkMode ? '#f1f1f1' : '#010101',
  });

  const getFooterStyle = () => ({
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center', // Центриране на иконите вертикално
    paddingVertical: 10,
    backgroundColor: darkMode ? '#333232FF' : '#f4511e', // По-тъмно оранжево за тъмен режим
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    elevation: 10,
    paddingHorizontal: 0,
  });

  const getNotificationIconBackground = () => ({
    alignItems: 'center',
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: darkMode ? '#010101' : '#f1f1f1', // Цветът на иконките, промени го според нуждите си
    justifyContent: 'center',
  });

  const getNotificationIconColor = () => ({
    color: darkMode ? '#f1f1f1' : '#010101',
    size: 34,
  });

  useEffect(() => {
    const fetchNotifications = async () => {
      if (!loginUser) return;

      try {
        const response = await api.get('/notifications');

        const userNotifications = response.data.filter(
          notification =>
            notification.recipient === loginUser && !notification.read,
        );

        setNotificationCount(
          userNotifications.length > 9 ? '9+' : userNotifications.length,
        );
      } catch (error) {
        console.error('Failed to fetch notifications:', error);
      }
    };

    fetchNotifications();
  }, [loginUser]);

  useEffect(() => {
    const fetchRequests = async () => {
      const userId = user?.id;

      if (!userId) {
        console.log('Missing login user or route ID.');
        return;
      }

      try {
        const response = await api.get('/requests');

        const pendingRequests = response.data.filter(
          req => req.userRouteId === userId && req.status === 'pending',
        );

        setReqestsCount(
          pendingRequests.length > 9 ? '9+' : pendingRequests.length,
        );
      } catch (error) {
        console.error('Failed to fetch route requests:', error);
      }
    };

    fetchRequests();
  }, [user?.id]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      // Проверка за параметри от Notifications, които показват, че броят на нотификациите трябва да бъде занулен
      if (route.params?.resetNotificationCount) {
        setNotificationCount(0);
      }
    });

    return unsubscribe;
  }, [navigation, route.params]);

  /*   useEffect(() => {
    const interval = setInterval(() => {
      fetchRequests();
    }, 30000);
    return () => clearInterval(interval);
  }, [loginUser]); */

  const changeLanguage = async lng => {
    await i18next.changeLanguage(lng);
    setisBulgaria(lng === 'bg');
  };

  const handlerVehicle = () => {
    navigation.navigate('Vehicle');
    console.log('Vehicle clicked !!!');
  };

  const handlerRouteRequest = async () => {
    try {
      // Вземаме всички заявки
      const response = await api.get('/requests');

      // Филтрираме чакащите към текущия потребител
      const pendingRequests = response.data.filter(
        req =>
          req.userRouteId === user?.id && req.status === 'pending' && !req.read,
      );

      // Обновяваме статуса на всяка на сървъра
      for (const request of pendingRequests) {
        await api.patch(`/requests/${request.id}`, {read: true});
      }

      // Нулираме брояча на клиента
      setReqestsCount(0);

      // Навигираме към екрана Route Request
      navigation.navigate('Route request');
      console.log('RouteRequest clicked !!!');
    } catch (error) {
      console.error('Failed to mark requests as read:', error);
      Alert.alert('Error', 'Failed to update requests.');
    }
  };

  const handlerLooking = () => {
    navigation.navigate('Looking');
    console.log('Looking clicked !!!');
  };

  const handlerSeekers = () => {
    navigation.navigate('Seekers');
    console.log('Seekers clicked !!!');
  };

  const handlerRouteViewer = () => {
    navigation.navigate('ViewRoutes');
    console.log('View Routes clicked !!!');
  };

  const handlerReporting = () => {
    navigation.navigate('Reporting');
    console.log('Reporting clicked !!!');
  };

  const handlerChatScreen = () => {
    Alert.alert(t('Coming soon'), t('Work in progress 🚧'), [{text: t('OK')}], {
      cancelable: true,
    });
  };
  const getDisabledIconBackground = () => ({
    alignItems: 'center',
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: darkMode ? '#2a2a2a' : '#cccccc',
    justifyContent: 'center',
    opacity: 0.6,
  });

  const handlerNotificationScreen = async () => {
    try {
      // Актуализиране на нотификациите на сървъра
      const response = await api.get('/notifications');
      const userNotifications = response.data.filter(
        notification =>
          notification.recipient === loginUser && !notification.read,
      );

      for (const notification of userNotifications) {
        await api.patch(`/notifications/${notification.id}`, {read: true});
      }

      // Пренасочване към екрана с нотификациите
      navigation.navigate('Notifications', {resetNotificationCount: true});
      console.log('Notifications screen clicked!');
      setNotificationCount(0); // Зануляваме броя на нотификациите на клиента
    } catch (error) {
      console.error('Failed to mark notifications as read:', error);
      Alert.alert('Error', 'Failed to update notifications.');
    }
  };

  return (
    <SafeAreaView style={{flex: 1}}>
      <ScrollView contentContainerStyle={{flexGrow: 1, paddingBottom: 60}}>
        <View style={getContainerStyle()}>
          <Image source={getBackgroundImage()} style={styles.backgroundImage} />
          <View style={styles.overlay} />
          <View style={styles.centeredTextContainer}>
            <Text style={getTextStyle()}>{t('In the car with me')}</Text>
            <Text style={getTextStyle()}>{t('We travel freely')}</Text>
          </View>
          <View style={{flex: 1}}>
            <View style={styles.languageSwitchContainer}>
              <TouchableOpacity
                style={styles.languageButton}
                onPress={() => changeLanguage('en')}>
                <Image
                  source={require('../../../images/eng1-flag.png')}
                  style={styles.flagImage}
                />
                <Text
                  style={{
                    ...getTextStyle(),
                    fontWeight: '900',
                    fontSize: 24,
                    backgroundColor: darkMode
                      ? 'rgba(255,255,255,0.1)'
                      : 'transparent',
                    paddingHorizontal: 10,
                    borderRadius: 5,
                  }}>
                  {t('English')}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.languageButton}
                onPress={() => changeLanguage('bg')}>
                <Image
                  source={require('../../../images/bulg-flag.png')}
                  style={styles.flagImage}
                />
                <Text
                  style={{
                    ...getTextStyle(),
                    fontWeight: '900',
                    fontSize: 24,
                    backgroundColor: darkMode
                      ? 'rgba(255, 255, 255, 0.1)'
                      : 'transparent',
                    paddingHorizontal: 10,
                    borderRadius: 5,
                  }}>
                  {t('Bulgarian')}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.menuImages}>
              {/* Create a route (Driver) */}
              <TouchableOpacity
                style={[getButtonStyle(), styles.fullWidthButton]}
                onPress={handlerVehicle}>
                <View style={styles.rowButtonContent}>
                  <Icons
                    name="car"
                    size={26}
                    color={darkMode ? '#f1f1f1' : '#010101'}
                  />
                  <Text style={getTextButtonStyles()}>
                    {t('Create a route (Driver)')}
                  </Text>
                </View>
              </TouchableOpacity>

              {/* Create request (Passenger) */}
              <TouchableOpacity
                style={[getButtonStyle(), styles.fullWidthButton]}
                onPress={handlerLooking}>
                <View style={styles.rowButtonContent}>
                  <Icons
                    name="account-search"
                    size={26}
                    color={darkMode ? '#f1f1f1' : '#010101'}
                  />
                  <Text style={getTextButtonStyles()}>
                    {t('Create request (Passenger)')}
                  </Text>
                </View>
              </TouchableOpacity>

              {/* Seekers (Passengers) */}
              <TouchableOpacity
                style={[getButtonStyle(), styles.fullWidthButton]}
                onPress={handlerSeekers}>
                <View style={styles.rowButtonContent}>
                  <Icons
                    name="account-multiple"
                    size={26}
                    color={darkMode ? '#f1f1f1' : '#010101'}
                  />
                  <Text style={getTextButtonStyles()}>
                    {t('List of Seekers (Passengers)')}
                  </Text>
                </View>
              </TouchableOpacity>

              {/* Offering (Drivers) */}
              <TouchableOpacity
                style={[getButtonStyle(), styles.fullWidthButton]}
                onPress={handlerRouteViewer}>
                <View style={styles.rowButtonContent}>
                  <Icons
                    name="steering"
                    size={26}
                    color={darkMode ? '#f1f1f1' : '#010101'}
                  />
                  <Text style={getTextButtonStyles()}>
                    {t('List of Offering (Drivers)')}
                  </Text>
                </View>
              </TouchableOpacity>
            </View>

            {/*  <View style={styles.searchBox}>
                    <View style={styles.searchContainer}>
                        <TextInput
                            style={styles.searchField}
                            placeholderTextColor={'#F5FDFE'}
                            placeholder={t('Search here')}
                        />
                    </View>
                    <TouchableOpacity
                        style={styles.searchButton}
                        onPress={() => {

                        }}
                    >
                        <Text style={styles.searchButtonText}>{t('Search')}</Text>
                    </TouchableOpacity>
                </View> */}
          </View>
        </View>
      </ScrollView>
      <View style={getFooterStyle()}>
        <View style={styles.notificationWrapper}>
          <TouchableOpacity
            style={getNotificationIconBackground()}
            onPress={handlerRouteRequest}>
            <Icons name="routes" {...getNotificationIconColor()} />

            {reqestsCount > 0 && (
              <View style={styles.notificationBadge}>
                <Text style={styles.notificationText}>{reqestsCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={getDisabledIconBackground()}
          onPress={handlerChatScreen}
          activeOpacity={0.8}>
          <Icons name="chat" {...getNotificationIconColor()} />
        </TouchableOpacity>
        <View style={styles.notificationWrapper}>
          <TouchableOpacity
            style={getNotificationIconBackground()}
            onPress={handlerNotificationScreen}>
            <Icons name="bell" {...getNotificationIconColor()} />
            {notificationCount > 0 && (
              <View style={styles.notificationBadge}>
                <Text style={styles.notificationText}>{notificationCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

export default HomePage;
