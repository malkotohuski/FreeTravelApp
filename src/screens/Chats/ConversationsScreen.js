import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import {useAuth} from '../../context/AuthContext';
import api from '../../api/api';
import {useTranslation} from 'react-i18next';

const ConversationsScreen = ({navigation}) => {
  const {t} = useTranslation();
  const {user} = useAuth();
  const [conversations, setConversations] = useState([]);

  const formatDate = date => {
    const messageDate = new Date(date);
    const now = new Date();

    const isToday = messageDate.toDateString() === now.toDateString();

    const yesterday = new Date();
    yesterday.setDate(now.getDate() - 1);

    const isYesterday = messageDate.toDateString() === yesterday.toDateString();

    const isThisYear = messageDate.getFullYear() === now.getFullYear();

    if (isToday) {
      return messageDate.toLocaleTimeString('bg-BG', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      });
    }

    if (isYesterday) {
      return t('yesterday');
    }

    if (isThisYear) {
      return messageDate.toLocaleDateString('bg-BG', {
        day: '2-digit',
        month: 'short',
      });
    }

    return messageDate.toLocaleDateString('bg-BG');
  };

  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const res = await api.get(`/api/conversations/user/${user.id}`);
        setConversations(res.data);
      } catch (err) {
        console.error(err);
      }
    };

    fetchConversations();
  }, []);

  return (
    <View style={styles.screen}>
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
              style={styles.conversationCard}
              onPress={() => {
                navigation.navigate('ChatScreen', {
                  conversationId: item.id,
                  otherUser: item.otherUser,
                });

                setConversations(prev =>
                  prev.map(conv =>
                    conv.id === item.id ? {...conv, unreadCount: 0} : conv,
                  ),
                );
              }}
              onLongPress={() => {
                Alert.alert(
                  'Delete conversation',
                  'Are you sure you want to delete this conversation?',
                  [
                    {text: 'Cancel', style: 'cancel'},
                    {
                      text: 'Delete',
                      style: 'destructive',
                      onPress: async () => {
                        try {
                          await api.delete(`/api/conversations/${item.id}`);

                          // Скриваме го локално за потребителя
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
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {item.otherUser.username[0].toUpperCase()}
                </Text>
              </View>

              {/* Middle Section */}
              <View style={styles.middleSection}>
                <View style={styles.topRow}>
                  <Text style={styles.username} numberOfLines={1}>
                    {item.otherUser.username}
                  </Text>

                  {lastMessage && (
                    <Text style={styles.time}>
                      {formatDate(lastMessage.createdAt)}
                    </Text>
                  )}
                </View>

                <View style={styles.bottomRow}>
                  <Text
                    style={[
                      styles.lastMessage,
                      item.unreadCount > 0 && styles.lastMessageUnread,
                    ]}
                    numberOfLines={1}>
                    {lastMessage?.text ||
                      `${item.departureCity} → ${item.arrivalCity}`}
                  </Text>

                  {item.unreadCount > 0 && (
                    <View style={styles.unreadBadge}>
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
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 14,
    marginBottom: 10,
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
    backgroundColor: '#f4511e',
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
    backgroundColor: '#f4511e',
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
