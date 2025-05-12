import React, { useContext } from 'react';
import { TouchableOpacity, ImageBackground, StyleSheet, Text } from 'react-native';
import Register from '../screens/Register';
import Login from '../screens/Login';
import { createDrawerNavigator } from '@react-navigation/drawer';
import HomePage from '../screens/Home';
import CustomerDrawer from './customDrawer';
import MarkSeatsScreen from '../screens/MarkSeatsScreen';
import Vehicle from '../screens/Vehicle';
import SelectRouteScreen from '../screens/SelectRoute';
import { useTranslation } from 'react-i18next';
import Comments from '../screens/Comments';
//import { useTranslation } from 'react-i18next';
import Confirm from '../screens/Confirm';
import ViewRoutes from '../screens/ViewRoutes';
import ReportingScreen from '../screens/ReportingScreen';
import RouteRequestScreen from '../screens/RouteRequest';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Icons from 'react-native-vector-icons/MaterialCommunityIcons';
import AccountManager from '../screens/AccountManager';
import Messages from '../screens/Chats/Messages';
import AccountSettings from '../screens/AccountSettings';
import WelcomeScreen from '../screens/Welcome';
import LogoutScreen from '../screens/Logout';
import SettingsScreen from '../screens/Settings';
import { RouteDetails } from '../screens/RequestScreen';
import ChatScreen from '../screens/Chats/ChatScreen';
import AddFriendScreen from '../screens/Chats/AddFriendScreen';
import RouteHistory from '../screens/RouteHistory';
import UsersScreen from '../screens/Users';
import Notifications from '../screens/Notifications';
import { DarkModeContext } from './DarkModeContext';

const Drawer = createDrawerNavigator();

const styles = StyleSheet.create({
    backgroundImage: {
        flex: 1,
        resizeMode: 'cover',
        justifyContent: 'center',
        opacity: 0.8, // Настройка на прозрачността на картината
    },
});

