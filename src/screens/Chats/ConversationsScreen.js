import React, {useEffect, useState} from 'react';
import {View, Text, FlatList, TouchableOpacity} from 'react-native';
import {useAuth} from '../../context/AuthContext';
import api from '../../api/api';

const ConversationsScreen = ({navigation}) => {
  const {user} = useAuth();
  const [conversations, setConversations] = useState([]);

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
    <View style={{flex: 1, padding: 16}}>
      <FlatList
        data={conversations}
        keyExtractor={item => item.id.toString()}
        renderItem={({item}) => (
          <TouchableOpacity
            style={{
              padding: 16,
              borderBottomWidth: 1,
              borderColor: '#ccc',
            }}
            onPress={() =>
              navigation.navigate('ChatScreen', {
                conversationId: item.id,
                otherUser: item.otherUser,
                routeInfo: {departureCity: '', arrivalCity: ''},
              })
            }>
            <Text style={{fontWeight: 'bold'}}>{item.otherUser.username}</Text>
            <Text numberOfLines={1}>
              {item.messages[item.messages.length - 1]?.text}
            </Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
};

export default ConversationsScreen;
