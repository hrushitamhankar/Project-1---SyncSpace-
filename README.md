# 🚀 SyncSpace

### Real-Time Collaborative Workspace

SyncSpace is a real-time collaborative development workspace that allows multiple users to work together on the same coding environment and whiteboard simultaneously.

The project combines a collaborative code editor with a real-time whiteboard, enabling users to communicate, write code, and visualize ideas together in the same workspace.

---

## ✨ Features

### 💻 Real-Time Collaborative Code Editor

- Monaco Editor based coding environment
- JavaScript syntax highlighting
- Real-time code synchronization using Yjs
- Socket.IO based communication
- Multiple users can edit the same document simultaneously
- Automatic synchronization when a user joins a room
- Reconnection support
- Shared room-based collaboration

### 🎨 Collaborative Whiteboard

- Real-time drawing between connected users
- Freehand drawing
- Adjustable brush size
- Custom brush color
- Clear board functionality
- Drawing events synchronized using Socket.IO
- Shared collaboration room

### 🔐 Authentication & Backend

- User authentication infrastructure
- Password hashing using bcrypt
- JWT-based authentication
- Express.js backend
- MongoDB database integration
- Authentication middleware
- Protected backend architecture

### 👥 Collaboration

- Room-based collaboration
- Connected-user awareness
- Real-time Socket.IO communication
- User join/leave handling
- Automatic synchronization of collaborative state

---

# 🏗️ System Architecture

```text
                  ┌──────────────────────┐
                  │      SyncSpace       │
                  │   React Frontend     │
                  └──────────┬───────────┘
                             │
              ┌──────────────┴──────────────┐
              │                             │
              ▼                             ▼
      ┌───────────────┐             ┌────────────────┐
      │ Monaco Editor │             │   Whiteboard   │
      └───────┬───────┘             └───────┬────────┘
              │                             │
              ▼                             ▼
          ┌───────┐                    Socket.IO
          │  Yjs  │                         │
          └───┬───┘                         │
              │                             │
              └──────────────┬──────────────┘
                             ▼
                    ┌─────────────────┐
                    │   Node.js +     │
                    │   Express.js    │
                    └────────┬────────┘
                             │
                       ┌─────┴─────┐
                       │           │
                       ▼           ▼
                 ┌──────────┐  ┌─────────┐
                 │ Socket.IO│  │ MongoDB │

                 └──────────┘  └─────────┘
