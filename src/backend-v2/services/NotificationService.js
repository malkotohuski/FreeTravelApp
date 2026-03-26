import messaging from '@react-native-firebase/messaging';
import {PermissionsAndroid, Platform} from 'react-native';
import {navigate} from '../../navigation/NavigationService';
import Toast from 'react-native-toast-message';

class NotificationService {
  currentConversationId = null;

  // 👉 SET активен чат
  setActiveConversation(conversationId) {
    this.currentConversationId = String(conversationId);
  }

  // 👉 CLEAR като излезеш
  clearActiveConversation() {
    this.currentConversationId = null;
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
      navigate('ConversationsScreen', {conversationId});
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
    } catch (err) {
      console.log('FCM ERROR:', err);
    }
  }

  getToastTitle(type) {
    switch (type) {
      case 'message':
        return '📩';
      case 'request':
        return '🚗 You have a new request';
      case 'accept':
        return '✅ Your request was accepted';
      case 'reject':
        return '❌ Your request was rejected';
      case 'rating':
        return '⭐ You received a new rating';
      default:
        return '🔔 Notification';
    }
  }

  async init() {
    await this.requestPermission();
    const token = await this.getFCMToken();

    // 🔥 FOREGROUND
    messaging().onMessage(async remoteMessage => {
      const {data} = remoteMessage;

      const incomingConversationId = data?.conversationId;

      // ❌ ако си вътре в същия чат → НЕ показвай toast
      if (
        (data?.type === 'message' || data?.type === 'chat') &&
        String(incomingConversationId || '') ===
          String(this.currentConversationId || '')
      ) {
        console.log('⛔ Skip toast (inside chat)');
        return;
      }

      const title = this.getToastTitle(data?.type);

      let body = '';

      if (data?.type === 'message') {
        const name = data?.senderName || 'Someone';
        body = `${name}: ${data?.message}`;
      } else if (data?.type === 'request') {
        body = 'Tap to view the request';
      } else {
        body = data?.message || 'You have a notification';
      }

      Toast.show({
        type: 'info',
        text1: title,
        text2: body,
        position: 'top',
        visibilityTime: 3000,
        onPress: () => {
          this.handleNavigation(data);
        },
      });
    });

    // 👉 BACKGROUND CLICK
    messaging().onNotificationOpenedApp(remoteMessage => {
      setTimeout(() => {
        this.handleNavigation(remoteMessage.data);
      }, 500);
    });

    // 👉 QUIT STATE
    const initialNotification = await messaging().getInitialNotification();

    if (initialNotification) {
      setTimeout(() => {
        this.handleNavigation(initialNotification.data);
      }, 1000);
    }

    return token;
  }
}

export default new NotificationService();
