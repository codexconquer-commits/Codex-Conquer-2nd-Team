# 💬 Real-time Chat Application

A modern, feature-rich chat application built with the MERN stack, enabling seamless real-time communication with voice and video calling capabilities.

## 🌟 Features

- **One-to-One Private Chat** - Direct messaging between users with real-time synchronization
- **Group Chat Functionality** - Create and manage group conversations with multiple participants
- **Real-time Messaging** - Instant message delivery using WebSockets (Socket.IO)
- **Audio & Video Calls** - High-quality peer-to-peer calls powered by WebRTC
- **User Authentication** - Secure login and registration with JWT-based authorization
- **User Status** - Real-time online/offline presence indicators
- **Message Features** - Timestamps, read receipts, and message history
- **Responsive Design** - Optimized for desktop, tablet, and mobile devices

## 🛠️ Tech Stack

### Frontend

- **React.js** - UI library
- **Socket.IO Client** - Real-time communication
- **WebRTC** - Audio/video streaming
- **CSS/Tailwind** - Styling

### Backend

- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **Socket.IO** - WebSocket library
- **JWT** - Authentication

### Database & Tools

- **MongoDB** - NoSQL database
- **Mongoose** - ODM for MongoDB

## 📁 Folder Structure

```
Codex-Conquer-2nd-Team/
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── utils/
│   │   ├── App.js
│   │   └── index.js
│   ├── package.json
│   └── .env.local
│
├── backend/
│   ├── models/
│   ├── routes/
│   ├── controllers/
│   ├── middleware/
│   ├── socket/
│   ├── config/
│   ├── server.js
│   ├── package.json
│   └── .env
│
└── README.md
```

## 🚀 Getting Started

### Prerequisites

- Node.js (v14 or higher)
- MongoDB (local or Atlas)
- npm or yarn

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/yourusername/Codex-Conquer-2nd-Team.git
   cd Codex-Conquer-2nd-Team
   ```

2. **Setup Backend**

   ```bash
   cd backend
   npm install
   ```

3. **Setup Frontend**
   ```bash
   cd ../frontend
   npm install
   ```

## ⚙️ Environment Variables

### Backend (.env)

```
PORT=5000
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/chat-app
JWT_SECRET=your_jwt_secret_key
CORS_ORIGIN=http://localhost:3000
NODE_ENV=development
```

### Frontend (.env.local)

```
REACT_APP_API_URL=http://localhost:5000
REACT_APP_SOCKET_URL=http://localhost:5000
```

## 📖 Running the Project Locally

### Backend

```bash
cd backend
npm start
# Server runs on http://localhost:5000
```

### Frontend

```bash
cd frontend
npm start
# Application opens on http://localhost:3000
```

The application will automatically connect to the backend via WebSocket.

## 📸 Screenshots

> Screenshots will be added here showcasing:
>
> - Login & Registration interface
> - One-to-one chat view
> - Group chat interface
> - Audio/Video call interface
> - User status and online indicators

## 🔮 Future Improvements

- [ ] Message encryption (end-to-end)
- [ ] File and media sharing
- [ ] Message search functionality
- [ ] User profiles and avatars
- [ ] Chat notifications (push & desktop)
- [ ] Screen sharing during calls
- [ ] Message reactions and emojis
- [ ] Dark mode theme
- [ ] Mobile app (React Native)

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

Please ensure your code follows the project's coding standards and includes appropriate comments.

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

**Made with ❤️ by the Codex-Conquer Team**
