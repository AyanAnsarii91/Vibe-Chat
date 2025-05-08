import { useState } from 'react';
import { useChat } from '../../context/ChatContext';
import { formatTime, getInitials, getFileIcon, isImageFile, isVideoFile } from '../../utils/helpers';
import { FiFile, FiImage, FiVideo, FiFileText, FiFilePlus, FiSmile, FiTrash2 } from 'react-icons/fi';
import EmojiPicker from 'emoji-picker-react';

const MessageItem = ({ message, isOutgoing, sender }) => {
  const [showReactions, setShowReactions] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false); // confirm delete dialog
  const { addReaction, deleteMessage } = useChat();

  // Handle emoji click for reactions
  const handleEmojiClick = (emojiData) => {
    addReaction(message.id, emojiData.emoji);
    setShowReactions(false);
  };

  // Get file icon component based on file type
  const getFileIconComponent = (fileType) => {
    if (isImageFile(fileType)) return <FiImage />;
    if (isVideoFile(fileType)) return <FiVideo />;
    if (fileType?.includes('pdf')) return <FiFileText />;
    if (fileType?.includes('document')) return <FiFilePlus />;
    return <FiFile />;
  };

  return (
    <div className={`message ${isOutgoing ? 'outgoing' : ''}`}>
      <div className="message-avatar">
        {sender?.avatar ? (
          <img src={sender.avatar} alt={sender.username} />
        ) : (
          <div 
            style={{ 
              backgroundColor: sender?.color || 'var(--primary-color)',
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontWeight: 'bold'
            }}
          >
            {getInitials(sender?.username)}
          </div>
        )}
      </div>
      
      <div className="message-content">
        {/* Text Content */}
        {message.content && (
          <div className="message-text">{message.content}</div>
        )}
        
        {/* Image Content */}
        {message.fileUrl && isImageFile(message.fileType) && (
          <div className="message-image-container">
            <img 
              src={`http://localhost:5000${message.fileUrl}`} 
              alt="Shared image" 
              className="message-image"
              style={{ 
                maxWidth: '200px', 
                maxHeight: '200px', 
                objectFit: 'contain', 
                borderRadius: '8px', 
                marginTop: '5px' 
              }}
            />
          </div>
        )}
        
        {/* Video Content */}
        {message.fileUrl && isVideoFile(message.fileType) && (
          <div className="message-video-container">
            <video 
              src={`http://localhost:5000${message.fileUrl}`} 
              controls 
              className="message-video"
            />
          </div>
        )}
        
        {/* File Content */}
        {message.fileUrl && !isImageFile(message.fileType) && !isVideoFile(message.fileType) && (
          <div className="message-file">
            <div className="message-file-icon">
              {getFileIconComponent(message.fileType)}
            </div>
            <div className="message-file-info">
              <div className="message-file-name">
                <a 
                  href={`http://localhost:5000${message.fileUrl}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                >
                  {message.filename}
                </a>
              </div>
            </div>
          </div>
        )}
        
        {/* Reactions */}
        {message.reactions && message.reactions.length > 0 && (
          <div className="message-reactions">
            {message.reactions.map((reaction, index) => (
              <div key={index} className="reaction">
                <span className="reaction-emoji">{reaction.reaction}</span>
                <span className="reaction-count">1</span>
              </div>
            ))}
          </div>
        )}
        
        {/* Time */}
        <div className="message-time">
          {formatTime(message.timestamp)}
          <button 
            className="reaction-button" 
            onClick={() => setShowReactions(!showReactions)}
            style={{ 
              background: 'none', 
              border: 'none',
              marginLeft: '5px',
              cursor: 'pointer',
              color: isOutgoing ? 'rgba(255,255,255,0.7)' : 'var(--gray-color)',
              fontSize: '14px'
            }}
          >
            <FiSmile />
          </button>
          <button 
            className="delete-button" 
            onClick={() => setShowConfirm(true)}
            style={{ 
              background: 'none',
              border: 'none',
              marginLeft: '5px',
              cursor: 'pointer',
              color: 'var(--danger-color)',
              fontSize: '14px'
            }}
          >
            <FiTrash2 />
          </button>
        </div>
        
        {/* Emoji Picker and Delete Confirmation */}
        {showReactions && (
          <div 
            style={{ 
              position: 'absolute', 
              bottom: '100%', 
              right: isOutgoing ? 'auto' : '0',
              left: isOutgoing ? '0' : 'auto',
              zIndex: 10
            }}
          >
            <EmojiPicker 
              onEmojiClick={handleEmojiClick}
              width={300}
              height={400} 
            />
          </div>
        )}
        {showConfirm && (
          <div className="confirm-dialog">
            <p>Do you want to delete this message?</p>
            <button className="confirm-yes" onClick={() => { deleteMessage(message.id); setShowConfirm(false); }}>Yes</button>
            <button className="confirm-no" onClick={() => setShowConfirm(false)}>No</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default MessageItem;
