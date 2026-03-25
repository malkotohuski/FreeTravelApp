// src/backend-v2/services/NotificationService.js
import messaging from '@react-native-firebase/messaging';
import {PermissionsAndroid, Platform} from 'react-native';
import notifee, {AndroidImportance} from '@notifee/react-native';

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

    // Създаваме channel за Android
    await notifee.createChannel({
      id: 'default',
      name: 'FreeTravel Notifications',
      importance: AndroidImportance.HIGH,
    });

    const token = await this.getFCMToken();

    // Foreground handler
    messaging().onMessage(async remoteMessage => {
      console.log('Foreground push:', remoteMessage);

      const title = remoteMessage.notification?.title || '🔔 Ново известие';
      const body = remoteMessage.notification?.body || '';

      await notifee.displayNotification({
        title,
        body,
        android: {
          channelId: 'default',
          pressAction: {id: 'default'},
        },
      });
    });

    // Background handler
    messaging().setBackgroundMessageHandler(async remoteMessage => {
      console.log('Background push:', remoteMessage);

      const title = remoteMessage.data?.title || '🔔 Ново известие';
      const body = remoteMessage.data?.body || '';

      await notifee.displayNotification({
        title,
        body,
        android: {
          channelId: 'default',
          pressAction: {id: 'default'},
        },
      });
    });

    return token;
  }

  onNavigationReady() {
    // placeholder ако искаме да навигираме при click
  }
}

export default new NotificationService();
