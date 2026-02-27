import React, {useEffect, useState, useContext} from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import {useAuth} from '../../context/AuthContext';
import {DarkModeContext} from '../../navigation/DarkModeContext';
import api from '../../api/api';

const ChatScreen = ({route}) => {
  const {conversationId, otherUser, routeInfo} = route.params;
  const {user} = useAuth();
  const {darkMode} = useContext(DarkModeContext);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');

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

  return (
    <SafeAreaView
      style={{flex: 1, backgroundColor: darkMode ? '#222' : '#fff'}}>
      <View
        style={{
          padding: 12,
          borderBottomWidth: 1,
          borderBottomColor: darkMode ? '#555' : '#ccc',
        }}>
        <Text style={{fontWeight: 'bold', color: darkMode ? '#fff' : '#000'}}>
          {routeInfo.departureCity} → {routeInfo.arrivalCity}
        </Text>
        <Text style={{color: darkMode ? '#ccc' : '#555'}}>
          Chat with {otherUser.username}
        </Text>
      </View>

      <FlatList
        data={messages}
        keyExtractor={item => item.id.toString()}
        renderItem={({item}) => (
          <View
            style={{
              padding: 10,
              backgroundColor:
                item.senderId === user.id
                  ? '#4caf50'
                  : darkMode
                  ? '#333'
                  : '#eee',
              alignSelf: item.senderId === user.id ? 'flex-end' : 'flex-start',
              borderRadius: 8,
              marginVertical: 2,
              maxWidth: '70%',
            }}>
            <Text
              style={{
                color:
                  item.senderId === user.id
                    ? '#fff'
                    : darkMode
                    ? '#fff'
                    : '#000',
              }}>
              {item.text}
            </Text>
          </View>
        )}
      />

      <View
        style={{
          flexDirection: 'row',
          padding: 8,
          borderTopWidth: 1,
          borderTopColor: darkMode ? '#555' : '#ccc',
        }}>
        <TextInput
          style={{
            flex: 1,
            padding: 10,
            borderWidth: 1,
            borderColor: darkMode ? '#555' : '#ccc',
            borderRadius: 8,
            color: darkMode ? '#fff' : '#000',
          }}
          value={text}
          onChangeText={setText}
          placeholder="Type a message..."
          placeholderTextColor={darkMode ? '#888' : '#999'}
        />
        <TouchableOpacity
          onPress={sendMessage}
          style={{marginLeft: 8, justifyContent: 'center'}}>
          <Text style={{color: '#2196f3', fontWeight: 'bold'}}>Send</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default ChatScreen;
