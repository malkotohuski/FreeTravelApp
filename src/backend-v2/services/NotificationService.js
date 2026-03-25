// src/backend-v2/services/NotificationService.js
import messaging from '@react-native-firebase/messaging';
import {Platform, PermissionsAndroid, Alert, AppState} from 'react-native';
import Toast from 'react-native-toast-message';
import {navigationRef} from '../../navigation/NavigationService';

class NotificationService {
  pendingNavigation = null;

  // ⚡️ Вика се когато NavigationContainer е готов
  onNavigationReady() {
    if (this.pendingNavigation) {
      console.log('⏳ Executing pending navigation after cold start');
      this.handleNavigation(this.pendingNavigation);
      this.pendingNavigation = null;
    }
  }

  // Основна функция за навигация
  handleNavigation(data) {
    console.log('🔹 HANDLE NAV DATA:', data);
    if (!data) return;

    const {screen, conversationId, routeId} = data;

    if (!navigationRef.isReady()) {
      console.log('⏳ Navigation not ready yet, retry in 1s', data);
      setTimeout(() => this.handleNavigation(data), 1000);
      return;
    }

    if (screen === 'message' && conversationId) {
      console.log('🔹 NAV CURRENT:', navigationRef.current);
      navigationRef.current?.navigate('ConversationsScreen', {conversationId});
    }

    if (screen === 'request' && routeId) {
      navigationRef.current?.navigate('RouteRequest', {routeId});
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
    // 👀 foreground push
    messaging().onMessage(remoteMessage => {
      console.log('Foreground push received:', remoteMessage.data);

      const {message} = remoteMessage.data;

      Toast.show({
        text1: message || 'Ново известие',
        visibilityTime: 3000,
        position: 'top',
      });

      // ❌ НЕ викай handleNavigation тук
    });

    // 👀 background push click
    messaging().onNotificationOpenedApp(remoteMessage => {
      console.log('Background notification click:', remoteMessage.data);
      this.handleNavigation(remoteMessage.data);
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
