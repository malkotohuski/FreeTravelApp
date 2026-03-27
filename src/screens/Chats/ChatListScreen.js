import React, {useEffect, useState, useContext, useRef} from 'react';
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
} from 'react-native';
import {useAuth} from '../../context/AuthContext';
import {useTranslation} from 'react-i18next';
import api from '../../api/api';
import {useTheme} from '../../theme/useTheme';
import socket from '../../socket/socket';
import NotificationService from '../../backend-v2/services/NotificationService';

const ChatScreen = ({route}) => {
  const {t} = useTranslation();

  const {conversationId, otherUser} = route.params;
  const {user} = useAuth();

  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const theme = useTheme();

  const [conversationInfo, setConversationInfo] = useState(null);

  const flatListRef = useRef(null);

  useEffect(() => {
    NotificationService.setActiveConversation(conversationId);

    return () => {
      NotificationService.clearActiveConversation();
    };
  }, [conversationId]);

  useEffect(() => {
    socket.emit('joinConversation', {
      userId: user.id,
      conversationId,
    });

    return () => {
      socket.emit('leaveConversation', {
        userId: user.id,
      });
    };
  }, [conversationId]);

  useEffect(() => {
    if (!user?.id) return;

    socket.emit('joinUserRoom', user.id);
  }, [user?.id]);

  useEffect(() => {
    const handler = ({conversationId: convId, message}) => {
      if (convId === route.params.conversationId) {
        setMessages(prev => {
          if (prev.some(msg => msg.id === message.id)) return prev;
          return [...prev, message];
        });

        api.put(`/api/conversations/${conversationId}/read`, {
          userId: user.id,
        });

        setTimeout(() => {
          flatListRef.current?.scrollToEnd({animated: true});
        }, 100);
      }
    };

    socket.on('newMessage', handler);

    return () => socket.off('newMessage', handler);
  }, []);

  useEffect(() => {
    if (!conversationId || !user?.id) return;

    api.put(`/api/conversations/${conversationId}/read`, {
      userId: user.id,
    });
  }, [conversationId, user?.id]);

  useEffect(() => {
    const fetchConversation = async () => {
      try {
        const res = await api.get(`/api/conversations/${conversationId}`);
        setConversationInfo(res.data);
      } catch (err) {
        console.error(err);
      }
    };

    fetchConversation();
  }, [conversationId]);

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const res = await api.get(
          `/api/conversations/${conversationId}/messages`,
        );
        setMessages(res.data);
      } catch (err) {
        console.error(err);
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
            <Text style={{color: '#fff', fontWeight: '700', fontSize: 18}}>
              {otherUser?.username?.[0]?.toUpperCase()}
            </Text>
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

        <FlatList
          ref={flatListRef}
          data={messages}
          keyboardShouldPersistTaps="handled"
          keyExtractor={item => item.id.toString()}
          onContentSizeChange={() =>
            flatListRef.current?.scrollToEnd({animated: true})
          }
          onLayout={() => flatListRef.current?.scrollToEnd({animated: true})}
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
                    style={[styles.avatarSmall, {backgroundColor: '#f4511e'}]}>
                    <Text style={{color: '#fff', fontSize: 13}}>
                      {otherUser?.username?.[0]?.toUpperCase()}
                    </Text>
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
                </View>
              </View>
            );
          }}
        />

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
