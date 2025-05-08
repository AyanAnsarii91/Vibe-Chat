# VibeChat - Real-time Chat Application

VibeChat is a beautiful, fully responsive real-time chat application built with React, Vite, and Socket.io. It features a modern UI, real-time messaging, file sharing, and more.

## Features

- **Real-time Messaging**: Instant message delivery and updates
- **User Authentication**: Simple username-based login system
- **Online Status Indicators**: See who's currently online
- **File Sharing**: Share images, videos, and other files
- **Emoji Reactions**: React to messages with emojis
- **Profile Management**: Update your username and avatar
- **Typing Indicators**: See when someone is typing
- **Mobile Responsive**: Works seamlessly on all devices
- **Beautiful UI**: Clean, modern interface with smooth animations

## Technology Stack

- **Frontend**: React, Vite, React Icons, Emoji-Picker-React
- **Backend**: Node.js, Express, Socket.io
- **Styling**: Vanilla CSS (no frameworks)

## Installation and Setup

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn

### Server Setup
1. Navigate to the server directory:
   ```
   cd server
   ```
2. Install dependencies:
   ```
   npm install
   ```
3. Start the server:
   ```
   npm start
   ```
   The server will run on http://localhost:5000

### Client Setup
1. From the project root, install dependencies:
   ```
   npm install
   ```
2. Start the development server:
   ```
   npm run dev
   ```
   The application will be available at http://localhost:5173

## How to Use

1. Enter a username to join the chat
2. Select a user from the sidebar to start chatting
3. Use the attachment buttons to share files
4. Click on the emoji button to add reactions
5. Update your profile by clicking your avatar in the sidebar

## Project Structure

- `/server` - Backend server using Express and Socket.io
- `/src` - React frontend code
  - `/components` - React components
  - `/context` - React Context for state management
  - `/utils` - Utility functions

## License

MIT
