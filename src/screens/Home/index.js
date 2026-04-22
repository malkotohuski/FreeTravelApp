import i18next from 'i18next';
import React, {
  useState,
  useEffect,
  useContext,
  useCallback,
  useRef,
} from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  Alert,
  ScrollView,
  SafeAreaView,
  Animated,
  Vibration,
} from 'react-native';
import {useTranslation} from 'react-i18next';
import {useFocusEffect} from '@react-navigation/native';
import styles from './styles';
import Icons from 'react-native-vector-icons/MaterialCommunityIcons';
import api from '../../api/api';
import {useAuth} from '../../context/AuthContext';
import {DarkModeContext} from '../../navigation/DarkModeContext';
import socket from '../../socket/socket';
import Toast from 'react-native-toast-message';
import NotificationService from '../../backend-v2/services/NotificationService';
import {useChat} from '../../context/ChatContext';

function HomePage({navigation}) {
  const {darkMode} = useContext(DarkModeContext);

  const {user} = useAuth();

  const {t} = useTranslation();
  const [isBulgaria, setisBulgaria] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);
  const [reqestsCount, setReqestsCount] = useState(0);
  const {chatCount, refreshChatCount} = useChat();

  const loginUser = user?.username;

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const bounceAnim = useRef(new Animated.Value(0)).current;

  
  useEffect(() => {
    if (!user?.id) return;

    const newNotificationHandler = notification => {
      setNotificationCount(prev => {
        const next = prev + 1;
        return next;
      });

      /*    Toast.show({
        type: 'info',
        text1: notification.message,
        visibilityTime: 4000,
      }); */
    };

    socket.on('newNotification', newNotificationHandler);

    return () => socket.off('newNotification', newNotificationHandler);
  }, [user?.id]);

  // â”€â”€â”€â”€â”€â”€â”€ ÐÐ¾Ð² useEffect Ð·Ð° messagesRead â”€â”€â”€â”€â”€â”€â”€
  
  const pulseLoopRef = useRef(null);

  useEffect(() => {
    if (pulseLoopRef.current) {
      pulseLoopRef.current.stop();
      pulseLoopRef.current = null;
    }

    if (chatCount > 0) {
      const loop = Animated.loop(
        Animated.parallel([
          Animated.sequence([
            Animated.timing(pulseAnim, {
              toValue: 1.2,
              duration: 1200,
              useNativeDriver: false,
            }),
            Animated.timing(pulseAnim, {
              toValue: 1,
              duration: 1200,
              useNativeDriver: false,
            }),
          ]),
          Animated.sequence([
            Animated.timing(glowAnim, {
              toValue: 1,
              duration: 1600,
              useNativeDriver: false,
            }),
            Animated.timing(glowAnim, {
              toValue: 0,
              duration: 1600,
              useNativeDriver: false,
            }),
          ]),
        ]),
      );

      pulseLoopRef.current = loop;
      loop.start();
    } else {
      pulseAnim.setValue(1);
      glowAnim.setValue(0);
    }

    // ðŸ”¥ ÐœÐÐžÐ“Ðž Ð’ÐÐ–ÐÐž
    return () => {
      if (pulseLoopRef.current) {
        pulseLoopRef.current.stop();
        pulseLoopRef.current = null;
      }
    };
  }, [chatCount]);

  // =================== Fetch notifications ===================
  useEffect(() => {
    const fetchNotifications = async () => {
      if (!loginUser) return;
      try {
        const response = await api.get('/api/notifications');
        let unreadNotifications = response.data.filter(n => !n.read);
        unreadNotifications = unreadNotifications.filter(
          (v, i, a) =>
            a.findIndex(
              n => n.routeId === v.routeId && n.message === v.message,
            ) === i,
        );
        setNotificationCount(
          unreadNotifications.length > 9 ? '9+' : unreadNotifications.length,
        );
      } catch (error) {
        console.error('Failed to fetch notifications:', error);
      }
    };
    fetchNotifications();
  }, [loginUser]);

  // =================== Fetch route requests ===================
  const fetchRequests = async () => {
    const userId = user?.id;
    if (!userId) return;

    try {
      const response = await api.get('/api/requests');

      const pendingRequests = response.data.filter(
        req => req.toUserId === userId && req.status === 'pending',
      );

      setReqestsCount(
        pendingRequests.length > 9 ? '9+' : pendingRequests.length,
      );
    } catch (error) {
      console.error('Failed to fetch route requests:', error);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [user?.id]);

  useFocusEffect(
    useCallback(() => {
      fetchRequests();
    }, [user?.id]),
  );
  useFocusEffect(
    useCallback(() => {
      refreshChatCount();
      const intervalId = setInterval(() => {
        refreshChatCount();
      }, 2500);

      return () => clearInterval(intervalId);
    }, [refreshChatCount]),
  );

  // =================== Language switch ===================
  const changeLanguage = async lng => {
    await i18next.changeLanguage(lng);
    setisBulgaria(lng === 'bg');
  };

  // =================== Navigation handlers ===================
  const handlerVehicle = () => navigation.navigate('Vehicle');
  const handlerRouteRequest = async () => {
    try {
      const response = await api.get('/api/requests');
      const pendingRequests = response.data.filter(
        req =>
          req.toUserId === user?.id && req.status === 'pending' && !req.read,
      );
      for (const request of pendingRequests) {
        if (!request.id) continue;
        await api.patch(`/api/requests/${request.id}/read`);
      }
      setReqestsCount(0);
      navigation.navigate('RouteRequest');
    } catch (error) {
      console.error('Failed to mark requests as read:', error);
      Alert.alert('Error', 'Failed to update requests.');
    }
  };
  const handlerLooking = () => navigation.navigate('Looking');
  const handlerSeekers = () => navigation.navigate('Seekers');
  const handlerRouteViewer = () => navigation.navigate('ViewRoutes');
  const handlerChatScreen = () => {
    navigation.navigate('ConversationsScreen');
  };
  const handlerNotificationScreen = async () => {
    try {
      if (!loginUser) return;
      const response = await api.get('/api/notifications');
      let unreadNotifications = response.data.filter(n => !n.read);
      unreadNotifications = unreadNotifications.filter(
        (v, i, a) =>
          a.findIndex(
            n => n.routeId === v.routeId && n.message === v.message,
          ) === i,
      );
      for (const notification of unreadNotifications) {
        await api.put(`/api/notifications/read/${notification.id}`);
      }
      setNotificationCount(0);
      navigation.navigate('Notifications', {resetNotificationCount: true});
    } catch (error) {
      console.error('Failed to mark notifications as read:', error);
      Alert.alert('Error', 'Failed to update notifications.');
    }
  };

  const getContainerStyle = () => ({
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'space-between',
    height: '100%',
    backgroundColor: darkMode ? '#121212' : '#fff',
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
    color: darkMode ? '#FFFDFDFF' : '#000000',
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
    alignItems: 'center',
    paddingVertical: 10,
    backgroundColor: darkMode ? '#333232FF' : '#f4511e',
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
    backgroundColor: darkMode ? '#010101' : '#f1f1f1',
    justifyContent: 'center',
  });

  // =================== Render ===================
  return (
    <SafeAreaView style={{flex: 1}}>
      <ScrollView contentContainerStyle={{flexGrow: 1, paddingBottom: 60}}>
        <View style={getContainerStyle()}>
          <Image source={getBackgroundImage()} style={styles.backgroundImage} />
          <View style={styles.overlay} />
          <View style={styles.centeredTextContainer}>
            {/*   <Text style={getTextStyle()}>{t('In the car with me')}</Text> */}
            <Text style={getTextStyle()}>{t('We travel freely')}</Text>
          </View>
          <View style={{flex: 1}}>
            {/* Language Switch */}
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
                      ? 'rgba(255,255,255,0.1)'
                      : 'transparent',
                    paddingHorizontal: 10,
                    borderRadius: 5,
                  }}>
                  {t('Bulgarian')}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Menu Buttons */}
            <View style={styles.menuImages}>
              <Text style={styles.sectionHeader}>{t('Driver')}</Text>
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

              <View
                style={{
                  height: 3,
                  backgroundColor: darkMode ? '#555' : '#ffffff',
                  marginVertical: 12,
                }}
              />

              <Text style={styles.sectionHeader}>{t('Passenger')}</Text>

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
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Footer */}
      <View style={getFooterStyle()}>
        {/* Route Requests */}
        <View style={styles.notificationWrapper}>
          <TouchableOpacity
            style={getNotificationIconBackground()}
            onPress={handlerRouteRequest}
            activeOpacity={0.8}>
            <Icons
              name="routes"
              size={34}
              color={darkMode ? '#f1f1f1' : '#010101'}
            />
            {reqestsCount > 0 && (
              <View
                style={[
                  styles.notificationBadge,
                  {backgroundColor: '#bd0e05'},
                ]}>
                <Text style={styles.notificationText}>{`${reqestsCount}`}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Chat */}
        <View style={styles.notificationWrapper}>
          <Animated.View
            style={{
              transform: [{scale: pulseAnim}, {translateY: bounceAnim}],
              shadowColor: '#ff0000',
              shadowOpacity: glowAnim,
              shadowRadius: 15,
              elevation: glowAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 15],
              }),
            }}>
            <TouchableOpacity
              style={{
                alignItems: 'center',
                justifyContent: 'center',
                width: 50,
                height: 50,
                borderRadius: 25,
                backgroundColor: darkMode ? '#222' : '#f1f1f1',
              }}
              onPress={handlerChatScreen}
              activeOpacity={0.8}>
              <Icons
                name="chat-processing"
                size={34}
                color={darkMode ? '#f1f1f1' : '#010101'}
              />
              {chatCount > 0 && (
                <View
                  style={[
                    styles.notificationBadge,
                    {backgroundColor: '#bd0e05'},
                  ]}>
                  <Text>{chatCount > 9 ? '9+' : chatCount}</Text>
                </View>
              )}
            </TouchableOpacity>
          </Animated.View>
        </View>

        {/* General Notifications */}
        <View style={styles.notificationWrapper}>
          <TouchableOpacity
            style={getNotificationIconBackground()}
            onPress={handlerNotificationScreen}
            activeOpacity={0.8}>
            <Icons
              name="bell"
              size={34}
              color={darkMode ? '#f1f1f1' : '#010101'}
            />
            {notificationCount > 0 && (
              <View
                style={[
                  styles.notificationBadge,
                  {backgroundColor: '#bd0e05'},
                ]}>
                <Text
                  style={
                    styles.notificationText
                  }>{`${notificationCount}`}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

export default HomePage;


