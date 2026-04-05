import React, {useEffect, useState, useCallback, useRef} from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Image,
} from 'react-native';
import {useAuth} from '../../context/AuthContext';
import {useTranslation} from 'react-i18next';
import {useFocusEffect} from '@react-navigation/native';
import api from '../../api/api';
import {useTheme} from '../../theme/useTheme';
import socket from '../../socket/socket';
import NotificationService from '../../backend-v2/services/NotificationService';
import {useChat} from '../../context/ChatContext';

const ChatScreen = ({route}) => {
  const {t} = useTranslation();

  const {conversationId, otherUser} = route.params;
  const {user} = useAuth();
  const [loadingMessages, setLoadingMessages] = useState(true);

  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const theme = useTheme();

  const [conversationInfo, setConversationInfo] = useState(null);
  const {setChatCount, setActiveConversation} = useChat();

  const flatListRef = useRef(null);

  useFocusEffect(
    React.useCallback(() => {
      setChatCount(0);
      NotificationService.setActiveConversation(conversationId);
      // 🔥 ако прави проблем да стане ---> setChatCount(prev => Math.max(0, prev - 1));

      api.put(`/api/conversations/${conversationId}/read`, {
        userId: user.id,
      });

      socket.emit('messagesRead', {conversationId});

      return () => {
        NotificationService.currentConversationId = null;
      };
    }, [conversationId]),
  );

  useEffect(() => {
    setMessages([]); // ❌ премахваме старите съобщения веднага
    setLoadingMessages(true);
  }, [conversationId]);

  useEffect(() => {
    setActiveConversation(conversationId);
    NotificationService.setActiveConversation(conversationId);

    return () => {
      setActiveConversation(null);
      NotificationService.setActiveConversation(null);
    };
  }, [conversationId]);

  useEffect(() => {
    socket.emit('joinConversation', {userId: user.id, conversationId});
    return () =>
      socket.emit('leaveConversation', {
        userId: user.id,
        conversationId,
      });
  }, [conversationId]);

  useEffect(() => {
    const reconnectHandler = () => {
      console.log('🔁 RECONNECTED → join пак');

      socket.emit('joinConversation', {
        userId: user.id,
        conversationId,
      });
    };

    socket.on('connect', reconnectHandler);

    return () => socket.off('connect', reconnectHandler);
  }, [conversationId, user.id]);

  useEffect(() => {
    if (!user?.id) return;

    socket.emit('joinUserRoom', user.id);
  }, [user?.id]);

  // 🔹 Ново съобщение
  useEffect(() => {
    const handler = ({conversationId: convId, message}) => {
      // Добавяме съобщението само ако е за текущия conversationId
      if (String(convId) !== String(conversationId)) return;

      setMessages(prev => {
        // проверка за дубликати
        if (prev.some(msg => msg.id === message.id)) return prev;
        return [...prev, message];
      });

      api.put(`/api/conversations/${convId}/read`, {
        userId: user.id,
      });

      setTimeout(() => {
        flatListRef.current?.scrollToEnd({animated: true});
      }, 100);
    };

    socket.on('newMessage', handler);

    return () => socket.off('newMessage', handler);
  }, [conversationId, user.id]);

  useEffect(() => {
    const handler = ({conversationId: convId}) => {
      if (String(convId) !== String(conversationId)) return;

      // маркираме МОИТЕ съобщения като прочетени
      setMessages(prev =>
        prev.map(msg =>
          msg.senderId === user.id ? {...msg, read: true} : msg,
        ),
      );
    };

    socket.on('messagesRead', handler);

    return () => socket.off('messagesRead', handler);
  }, [conversationId, user.id]);

  useEffect(() => {
    const fetchConversation = async () => {
      try {
        const res = await api.get(`/api/conversations/${conversationId}`);
        setConversationInfo(prev => ({
          ...prev,
          ...res.data,
          unreadCount: prev?.unreadCount || res.data.unreadCount,
        }));
      } catch (err) {
        console.error(err);
      }
    };

    fetchConversation();
  }, [conversationId]);

  useEffect(() => {
    const fetchMessages = async () => {
      if (!conversationId) return;

      try {
        const res = await api.get(
          `/api/conversations/${conversationId}/messages`,
        );
        setMessages(res.data);
        NotificationService.setActiveConversation(conversationId);
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingMessages(false); // 🔹 край на loader-а
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({animated: true});
        }, 100);
      }
    };

    fetchMessages();
  }, [conversationId]);

  const sendMessage = async () => {
    if (!text.trim()) return;
    try {
      const res = await api.post(
        `/api/conversations/${conversationId}/messages`,
        {
          senderId: user.id,
          text,
        },
      );

      setMessages(prev => {
        if (prev.some(msg => msg.id === res.data.id)) return prev;
        return [...prev, res.data];
      });

      setTimeout(() => {
        flatListRef.current?.scrollToEnd({animated: true});
      }, 100);

      setText('');
    } catch (err) {
      console.error(err);
    }
  };

  const formatDate = date => {
    const messageDate = new Date(date);
    const now = new Date();

    const isToday = messageDate.toDateString() === now.toDateString();

    const yesterday = new Date();
    yesterday.setDate(now.getDate() - 1);
    const isYesterday = messageDate.toDateString() === yesterday.toDateString();

    const isThisYear = messageDate.getFullYear() === now.getFullYear();

    if (isToday) {
      // Днес -> показваме само час и минути
      return messageDate.toLocaleTimeString('bg-BG', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      });
    }

    if (isYesterday) {
      // Вчера -> показваме "Вчера" + час и минути
      return (
        'Вчера ' +
        messageDate.toLocaleTimeString('bg-BG', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        })
      );
    }

    if (isThisYear) {
      // Тази година -> показваме ден, месец и час
      return (
        messageDate.toLocaleDateString('bg-BG', {
          day: '2-digit',
          month: 'short',
        }) +
        ' ' +
        messageDate.toLocaleTimeString('bg-BG', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        })
      );
    }

    // Преди тази година -> показваме пълна дата + час
    return (
      messageDate.toLocaleDateString('bg-BG') +
      ' ' +
      messageDate.toLocaleTimeString('bg-BG', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      })
    );
  };

  return (
    <SafeAreaView style={{flex: 1, backgroundColor: theme.gradient[0]}}>
      <KeyboardAvoidingView
        style={{flex: 1}}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={100}>
        <View
          style={[
            styles.header,
            {
              backgroundColor: theme.cardBackground,
              borderBottomColor: theme.cardBorder,
            },
          ]}>
          <View style={[styles.avatar, {backgroundColor: theme.highlight}]}>
            {otherUser?.userImage ? (
              <Image
                source={{uri: otherUser.userImage}}
                style={styles.avatarImage}
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

          <View style={{flex: 1}}>
            <Text style={[styles.username, {color: theme.textPrimary}]}>
              {otherUser?.username}
            </Text>

            <Text style={[styles.routeText, {color: theme.highlight}]}>
              {conversationInfo
                ? `${conversationInfo.departureCity} → ${conversationInfo.arrivalCity}`
                : ''}
            </Text>
          </View>
        </View>

        {loadingMessages ? (
          <View
            style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
            <Text style={{color: theme.textPrimary}}>Loading...</Text>
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            keyboardShouldPersistTaps="handled"
            keyExtractor={item => item.id.toString()}
            renderItem={({item}) => {
              const isMe = item.senderId === user.id;
              return (
                <View
                  style={[
                    styles.messageRow,
                    {flexDirection: isMe ? 'row-reverse' : 'row'},
                  ]}>
                  {!isMe && (
                    <View
                      style={[
                        styles.avatarSmall,
                        {backgroundColor: '#f4511e'},
                      ]}>
                      <Image
                        source={{
                          uri:
                            otherUser?.userImage ||
                            'https://res.cloudinary.com/dqxczsig5/image/upload/v1774361343/avatars/bzrmewmud1dlaatajmyf.jpg',
                        }}
                        style={styles.avatarSmallImage}
                      />
                    </View>
                  )}
                  <View
                    style={[
                      styles.bubble,
                      isMe ? styles.myBubble : styles.otherBubble,
                      {
                        backgroundColor: isMe
                          ? theme.primaryButton
                          : theme.inputBackground,
                      },
                    ]}>
                    <Text
                      style={[
                        styles.messageText,
                        {color: isMe ? '#fff' : theme.textPrimary},
                      ]}>
                      {item.text}
                    </Text>
                    <View style={{flexDirection: 'row', alignItems: 'center'}}>
                      <Text
                        style={[
                          styles.timeText,
                          {
                            color: isMe
                              ? 'rgba(255,255,255,0.7)'
                              : theme.placeholder,
                          },
                        ]}>
                        {formatDate(item.createdAt)}
                      </Text>

                      {isMe && item.read && (
                        <Text
                          style={{
                            marginLeft: 6,
                            fontSize: 11,
                            color: 'rgba(255,255,255,0.7)',
                          }}>
                          ✓✓
                        </Text>
                      )}
                    </View>
                  </View>
                </View>
              );
            }}
          />
        )}

        <View
          style={[
            styles.inputContainer,
            {
              backgroundColor: theme.cardBackground,
              borderTopColor: theme.cardBorder,
            },
          ]}>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: theme.inputBackground,
                color: theme.textPrimary,
              },
            ]}
            value={text}
            onChangeText={setText}
            placeholder={t('Type a message...')}
            placeholderTextColor="#d9d9db"
          />

          <TouchableOpacity
            onPress={sendMessage}
            style={[styles.sendButton, {backgroundColor: theme.primaryButton}]}>
            <Text style={[styles.sendText, {color: '#fff'}]}>{t('Send')}</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default ChatScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },

  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },

  avatarSmall: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 6,
  },

  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 23,
    resizeMode: 'cover',
  },

  avatarSmallImage: {
    width: '100%',
    height: '100%',
    borderRadius: 16,
    resizeMode: 'cover',
  },

  username: {
    fontWeight: '700',
    fontSize: 16,
  },

  routeText: {
    fontSize: 13,
    marginTop: 3,
    fontWeight: '500',
  },

  messageRow: {
    marginVertical: 6,
    paddingHorizontal: 12,
    alignItems: 'flex-end',
  },

  bubble: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 20,
    maxWidth: '75%',
  },

  myBubble: {
    borderBottomRightRadius: 6,
  },

  otherBubble: {
    borderBottomLeftRadius: 6,
  },

  messageText: {
    fontSize: 15,
    lineHeight: 20,
  },

  timeText: {
    fontSize: 11,
    marginTop: 6,
    alignSelf: 'flex-end',
  },

  inputContainer: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 10,
    alignItems: 'center',
    borderTopWidth: 1,
  },

  input: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 25,
    fontSize: 15,
  },

  sendButton: {
    marginLeft: 10,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
  },

  sendText: {
    fontWeight: '600',
    fontSize: 14,
  },
});
