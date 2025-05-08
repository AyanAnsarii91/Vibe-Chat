import { FiMessageSquare } from 'react-icons/fi';
import { useChat } from '../../context/ChatContext';

const WelcomeScreen = () => {
  const { user } = useChat();
  
  return (
    <div className="welcome-screen">
      <div className="welcome-icon">
        <FiMessageSquare />
      </div>
      <h1 className="welcome-title">Welcome to VibeChat, {user?.username}!</h1>
      <p className="welcome-text">
        Select a user from the sidebar to start chatting. You can share messages,
        images, videos, and other files in real-time.
      </p>
    </div>
  );
};

export default WelcomeScreen;
