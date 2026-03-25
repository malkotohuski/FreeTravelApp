// src/backend-v2/services/NotificationService.js
import messaging from '@react-native-firebase/messaging';
import {Platform, PermissionsAndroid, Alert} from 'react-native';
import {navigationRef} from '../../navigation/NavigationService';

class NotificationService {
  pendingNavigation = null;

  // ⚡️ Вика се когато NavigationContainer е готов
  onNavigationReady() {
    if (this.pendingNavigation) {
      this.navigate(this.pendingNavigation);
      this.pendingNavigation = null;
    }
  }

  // Основна функция за навигация
  handleNavigation(data) {
    if (!data) return;

    const {screen, conversationId, routeId} = data;

    console.log('🧭 NAVIGATE DATA:', data);
    console.log('🧭 NAV READY:', navigationRef.isReady());

    if (!navigationRef.isReady()) {
      console.log('⏳ Navigation not ready, retrying...');
      setTimeout(() => this.handleNavigation(data), 1000);
      return;
    }

    if (screen === 'message' && conversationId) {
      navigate('ConversationsScreen', {conversationId});
    }

    if (screen === 'request' && routeId) {
      navigate('Route request', {routeId});
    }
  }

  async requestPermission() {
    if (Platform.OS === 'android' && Platform.Version >= 33) {
      await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
      );
    }
    const status = await messaging().requestPermission();
    return (
      status === messaging.AuthorizationStatus.AUTHORIZED ||
      status === messaging.AuthorizationStatus.PROVISIONAL
    );
  }

  async getFCMToken() {
    await messaging().registerDeviceForRemoteMessages();
    const token = await messaging().getToken();
    console.log('FCM TOKEN:', token);
    return token;
  }

  async init() {
    await this.requestPermission();
    const token = await this.getFCMToken();

    // 👀 foreground push
    messaging().onMessage(remoteMessage => {
      Alert.alert(
        remoteMessage.notification?.title || 'Ново съобщение',
        remoteMessage.notification?.body || '',
      );
    });

    // 👀 background push click
    messaging().onNotificationOpenedApp(remoteMessage => {
      console.log('Background notification click:', remoteMessage.data);
      this.navigate(remoteMessage.data);
    });

    // 👀 cold start push click
    const initialNotification = await messaging().getInitialNotification();
    if (initialNotification) {
      console.log('Cold start notification:', initialNotification.data);
      this.pendingNavigation = initialNotification.data;
    }

    return token;
  }
}

export default new NotificationService();
