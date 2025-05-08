import { useState, useRef } from 'react';
import { useChat } from '../../context/ChatContext';
import { FiX, FiUser } from 'react-icons/fi';
import { getInitials } from '../../utils/helpers';

const ProfileModal = () => {
  const { user, updateProfile, isProfileModalOpen, toggleProfileModal } = useChat();
  const [username, setUsername] = useState(user?.username || '');
  const [avatar, setAvatar] = useState(user?.avatar || null);
  const [previewUrl, setPreviewUrl] = useState(user?.avatar || null);
  const fileInputRef = useRef(null);

  // Handle file selection
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = () => {
      setPreviewUrl(reader.result);
      setAvatar(reader.result);
    };
    reader.readAsDataURL(file);
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!username.trim()) {
      alert('Username is required');
      return;
    }
    
    updateProfile({
      username: username.trim(),
      avatar: avatar
    });
    
    toggleProfileModal();
  };

  if (!isProfileModalOpen) return null;

  return (
    <div className="modal-overlay" onClick={toggleProfileModal}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Edit Profile</h2>
          <button className="modal-close" onClick={toggleProfileModal}>
            <FiX />
          </button>
        </div>
        
        <div className="modal-body">
          <form className="profile-form" onSubmit={handleSubmit}>
            <div className="avatar-upload">
              <div className="avatar-preview">
                {previewUrl ? (
                  <img src={previewUrl} alt="Avatar preview" />
                ) : (
                  <div 
                    style={{ 
                      backgroundColor: user?.color || 'var(--primary-color)',
                      width: '100%',
                      height: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontSize: '2rem'
                    }}
                  >
                    {getInitials(username || user?.username)}
                  </div>
                )}
              </div>
              
              <button 
                type="button" 
                className="upload-button"
                onClick={() => fileInputRef.current?.click()}
              >
                <FiUser style={{ marginRight: '5px' }} />
                Choose Avatar
              </button>
              
              <input 
                type="file" 
                ref={fileInputRef} 
                style={{ display: 'none' }}
                onChange={handleFileChange}
                accept="image/*"
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="username" className="form-label">Username</label>
              <input
                type="text"
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
                className="chat-input"
                style={{ backgroundColor: 'white' }}
              />
            </div>
            
            <div className="modal-footer">
              <button 
                type="button" 
                className="cancel-button"
                onClick={toggleProfileModal}
              >
                Cancel
              </button>
              <button type="submit" className="save-button">
                Save Changes
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ProfileModal;
