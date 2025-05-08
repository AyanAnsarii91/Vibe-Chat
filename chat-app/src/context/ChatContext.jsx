import { createContext, useContext, useEffect, useReducer, useState, useRef } from 'react';
import { io } from 'socket.io-client';

const ChatContext = createContext();

// Initialize socket connection
let socket;

// This function ensures socket is only initialized once
const getSocket = () => {
  if (!socket) {
    // Use environment variable for server URL, fallback to localhost for development
    const serverUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    console.log('Connecting to server:', serverUrl);
    
    socket = io(serverUrl, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 20000
    });
  }
  return socket;
};

// Initial state for our chat context
// Helper to safely parse JSON from localStorage
const getStoredItem = (key, defaultValue) => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error(`Error parsing ${key} from localStorage:`, error);
    return defaultValue;
  }
};

// Initial state for our chat context
const initialState = {
  user: getStoredItem('chatUser', null),
  activeChat: getStoredItem('activeChat', null),
  users: getStoredItem('chatUsers', []),
  messages: getStoredItem('chatMessages', []),
  isTyping: {},
  socketId: null
};

// Reducer function to handle various actions
const chatReducer = (state, action) => {
  let newState;
  
  switch (action.type) {
    case 'SET_USER':
      newState = { ...state, user: action.payload };
      localStorage.setItem('chatUser', JSON.stringify(action.payload));
      break;
      
    case 'LOGOUT':
      newState = { ...state, user: null, activeChat: null, messages: [] };
      localStorage.removeItem('chatUser');
      localStorage.removeItem('chatMessages');
      localStorage.removeItem('activeChat');
      break;
      
    case 'SET_ACTIVE_CHAT':
      newState = { ...state, activeChat: action.payload };
      if (action.payload) {
        localStorage.setItem('activeChat', JSON.stringify(action.payload));
      }
      break;
      
    case 'SET_USERS':
      newState = { ...state, users: action.payload };
      localStorage.setItem('chatUsers', JSON.stringify(action.payload));
      break;
      
    case 'ADD_MESSAGE':
      // Check for duplicates
      if (state.messages.some(msg => msg.id === action.payload.id)) {
        console.warn('Attempted to add duplicate message ID:', action.payload.id);
        return state;
      }
      
      const newMessages = [...state.messages, action.payload];
      newState = { ...state, messages: newMessages };
      localStorage.setItem('chatMessages', JSON.stringify(newMessages));
      break;
      
    case 'SET_MESSAGES':
      newState = { ...state, messages: action.payload };
      localStorage.setItem('chatMessages', JSON.stringify(action.payload));
      break;
      
    case 'UPDATE_MESSAGE':
      const updatedMessages = state.messages.map(msg => 
        msg.id === action.payload.id ? action.payload : msg
      );
      newState = { ...state, messages: updatedMessages };
      localStorage.setItem('chatMessages', JSON.stringify(updatedMessages));
      break;
      
    case 'SET_TYPING':
      newState = {
        ...state,
        isTyping: {
          ...state.isTyping,
          [action.payload.userId]: action.payload.isTyping
        }
      };
      break;
      
    case 'DELETE_MESSAGE':
      const messagesAfterDelete = state.messages.filter(msg => msg.id !== action.payload);
      newState = { ...state, messages: messagesAfterDelete };
      localStorage.setItem('chatMessages', JSON.stringify(messagesAfterDelete));
      break;
      
    case 'DELETE_CHAT':
      const messagesAfterChatDelete = state.messages.filter(
        msg => !(
          (msg.from === action.payload && msg.to === state.socketId) ||
          (msg.to === action.payload && msg.from === state.socketId)
        )
      );
      newState = { ...state, messages: messagesAfterChatDelete };
      localStorage.setItem('chatMessages', JSON.stringify(messagesAfterChatDelete));
      break;
      
    default:
      return state;
  }
  
  return newState;
};

