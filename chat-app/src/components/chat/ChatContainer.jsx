import { useEffect, useRef, useState } from 'react';
import { useChat } from '../../context/ChatContext';
import { formatTime, getInitials, isImageFile, isVideoFile } from '../../utils/helpers';
import EmojiPicker from 'emoji-picker-react';
import { FiSend, FiImage, FiPaperclip, FiSmile, FiVideo, FiPhone } from 'react-icons/fi';
import MessageItem from './MessageItem';
import WelcomeScreen from './WelcomeScreen';
import VideoCall from '../call/VideoCall';

const ChatContainer = () => {
  const { 
    activeChat, 
    user, 
    messages, 
    sendMessage, 
    sendFileMessage,
    setTyping,
    isTyping,
    isEmojiPickerOpen,
    toggleEmojiPicker,
    socket // Extract socket from context
  } = useChat();
  
  const [input, setInput] = useState('');
  const [isUserTyping, setIsUserTyping] = useState(false);
  const [callActive, setCallActive] = useState(false);
  const [callType, setCallType] = useState(null); // 'video' or 'voice'
  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);
  
  // Filter messages for the active chat
  const chatMessages = messages.filter(
    msg => {
      // Make sure socket and activeChat exist before filtering
      if (!socket || !activeChat) return false;
      
      // Log for debugging
      console.log(`Checking message: from=${msg.from}, to=${msg.to}, socket.id=${socket?.id}, activeChat.id=${activeChat?.id}`);
      
      return (
        // Messages from current user to active chat
        (msg.from === socket.id && msg.to === activeChat?.id) || 
        // Messages from active chat to current user
        (msg.to === socket.id && msg.from === activeChat?.id)
      );
    }
  );
  
  // Debug logging
  console.log('All messages:', messages);
  console.log('Filtered messages:', chatMessages);
  console.log('Current socket ID:', socket?.id);

  // Scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // Handle typing indicator
  useEffect(() => {
    if (!activeChat) return;
    
    let typingTimeout;
    if (isUserTyping) {
      setTyping(activeChat.id, true);
      typingTimeout = setTimeout(() => {
        setIsUserTyping(false);
        setTyping(activeChat.id, false);
      }, 3000);
    } else {
      setTyping(activeChat.id, false);
    }
    
    return () => clearTimeout(typingTimeout);
  }, [isUserTyping, activeChat, setTyping]);

  // Handle send message
  const handleSendMessage = () => {
    if (!input.trim() && !fileInputRef.current?.files?.length) return;
    
    if (input.trim()) {
      sendMessage(input, activeChat.id);
      setInput('');
      setIsUserTyping(false);
    }
    
    if (fileInputRef.current?.files?.length) {
      Array.from(fileInputRef.current.files).forEach(file => {
        sendFileMessage(file, activeChat.id);
      });
      fileInputRef.current.value = null;
    }
  };

  // Handle key press
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Handle input change
  const handleInputChange = (e) => {
    setInput(e.target.value);
    if (!isUserTyping && e.target.value.trim()) {
      setIsUserTyping(true);
    } else if (e.target.value.trim() === '') {
      setIsUserTyping(false);
    }
  };

  // Handle file upload click
  const handleFileClick = () => {
    fileInputRef.current?.click();
  };

  // Handle emoji select
  const handleEmojiSelect = (emojiData) => {
    setInput((prev) => prev + emojiData.emoji);
    toggleEmojiPicker();
  };

  const handleVideoCall = () => {
    setCallType('video');
    setCallActive(true);
  };

  const handleVoiceCall = () => {
    setCallType('voice');
    setCallActive(true);
  };

  const handleEndCall = () => {
    setCallActive(false);
    setCallType(null);
  };

  if (!activeChat) {
    return <WelcomeScreen />;
  }

  return (
    <div className="chat-container">
      {callActive && (
        <VideoCall 
          isVideo={callType === 'video'} 
          callWith={activeChat} 
          onClose={handleEndCall} 
        />
      )}
      <div className="chat-header">
        <div className="chat-header-info">
          <div className="user-avatar">
            {activeChat.avatar ? (
              <img src={activeChat.avatar} alt={activeChat.username} />
            ) : (
              <span style={{ backgroundColor: activeChat.color }}>
                {getInitials(activeChat.username)}
              </span>
            )}
            {activeChat.online && <div className="online-indicator"></div>}
          </div>
          <div className="user-info">
            <h3 className="user-name">{activeChat.username}</h3>
            <p className="user-status">
              {activeChat.online ? 'Online' : 'Offline'}
            </p>
          </div>
        </div>
        <div className="chat-header-actions">
          <button className="call-button" onClick={handleVideoCall}>
            <FiVideo />
          </button>
          <button className="call-button" onClick={handleVoiceCall}>
            <FiPhone />
          </button>
        </div>
      </div>

      <div className="chat-messages">
        {chatMessages.length > 0 ? (
          chatMessages.map((message) => (
            <MessageItem 
              key={message.id} 
              message={message} 
              isOutgoing={message.from === socket?.id}
              sender={message.from === socket?.id ? user : activeChat}
            />
          ))
        ) : (
          <div className="empty-chat-message" style={{ textAlign: 'center', marginTop: '20px', color: 'var(--gray-color)' }}>
            No messages yet. Start the conversation!
          </div>
        )}
        {isTyping[activeChat.id] && (
          <div className="typing-indicator">
            {activeChat.username} is typing...
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="chat-input-container">
        <div className="chat-input-wrapper">
          <textarea
            className="chat-input"
            placeholder="Type a message..."
            value={input}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
          />
          <div className="input-actions">
            <button 
              className="input-action-button"
              onClick={toggleEmojiPicker}
            >
              <FiSmile />
            </button>
            <button 
              className="input-action-button"
              onClick={handleFileClick}
            >
              <FiPaperclip />
            </button>
            <button 
              className="input-action-button"
              onClick={handleFileClick}
            >
              <FiImage />
            </button>
            <input 
              type="file" 
              ref={fileInputRef} 
              style={{ display: 'none' }}
              onChange={() => {}} // Just to prevent React warning
              multiple
            />
          </div>
          <button 
            className="send-button"
            onClick={handleSendMessage}
          >
            <FiSend />
          </button>
        </div>
      </div>

      {isEmojiPickerOpen && (
        <div className="emoji-picker-container">
          <EmojiPicker 
            onEmojiClick={handleEmojiSelect} 
            width={300} 
            height={400}
          />
        </div>
      )}
    </div>
  );
};

export default ChatContainer;
