import messaging from '@react-native-firebase/messaging';
import {PermissionsAndroid, Platform} from 'react-native';
import {navigate} from '../../navigation/NavigationService';
import Toast from 'react-native-toast-message';

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
      navigate('ConversationsScreen', {conversationId});
    }

    if (screen === 'request' && routeId) {
      navigate('RouteRequest', {
        routeId,
        fromNotification: true, // 👈 ВАЖНО
      });
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

  getToastTitle(type) {
    switch (type) {
      case 'message':
        return '📩 Ново съобщение';
      case 'request':
        return '🚗 Нова заявка за пътуване';
      case 'accept':
        return '✅ Заявката е приета';
      case 'reject':
        return '❌ Заявката е отказана';
      case 'rating':
        return '⭐ Нова оценка';
      default:
        return '🔔 Известие';
    }
  }

  async init() {
    await this.requestPermission();
    const token = await this.getFCMToken();

    // 👉 когато app е отворено
    messaging().onMessage(async remoteMessage => {
      console.log('Foreground push:', remoteMessage);

      const {data} = remoteMessage;

      const title = this.getToastTitle(data?.type);
      const body = data?.message || 'Имаш ново известие';

      Toast.show({
        type: 'info',
        text1: title,
        text2: body,
        position: 'top',
        visibilityTime: 3000,
        onPress: () => {
          this.handleNavigation(data); // 👈 директно навигираш
        },
      });
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
