import messaging from '@react-native-firebase/messaging';
import {PermissionsAndroid, Platform} from 'react-native';
import {navigate} from '../../navigation/NavigationService';
import Toast from 'react-native-toast-message';
import api from '../../api/api';

class NotificationService {
  currentConversationId = null;
  tokenRefreshUnsubscribe = null;

  setActiveConversation(conversationId) {
    this.currentConversationId = String(conversationId);
  }

  clearActiveConversation() {
    this.currentConversationId = null;
  }

  getActiveConversation() {
    return this.currentConversationId;
  }

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

    if (screen === 'message' && conversationId) {
      this.setActiveConversation(conversationId);
      navigate('ChatScreen', {conversationId});
    }

    if (screen === 'request' && routeId) {
      navigate('RouteRequest', {
        routeId,
        fromNotification: true,
      });
    }
  }

  async getFCMToken() {
    try {
      await messaging().registerDeviceForRemoteMessages();
      const token = await messaging().getToken();
      return token;
    } catch (error) {
      console.log('FCM ERROR:', error);
      return null;
    }
  }

  async registerTokenWithBackend(token) {
    if (!token) {
      return null;
    }

    try {
      await api.post('/api/register-device', {fcmToken: token});
      return token;
    } catch (error) {
      const status = error?.response?.status;

      if (status !== 401 && status !== 403) {
        console.log('Register device token failed:', error?.message || error);
      }

      return null;
    }
  }

  async syncDeviceToken() {
    const granted = await this.requestPermission();

    if (!granted) {
      return null;
    }

    const token = await this.getFCMToken();
    await this.registerTokenWithBackend(token);
    return token;
  }

  getToastTitle(type) {
    switch (type) {
      case 'message':
        return 'Message';
      case 'request':
        return 'You have a new request';
      case 'accept':
        return 'Your request was accepted';
      case 'reject':
        return 'Your request was rejected';
      case 'rating':
        return 'You received a new rating';
      default:
        return 'Notification';
    }
  }

  async init() {
    const token = await this.syncDeviceToken();

    if (!this.tokenRefreshUnsubscribe) {
      this.tokenRefreshUnsubscribe = messaging().onTokenRefresh(
        async newToken => {
          await this.registerTokenWithBackend(newToken);
        },
      );
    }

    messaging().onMessage(async remoteMessage => {
      const {data} = remoteMessage;

      if (data?.title || data?.body) {
        Toast.show({
          type: 'info',
          text1: data.title || this.getToastTitle(data?.type),
          text2: data.body || '',
          position: 'top',
        });
      }

      return;
    });

    messaging().onNotificationOpenedApp(remoteMessage => {
      setTimeout(() => {
        this.handleNavigation(remoteMessage.data);
      }, 800);
    });

    const initialNotification = await messaging().getInitialNotification();

    if (initialNotification) {
      setTimeout(() => {
        this.handleNavigation(initialNotification.data);
      }, 1500);
    }

    return token;
  }
}

export default new NotificationService();
