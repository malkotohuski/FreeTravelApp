import React, {useContext, useEffect, useState, useRef} from 'react';
import {
  View,
  Text,
  Switch,
  StyleSheet,
  ScrollView,
  Alert,
  Modal,
  Pressable,
  SafeAreaView,
  Linking,
  TouchableOpacity,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {useTranslation} from 'react-i18next';
import {DarkModeContext} from '../../navigation/DarkModeContext';
import {useNavigation} from '@react-navigation/native';
import {useAuth} from '../../context/AuthContext';
import api from '../../api/api';

const SettingsScreen = () => {
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const {darkMode, toggleDarkMode} = useContext(DarkModeContext);
  const navigation = useNavigation();
  const {t, i18n} = useTranslation();
  const {logout} = useAuth();

  // Суичове за различни настройки
  const [toggleValues, setToggleValues] = useState({
    darkMode: !!darkMode,
    routeRequests: false,
    ratings: false,
    generalNotifications: false,
  });

  useEffect(() => {
    setToggleValues(prev => ({...prev, darkMode: !!darkMode}));
  }, [darkMode]);

  const handleToggleSwitch = id => {
    setToggleValues(prevValues => {
      const next = {...prevValues, [id]: !prevValues[id]};
      return next;
    });

    if (id === 'darkMode') {
      toggleDarkMode();
    }
  };

  const deleteAccount = async () => {
    try {
      const response = await api.patch('/api/users/delete-account');

      if (response.status !== 200) {
        Alert.alert('Error', 'Something went wrong.');
        return;
      }

      await logout();

      Alert.alert('Account deleted', 'Your account has been deactivated.', [
        {text: 'OK', onPress: () => navigation.navigate('Login')},
      ]);
    } catch (error) {
      Alert.alert(
        'Error',
        error.response?.data?.error || 'Unable to delete account.',
      );
    }
  };

  const handleLinkPress = id => {
    switch (id) {
      case 'language':
        navigation.navigate('LanguageSelection');
        break;
      case 'editProfile':
        navigation.navigate('AccountManager');
        break;
      case 'changePassword':
        navigation.navigate('AccountSettings');
        break;
      case 'deleteAccount':
        setShowDeleteModal(true);
        break;
      case 'reportBug':
        navigation.navigate('ReportBugScreen');
        break;
      case 'contactUs':
        navigation.navigate('ContactUsScreen');
        break;
      case 'about':
        navigation.navigate('AboutUsScreen');
        break;
      case 'privacyPolicy':
        Linking.openURL(
          i18n.language === 'bg'
            ? 'https://malkotohuski.github.io/legal-pages/privacy-policy-bg.html'
            : 'https://malkotohuski.github.io/legal-pages/privacy-policy-eng.html',
        );
        break;

      case 'termsOfService':
        Linking.openURL(
          i18n.language === 'bg'
            ? 'https://malkotohuski.github.io/legal-pages/terms-of-service-bg.html'
            : 'https://malkotohuski.github.io/legal-pages/terms-of-service-en.html',
        );
        break;
      default:
        break;
    }
  };

  const getSectionHeaderStyle = () => ({
    ...styles.sectionHeader,
    color: darkMode ? '#E0E0E0' : '#000',
  });

  const getListItemContainerStyle = () => ({
    ...styles.listItemContainer,
    backgroundColor: darkMode ? '#1E1E1E' : '#fff',
    borderColor: darkMode ? '#333333' : '#ddd',
    shadowColor: darkMode ? '#000' : '#ccc',
    elevation: darkMode ? 4 : 1,
    borderRadius: 10,
    marginVertical: 5,
  });

  const getTextStyle = () => ({
    color: darkMode ? '#E0E0E0' : '#000',
  });

  const renderItem = item => {
    switch (item.type) {
      case 'link':
        return (
          <TouchableOpacity
            key={item.id}
            style={getListItemContainerStyle()}
            activeOpacity={0.8}
            onPress={() => handleLinkPress(item.id)}>
            <View style={styles.listItemInner}>
              <View style={styles.listItemLeading}>
                <Icon name={item.icon} size={22} color={item.color} />
              </View>
              <View style={styles.listItemContent}>
                <Text style={[styles.listItemTitle, getTextStyle()]}>
                  {item.label}
                </Text>
              </View>
              <Icon
                name="chevron-right"
                size={22}
                color={darkMode ? '#E0E0E0' : '#666'}
              />
            </View>
          </TouchableOpacity>
        );
      case 'toggle':
        return (
          <View key={item.id} style={getListItemContainerStyle()}>
            <View style={styles.listItemInner}>
              <View style={styles.listItemLeading}>
                <Icon name={item.icon} size={22} color={item.color} />
              </View>
              <View style={styles.listItemContent}>
                <Text style={[styles.listItemTitle, getTextStyle()]}>
                  {item.label}
                </Text>
              </View>
              <Switch
                value={!!toggleValues[item.id]}
                onValueChange={() => handleToggleSwitch(item.id)}
              />
            </View>
          </View>
        );
      default:
        return null;
    }
  };

  // --- Delete Hold Modal ---
  const DeleteHoldModal = ({visible, onCancel, onFinish}) => {
    const [count, setCount] = useState(5);
    const intervalRef = useRef(null);

    const startHold = () => {
      intervalRef.current = setInterval(() => {
        setCount(prev => {
          if (prev === 1) {
            clearInterval(intervalRef.current);
            onFinish();
          }
          return prev - 1;
        });
      }, 1000);
    };

    const stopHold = () => {
      clearInterval(intervalRef.current);
      setCount(5);
    };

    return (
      <Modal transparent visible={visible} animationType="fade">
        <View style={styles.modalBackground}>
          <View style={styles.modalBox}>
            <Text
              style={{
                fontSize: 18,
                fontWeight: 'bold',
                marginBottom: 10,
                textAlign: 'center',
              }}>
              {t('Hold to permanently delete account')}
            </Text>
            <Text style={{marginBottom: 20, fontSize: 16}}>
              {t('Release to cancel')}
            </Text>

            <Pressable
              onPressIn={startHold}
              onPressOut={stopHold}
              style={styles.holdButton}>
              <Text style={{fontSize: 20}}>
                {count === 5
                  ? t('Hold')
                  : t('Deleting in {{count}}...', {count})}
              </Text>
            </Pressable>

            <Text
              style={{
                color: 'black',
                marginTop: 15,
                fontSize: 18,
                fontWeight: 'bold',
              }}
              onPress={onCancel}>
              {t('Cancel')}
            </Text>
          </View>
        </View>
      </Modal>
    );
  };

  // --- Sections ---
  const SECTIONS = [
    {
      header: t('Preferences') || 'Preferences',
      icon: 'settings',
      items: [
        /*  {
          id: 'language',
          icon: 'language',
          color: '#fe9488',
          label: t('Language') || 'Language',
          type: 'link',
        }, */
        {
          id: 'darkMode',
          icon: 'dark-mode',
          color: '#007afe',
          label: t('Dark mode') || 'Dark mode',
          type: 'toggle',
        },
      ],
    },
    /*  {
      header: t('Notifications') || 'Notifications',
      icon: 'notifications',
      items: [
        {
          id: 'routeRequests',
          icon: 'directions-car',
          color: '#13C791FF',
          label: t('Route Requests') || 'Route Requests',
          type: 'toggle',
        },
        {
          id: 'ratings',
          icon: 'star',
          color: '#fd2d54',
          label: t('Ratings') || 'Ratings',
          type: 'toggle',
        },
        {
          id: 'generalNotifications',
          icon: 'notifications-active',
          color: '#535353FF',
          label: t('General Notifications') || 'General Notifications',
          type: 'toggle',
        },
      ],
    }, */
    {
      header: t('Account') || 'Account',
      icon: 'person',
      items: [
        {
          id: 'editProfile',
          icon: 'edit',
          color: '#32c759',
          label: t('Edit Profile') || 'Edit Profile',
          type: 'link',
        },
        {
          id: 'changePassword',
          icon: 'lock',
          color: '#C6D317FF',
          label: t('Change Password') || 'Change Password',
          type: 'link',
        },
        {
          id: 'deleteAccount',
          icon: 'delete',
          color: '#ff3b30',
          label: t('Delete Account') || 'Delete Account',
          type: 'link',
        },
      ],
    },
    {
      header: t('Help') || 'Help',
      icon: 'help',
      items: [
        {
          id: 'privacyPolicy',
          icon: 'privacy-tip',
          color: '#007AFE',
          label: t('privacyPolicy') || 'Privacy Policy',
          type: 'link',
        },
        {
          id: 'termsOfService',
          icon: 'description',
          color: '#34C759',
          label: t('termsOfService') || 'Terms of Service',
          type: 'link',
        },
        {
          id: 'reportBug',
          icon: 'bug-report',
          color: '#8c8d91',
          label: t('Report Bug') || 'Report Bug',
          type: 'link',
        },
        {
          id: 'contactUs',
          icon: 'mail',
          color: '#007afe',
          label: t('Contact Us') || 'Contact Us',
          type: 'link',
        },
        {
          id: 'about',
          icon: 'info',
          color: '#fe9488',
          label: t('About') || 'About',
          type: 'link',
        },
      ],
    },
  ];

  return (
    <>
      <SafeAreaView style={{flex: 1}}>
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            padding: 15,
            backgroundColor: darkMode ? '#121212' : '#fff',
          }}>
          {SECTIONS.map(section => (
            <View key={section.header} style={{marginBottom: 20}}>
              <Text style={getSectionHeaderStyle()}>{section.header}</Text>
              {section.items.map(item => renderItem(item))}
            </View>
          ))}
        </ScrollView>
      </SafeAreaView>

      <DeleteHoldModal
        visible={showDeleteModal}
        onCancel={() => setShowDeleteModal(false)}
        onFinish={() => {
          setTimeout(() => {
            setShowDeleteModal(false);
            deleteAccount();
          }, 0);
        }}
      />
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 15,
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 15,
    marginBottom: 10,
  },
  listItemContainer: {
    borderBottomWidth: 1,
    padding: 10,
  },
  listItemInner: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  listItemLeading: {
    width: 28,
    alignItems: 'center',
    marginRight: 12,
  },
  listItemContent: {
    flex: 1,
  },
  listItemTitle: {
    fontSize: 16,
    fontWeight: '500',
  },
  modalBackground: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBox: {
    width: '80%',
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  holdButton: {
    backgroundColor: '#ff3b30',
    paddingVertical: 15,
    paddingHorizontal: 15,
    borderRadius: 50,
  },
});

export default SettingsScreen;
