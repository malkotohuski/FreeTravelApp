import React, {useEffect, useState} from 'react';
import {View, Text, FlatList, TouchableOpacity, StyleSheet} from 'react-native';
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
              onPress={() =>
                navigation.navigate('ChatScreen', {
                  conversationId: item.id,
                  otherUser: item.otherUser,
                })
              }>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {item.otherUser.username[0].toUpperCase()}
                </Text>
              </View>

              <View style={{flex: 1}}>
                <View style={styles.topRow}>
                  <Text style={styles.username}>{item.otherUser.username}</Text>

                  {lastMessage && (
                    <Text style={styles.time}>
                      {formatDate(lastMessage.createdAt)}
                    </Text>
                  )}
                </View>

                <View style={styles.routeBadge}>
                  <Text style={{color: '#f4511e', fontSize: 12}}>
                    {item.departureCity} → {item.arrivalCity}
                  </Text>
                </View>

                <Text style={styles.lastMessage} numberOfLines={1}>
                  {lastMessage?.text || 'No messages yet'}
                </Text>
              </View>

              {/* 🔥 UNREAD BADGE ABSOLUTE */}
              {item.unreadCount > 0 && (
                <View style={styles.unreadBadge}>
                  <Text style={styles.unreadText}>{item.unreadCount}</Text>
                </View>
              )}
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
    padding: 15,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.08)',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
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

  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  username: {
    fontWeight: '600',
    fontSize: 16,
    color: '#fff',
  },

  lastMessage: {
    color: '#ccc',
    marginTop: 4,
  },

  time: {
    fontSize: 12,
    color: '#aaa',
  },
  unreadBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: '#f4511e',
    minWidth: 22,
    height: 22,
    borderRadius: 11,
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
