import 'react-native-gesture-handler';
import React, {useState, useEffect} from 'react';
import './src/i18n/i18n';
import {SafeAreaView} from 'react-native-safe-area-context';
import {NavigationContainer} from '@react-navigation/native';
import {Navigator} from './src/navigation/drawerContent';
import {RouteProvider} from './src/context/RouteContext';
import {AuthProvider} from './src/context/AuthContext';
import {DarkModeProvider} from './src/navigation/DarkModeContext';
import {navigationRef} from './src/navigation/NavigationService';
import NotificationService from './src/backend-v2/services/NotificationService';
import messaging from '@react-native-firebase/messaging';
import notifee, {AndroidImportance} from '@notifee/react-native';
import Toast from 'react-native-toast-message';
import api from './src/api/api';

// 🔴 ТОВА Е МНОГО ВАЖНО – ИЗВЪН App()
messaging().setBackgroundMessageHandler(async remoteMessage => {
  console.log('📩 BACKGROUND MESSAGE:', remoteMessage.data);

  const {title, body} = remoteMessage.data;

  await notifee.displayNotification({
    title: title || 'Ново съобщение',
    body: body || '',
    android: {
      channelId: 'default',
      pressAction: {
        id: 'default',
      },
    },
  });
});

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    async function initPush() {
      // ✅ Създаваме channel (задължително за Android)
      await notifee.createChannel({
        id: 'default',
        name: 'Default Channel',
        importance: AndroidImportance.HIGH,
      });

      const token = await NotificationService.init();

      console.log('Device token:', token);

      try {
        await api.post('api/register-device', {
          userId: user.id,
          fcmToken: token,
        });

        console.log('FCM token saved to backend');
      } catch (err) {
        console.log('Error saving FCM token:', err);
      }
    }

    initPush();
  }, []);

  return (
    <SafeAreaView style={{flex: 1}}>
      <DarkModeProvider>
        <NavigationContainer
          ref={navigationRef}
          onReady={() => {
            NotificationService.onNavigationReady();
          }}>
          <AuthProvider>
            <RouteProvider>
              <Navigator isLoggedIn={isLoggedIn} />
            </RouteProvider>
          </AuthProvider>
        </NavigationContainer>
      </DarkModeProvider>

      {/* Toast за foreground */}
      <Toast />
    </SafeAreaView>
  );
}

export default App;
