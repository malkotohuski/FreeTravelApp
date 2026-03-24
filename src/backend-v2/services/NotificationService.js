import messaging from '@react-native-firebase/messaging';
import {PermissionsAndroid, Platform} from 'react-native';
import {navigate} from '../../navigation/NavigationService';
import {navigationRef} from '../../navigation/NavigationService';

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
    console.log('🔥 FULL DATA:', data);
    if (!data) return;

    const {screen, conversationId, routeId} = data;

    console.log('🔥 SCREEN:', screen);
    console.log('🔥 ROUTE ID:', routeId);
    console.log('🔥 CONVERSATION ID:', conversationId);

    if (!navigationRef.isReady()) {
      console.log('⏳ Navigation not ready, retrying...');
      setTimeout(() => this.handleNavigation(data), 1000);
      return;
    }

    if (screen?.toLowerCase() === 'message' && conversationId) {
      console.log('➡️ GO TO CHAT');
      navigate('ConversationsScreen', {conversationId});
    }

    if (screen?.toLowerCase() === 'request' && routeId) {
      console.log('➡️ GO TO REQUEST SCREEN');
      navigate('RouteRequest', {routeId, fromNotification: true});
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
      console.log('📲 CLICKED NOTIFICATION:', remoteMessage);
      console.log('📲 DATA:', remoteMessage.data);

      setTimeout(() => {
        this.handleNavigation(remoteMessage.data);
      }, 500);
    });
    // 👉 когато app е затворено и се отвори от нотификация
    const initialNotification = await messaging().getInitialNotification();

    if (initialNotification) {
      console.log('🚀 OPEN FROM CLOSED APP:', initialNotification);
      console.log('🚀 DATA:', initialNotification.data);

      setTimeout(() => {
        this.handleNavigation(initialNotification.data);
      }, 1000);
    }

    return token;
  }
}

export default new NotificationService();
