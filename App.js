import 'react-native-gesture-handler';
import React, {useEffect, useState} from 'react';
import './src/i18n/i18n';

import {SafeAreaView} from 'react-native-safe-area-context';
import {NavigationContainer} from '@react-navigation/native';

import {Navigator} from './src/navigation/drawerContent';
import {RouteProvider} from './src/context/RouteContext';
import {AuthProvider} from './src/context/AuthContext';
import {DarkModeProvider} from './src/navigation/DarkModeContext';

import {
  navigationRef,
  handlePendingNavigation,
} from './src/navigation/NavigationService';

import NotificationService from './src/backend-v2/services/NotificationService';
import Toast from 'react-native-toast-message';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    // 🔥 init push само веднъж
    NotificationService.init();
  }, []);

  return (
    <SafeAreaView style={{flex: 1}}>
      <DarkModeProvider>
        <NavigationContainer
          ref={navigationRef}
          onReady={() => {
            console.log('✅ Navigation ready');
            handlePendingNavigation(); // 💥 ТОВА Е FIX-а
          }}>
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
