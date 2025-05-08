const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Create uploads directory if it doesn't exist
const fs = require('fs');
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: [
      'https://vibe-chat-rouge.vercel.app',
      'http://localhost:5173',
      'https://localhost:5173',
      '*'
    ],
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
  },
  transports: ['websocket', 'polling'],
  pingTimeout: 60000,
  pingInterval: 25000,
  maxHttpBufferSize: 1e8,  // Increase buffer size
  connectionStateRecovery: {
    maxDisconnectionDuration: 2 * 60 * 1000,
    skipMiddlewares: true
  }
});

// Store connected users
let users = [];

// Store messages
let messages = [];

io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  // Handle user joining
  socket.on('user_join', (userData) => {
    const user = {
      ...userData,
      id: socket.id,
      online: true
    };
    
    // Check if user already exists
    const existingUserIndex = users.findIndex(u => u.username === userData.username);
    if (existingUserIndex !== -1) {
      users[existingUserIndex] = user;
    } else {
      users.push(user);
    }
    
    // Send updated user list to all clients
    io.emit('user_list', users);
    
    // Send existing messages to new user
    socket.emit('message_history', messages);
  });

  // Handle private messages
  socket.on('private_message', (messageData) => {
    console.log('Received private message:', messageData);
    
    const newMessage = {
      ...messageData,
      timestamp: new Date().toISOString()
    };
    
    messages.push(newMessage);
    
    // Log the recipient's socket existence and connection status
    const recipientSocket = io.sockets.sockets.get(messageData.to);
    console.log(`Recipient socket exists: ${!!recipientSocket}`);
    if (recipientSocket) {
      console.log(`Recipient socket connected: ${recipientSocket.connected}`);
    }
    
    // Send to recipient (if different from sender)
    if (messageData.to && messageData.to !== socket.id) {
      io.to(messageData.to).emit('receive_message', newMessage);
      console.log(`Message sent to recipient: ${messageData.to}`);
    }
    
    // Always send back to sender (as confirmation, or if they are the sole recipient)
    socket.emit('receive_message', newMessage);
    console.log(`Message sent back to sender: ${socket.id} (either as confirmation or self-message)`);
  });

  // Handle reactions
  socket.on('message_reaction', (reactionData) => {
    const { messageId, reaction, username } = reactionData;
    
    // Find the message and add the reaction
    const messageIndex = messages.findIndex(msg => msg.id === messageId);
    if (messageIndex !== -1) {
      if (!messages[messageIndex].reactions) {
        messages[messageIndex].reactions = [];
      }
      
      // Remove previous reaction from the same user if exists
      messages[messageIndex].reactions = messages[messageIndex].reactions.filter(
        r => r.username !== username
      );
      
      // Add new reaction
      messages[messageIndex].reactions.push({ username, reaction });
      
      // Broadcast the updated message
      io.emit('message_updated', messages[messageIndex]);
    }
  });

  // Handle file uploads
  socket.on('file_message', (fileData) => {
    const { file, filename, fileType, from, to } = fileData;
    
    // Generate a unique filename
    const uniqueFilename = `${Date.now()}-${filename}`;
    const filePath = path.join(uploadDir, uniqueFilename);
    
    // Save the file
    fs.writeFile(filePath, file, { encoding: 'base64' }, (err) => {
      if (err) {
        console.error('Error saving file:', err);
        return;
      }
      
      // Create message with file info
      const newMessage = {
        id: Date.now().toString(),
        from,
        to,
        fileUrl: `/uploads/${uniqueFilename}`,
        fileType,
        filename,
        timestamp: new Date().toISOString()
      };
      
      messages.push(newMessage);
      
      // Send to recipient (if different from sender)
      if (to && to !== from) { 
        io.to(to).emit('receive_message', newMessage);
        console.log(`File message sent to recipient: ${to}`);
      }
      
      // Always send back to sender (as confirmation or if they are the sole recipient)
      socket.emit('receive_message', newMessage);
      console.log(`File message sent back to sender: ${from}`);
    });
  });

  // Handle profile updates
  socket.on('profile_update', (profileData) => {
    const { username, avatar } = profileData;
    
    // Update user profile
    const userIndex = users.findIndex(u => u.id === socket.id);
    if (userIndex !== -1) {
      users[userIndex] = {
        ...users[userIndex],
        username,
        avatar
      };
      
      // Broadcast updated user list
      io.emit('user_list', users);
    }
  });

  // Handle typing indicator
  socket.on('typing', (data) => {
    const { to, isTyping } = data;
    io.to(to).emit('user_typing', { from: socket.id, isTyping });
  });

  // Handle WebRTC signaling
  socket.on('webrtc_offer', (data) => {
    io.to(data.to).emit('webrtc_offer', data);
  });

  socket.on('webrtc_answer', (data) => {
    io.to(data.to).emit('webrtc_answer', data);
  });

  socket.on('webrtc_ice_candidate', (data) => {
    io.to(data.to).emit('webrtc_ice_candidate', data);
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
    
    // Mark user as offline
    const userIndex = users.findIndex(u => u.id === socket.id);
    if (userIndex !== -1) {
      users[userIndex].online = false;
      
      // Broadcast updated user list
      io.emit('user_list', users);
    }
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
