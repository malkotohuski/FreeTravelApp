import 'react-native-gesture-handler';
import React, {useState} from 'react';
import './src/i18n/i18n';
import {SafeAreaView} from 'react-native-safe-area-context';
import {NavigationContainer} from '@react-navigation/native';
import {Navigator} from './src/navigation/drawerContent';
import {RouteProvider} from './src/context/RouteContext';
import {AuthProvider} from './src/context/AuthContext';
import {DarkModeProvider} from './src/navigation/DarkModeContext';
import {navigationRef} from './src/navigation/NavigationService';
import NotificationService from './src/backend-v2/services/NotificationService';
import {useEffect} from 'react';
import Toast from 'react-native-toast-message';
import api from './src/api/api';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    async function initPush() {
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
        <NavigationContainer ref={navigationRef}>
          <AuthProvider>
            <RouteProvider>
              <Navigator isLoggedIn={isLoggedIn} />
            </RouteProvider>
          </AuthProvider>
        </NavigationContainer>
      </DarkModeProvider>
      <Toast />
    </SafeAreaView>
  );
}

export default App;
