// backend-v2/services/NotificationService.js
import messaging from '@react-native-firebase/messaging';
import {PermissionsAndroid, Platform} from 'react-native';
import {navigate} from '../../navigation/NavigationService';

class NotificationService {
  async requestPermission() {
    if (Platform.OS === 'android' && Platform.Version >= 33) {
      await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
      );
    }

    const authStatus = await messaging().requestPermission();
    return (
      authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authStatus === messaging.AuthorizationStatus.PROVISIONAL
    );
  }

  handleNavigation(data) {
    if (!data) return;

    const {screen, conversationId, routeId} = data;

    console.log('NAVIGATE DATA:', data);

    if (screen === 'message' && conversationId) {
      navigate('ChatScreen', {conversationId});
    }

    if (screen === 'request' && routeId) {
      navigate('RouteDetails', {routeId});
    }
  }

  async getFCMToken() {
    try {
      await messaging().registerDeviceForRemoteMessages();
      const token = await messaging().getToken();
      console.log('FCM TOKEN:', token);
      return token;
    } catch (err) {
      console.log('FCM ERROR:', err);
    }
  }

  async init() {
    await this.requestPermission();
    const token = await this.getFCMToken();

    // 👉 когато app е отворено
    messaging().onMessage(async remoteMessage => {
      console.log('Foreground push:', remoteMessage);
    });

    // 👉 когато кликнеш нотификация (app във background)
    messaging().onNotificationOpenedApp(remoteMessage => {
      console.log('Notification opened:', remoteMessage);

      setTimeout(() => {
        this.handleNavigation(remoteMessage.data);
      }, 500);
    });
    // 👉 когато app е затворено и се отвори от нотификация
    const initialNotification = await messaging().getInitialNotification();

    if (initialNotification) {
      console.log('App opened from quit state:', initialNotification);
      setTimeout(() => {
        this.handleNavigation(initialNotification.data);
      }, 1000);
    }

    return token;
  }
}

export default new NotificationService();
