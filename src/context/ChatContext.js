import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  useCallback,
  useRef,
} from 'react';
import Toast from 'react-native-toast-message';
import socket from '../socket/socket';
import api from '../api/api';
import {useAuth} from './AuthContext';
import NotificationService from '../backend-v2/services/NotificationService';

const ChatContext = createContext();

export const ChatProvider = ({children}) => {
  const {user, isAuthenticated} = useAuth();
  const [chatCount, setChatCount] = useState(0);
  const [activeConversation, setActiveConversation] = useState(null);
  const deliveredEndpointAvailableRef = useRef(true);

  const refreshChatCount = useCallback(async () => {
    if (!user?.id || !isAuthenticated) {
      setChatCount(0);
      return 0;
    }

    try {
      const res = await api.get(`/api/conversations/user/${user.id}`);
      const totalUnread = res.data.reduce(
        (sum, conv) => sum + (conv.unreadCount || 0),
        0,
      );
      setChatCount(totalUnread);
      return totalUnread;
    } catch (error) {
      console.error('Failed to refresh chat count:', error);
      return 0;
    }
  }, [isAuthenticated, user?.id]);

  useEffect(() => {
    refreshChatCount();
  }, [refreshChatCount]);

  useEffect(() => {
    if (!user?.id || !isAuthenticated) {
      return undefined;
    }

    const joinUserRoom = () => {
      socket.emit('joinUserRoom', user.id);
    };

    joinUserRoom();
    socket.on('connect', joinUserRoom);

    return () => {
      socket.off('connect', joinUserRoom);
    };
  }, [isAuthenticated, user?.id]);

  useEffect(() => {
    if (!user?.id || !isAuthenticated) {
      return;
    }

    const newConversationHandler = conv => {
      const currentActive = NotificationService.getActiveConversation();

      if (currentActive && String(currentActive) === String(conv.id)) {
        return;
      }

      setChatCount(prev => prev + 1);

      Toast.show({
        type: 'success',
        text1: 'New chat started',
        text2: `${conv.departureCity} - ${conv.arrivalCity}`,
        position: 'top',
        visibilityTime: 5000,
        autoHide: true,
        topOffset: 60,
      });
    };

    const newMessageHandler = ({conversationId, message}) => {
      const currentActive = NotificationService.getActiveConversation();

      if (message?.senderId !== user.id) {
        socket.emit('messageDelivered', {
          conversationId,
          messageId: message.id,
          userId: user.id,
        });

        if (!deliveredEndpointAvailableRef.current) {
          return;
        }

        api
          .put(`/api/conversations/${conversationId}/delivered`)
          .catch(error => {
            if (error?.response?.status === 404) {
              deliveredEndpointAvailableRef.current = false;
              return;
            }

            console.error('Failed to mark message delivered:', error);
          });
      }

      if (String(currentActive) === String(conversationId)) {
        return;
      }

      if (message?.senderId === user.id) {
        return;
      }

      setChatCount(prev => prev + 1);
    };

    socket.on('newConversation', newConversationHandler);
    socket.on('newMessage', newMessageHandler);

    return () => {
      socket.off('newConversation', newConversationHandler);
      socket.off('newMessage', newMessageHandler);
    };
  }, [isAuthenticated, user?.id]);

  const resetChat = () => {
    setChatCount(0);
  };

  return (
    <ChatContext.Provider
      value={{
        chatCount,
        setChatCount,
        activeConversation,
        setActiveConversation,
        resetChat,
        refreshChatCount,
      }}>
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => useContext(ChatContext);
