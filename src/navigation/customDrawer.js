import React from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import {useTranslation} from 'react-i18next';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Icons from 'react-native-vector-icons/MaterialCommunityIcons';
import {useAuth} from '../context/AuthContext';

function CustomerDrawer({navigation}) {
  const {t} = useTranslation();
  const {user} = useAuth();
  const noImage = require('../../images/emptyUserImage.png');
  const profilePicture = user?.userImage; // userImage ÃÂµ ÃÂ´ÃÂ¸Ã‘â‚¬ÃÂµÃÂºÃ‘â€šÃÂ½ÃÂ¾ ÃÂ² user
  const username = user?.username;

  const handlerAccountScreen = () => {
    navigation.navigate('AccountManager');
  };

  const handlerHomeScreen = () => {
    navigation.navigate('Home');
  };

  const handlerRouteViewer = () => {
    navigation.navigate('RoutesHistory');
  };

  const handlerReporting = () => {
    navigation.navigate('Reporting'); // ÃÂ¿Ã‘â‚¬ÃÂµÃÂ´ÃÂ°ÃÂ²ÃÂ°ÃÂ¼ÃÂµ userId ÃÂºÃÂ°Ã‘â€šÃÂ¾ ÃÂ¿ÃÂ°Ã‘â‚¬ÃÂ°ÃÂ¼ÃÂµÃ‘â€šÃ‘Å Ã‘â‚¬
  };

  const handlerAdminReports = () => {
    navigation.navigate('AdminReports');
  };

  /*   const handlerRequest = () => {
    navigation.navigate('Route request');
  }; */

  const handlerSettings = () => {
    navigation.navigate('Settings');
  };

  const handlerLogout = () => {
    navigation.navigate('LogoutScreen');
  };

  return (
    <SafeAreaView style={{flex: 1}}>
      <ScrollView
        contentContainerStyle={{flexGrow: 1}}
        style={{flex: 1, backgroundColor: 'grey'}}
        showsVerticalScrollIndicator={false} // ÃÂ¡ÃÂºÃ‘â‚¬ÃÂ¸ÃÂ²ÃÂ° Ã‘ÂÃÂºÃ‘â‚¬ÃÂ¾ÃÂ» ÃÂ¸ÃÂ½ÃÂ´ÃÂ¸ÃÂºÃÂ°Ã‘â€šÃÂ¾Ã‘â‚¬ÃÂ° (ÃÂ¿ÃÂ¾ ÃÂ¶ÃÂµÃÂ»ÃÂ°ÃÂ½ÃÂ¸ÃÂµ)
      >
        <View style={styles.mainContainer}>
          <Image
            source={require('../../images/d6.png')}
            style={styles.backgroundImage}
          />
          <View style={styles.drawerContainer}>
            <TouchableOpacity
              style={styles.userInfoContainer}
              onPress={handlerAccountScreen}>
              <Image
                source={profilePicture ? {uri: profilePicture} : noImage}
                style={styles.userImage}
              />
              <Text style={styles.userInfo}>{username}</Text>
            </TouchableOpacity>
            <View style={styles.topLeft}>
              <TouchableOpacity
                style={styles.drawerScreen}
                onPress={handlerHomeScreen}>
                <Icon name="home" size={30} color="#0721B6" />

                <Text style={styles.textButtons}>{t('Home')}</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.topLeft}>
              <TouchableOpacity
                style={styles.drawerScreen}
                onPress={handlerRouteViewer}>
                <Icon name="work-history" size={30} color="#0721B6" />
                <Text style={styles.textButtons}>{t('Routes History')}</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.topLeft}>
              <TouchableOpacity
                style={styles.drawerScreen}
                onPress={handlerReporting}>
                <Icon name="report" size={30} color="#0721B6" />
                <Text style={styles.textButtons}>{t('Reporting')}</Text>
              </TouchableOpacity>
            </View>
            {user?.isAdmin ? (
              <View style={styles.topLeft}>
                <TouchableOpacity
                  style={styles.drawerScreen}
                  onPress={handlerAdminReports}>
                  <Icons name="shield-account" size={30} color="#0721B6" />
                  <Text style={styles.textButtons}>Admin Reports</Text>
                </TouchableOpacity>
              </View>
            ) : null}
            {/*             <View style={styles.topLeft}>
              <TouchableOpacity
                style={styles.drawerScreen}
                onPress={handlerRequest}>
                <Icons name="routes" size={30} color="#0721B6" />
                <Text style={styles.textButtons}>{t('Route request')}</Text>
              </TouchableOpacity>
            </View> */}
            <View style={styles.topLeft}>
              <TouchableOpacity
                style={styles.drawerScreen}
                onPress={handlerSettings}>
                <Icon name="settings" size={30} color="#0721B6" />
                <Text style={styles.textButtons}>{t('Settings')}</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.topLeft}>
              <TouchableOpacity
                style={styles.drawerScreen}
                onPress={handlerLogout}>
                <Icons name="logout" size={30} color="#0721B6" />
                <Text style={styles.textButtons}>{t('Logout')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backgroundImage: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  drawerContainer: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 15,
    width: '100%',
  },
  userInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0721B6',
    padding: 15,
    borderRadius: 10,
    marginBottom: 30,
    width: '100%',
    alignSelf: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.8,
    shadowRadius: 2,
    elevation: 5,
    overflow: 'hidden', // ÃÂ¿Ã‘â‚¬ÃÂµÃÂ´ÃÂ¾Ã‘â€šÃÂ²Ã‘â‚¬ÃÂ°Ã‘â€šÃ‘ÂÃÂ²ÃÂ° ÃÂ¸ÃÂ·ÃÂ»ÃÂ¸ÃÂ·ÃÂ°ÃÂ½ÃÂµÃ‘â€šÃÂ¾ ÃÂ½ÃÂ° Ã‘ÂÃ‘Å ÃÂ´Ã‘Å Ã‘â‚¬ÃÂ¶ÃÂ°ÃÂ½ÃÂ¸ÃÂµ
  },
  userImage: {
    width: 45,
    height: 45,
    borderRadius: 50,
  },
  userIcon: {
    marginRight: 10,
  },
  userInfo: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 10,
    flexShrink: 1, // ÃÂ¾ÃÂ³Ã‘â‚¬ÃÂ°ÃÂ½ÃÂ¸Ã‘â€¡ÃÂ°ÃÂ²ÃÂ° Ã‘â‚¬ÃÂ°ÃÂ·ÃÂ¼ÃÂµÃ‘â‚¬ÃÂ° ÃÂ½ÃÂ° Ã‘â€šÃÂµÃÂºÃ‘ÂÃ‘â€šÃÂ°
    flexWrap: 'wrap', // ÃÂ¿Ã‘â‚¬ÃÂµÃÂ½ÃÂ°Ã‘ÂÃ‘Â Ã‘â€šÃÂµÃÂºÃ‘ÂÃ‘â€šÃÂ° ÃÂ½ÃÂ° ÃÂ½ÃÂ¾ÃÂ² Ã‘â‚¬ÃÂµÃÂ´, ÃÂ°ÃÂºÃÂ¾ ÃÂµ ÃÂ½Ã‘Æ’ÃÂ¶ÃÂ½ÃÂ¾
    maxWidth: '75%', // ÃÂ·ÃÂ°ÃÂ´ÃÂ°ÃÂ²ÃÂ° ÃÂ¼ÃÂ°ÃÂºÃ‘ÂÃÂ¸ÃÂ¼ÃÂ°ÃÂ»ÃÂ½ÃÂ° Ã‘Ë†ÃÂ¸Ã‘â‚¬ÃÂ¸ÃÂ½ÃÂ° ÃÂ·ÃÂ° Ã‘â€šÃÂµÃÂºÃ‘ÂÃ‘â€šÃÂ°
  },
  topLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    width: '100%',
    borderRadius: 10,
  },
  drawerScreen: {
    alignItems: 'center',
    padding: 20,
    marginBottom: 10,
    fontSize: 24,
    fontWeight: 'bold',
    borderWidth: 2, // ÃÅ¸Ã‘â‚¬ÃÂµÃÂ¼ÃÂ°Ã‘â€¦ÃÂ²ÃÂ°ÃÂ½ÃÂµ ÃÂ½ÃÂ° ÃÂ³Ã‘â‚¬ÃÂ°ÃÂ½ÃÂ¸Ã‘â€ ÃÂ°Ã‘â€šÃÂ°
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    width: '100%',
    flexDirection: 'row',
    borderRadius: 15, // Ãâ€”ÃÂ°ÃÂºÃ‘â‚¬Ã‘Å ÃÂ³ÃÂ»ÃÂµÃÂ½ÃÂ¸ Ã‘â‚¬Ã‘Å ÃÂ±ÃÂ¾ÃÂ²ÃÂµ
  },
  textButtons: {
    marginLeft: 5, // adjust as needed
    color: '#0F0F0FFF', // text color
    fontSize: 20, // text size
    fontWeight: 'bold', // text weight
  },
});

export default CustomerDrawer;
