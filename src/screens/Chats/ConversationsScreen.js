import React, {useEffect, useState, useCallback} from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Image,
} from 'react-native';
import {useAuth} from '../../context/AuthContext';
import api from '../../api/api';
import {useTranslation} from 'react-i18next';
import {useTheme} from '../../theme/useTheme';
import socket from '../../socket/socket';
import NotificationService from '../../backend-v2/services/NotificationService';
import {useFocusEffect} from '@react-navigation/native';
import {useChat} from '../../context/ChatContext';

const ConversationsScreen = ({navigation}) => {
  const {t} = useTranslation();
  const {user} = useAuth();
  const [conversations, setConversations] = useState([]);
  const [page, setPage] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);
  const LIMIT = 20;
  const {refreshChatCount} = useChat();

  const theme = useTheme();

  const fetchConversations = useCallback(async () => {
    try {
      const res = await api.get(
        `/api/conversations/user/${user.id}?skip=0&take=${LIMIT}`,
      );
      setConversations(
        res.data.map(c => ({
          ...c,
          messages: c.messages || [],
          unreadCount: c.unreadCount || 0,
        })),
      );
      setPage(1);
    } catch (err) {
      console.error(err);
    }
  }, [LIMIT, user.id]);

  useEffect(() => {
    const handler = ({conversationId}) => {
      if (
        String(NotificationService.currentConversationId) !==
        String(conversationId)
      )
        return;

      setConversations(prev =>
        prev.map(conv =>
          conv.id === conversationId ? {...conv, unreadCount: 0} : conv,
        ),
      );
    };

    socket.on('messagesRead', handler);

    return () => socket.off('messagesRead', handler);
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      fetchConversations();
      refreshChatCount();

      const delayedRefreshId = setTimeout(() => {
        fetchConversations();
        refreshChatCount();
      }, 400);

      const intervalId = setInterval(() => {
        fetchConversations();
        refreshChatCount();
      }, 10000);

      return () => {
        clearTimeout(delayedRefreshId);
        clearInterval(intervalId);
      };
    }, [fetchConversations, refreshChatCount]),
  );

  useEffect(() => {
    const newConversationHandler = conv => {
      setConversations(prev => {
        const existingIndex = prev.findIndex(c => c.id === conv.id);
        const nextConversation = {
          ...conv,
          messages: conv.messages || [],
          unreadCount: conv.unreadCount || 0,
        };

        if (existingIndex >= 0) {
          const updated = [...prev];
          updated.splice(existingIndex, 1);
          return [nextConversation, ...updated];
        }

        if (conv.user1Id === user.id || conv.user2Id === user.id) {
          navigation.navigate('ChatScreen', {
            conversationId: conv.id,
            otherUser: conv.otherUser,
            fromScreen: 'ConversationsScreen',
          });
        }

        return [nextConversation, ...prev];
      });
    };

    const newMessageHandler = ({conversationId, message}) => {
      setConversations(prev => {
        const existingIndex = prev.findIndex(
          conv => String(conv.id) === String(conversationId),
        );

        if (existingIndex === -1) {
          return prev;
        }

        const currentConversation = prev[existingIndex];
        const messageExists = currentConversation.messages?.some(
          m => m.id === message.id,
        );

        const isMyMessage = message.senderId === user.id;
        const isActiveChat =
          String(NotificationService.getActiveConversation()) ===
          String(conversationId);

        const updatedConversation = {
          ...currentConversation,
          messages: messageExists
            ? currentConversation.messages || []
            : [...(currentConversation.messages || []), message],
          lastMessage: message,
          unreadCount:
            isActiveChat || isMyMessage
              ? 0
              : (currentConversation.unreadCount || 0) + (messageExists ? 0 : 1),
        };

        const next = [...prev];
        next.splice(existingIndex, 1);
        return [updatedConversation, ...next];
      });
    };

    socket.on('newConversation', newConversationHandler);
    socket.on('newMessage', newMessageHandler);

    return () => {
      socket.off('newConversation', newConversationHandler);
      socket.off('newMessage', newMessageHandler);
    };
  }, [navigation, user.id]);

  const loadMore = async () => {
    if (loadingMore) return;

    try {
      setLoadingMore(true);

      const res = await api.get(
        `/api/conversations/user/${user.id}?skip=${page * LIMIT}&take=${LIMIT}`,
      );

      // Ð°ÐºÐ¾ Ð½ÑÐ¼Ð° Ð½Ð¾Ð²Ð¸ â€“ Ð¿Ñ€Ð¾ÑÑ‚Ð¾ ÑÐ¿Ð¸Ñ€Ð°Ð¼Ðµ
      if (res.data.length === 0) return;

      setConversations(prev => {
        const newOnes = res.data.filter(c => !prev.some(e => e.id === c.id));

        return [...prev, ...newOnes.map(c => ({...c, messages: []}))];
      });
      setPage(prev => prev + 1);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingMore(false);
    }
  };

  const formatDate = date => {
    const messageDate = new Date(date);
    const now = new Date();

    const diffDays = Math.floor((now - messageDate) / (1000 * 60 * 60 * 24));

    const time = messageDate.toLocaleTimeString('bg-BG', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });

    if (diffDays === 0) {
      return time;
    }

    if (diffDays === 1) {
      return `${t('yesterday')} ${time}`;
    }

    if (diffDays < 7) {
      return (
        messageDate.toLocaleDateString('bg-BG', {
          weekday: 'short',
        }) + ` ${time}`
      );
    }

    if (messageDate.getFullYear() === now.getFullYear()) {
      return (
        messageDate.toLocaleDateString('bg-BG', {
          day: '2-digit',
          month: 'short',
        }) + ` ${time}`
      );
    }

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
                navigation.navigate('ChatScreen', {
                  conversationId: item.id,
                  otherUser: item.otherUser,
                  fromScreen: 'ConversationsScreen',
                });

                setConversations(prev =>
                  prev.map(conv =>
                    conv.id === item.id ? {...conv, unreadCount: 0} : conv,
                  ),
                );
                refreshChatCount();
              }}
              onLongPress={() => {
                Alert.alert(
                  t('deleteConversation'),
                  t('areYouSureYouWantToDeleteThisConversation'),
                  [
                    {text: t('Cancel'), style: 'cancel'},
                    {
                      text: t('Delete'),
                      style: 'destructive',
                      onPress: async () => {
                        try {
                          await api.delete(`/api/conversations/${item.id}`);

                          // Ð¡ÐºÑ€Ð¸Ð²Ð°Ð¼Ðµ Ð³Ð¾ Ð»Ð¾ÐºÐ°Ð»Ð½Ð¾ Ð·Ð° Ð¿Ð¾Ñ‚Ñ€ÐµÐ±Ð¸Ñ‚ÐµÐ»Ñ
                          setConversations(prev =>
                            prev.filter(conv => conv.id !== item.id),
                          );
                        } catch (err) {
                          console.error('Delete failed:', err);
                        }
                      },
                    },
                  ],
                );
              }}>
              {/* Avatar */}
              <View style={[styles.avatar, {backgroundColor: theme.highlight}]}>
                {item.otherUser?.userImage ? (
                  <Image
                    source={{uri: item.otherUser.userImage}}
                    style={styles.avatarImage}
                  />
                ) : (
                  <Image
                    source={{
                      uri: 'https://res.cloudinary.com/dqxczsig5/image/upload/v1774361343/avatars/mazhsnugabcw9spsvm50.jpg',
                    }}
                    style={styles.avatarImage}
                  />
                )}
              </View>

              {/* Middle Section */}
              <View style={styles.middleSection}>
                <View style={styles.topRow}>
                  <Text style={[styles.username, {color: theme.textPrimary}]}>
                    {item.otherUser?.username}
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
                      `${item.departureCity} - ${item.arrivalCity}`}
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
        onEndReached={loadMore}
        onEndReachedThreshold={0.2}
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
    borderRadius: 25, // Ð´Ð° ÑÑŠÐ²Ð¿Ð°Ð´Ð° Ñ ÐºÐ¾Ð½Ñ‚ÐµÐ¹Ð½ÐµÑ€Ð°
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

