import React, {useEffect, useState, useContext, useCallback} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  Image,
  StyleSheet,
  FlatList,
  Modal,
  TextInput,
} from 'react-native';
import {useFocusEffect} from '@react-navigation/native';
import {useTranslation} from 'react-i18next';
import Icons from 'react-native-vector-icons/MaterialCommunityIcons';
import axios from 'axios';
import {useAuth} from '../../context/AuthContext';
import {DarkModeContext} from '../../navigation/DarkModeContext';

const API_BASE_URL = 'http://10.0.2.2:3000';

const api = axios.create({
  baseURL: API_BASE_URL,
});

const Notifications = ({navigation, route}) => {
  const {user} = useAuth();
  const {darkMode} = useContext(DarkModeContext);
  const {t} = useTranslation();
  const {mainRouteUser} = route.params || {};

  const [notifications, setNotifications] = useState([]);
  const [visibleModalId, setVisibleModalId] = useState(null);
  const [respondModalVisible, setRespondModalVisible] = useState(false);
  const [respondingTo, setRespondingTo] = useState(null);
  const [responseComment, setResponseComment] = useState('');

  const handlePersonalMessagePress = notification => {
    setRespondingTo(notification);
    setTimeout(() => {
      setRespondModalVisible(true);
    }, 100);
  };

  const handleRespond = async responseType => {
    if (!respondingTo) return;

    const recipientUser = respondingTo.requester?.username;
    const senderUsername = user?.user?.username;

    const message =
      responseType === 'accepted'
        ? `${senderUsername} прие поканата ви.`
        : `${senderUsername} отказа поканата ви.`;

    try {
      await api.post('/notifications', {
        recipient: recipientUser,
        message: message,
        routeId: respondingTo.routeId,
        requester: {
          username: senderUsername,
          userFname: user?.user?.firstName,
          userLname: user?.user?.lastName,
          email: user?.user?.email,
        },
        personalMessage: responseComment,
        createdAt: new Date().toISOString(),
        read: false,
        status: 'active',
      });

      console.log('✅ Успешно изпратена нотификация');

      setRespondModalVisible(false);
      setRespondingTo(null);
      setResponseComment('');

      // Ако е Accept, навигирай след кратко забавяне
      if (responseType === 'accepted') {
        setTimeout(() => {
          navigation.navigate('Route request');
        }, 150); // 150ms за плавно затваряне на модала
      }
    } catch (error) {
      console.error('❌ Грешка при изпращане на нотификация:', error);
    }
  };

  const fetchNotifications = async () => {
    try {
      const response = await api.get(
        `/notifications?recipient=${user?.user?.username}`,
      );
      const activeNotifications = response.data.filter(
        n => n.status === 'active',
      );
      const sorted = activeNotifications.sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
      );
      setNotifications(sorted);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchNotifications();
    }, [user]),
  );

  const handleNotificationPress = notification => {
    try {
      const message = notification.message.toLowerCase();
      if (
        message.includes('оцени пътуването') ||
        message.includes('rate the trip')
      ) {
        navigation.navigate('RateUser', {
          mainRouteUser: notification.mainRouteUser,
          routeId: notification.routeId,
        });
      }
    } catch (e) {
      console.error('Navigation error:', e);
    }
  };

  const handleNotificationRequestPress = notification => {
    try {
      console.log('➡️ Навигация към Route request:', notification);
      const message = notification.message.toLowerCase();
      if (
        message.includes('your route') &&
        (message.includes('candidate') || message.includes('new request'))
      ) {
        navigation.navigate('Route request');
      }
    } catch (e) {
      console.error('Navigation error:', e);
    }
  };

  const deleteNotification = async id => {
    try {
      await api.patch(`/notifications/${id}`, {status: 'deleted'});
      setNotifications(prev => prev.filter(n => n.id !== id));
      setVisibleModalId(null);
    } catch (error) {
      console.error(`Failed to delete notification ${id}:`, error);
    }
  };

  const getHeaderStyles = () => ({
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    padding: 16,
    backgroundColor: darkMode ? '#333232FF' : '#f4511e',
  });

  const formatDate = dateString => {
    const now = new Date();
    const date = new Date(dateString);
    const diffMin = Math.floor((now - date) / (1000 * 60));
    const diffHr = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHr / 24);
    return diffDay >= 1
      ? `${diffDay}d`
      : diffHr >= 1
      ? `${diffHr}h`
      : `${diffMin}min`;
  };

  const isNewNotification = createdAt => {
    const now = new Date();
    const date = new Date(createdAt);
    const diffHr = (now - date) / (1000 * 60 * 60);
    return diffHr < 24;
  };

  return (
    <SafeAreaView style={styles.mainContainer}>
      <Image
        source={require('../../../images/user-background.jpg')}
        style={styles.backgroundImage}
      />
      <View
        style={{flex: 1, justifyContent: 'flex-start', alignItems: 'center'}}>
        <View style={getHeaderStyles()}>
          <Text style={styles.headerTitle}>{t('Notifications')}</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Home')}>
            <Icons name="keyboard-backspace" size={24} color="white" />
          </TouchableOpacity>
        </View>

        <FlatList
          data={notifications}
          keyExtractor={item => item.id.toString()}
          contentContainerStyle={styles.notificationList}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Icons name="bell-off-outline" size={80} color="#010101" />
              <Text style={styles.emptyMessage}>
                {t('No new notifications')}
              </Text>
            </View>
          }
          renderItem={({item}) => (
            <View
              style={[
                styles.notification,
                isNewNotification(item.createdAt) && styles.newNotification,
              ]}>
              <Text style={styles.newLabel}>
                {isNewNotification(item.createdAt) ? t('New') : t('Earlier')}
              </Text>
              <TouchableOpacity
                style={styles.dotsButton}
                onPress={() => setVisibleModalId(item.id)}>
                <Icons name="dots-vertical" size={25} color="#000" />
              </TouchableOpacity>

              <TouchableOpacity onPress={() => handleNotificationPress(item)}>
                <Text style={styles.message}>{item.message}</Text>
              </TouchableOpacity>

              {item.message &&
                item.message
                  .toLowerCase()
                  .includes('you have a candidate for your route') && (
                  <TouchableOpacity
                    onPress={() => handleNotificationRequestPress(item)}
                    style={{
                      marginTop: 10,
                      padding: 10,
                      backgroundColor: '#e6f7ff',
                      borderRadius: 8,
                    }}>
                    <View>
                      <Text style={{color: '#005fcb', fontWeight: 'bold'}}>
                        {t('View candidate request')}
                      </Text>
                      {item.requester?.comment ? (
                        <TouchableOpacity
                          onPress={() => handlePersonalMessagePress(item)}
                          style={{
                            marginTop: 8,
                            padding: 10,
                            backgroundColor: '#f2f2f2',
                            borderRadius: 8,
                          }}>
                          <Text
                            style={{
                              color: '#333',
                              fontSize: 14,
                              fontStyle: 'italic',
                            }}>
                            "{item.requester.comment}"
                          </Text>
                        </TouchableOpacity>
                      ) : null}
                    </View>
                  </TouchableOpacity>
                )}

              {item.personalMessage ? (
                <TouchableOpacity
                  onPress={() => handlePersonalMessagePress(item)}
                  style={{
                    marginTop: 8,
                    padding: 10,
                    backgroundColor: '#f2f2f2',
                    borderRadius: 8,
                  }}>
                  <Text
                    style={{
                      color: '#333',
                      fontSize: 14,
                      fontStyle: 'italic',
                    }}>
                    "{item.personalMessage}"
                  </Text>
                </TouchableOpacity>
              ) : null}

              <Text style={styles.date}>{formatDate(item.createdAt)}</Text>

              <Modal
                transparent
                visible={visibleModalId === item.id}
                animationType="fade"
                onRequestClose={() => setVisibleModalId(null)}>
                <View style={styles.modalOverlay}>
                  <View style={styles.modalContent}>
                    <Text style={styles.modalTitle}>
                      {t('Notification Options')}
                    </Text>
                    <Text style={styles.modalMessage}>
                      {t('Do you want to delete this notification:')}
                      {'\n'}
                      {'\n'}
                      {item.message}
                    </Text>
                    <TouchableOpacity
                      style={styles.modalButton}
                      onPress={() => deleteNotification(item.id)}>
                      <Text style={styles.modalButtonText}>{t('Delete')}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.modalButton, styles.cancelButton]}
                      onPress={() => setVisibleModalId(null)}>
                      <Text style={styles.modalButtonText}>{t('Cancel')}</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </Modal>
              <Modal
                visible={respondModalVisible}
                animationType="none"
                onRequestClose={() => setRespondModalVisible(false)}>
                <View style={styles.simpleModalContainer}>
                  <View style={styles.modalContent}>
                    <Text style={styles.modalTitle}>
                      {t('Response to inquiry')}
                    </Text>
                    <Text style={styles.modalMessage}>
                      {respondingTo?.personalMessage}
                    </Text>
                    <TextInput
                      style={styles.responseInput}
                      placeholder={t('Type here...')}
                      value={responseComment}
                      onChangeText={setResponseComment}
                    />
                    <TouchableOpacity
                      style={styles.modalButton}
                      onPress={() => handleRespond('accepted')}>
                      <Text style={styles.modalButtonText}>{t('Accept')}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.modalButton, styles.cancelButton]}
                      onPress={() => handleRespond('rejected')}>
                      <Text style={styles.modalButtonText}>{t('Decline')}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.modalButton, styles.cancelButton]}
                      onPress={() => setRespondModalVisible(false)}>
                      <Text style={styles.modalButtonText}>{t('Close')}</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </Modal>
            </View>
          )}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  mainContainer: {flex: 1, backgroundColor: '#f9f9f9'},
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
    position: 'absolute',
  },
  headerTitle: {color: 'white', fontSize: 20, fontWeight: 'bold'},
  notificationList: {padding: 16},
  notification: {
    padding: 15,
    backgroundColor: '#fff',
    borderRadius: 10,
    marginBottom: 20,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#ddd',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  message: {fontSize: 16, color: '#010101', marginBottom: 8},
  date: {fontSize: 12, color: '#202020FF'},
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyMessage: {
    marginTop: 10,
    fontSize: 18,
    color: '#010101',
    textAlign: 'center',
  },
  newLabel: {
    position: 'absolute',
    top: -10,
    left: 10,
    backgroundColor: '#cce7ff',
    color: '#005fcb',
    fontWeight: 'bold',
    paddingHorizontal: 10,
    borderRadius: 3,
    fontSize: 12,
  },
  newNotification: {backgroundColor: '#cce7ff'},
  dotsButton: {
    position: 'absolute',
    top: 10,
    right: -5,
    zIndex: 1,
    padding: 5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  modalContent: {
    width: '80%',
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
    elevation: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  modalMessage: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
  },
  modalButton: {
    width: '100%',
    padding: 15,
    backgroundColor: '#f4511e',
    borderRadius: 5,
    marginVertical: 5,
    alignItems: 'center',
  },
  cancelButton: {backgroundColor: '#ccc'},
  modalButtonText: {color: 'white', fontSize: 16, fontWeight: 'bold'},

  simpleModalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#010101', // Без прозрачност, за да няма конфликт с фон
    padding: 20,
  },
  responseInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    width: '100%',
    marginVertical: 10,
    padding: 10,
  },
});

export default Notifications;
