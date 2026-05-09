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
  const [newChatCount, setNewChatCount] = useState(0);
  const [activeConversation, setActiveConversation] = useState(null);
  const deliveredEndpointAvailableRef = useRef(true);
  const knownConversationIdsRef = useRef(new Set());
  const hasSyncedConversationsRef = useRef(false);

  const refreshChatCount = useCallback(async () => {
    if (!user?.id || !isAuthenticated) {
      setChatCount(0);
      setNewChatCount(0);
      knownConversationIdsRef.current = new Set();
      hasSyncedConversationsRef.current = false;
      return 0;
    }

    try {
      const res = await api.get(`/api/conversations/user/${user.id}`);
      const conversationIds = new Set(
        res.data.map(conversation => String(conversation.id)),
      );
      const newConversationIds = [...conversationIds].filter(
        id => !knownConversationIdsRef.current.has(id),
      );
      const totalUnread = res.data.reduce(
        (sum, conv) => sum + (conv.unreadCount || 0),
        0,
      );

      if (
        hasSyncedConversationsRef.current &&
        newConversationIds.length > 0
      ) {
        setNewChatCount(prev => prev + newConversationIds.length);
      }

      knownConversationIdsRef.current = conversationIds;
      hasSyncedConversationsRef.current = true;
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

    const intervalId = setInterval(() => {
      refreshChatCount();
    }, 10000);

    return () => clearInterval(intervalId);
  }, [isAuthenticated, refreshChatCount, user?.id]);

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
      const conversationId = String(conv.id);

      if (currentActive && String(currentActive) === String(conv.id)) {
        knownConversationIdsRef.current.add(conversationId);
        return;
      }

      if (!knownConversationIdsRef.current.has(conversationId)) {
        knownConversationIdsRef.current.add(conversationId);
        setNewChatCount(prev => prev + 1);
      }

      Toast.show({
        type: 'success',
        text1: 'New chat started',
        text2: `${conv.departureCity} - ${conv.arrivalCity}`,
        position: 'top',
        visibilityTime: 5000,
        autoHide: true,
        topOffset: 60,
      });

      refreshChatCount();
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
        refreshChatCount();
        return;
      }

      if (message?.senderId === user.id) {
        refreshChatCount();
        return;
      }

      setChatCount(prev => prev + 1);
      refreshChatCount();
    };

    socket.on('newConversation', newConversationHandler);
    socket.on('newMessage', newMessageHandler);

    return () => {
      socket.off('newConversation', newConversationHandler);
      socket.off('newMessage', newMessageHandler);
    };
  }, [isAuthenticated, refreshChatCount, user?.id]);

  const resetChat = () => {
    setChatCount(0);
    setNewChatCount(0);
  };

  const clearNewChatCount = () => {
    setNewChatCount(0);
  };

  return (
    <ChatContext.Provider
      value={{
        chatCount,
        newChatCount,
        setChatCount,
        activeConversation,
        setActiveConversation,
        resetChat,
        clearNewChatCount,
        refreshChatCount,
      }}>
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => useContext(ChatContext);
