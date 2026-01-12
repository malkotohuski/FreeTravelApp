import 'react-native-gesture-handler';
import React, {useState} from 'react';
import './src/i18n/i18n';
import {SafeAreaView} from 'react-native-safe-area-context';
import {createDrawerNavigator} from '@react-navigation/drawer';
import {NavigationContainer} from '@react-navigation/native';
import {Navigator} from './src/navigation/drawerContent';
import {RouteProvider} from './src/context/RouteContext';
import {AuthProvider} from './src/context/AuthContext';
import {DarkModeProvider} from './src/navigation/DarkModeContext';

const Drawer = createDrawerNavigator();

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  return (
    <SafeAreaView style={{flex: 1}}>
      <DarkModeProvider>
        <NavigationContainer>
          <AuthProvider>
            <RouteProvider>
              <Navigator isLoggedIn={isLoggedIn} />
            </RouteProvider>
          </AuthProvider>
        </NavigationContainer>
      </DarkModeProvider>
    </SafeAreaView>
  );
}

export default App;
