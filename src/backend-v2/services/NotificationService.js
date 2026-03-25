// src/backend-v2/services/NotificationService.js
import messaging from '@react-native-firebase/messaging';
import {Platform, PermissionsAndroid} from 'react-native';
import {navigationRef} from '../../navigation/NavigationService';
import {CommonActions} from '@react-navigation/native';

class NotificationService {
  pendingNavigation = null;

  onNavigationReady() {
    if (this.pendingNavigation) {
      this.handleNavigation(this.pendingNavigation);
      this.pendingNavigation = null;
    }
  }

  handleNavigation(data) {
    if (!data) return;

    const {screen, conversationId, routeId} = data;
    console.log('🔹 HANDLE NAV DATA:', data);

    const tryNavigate = () => {
      if (!navigationRef.current) {
        console.log('⏳ Navigation not ready, retry in 500ms');
        setTimeout(tryNavigate, 500);
        return;
      }

      console.log('🔹 NAV CURRENT READY:', navigationRef.current);

      if (screen === 'message' && conversationId) {
        navigationRef.current.dispatch(
          CommonActions.navigate('ConversationsScreen', {conversationId}),
        );
      } else if (screen === 'request' && routeId) {
        navigationRef.current.dispatch(
          CommonActions.navigate('RouteRequest', {routeId}),
        );
      }
    };

    tryNavigate();
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
      console.log('Foreground push received:', remoteMessage.data);
      this.handleNavigation(remoteMessage.data);
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
