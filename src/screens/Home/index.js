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
import socket from '../../socket/socket';

function HomePage({navigation}) {
  const {darkMode} = useContext(DarkModeContext);
  const route = useRoute();
  const {user} = useAuth();

  const {t} = useTranslation();
  const [isBulgaria, setisBulgaria] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);
  const [reqestsCount, setReqestsCount] = useState(0);
  const [chatNotificationCount, setChatNotificationCount] = useState(0);

  const loginUser = user?.username;

  useEffect(() => {
    if (!user?.id) return;

    socket.emit('joinUserRoom', user.id);

    socket.on('newConversation', () => {
      setChatNotificationCount(prev => {
        if (prev === '9+') return '9+';
        const next = Number(prev || 0) + 1;
        return next > 9 ? '9+' : next;
      });
    });

    socket.on('newMessage', data => {
      if (data?.message?.senderId === user.id) return;

      setChatNotificationCount(prev => {
        if (prev === '9+') return '9+';
        const next = Number(prev || 0) + 1;
        return next > 9 ? '9+' : next;
      });
    });

    return () => {
      socket.off('newConversation');
      socket.off('newMessage');
    };
  }, [user?.id]);

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
    color: darkMode ? '#FFFDFDFF' : '#010101',
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

  const getChatIconBackground = () => ({
    alignItems: 'center',
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    backgroundColor:
      chatNotificationCount > 0 ? '#bd0e05' : darkMode ? '#010101' : '#f1f1f1',
  });

  const getNotificationIconColor = () => ({
    color: darkMode ? '#f1f1f1' : '#010101',
    size: 34,
  });

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
  useEffect(() => {
    const fetchRequests = async () => {
      const userId = user?.id;
      if (!userId) return;
      try {
        const response = await api.get('/api/requests');
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

  // =================== Polling for new chat messages ===================
  useEffect(() => {
    if (!user?.id) return;

    const fetchUnread = async () => {
      try {
        const res = await api.get(`/api/conversations/user/${user.id}`);

        let totalUnread = 0;

        res.data.forEach(conv => {
          if (conv.unreadCount > 0) {
            totalUnread += conv.unreadCount;
          }
        });

        setChatNotificationCount(totalUnread > 9 ? '9+' : totalUnread);
      } catch (err) {
        console.error('Failed to fetch unread:', err);
      }
    };

    fetchUnread();
  }, [user?.id]);

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
          req.userRouteId === user?.id && req.status === 'pending' && !req.read,
      );
      for (const request of pendingRequests) {
        if (!request.id) continue;
        await api.patch(`/api/requests/${request.id}/read`);
      }
      setReqestsCount(0);
      navigation.navigate('Route request');
    } catch (error) {
      console.error('Failed to mark requests as read:', error);
      Alert.alert('Error', 'Failed to update requests.');
    }
  };
  const handlerLooking = () => navigation.navigate('Looking');
  const handlerSeekers = () => navigation.navigate('Seekers');
  const handlerRouteViewer = () => navigation.navigate('ViewRoutes');
  const handlerChatScreen = () => {
    setChatNotificationCount(0); // нулираме при влизане в чат
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

  // =================== Render ===================
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
          </View>
        </View>
      </ScrollView>

      {/* Footer */}
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

        <View style={styles.notificationWrapper}>
          <TouchableOpacity
            style={getChatIconBackground()}
            onPress={handlerChatScreen}
            activeOpacity={0.8}>
            <Icons name="chat-processing" {...getNotificationIconColor()} />
            {chatNotificationCount > 0 && (
              <View style={styles.notificationBadge}>
                <Text style={styles.notificationText}>
                  {chatNotificationCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

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
