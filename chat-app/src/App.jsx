import { useState, useEffect } from 'react';
import './App.css';
import { ChatProvider, useChat } from './context/ChatContext';
import Login from './components/auth/Login';
import Sidebar from './components/chat/Sidebar';
import ChatContainer from './components/chat/ChatContainer';
import ProfileModal from './components/profile/ProfileModal';
import { FiMenu } from 'react-icons/fi';

// Main App Component that wraps everything with the ChatProvider
function App() {
  return (
    <ChatProvider>
      <AppContent />
    </ChatProvider>
  );
}

// AppContent component that uses the ChatContext
function AppContent() {
  const { user } = useChat();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Toggle mobile sidebar
  const toggleMobileSidebar = () => {
    setIsMobileSidebarOpen(prev => !prev);
  };

  // Close sidebar when clicking outside on mobile
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 768) {
        setIsMobileSidebarOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // If no user is logged in, show login screen
  if (!user) {
    return <Login />;
  }

  return (
    <div className="app-container">
      {/* Mobile Menu Toggle */}
      <div className="mobile-toggle" onClick={toggleMobileSidebar} style={{ display: window.innerWidth <= 768 ? 'flex' : 'none' }}>
        <FiMenu />
      </div>
      
      {/* Sidebar */}
      <div className={`sidebar ${isMobileSidebarOpen ? 'open' : ''}`}>
        <Sidebar />
      </div>
      
      {/* Chat Container */}
      <ChatContainer />
      
      {/* Profile Modal */}
      <ProfileModal />
    </div>
  );
}

export default App
