import React, {useState, useContext, useCallback, useEffect} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  StyleSheet,
  FlatList,
  Modal,
  ActivityIndicator,
} from 'react-native';
import {useFocusEffect} from '@react-navigation/native';
import {useTranslation} from 'react-i18next';
import Icons from 'react-native-vector-icons/MaterialCommunityIcons';
import api from '../../api/api';
import {useAuth} from '../../context/AuthContext';
import {useTheme} from '../../theme/useTheme';
import socket from '../../socket/socket';
import Toast from 'react-native-toast-message';

const Notifications = ({navigation}) => {
  const {user} = useAuth();
  const theme = useTheme();
  const {t} = useTranslation();

  const [notifications, setNotifications] = useState([]);
  const [visibleModalId, setVisibleModalId] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/notifications');
      const activeNotifications = response.data
        .filter(n => n.status === 'active' && !n.conversationId) // ❌ добави !n.conversationId
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      const uniqueNotifications = activeNotifications.filter(
        (v, i, a) =>
          a.findIndex(
            n => n.routeId === v.routeId && n.message === v.message,
          ) === i,
      );

      setNotifications(uniqueNotifications);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchNotifications();
    }, []),
  );

  // --- SOCKET LISTENER за нови уведомления ---
  useEffect(() => {
    if (!user?.id) return;

    socket.emit('joinUserRoom', user.id);

    socket.on('newNotification', notification => {
      // ❌ Пропускаме chat-съобщения
      if (notification.conversationId) return;

      setNotifications(prev => [notification, ...prev]);
    });

    return () => socket.off('newNotification');
  }, [user?.id]);

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
    return diffHr < 12;
  };

  const handleNotificationPress = async notification => {
    try {
      if (!notification.read) {
        await api.put(`/api/notifications/read/${notification.id}`);
        setNotifications(prev =>
          prev.map(n => (n.id === notification.id ? {...n, read: true} : n)),
        );
      }

      const message = notification.message.toLowerCase();

      // RATE
      if (
        message.includes('оцени пътуването') ||
        message.includes('rate the trip') ||
        message.includes('rate your passenger')
      ) {
        navigation.navigate('RateUser', {
          routeId: notification.routeId,
          ratedId: notification.senderId,
          ratedUsername: notification.senderUsername,
        });
      }

      // ROUTE REQUEST
      else if (
        message.includes('your route') &&
        message.includes('candidate') &&
        notification.recipientId === user.id
      ) {
        navigation.navigate('RouteRequest', {fromNotification: true});
      }

      // APPROVED → CHAT
      else if (
        message.includes('approved') &&
        notification.recipientId === user.id
      ) {
        const response = await api.post('/api/conversations/start', {
          routeId: notification.routeId,
          user1Id: user.id,
          user2Id: notification.senderId,
        });

        const conversation = response.data;
        const otherUser =
          conversation.user1.id === user.id
            ? conversation.user2
            : conversation.user1;

        navigation.navigate('ChatScreen', {
          conversationId: conversation.id,
          otherUser,
          routeInfo: {
            departureCityId: notification.departureCityId,
            departureCity: notification.departureCity,
            arrivalCityId: notification.arrivalCityId,
            arrivalCity: notification.arrivalCity,
          },
        });
      }
    } catch (error) {
      console.error('Navigation or mark-as-read error:', error);
    }
  };

  const deleteNotification = async id => {
    try {
      await api.patch(`/api/notifications/${id}`, {status: 'deleted'});
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
    padding: 20,
    backgroundColor: theme.firstButton,
  });

  // Вътре във Notifications
  return (
    <SafeAreaView style={{flex: 1, backgroundColor: theme.gradient[0]}}>
      <View style={{flex: 1}}>
        <View style={getHeaderStyles()}>
          <Text style={styles.headerTitle}>{t('Notifications')}</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Home')}>
            <Icons name="keyboard-backspace" size={24} color="white" />
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.primaryButton} />
          </View>
        ) : (
          <FlatList
            data={notifications}
            keyExtractor={item => item.id.toString()}
            contentContainerStyle={{
              paddingVertical: 20,
              paddingHorizontal: 16,
              flexGrow: 1,
            }}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Icons
                  name="bell-off-outline"
                  size={80}
                  color={theme.textSecondary}
                />
                <Text style={[styles.emptyMessage, {color: theme.textSecondary}]}>
                  {t('No new notifications')}
                </Text>
              </View>
            }
            renderItem={({item}) => (
            <View
              style={[
                styles.notification,
                {
                  backgroundColor: isNewNotification(item.createdAt)
                    ? theme.highlight + '22'
                    : theme.cardBackground,
                  borderColor: theme.cardBorder,
                  borderWidth: 1,
                },
              ]}>
              <View style={styles.notificationHeader}>
                <Text
                  style={[
                    styles.newLabel,
                    {
                      backgroundColor: isNewNotification(item.createdAt)
                        ? '#cce7ff'
                        : '#eee',
                      color: isNewNotification(item.createdAt)
                        ? '#005fcb'
                        : '#888',
                    },
                  ]}>
                  {isNewNotification(item.createdAt) ? t('New') : t('Earlier')}
                </Text>

                {/* Дотс бутон */}
                <TouchableOpacity
                  onPress={() => setVisibleModalId(item.id)}
                  style={{padding: 8}}>
                  <Icons
                    name="dots-vertical"
                    size={25}
                    color={theme.textPrimary}
                  />
                </TouchableOpacity>
              </View>

              <TouchableOpacity onPress={() => handleNotificationPress(item)}>
                <Text style={[styles.message, {color: theme.textPrimary}]}>
                  {item.message}
                </Text>
              </TouchableOpacity>
              <Text style={[styles.date, {color: theme.placeholder}]}>
                {formatDate(item.createdAt)}
              </Text>
            </View>
            )}
          />
        )}

        {/* --- Root level Modal --- */}
        <Modal
          visible={!!visibleModalId}
          transparent
          animationType="fade"
          onRequestClose={() => setVisibleModalId(null)}>
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPressOut={() => setVisibleModalId(null)}>
            <View
              style={[
                styles.modalContent,
                {backgroundColor: theme.cardBackground},
              ]}>
              <Text style={[styles.modalTitle, {color: theme.textPrimary}]}>
                {t('Actions')}
              </Text>
              <TouchableOpacity
                style={[
                  styles.modalButton,
                  {backgroundColor: theme.primaryButton},
                ]}
                onPress={() => {
                  deleteNotification(visibleModalId);
                }}>
                <Text style={styles.modalButtonText}>{t('Delete')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modalButton,
                  {backgroundColor: theme.secondaryButton},
                ]}
                onPress={() => setVisibleModalId(null)}>
                <Text style={styles.modalButtonText}>{t('Cancel')}</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  headerTitle: {color: 'white', fontSize: 20, fontWeight: 'bold'},
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationList: {padding: 16},
  notification: {
    width: '100%', // сега вече заема почти целия контейнер
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 12,
    elevation: 2,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  notificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  message: {fontSize: 16, color: '#010101', marginBottom: 8},
  date: {fontSize: 12},
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyMessage: {
    marginTop: 10,
    fontSize: 18,
    textAlign: 'center',
  },
  newLabel: {
    fontWeight: 'bold',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 3,
    fontSize: 12,
  },
  dotsButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 9999,
    padding: 10,
    backgroundColor: 'transparent',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '80%',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
    elevation: 5,
    backgroundColor: 'white', // ще override-нем с theme.cardBackground
  },
  modalTitle: {fontSize: 18, fontWeight: 'bold', marginBottom: 10},
  modalMessage: {fontSize: 16, marginBottom: 20, textAlign: 'center'},
  modalButton: {
    width: '100%',
    padding: 15,
    borderRadius: 5,
    marginVertical: 5,
    alignItems: 'center',
  },
  modalButtonText: {color: 'white', fontSize: 16, fontWeight: 'bold'},
});

export default Notifications;
