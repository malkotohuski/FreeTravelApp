import messaging from '@react-native-firebase/messaging';
import {PermissionsAndroid, Platform} from 'react-native';
import {navigate} from '../../navigation/NavigationService'; // ✅ само оттук!
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

  // 👉 NAVIGATION от push
  handleNavigation(data) {
    if (!data) return;

    const {screen, conversationId, routeId} = data;

    console.log('📲 PUSH NAVIGATION:', data);

    if (screen === 'message' && conversationId) {
      this.setActiveConversation(conversationId);

      navigate('ChatScreen', {
        conversationId,
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

    // 👉 BACKGROUND (app е в background)
    messaging().onNotificationOpenedApp(remoteMessage => {
      console.log('📲 BACKGROUND CLICK');

      setTimeout(() => {
        this.handleNavigation(remoteMessage.data);
      }, 800); // 🔥 малко по-голям delay
    });

    // 👉 QUIT STATE (app е бил затворен)
    const initialNotification = await messaging().getInitialNotification();

    if (initialNotification) {
      console.log('📲 OPEN FROM QUIT');

      setTimeout(() => {
        this.handleNavigation(initialNotification.data);
      }, 1500); // 🔥 ключово за Play Store!
    }

    return token;
  }
}

export default new NotificationService();
