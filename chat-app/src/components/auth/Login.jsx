import { useState } from 'react';
import { useChat } from '../../context/ChatContext';
import { getRandomColor } from '../../utils/helpers';

const Login = () => {
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const { login } = useChat();

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!username.trim()) {
      setError('Username is required');
      return;
    }
    
    // Create user object
    const user = {
      username: username.trim(),
      avatar: null,
      color: getRandomColor()
    };
    
    // Login the user
    login(user);
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <h1 className="login-title">VibeChat</h1>
          <p className="login-subtitle">Connect with friends in real-time</p>
        </div>
        
        <form className="login-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="username" className="form-label">Username</label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username"
              className="chat-input"
            />
            {error && <p className="error-text" style={{ color: 'var(--danger-color)', fontSize: '0.8rem', marginTop: '5px' }}>{error}</p>}
          </div>
          
          <button type="submit" className="login-button">
            Join Chat
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
