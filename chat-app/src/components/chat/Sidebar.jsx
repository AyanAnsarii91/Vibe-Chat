import { useChat } from '../../context/ChatContext';
import { getInitials } from '../../utils/helpers';

const Sidebar = () => {
  const { users, activeChat, setActiveChat, user, toggleProfileModal } = useChat();

  // Filter out current user and sort by online status
  const filteredUsers = users
    .filter(u => u.id !== user?.id)
    .sort((a, b) => {
      // Sort by online status first
      if (a.online !== b.online) {
        return a.online ? -1 : 1;
      }
      // Then by username
      return a.username.localeCompare(b.username);
    });

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <h2 className="app-title">VibeChat</h2>
        <div className="user-avatar" onClick={toggleProfileModal}>
          {user?.avatar ? (
            <img src={user.avatar} alt={user.username} />
          ) : (
            <span style={{ backgroundColor: user?.color }}>
              {getInitials(user?.username)}
            </span>
          )}
        </div>
      </div>

      <div className="user-list">
        {filteredUsers.length > 0 ? (
          filteredUsers.map((userItem) => (
            <div 
              key={userItem.id} 
              className={`user-item ${activeChat?.id === userItem.id ? 'active' : ''}`}
              onClick={() => setActiveChat(userItem)}
            >
              <div className="user-avatar">
                {userItem.avatar ? (
                  <img src={userItem.avatar} alt={userItem.username} />
                ) : (
                  <span style={{ backgroundColor: userItem.color }}>
                    {getInitials(userItem.username)}
                  </span>
                )}
                {userItem.online && <div className="online-indicator"></div>}
              </div>
              <div className="user-info">
                <h3 className="user-name">{userItem.username}</h3>
                <p className="user-status">
                  {userItem.online ? 'Online' : 'Offline'}
                </p>
              </div>
            </div>
          ))
        ) : (
          <div className="empty-list-message" style={{ padding: '20px', textAlign: 'center', color: 'var(--gray-color)' }}>
            No users available
          </div>
        )}
      </div>
    </div>
  );
};

export default Sidebar;
