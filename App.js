import 'react-native-gesture-handler';
import React, {useEffect} from 'react';
import './src/i18n/i18n';

import {SafeAreaView} from 'react-native-safe-area-context';
import {NavigationContainer} from '@react-navigation/native';

import {Navigator} from './src/navigation/drawerContent';
import {RouteProvider} from './src/context/RouteContext';
import {AuthProvider} from './src/context/AuthContext';
import {DarkModeProvider} from './src/navigation/DarkModeContext';
import {ChatProvider} from './src/context/ChatContext';

import {
  navigationRef,
  handlePendingNavigation,
} from './src/navigation/NavigationService';

import NotificationService from './src/backend-v2/services/NotificationService';
import Toast from 'react-native-toast-message';

function App() {
  useEffect(() => {
    NotificationService.init();
  }, []);

  return (
    <SafeAreaView style={{flex: 1}}>
      <DarkModeProvider>
        <AuthProvider>
          <ChatProvider>
            <NavigationContainer
              ref={navigationRef}
              onReady={() => {
                handlePendingNavigation();
              }}>
              <RouteProvider>
                <Navigator />
              </RouteProvider>
            </NavigationContainer>
          </ChatProvider>
        </AuthProvider>
      </DarkModeProvider>

      <Toast />
    </SafeAreaView>
  );
}

export default App;
