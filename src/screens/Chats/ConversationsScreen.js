import React, {useEffect, useState, useCallback} from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Image,
} from 'react-native';
import {useAuth} from '../../context/AuthContext';
import api from '../../api/api';
import {useTranslation} from 'react-i18next';
import {useTheme} from '../../theme/useTheme';
import socket from '../../socket/socket';
import {useFocusEffect} from '@react-navigation/native';

const ConversationsScreen = ({navigation, route}) => {
  const resetChatNotifications = (count = 0) => {
    setConversations(prev =>
      prev.map(conv =>
        conv.id === currentConversationId ? {...conv, unreadCount: 0} : conv,
      ),
    );
  };
  const {t} = useTranslation();
  const {user} = useAuth();
  const [conversations, setConversations] = useState([]);
  const [currentConversationId, setCurrentConversationId] = useState(null);
  const theme = useTheme();

  // 🔹 SOCKETS: нови разговори и съобщения
  useEffect(() => {
    const handleNewConversation = conv => {
      setConversations(prev => [
        {
          ...conv,
          otherUser: conv.otherUser || {
            username: 'Потребител',
            userImage:
              'https://res.cloudinary.com/dqxczsig5/image/upload/v1774361343/avatars/bzrmewmud1dlaatajmyf.jpg',
          },
        },
        ...prev,
      ]);
    };

    const handleNewMessage = ({conversationId: msgConvId, message}) => {
      setConversations(prev => {
        let updated = false;
        const newConversations = prev.map(conv => {
          if (conv.id === msgConvId) {
            updated = true;
            const isMyMessage = String(message.senderId) === String(user.id);
            const unreadIncrement =
              currentConversationId === msgConvId ? 0 : isMyMessage ? 0 : 1; // 🟢 ключово
            return {
              ...conv,
              messages: [...(conv.messages || []), message],
              unreadCount: (conv.unreadCount || 0) + unreadIncrement,
            };
          }
          return conv;
        });

        if (!updated) {
          const isMyMessage = String(message.senderId) === String(user.id);
          return [
            {
              id: msgConvId,
              messages: [message],
              unreadCount: isMyMessage ? 0 : 1,
            },
            ...prev,
          ];
        }

        return newConversations;
      });
    };

    socket.on('newConversation', handleNewConversation);
    socket.on('newMessage', handleNewMessage);

    return () => {
      socket.off('newConversation', handleNewConversation);
      socket.off('newMessage', handleNewMessage);
    };
  }, [user.id, currentConversationId]);

  // 🔹 Fetch разговори при фокус на екрана
  useFocusEffect(
    useCallback(() => {
      const fetchConversations = async () => {
        try {
          const res = await api.get(`/api/conversations/user/${user.id}`);

          setConversations(prev => {
            const merged = res.data.map(newConv => {
              const existing = prev.find(c => c.id === newConv.id);
              return {
                ...newConv,
                otherUser: newConv.otherUser || existing?.otherUser,
                unreadCount:
                  existing && existing.unreadCount > newConv.unreadCount
                    ? existing.unreadCount
                    : newConv.unreadCount,
              };
            });

            // Сортиране по последно съобщение
            return merged.sort((a, b) => {
              const aTime = a.messages?.[a.messages.length - 1]?.createdAt || 0;
              const bTime = b.messages?.[b.messages.length - 1]?.createdAt || 0;
              return new Date(bTime) - new Date(aTime);
            });
          });
        } catch (err) {
          console.error(err);
        }
      };
      setCurrentConversationId(null);
      fetchConversations();
    }, [user.id]),
  );

  // 🔹 Форматиране на дата
  const formatDate = date => {
    const messageDate = new Date(date);
    const now = new Date();
    const diffDays = Math.floor((now - messageDate) / (1000 * 60 * 60 * 24));
    const time = messageDate.toLocaleTimeString('bg-BG', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });

    if (diffDays === 0) return time;
    if (diffDays === 1) return `Вчера ${time}`;
    if (diffDays < 7)
      return (
        messageDate.toLocaleDateString('bg-BG', {weekday: 'short'}) + ` ${time}`
      );
    if (messageDate.getFullYear() === now.getFullYear())
      return (
        messageDate.toLocaleDateString('bg-BG', {
          day: '2-digit',
          month: 'short',
        }) + ` ${time}`
      );
    return messageDate.toLocaleDateString('bg-BG') + ` ${time}`;
  };

  return (
    <View style={[styles.screen, {backgroundColor: theme.gradient[0]}]}>
      <FlatList
        data={conversations}
        keyExtractor={item => item.id.toString()}
        renderItem={({item}) => {
          const lastMessage =
            item.messages && item.messages.length > 0
              ? item.messages[item.messages.length - 1]
              : null;

          console.log('Other user image:', item.otherUser?.userImage);

          return (
            <TouchableOpacity
              style={[
                styles.conversationCard,
                {
                  backgroundColor: theme.cardBackground,
                  borderColor: theme.cardBorder,
                },
              ]}
              onPress={() => {
                setCurrentConversationId(item.id); // 🟢 ново
                navigation.navigate('ChatScreen', {
                  conversationId: item.id,
                  otherUser: item.otherUser,
                  resetChatNotifications, // 👈 важно
                });

                setConversations(prev =>
                  prev.map(conv =>
                    conv.id === item.id ? {...conv, unreadCount: 0} : conv,
                  ),
                );

                if (resetChatNotifications && item.unreadCount > 0) {
                  resetChatNotifications(item.unreadCount);
                }

                api.put(`/api/conversations/${item.id}/read`, {
                  userId: user.id,
                });
              }}>
              <View style={[styles.avatar, {backgroundColor: theme.highlight}]}>
                {item.otherUser?.userImage ? (
                  <Image
                    source={{uri: item.otherUser.userImage}}
                    style={styles.avatarImage} // новият стил по-долу
                  />
                ) : (
                  <Image
                    source={{
                      uri: 'https://res.cloudinary.com/dqxczsig5/image/upload/v1774361343/avatars/bzrmewmud1dlaatajmyf.jpg',
                    }}
                    style={styles.avatarImage}
                  />
                )}
              </View>

              <View style={styles.middleSection}>
                <View style={styles.topRow}>
                  <Text style={[styles.username, {color: theme.textPrimary}]}>
                    {item.otherUser.username}
                  </Text>
                  {lastMessage && (
                    <Text style={[styles.time, {color: theme.placeholder}]}>
                      {formatDate(lastMessage.createdAt)}
                    </Text>
                  )}
                </View>

                <View style={styles.bottomRow}>
                  <Text
                    style={[
                      styles.lastMessage,
                      {color: theme.textSecondary},
                      item.unreadCount > 0 && {
                        color: theme.textPrimary,
                        fontWeight: '700',
                      },
                    ]}>
                    {lastMessage?.text ||
                      `${item.departureCity} → ${item.arrivalCity}`}
                  </Text>

                  {item.unreadCount > 0 && (
                    <View
                      style={[
                        styles.unreadBadge,
                        {backgroundColor: theme.primaryButton},
                      ]}>
                      <Text style={styles.unreadText}>{item.unreadCount}</Text>
                    </View>
                  )}
                </View>
              </View>
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    padding: 16,
    backgroundColor: '#1e1e1e',
  },
  conversationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 14,
    marginBottom: 10,
    borderWidth: 1,
  },

  leftSection: {
    flexDirection: 'row',
    flex: 1,
    alignItems: 'center',
  },

  textSection: {
    flex: 1,
  },

  rightSection: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 6,
    minHeight: 95,
  },

  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },

  middleSection: {
    flex: 1,
  },

  route: {
    color: '#f4511e',
    fontSize: 13,
    marginTop: 2,
    fontWeight: '500',
  },

  routeBadge: {
    backgroundColor: 'rgba(244,81,30,0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginTop: 4,
  },

  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 25, // да съвпада с контейнера
    resizeMode: 'cover',
  },

  avatarText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 18,
  },

  deleteButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#2a2a2a',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },

  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },

  username: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    flex: 1,
    marginRight: 10,
  },

  lastMessage: {
    color: '#ccc',
    flex: 1,
    marginRight: 10,
  },

  lastMessageUnread: {
    color: '#fff',
    fontWeight: '600',
  },

  time: {
    fontSize: 12,
    color: '#aaa',
  },

  unreadBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },

  unreadText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
});
export default ConversationsScreen;
