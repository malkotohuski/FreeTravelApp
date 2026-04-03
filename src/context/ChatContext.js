import React, {createContext, useState, useContext} from 'react';

const ChatContext = createContext();

export const ChatProvider = ({children}) => {
  const [chatCount, setChatCount] = useState(0);
  const [activeConversation, setActiveConversation] = useState(null);

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
      }}>
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => useContext(ChatContext);