export const ChatProvider = ({ children }) => {
  const [state, dispatch] = useReducer(chatReducer, initialState);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
  const [socketId, setSocketId] = useState(null);

  // Persist state changes to localStorage
  useEffect(() => {
    localStorage.setItem('chatMessages', JSON.stringify(state.messages));
  }, [state.messages]);

  useEffect(() => {
    if (state.activeChat) {
      localStorage.setItem('activeChat', JSON.stringify(state.activeChat));
    }
  }, [state.activeChat]);

  useEffect(() => {
    if (state.users.length > 0) {
      localStorage.setItem('chatUsers', JSON.stringify(state.users));
    }
  }, [state.users]);

  // Handle socket events
  useEffect(() => {
    if (state.user) {
      const currentSocket = getSocket();
      
      // Connect socket if not connected
      if (!currentSocket.connected) {
        currentSocket.connect();
      }
      
      // Listen for connect event to get socket.id
      currentSocket.on('connect', () => {
        setSocketId(currentSocket.id);
        console.log('Socket connected! Socket ID:', currentSocket.id);
        // Join the chat after connection
        currentSocket.emit('user_join', {
          username: state.user.username,
          avatar: state.user.avatar
        });
      });
      // If already connected, set socketId immediately
      if (currentSocket.connected && !socketId) {
        setSocketId(currentSocket.id);
      }
      
      // Listen for user list updates
      currentSocket.on('user_list', (users) => {
        console.log('Received user list:', users);
        dispatch({ type: 'SET_USERS', payload: users });
      });

      // Listen for new messages
      currentSocket.on('receive_message', (message) => {
        console.log('Received message:', message);
        dispatch({ type: 'ADD_MESSAGE', payload: message });
      });

      // Listen for message history
      currentSocket.on('message_history', (messages) => {
        console.log('Received message history:', messages);
        // Merge server history with local messages
        const localMessages = getStoredItem('chatMessages', []);
        const mergedMessages = [...localMessages];
        
        // Add new messages from server that don't exist locally
        messages.forEach(serverMsg => {
          if (!mergedMessages.some(localMsg => localMsg.id === serverMsg.id)) {
            mergedMessages.push(serverMsg);
          }
        });
        
        // Sort by timestamp
        mergedMessages.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
        
        dispatch({ type: 'SET_MESSAGES', payload: mergedMessages });
      });

      // Listen for message updates (reactions)
      currentSocket.on('message_updated', (updatedMessage) => {
        dispatch({ type: 'UPDATE_MESSAGE', payload: updatedMessage });
        // Update the message in localStorage
        const messages = getStoredItem('chatMessages', []);
        const updatedMessages = messages.map(msg => 
          msg.id === updatedMessage.id ? updatedMessage : msg
        );
        localStorage.setItem('chatMessages', JSON.stringify(updatedMessages));
      });

      // Listen for typing indicators
      currentSocket.on('user_typing', ({ from, isTyping }) => {
        dispatch({ 
          type: 'SET_TYPING', 
          payload: { userId: from, isTyping } 
        });
      });
      
      // Listen for disconnect
      currentSocket.on('disconnect', () => {
        setSocketId(null);
        console.log('Socket disconnected!');
      });
      
      currentSocket.on('connect_error', (error) => {
        setSocketId(null);
        console.error('Socket connection error:', error);
      });
    }

    return () => {
      const currentSocket = getSocket();
      if (currentSocket) {
        currentSocket.off('user_list');
        currentSocket.off('receive_message');
        currentSocket.off('message_history');
        currentSocket.off('message_updated');
        currentSocket.off('user_typing');
        currentSocket.off('connect');
        currentSocket.off('disconnect');
        currentSocket.off('connect_error');
      }
    };
  }, [state.user]);

  // Send a private message
  const sendMessage = (content, to) => {
    if (!content.trim() && !content.file) return;
    const currentSocket = getSocket();
    if (!currentSocket.connected || !socketId) {
      console.error('Socket not connected or socketId unavailable! Cannot send message.');
      return;
    }
    const messageData = {
      id: Date.now().toString(),
      content,
      from: socketId,
      to,
      timestamp: new Date().toISOString()
    };
    console.log('Sending message:', messageData);
    currentSocket.emit('private_message', messageData);
  };

  // Send a file message
  const sendFileMessage = (file, to) => {
    const currentSocket = getSocket();
    if (!currentSocket.connected || !socketId) {
      console.error('Socket not connected or socketId unavailable! Cannot send file.');
      return;
    }
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      // Extract the base64 data (remove the data URL prefix)
      const base64Data = reader.result.split(',')[1];
      const fileData = {
        file: base64Data,
        filename: file.name,
        fileType: file.type,
        from: socketId,
        to
      };
      console.log('Sending file:', file.name);
      currentSocket.emit('file_message', fileData);
    };
  };

  // Add a reaction to a message
  const addReaction = (messageId, reaction) => {
    if (!state.user) return;
    const currentSocket = getSocket();
    if (!currentSocket.connected || !socketId) {
      console.error('Socket not connected or socketId unavailable! Cannot add reaction.');
      return;
    }
    currentSocket.emit('message_reaction', {
      messageId,
      reaction,
      username: state.user.username
    });
  };

  // Update user profile
  const updateProfile = (profileData) => {
    const currentSocket = getSocket();
    if (currentSocket.connected) {
      currentSocket.emit('profile_update', profileData);
    }
    
    // Update local user data
    dispatch({
      type: 'SET_USER',
      payload: { ...state.user, ...profileData }
    });
  };

  // Set typing indicator
  const setTyping = (to, isTyping) => {
    const currentSocket = getSocket();
    if (currentSocket.connected) {
      currentSocket.emit('typing', { to, isTyping });
    }
  };

  // Login user
  const login = (userData) => {
    dispatch({ type: 'SET_USER', payload: userData });
  };

  // Logout user
  const logout = () => {
    dispatch({ type: 'LOGOUT' });
    const currentSocket = getSocket();
    if (currentSocket) {
      currentSocket.disconnect();
    }
  };

  // Set active chat
  const setActiveChat = (user) => {
    dispatch({ type: 'SET_ACTIVE_CHAT', payload: user });
  };

  // Toggle profile modal
  const toggleProfileModal = () => {
    setIsProfileModalOpen(prev => !prev);
  };

  // Toggle emoji picker
  const toggleEmojiPicker = () => {
    setIsEmojiPickerOpen(prev => !prev);
  };

  // Delete message
  const deleteMessage = (messageId) => {
    // Update state through reducer
    dispatch({ type: 'DELETE_MESSAGE', payload: messageId });
    
    // Directly update localStorage to ensure persistence
    const messages = getStoredItem('chatMessages', []);
    const updatedMessages = messages.filter(msg => msg.id !== messageId);
    localStorage.setItem('chatMessages', JSON.stringify(updatedMessages));
  };

  // Delete entire chat conversation
  const deleteChat = (chatUserId) => {
    // Update state through reducer
    dispatch({ type: 'DELETE_CHAT', payload: chatUserId });
    
    // Update localStorage
    const messages = getStoredItem('chatMessages', []);
    const updatedMessages = messages.filter(msg => !(
      (msg.from === chatUserId && msg.to === socketId) ||
      (msg.to === chatUserId && msg.from === socketId)
    ));
    localStorage.setItem('chatMessages', JSON.stringify(updatedMessages));
  };

  const value = {
    ...state,
    socket: getSocket(),
    socketId,
    sendMessage,
    sendFileMessage,
    addReaction,
    updateProfile,
    setTyping,
    login,
    logout,
    setActiveChat,
    isProfileModalOpen,
    toggleProfileModal,
    isEmojiPickerOpen,
    toggleEmojiPicker,
    deleteMessage,
    deleteChat
  };

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
};

// Custom hook to use the chat context
export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};
