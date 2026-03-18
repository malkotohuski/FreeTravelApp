// backend-v2/services/NotificationService.js
import messaging from '@react-native-firebase/messaging';
import {PermissionsAndroid, Platform} from 'react-native';

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
    const token = await this.getFCMToken();

    messaging().onMessage(async remoteMessage => {
      console.log('Foreground push:', remoteMessage);
    });

    return token;
  }
}

export default new NotificationService();
