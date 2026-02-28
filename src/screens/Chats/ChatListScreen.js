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
import {DarkModeContext} from '../../navigation/DarkModeContext';
import {useTranslation} from 'react-i18next';
import api from '../../api/api';

const ChatScreen = ({route}) => {
  const {t} = useTranslation();

  const {conversationId, otherUser} = route.params;
  const {user} = useAuth();
  const {darkMode} = useContext(DarkModeContext);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');

  const [conversationInfo, setConversationInfo] = useState(null);

  const flatListRef = useRef(null);

  const colors = {
    background: darkMode ? '#f9f9f9' : '#121212',
    card: darkMode ? '#ffffff' : '#1e1e1e',
    border: darkMode ? '#e0e0e0' : '#2a2a2a',
    textPrimary: darkMode ? '#000000' : '#ffffff',
    textSecondary: darkMode ? '#666666' : '#aaaaaa',
    accent: '#f4511e',
    myMessage: '#f4511e',
    otherMessage: darkMode ? '#eeeeee' : '#2a2a2a',
  };

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

    const interval = setInterval(fetchMessages, 2000); // 🔥 refresh на 2 секунди

    return () => clearInterval(interval);
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
      setMessages(prev => [...prev, res.data]);
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
      return messageDate.toLocaleTimeString('bg-BG', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      });
    }

    if (isYesterday) {
      return 'Вчера';
    }

    if (isThisYear) {
      return messageDate.toLocaleDateString('bg-BG', {
        day: '2-digit',
        month: 'short',
      });
    }

    return messageDate.toLocaleDateString('bg-BG');
  };

  return (
    <SafeAreaView
      style={{flex: 1, backgroundColor: darkMode ? '#fff' : '#222'}}>
      <KeyboardAvoidingView
        style={{flex: 1}}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={100}>
        <View
          style={[
            styles.header,
            {
              backgroundColor: darkMode ? '#ffffff' : '#1c1c1e',
              borderBottomColor: darkMode ? '#e5e5e5' : '#070707',
            },
          ]}>
          <View style={[styles.avatar, {backgroundColor: '#f4511e'}]}>
            <Text style={{color: '#fff', fontWeight: '700', fontSize: 18}}>
              {otherUser?.username?.[0]?.toUpperCase()}
            </Text>
          </View>

          <View style={{flex: 1}}>
            <Text
              style={[styles.username, {color: darkMode ? '#0f0f0f' : '#fff'}]}>
              {otherUser?.username}
            </Text>

            <Text style={[styles.routeText, {color: '#f4511e'}]}>
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
                        ? '#f4511e'
                        : darkMode
                        ? '#f2f2f7'
                        : '#57575e',
                    },
                  ]}>
                  <Text
                    style={[
                      styles.messageText,
                      {color: isMe ? '#fff' : darkMode ? '#000' : '#fff'},
                    ]}>
                    {item.text}
                  </Text>

                  <Text
                    style={[
                      styles.timeText,
                      {color: isMe ? '#373738' : '#ffffff'},
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
              backgroundColor: darkMode ? '#ffffff' : '#1c1c1e',
              borderTopColor: darkMode ? '#e5e5e5' : '#070707',
            },
          ]}>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: darkMode ? '#f2f2f7' : '#373738',
                color: darkMode ? '#000' : '#fff',
              },
            ]}
            value={text}
            onChangeText={setText}
            placeholder={t('Type a message...')}
            placeholderTextColor="#d9d9db"
          />

          <TouchableOpacity
            onPress={sendMessage}
            style={[styles.sendButton, {backgroundColor: '#f4511e'}]}>
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
