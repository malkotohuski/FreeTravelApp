import {getApp} from '@react-native-firebase/app';
import {
  AuthorizationStatus,
  getInitialNotification,
  getMessaging,
  getToken,
  isDeviceRegisteredForRemoteMessages,
  onMessage,
  onNotificationOpenedApp,
  onTokenRefresh,
  registerDeviceForRemoteMessages,
  requestPermission,
} from '@react-native-firebase/messaging';
import {PermissionsAndroid, Platform} from 'react-native';
import {navigate} from '../../navigation/NavigationService';
import Toast from 'react-native-toast-message';
import api from '../../api/api';

class NotificationService {
  currentConversationId = null;
  messaging = getMessaging(getApp());
  tokenRefreshUnsubscribe = null;
  foregroundMessageUnsubscribe = null;
  notificationOpenedUnsubscribe = null;
  initialized = false;

  setActiveConversation(conversationId) {
    this.currentConversationId = conversationId
      ? String(conversationId)
      : null;
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

    const authStatus = await requestPermission(this.messaging);
    return (
      authStatus === AuthorizationStatus.AUTHORIZED ||
      authStatus === AuthorizationStatus.PROVISIONAL
    );
  }

  handleNavigation(data) {
    if (!data) {
      return;
    }

    const {screen, conversationId, routeId} = data;

    if (screen === 'message' && conversationId) {
      this.setActiveConversation(conversationId);
      navigate('ChatScreen', {
        conversationId,
        fromScreen: 'ConversationsScreen',
      });
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
      if (
        Platform.OS === 'ios' &&
        !isDeviceRegisteredForRemoteMessages(this.messaging)
      ) {
        await registerDeviceForRemoteMessages(this.messaging);
      }

      return await getToken(this.messaging);
    } catch (error) {
      console.error('FCM token error:', error?.message || error);
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
        console.error(
          'Register device token failed:',
          error?.message || error,
        );
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
    if (this.initialized) {
      return null;
    }

    this.initialized = true;

    if (!this.tokenRefreshUnsubscribe) {
      this.tokenRefreshUnsubscribe = onTokenRefresh(
        this.messaging,
        async newToken => {
          await this.registerTokenWithBackend(newToken);
        },
      );
    }

    if (!this.foregroundMessageUnsubscribe) {
      this.foregroundMessageUnsubscribe = onMessage(
        this.messaging,
        remoteMessage => {
          const {data} = remoteMessage;

          if (data?.title || data?.body) {
            Toast.show({
              type: 'info',
              text1: data.title || this.getToastTitle(data?.type),
              text2: data.body || '',
              position: 'top',
            });
          }
        },
      );
    }

    if (!this.notificationOpenedUnsubscribe) {
      this.notificationOpenedUnsubscribe = onNotificationOpenedApp(
        this.messaging,
        remoteMessage => {
          setTimeout(() => {
            this.handleNavigation(remoteMessage.data);
          }, 800);
        },
      );
    }

    const initialNotification = await getInitialNotification(this.messaging);

    if (initialNotification) {
      setTimeout(() => {
        this.handleNavigation(initialNotification.data);
      }, 1500);
    }

    return null;
  }
}

export default new NotificationService();