export const Navigator = ({ isLoggedIn }) => {
    const { t } = useTranslation();
    const { darkMode } = useContext(DarkModeContext);
    //const backgroundImage = require('../../images/drawer.jpg');

    const screenStyles = {
        headerStyle: {
            backgroundColor: darkMode ? '#333232FF' : '#f4511e', // Промяна на цвета при darkMode
        },
        headerTintColor: darkMode ? '#f1f1f1' : '#F1F1F1', // Промяна на цвета на текста
    };

    const renderLogoutIcon = ({ navigation }) => (
        <TouchableOpacity
            style={{ marginRight: 16 }}
            onPress={() => {
                // Handle the press event, navigate to the 'LogoutScreen'
                navigation.navigate('LogoutScreen');
            }}
        >
            <Icon name="logout" size={24} color="white" />
        </TouchableOpacity>
    );

    const renderManageAccountsIcon = ({ navigation }) => (
        <TouchableOpacity
            style={{ marginRight: 16 }}
            onPress={() => {
                // Handle the press event, navigate to the 'AccountManager' screen
                navigation.navigate('AccountManager');
            }}
        >
            <Icon name="manage-accounts" size={24} color="white" />
        </TouchableOpacity>
    );

    const renderBackButtonIcon = ({ navigation }) => (
        <TouchableOpacity
            style={{ marginRight: 16 }}
            onPress={() => {
                navigation.navigate('Home');
            }}
        >
            <Icons name="keyboard-backspace" size={24} color="white" />
        </TouchableOpacity>
    );

    const renderBackButtonVehicle = ({ navigation }) => (
        <TouchableOpacity
            style={{
                marginRight: 16
            }}
            onPress={() => {
                navigation.navigate('Home');
            }}
        >
            <Icons name="keyboard-backspace" size={24} color="white" />
        </TouchableOpacity>
    );

    const renderBackButtonAccountInfo = ({ navigation }) => (
        <TouchableOpacity
            style={{
                marginRight: 16
            }}
            onPress={() => {
                navigation.navigate('AccountManager');
            }}
        >
            <Icons name="keyboard-backspace" size={24} color="white" />
        </TouchableOpacity>
    );

    const renderBackButtonIcons = ({ navigation }) => (
        <TouchableOpacity
            style={{
                marginRight: 16,
            }}
            onPress={() => {
                navigation.navigate('Vehicle');
            }}
        >
            <Icons name="keyboard-backspace" size={24} color="white" />
        </TouchableOpacity>
    );

    const BackButtonRouteRequests = ({ navigation }) => (
        <TouchableOpacity
            style={{ marginRight: 16 }}
            onPress={() => {
                navigation.navigate('Home');
            }}
        >
            <Icons name="keyboard-backspace" size={24} color="white" />
        </TouchableOpacity>
    );

    const BackButtonRouteViewRoutes = ({ navigation }) => (
        <TouchableOpacity
            style={{ marginRight: 16 }}
            onPress={() => {
                navigation.navigate('View routes');
            }}
        >
            <Icons name="keyboard-backspace" size={24} color="white" />
        </TouchableOpacity>
    );

    return (
        <Drawer.Navigator
            drawerContent={CustomerDrawer}
        >
            <Drawer.Screen
                name="Login"
                component={Login}
                options={{
                    title: 'Login',
                    ...screenStyles,
                    headerShown: false,
                    drawerItemStyle: { display: 'none' }
                }}
            />
           <Drawer.Screen
                name="Register"
                component={Register}
                options={{
                    title: t('Register'),
                    ...screenStyles,
                    headerShown: false,
                    drawerItemStyle: { display: 'none' }
                }}
            />     
            <Drawer.Screen
                name="Messages"
                component={Messages}
                options={{
                    title: t('Messages'),
                    ...screenStyles,
                    headerShown: false,
                    drawerItemStyle: { display: 'none' }
                }}
            /> 
            <Drawer.Screen
                name='Home'
                component={HomePage}
                options={{
                    title: t(''),
                    ...screenStyles,
                    drawerIcon: ({ color, size }) => (
                        <Icon name="home" size={size} color={color} />
                    ),
                }}
                listeners={({ navigation }) => ({
                    focus: () => {
                        navigation.setOptions({
                            headerRight: () => renderManageAccountsIcon({ navigation }),
                        });
                    },
                })}
            />  
            <Drawer.Screen
                name="Vehicle"
                component={Vehicle}
                options={{
                    title: t('Vehicle'),
                    ...screenStyles,
                    headerTitleStyle: {
                    fontSize: 18, // <-- промени размера тук
        },
                    drawerItemStyle: { display: 'none' }
                }}
                listeners={({ navigation }) => ({
    focus: () => {
        navigation.setOptions({
            headerRight: () => (
                <TouchableOpacity
                    style={{ marginRight: 16, flexDirection: 'row', alignItems: 'center' }}
                    onPress={() => navigation.navigate('Home')} // или друга логика за връщане
                >
                    <Text style={{ color: 'white', marginRight: 8 , fontSize: 18, }}>{t('Step 1 of 4')}</Text>
                    <Icons name="keyboard-backspace" size={24} color="white" />
                   
                </TouchableOpacity>
            ),
        });
    },
})}

            />
            <Drawer.Screen
                name="Mark Seats"
                component={MarkSeatsScreen}
                options={{
                    title: t('Mark Seats'),
                    ...screenStyles,
                      headerTitleStyle: {
                    fontSize: 18, // <-- промени размера тук
        },
                    drawerItemStyle: { display: 'none' }
                }}
              listeners={({ navigation }) => ({
    focus: () => {
        navigation.setOptions({
            headerRight: () => (
                <TouchableOpacity
                    style={{ marginRight: 16, flexDirection: 'row', alignItems: 'center' }}
                    onPress={() => navigation.navigate('Vehicle')} // или друга логика за връщане
                >
                    <Text style={{ color: 'white', marginRight: 8 , fontSize: 18,}}>{t('Step 2 of 4')}</Text>
                    <Icons name="keyboard-backspace" size={24} color="white" />
                   
                </TouchableOpacity>
            ),
        });
    },
})}
            />
             <Drawer.Screen
                name="Chat"
                component={ChatScreen}
                options={{
                    title: t('Chat'),
                    ...screenStyles,
                    headerShown: false,
                    drawerItemStyle: { display: 'none' }
                }}
            />
            <Drawer.Screen
                name="AddFriendScreen"
                component={AddFriendScreen}
                options={{
                    title: t('AddFriendScreen'),
                    ...screenStyles,
                    headerShown: false,
                    drawerItemStyle: { display: 'none' }
                }}
            />
            <Drawer.Screen
                name="SelectRoute"
                component={SelectRouteScreen}
                options={{
                    title: t('SelectRoute'),
                    ...screenStyles,
                      headerTitleStyle: {
                    fontSize: 18, // <-- промени размера тук
        },
                    drawerItemStyle: { display: 'none' }
                }}
                listeners={({ navigation }) => ({
    focus: () => {
        navigation.setOptions({
            headerRight: () => (
                <TouchableOpacity
                    style={{ marginRight: 16, flexDirection: 'row', alignItems: 'center' }}
                    onPress={() => navigation.navigate('Mark Seats')} // или друга логика за връщане
                >
                    <Text style={{ color: 'white', marginRight: 8 , fontSize: 18,}}>{t('Step 3 of 4')}</Text>
                    <Icons name="keyboard-backspace" size={24} color="white" />
                   
                </TouchableOpacity>
            ),
        });
    },
})}
            />
              <Drawer.Screen
                name="View routes"
                component={ViewRoutes}
                options={{
                    title: t('View routes'),
                    ...screenStyles,
                    drawerIcon: ({ color, size }) => (
                        <Icon name="streetview" size={size} color={color} />
                    ),
                }}
                listeners={({ navigation }) => ({
                    focus: () => {
                        navigation.setOptions({
                            headerRight: () => renderBackButtonVehicle({ navigation }),
                        });
                    },
                })}
            />
               <Drawer.Screen
                name="Reporting"
                component={ReportingScreen}
                options={{
                    title: t('Reporting'),
                    ...screenStyles,
                    headerShown: false,
                    drawerIcon: ({ color, size }) => (
                        <Icon name="report" size={size} color={color} />
                    ),
                }}
            />
              <Drawer.Screen
                name="Comments"
                component={Comments}
                key="Comments"
                options={{
                    title: t('Comments'),
                    ...screenStyles,
                    headerShown: false,
                    drawerItemStyle: { display: 'none' }
                }}
            />
             <Drawer.Screen
                name="Confirm"
                component={Confirm}
                options={{
                    title: t('Confirm'),
                    ...screenStyles,
                      headerTitleStyle: {
                    fontSize: 18, // <-- промени размера тук
        },
                    drawerItemStyle: { display: 'none' }
                }}
                listeners={({ navigation }) => ({
    focus: () => {
        navigation.setOptions({
            headerRight: () => (
                <TouchableOpacity
                    style={{ marginRight: 16, flexDirection: 'row', alignItems: 'center' }}
                    onPress={() => navigation.navigate('SelectRoute')} // или друга логика за връщане
                >
                    <Text style={{ color: 'white', marginRight: 8 , fontSize: 18,}}>{t('Step 4 of 4')}</Text>
                    <Icons name="keyboard-backspace" size={24} color="white" />
                   
                </TouchableOpacity>
            ),
        });
    },
})}
            />
             <Drawer.Screen
                name="Route request"
                component={RouteRequestScreen}
                options={{
                    title: t('Route request'),
                    ...screenStyles,
                    drawerIcon: ({ color, size }) => (
                        <Icons name="routes" size={size} color={color} />
                    ),
                }}
                listeners={({ navigation }) => ({
                    focus: () => {
                        navigation.setOptions({
                            headerRight: () => BackButtonRouteRequests({ navigation }),
                        });
                    },
                })}
            />
              <Drawer.Screen
                name="UsersScreen"
                component={UsersScreen}
                options={{
                    title: t('UsersScreen'),
                    ...screenStyles,
                    headerShown: false,
                    drawerIcon: ({ color, size }) => (
                        <Icon name="report" size={size} color={color} />
                    ),
                }}
            />
            <Drawer.Screen
                name="Settings"
                component={SettingsScreen}
                options={{
                    title: t('Settings'),
                    ...screenStyles,
                    drawerIcon: ({ color, size }) => (
                        <Icon name="settings" size={size} color={color} />
                    ),
                }}
                listeners={({ navigation }) => ({
                    focus: () => {
                        navigation.setOptions({
                            headerRight: () => BackButtonRouteRequests({ navigation }),
                        });
                    },
                })}
            />
            <Drawer.Screen
                name="AccountManager"
                component={AccountManager}
                options={{
                    title: t('Information about your account'),
                    ...screenStyles,
                    drawerItemStyle: { display: 'none' },
                }}
                listeners={({ navigation }) => ({
                    focus: () => {
                        navigation.setOptions({
                            headerRight: () => BackButtonRouteRequests({ navigation }),
                        });
                    },
                })}
            />
             <Drawer.Screen
                name="AccountSettings"
                component={AccountSettings}
                key="AccountSettings"
                options={{
                    title: t('Create an account'),
                    ...screenStyles,
                    drawerItemStyle: { display: 'none' }
                }}
                listeners={({ navigation }) => ({
                    focus: () => {
                        navigation.setOptions({
                            headerRight: () => renderBackButtonAccountInfo({ navigation }),
                        });
                    },
                })}
            />
            <Drawer.Screen
                name="LogoutScreen"
                component={LogoutScreen}
                options={{
                    title: t('Logout'),
                    ...screenStyles,
                    drawerIcon: ({ color, size }) => (
                        <Icons name="logout" size={size} color={color} />
                    ),
                }}
            />
               <Drawer.Screen
                name="WelcomeScreen"
                component={WelcomeScreen}
                key="WelcomeScreen"
                options={{
                    title: t('Welcome'),
                    ...screenStyles,
                    drawerItemStyle: { display: 'none' }
                }}
            />
               <Drawer.Screen
                name="RoutesHistory"
                component={RouteHistory}
                options={{
                    title: t('Routes History'),
                    ...screenStyles,
                    headerShown: false,
                    drawerItemStyle: { display: 'none' }
                }}
            />
             <Drawer.Screen
                name="RouteDetails"
                component={RouteDetails}
                options={{
                    title: t('Route Details'),
                    ...screenStyles,
                    drawerItemStyle: { display: 'none' }
                }}
                listeners={({ navigation }) => ({
                    focus: () => {
                        navigation.setOptions({
                            headerRight: () => BackButtonRouteViewRoutes({ navigation }),
                        });
                    },
                })}
            />
            <Drawer.Screen
                name="Notifications"
                component={Notifications}
                options={{
                    title: t('Notifications'),
                    ...screenStyles,
                    headerShown: false,
                    drawerItemStyle: { display: 'none' }
                }}
                    />
            {isLoggedIn ? dynamicScreens : null} 
        </Drawer.Navigator>
    );
};