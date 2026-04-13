# 💬 ChatHive — Real-Time Chat Application

ChatHive is a scalable, real-time chat application engineered with modern full-stack technologies. It delivers low-latency messaging, secure authentication, and a smooth, app-like user experience.

---

## 🚀 Highlights

- ⚡ Real-time bi-directional messaging with Socket.IO
- 🔐 JWT-based authentication & authorization
- 🟢 Online/offline user presence tracking
- 💬 Conversation-based chat architecture
- 📁 File/image upload support via Multer
- ✅ Request validation using Express Validator
- 📦 Modular, scalable backend structure
- 🎨 Smooth UI with animations (Framer Motion)
- 😀 Emoji support for richer conversations
- 🔄 Auto message updates without refresh

---

## ⚙️ Environment Setup

Create a `.env` file in your backend root directory:

### 📄 `.env.example`

```env
NODE_ENV=development
PORT=5000

# MongoDB
MONGODB_URI=Your mongdb uri

# JWT
JWT_ACCESS_SECRET=JWT access secret token
JWT_REFRESH_SECRET=JWT refresh secret token
JWT_ACCESS_EXPIRES=15m
JWT_REFRESH_EXPIRES=7d

# Client
CLIENT_URL=http://localhost:5173

# File Upload
UPLOAD_DIR=uploads
MAX_FILE_SIZE=10485760
```

### Backend Run Command

```
cd server
npm install
npm run dev
```

### Frontend run Command

```
cd frontend
npm install
npm run dev
```

### Project Folder Structure

```
chatHive/
│
├── server/
│   ├── src/
│   │   ├── config/
│   │   ├── features/
│   │   ├── shared/
│   │   ├── socket/
│   │   └── app.ts/
│   │   └── index.ts.ts/
│   │   |
│   │   └── uploads/
│   │
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   ├── features/
│   │   ├──   ├── auth/
│   │   ├──   ├── chat/
│   │   ├──   ├── conversations/
│   │   ├──   ├── notification/
│   │   ├── shared/
│   │   ├── └── components/
│   │   ├── ├── hooks/
│   │   ├── ├── services/
│   │   ├── ├── store/
│   │   ├── ├── types/
│   │   ├── ├── utils/
│   │   ├── idex.css
│   │   ├── main.tsx
│   │   └── hooks/
│   │
│   └── package.json
│
└── README.md
```

## 🧰 Tech & Tools

### 🔧 Backend

- **Node.js**: JavaScript runtime for building scalable server-side applications.  
  Docs: https://nodejs.org/

- **Express.js**: Fast, minimalist web framework for building APIs and backend services.  
  Docs: https://expressjs.com/

- **MongoDB**: NoSQL database for storing application data in flexible, JSON-like documents.  
  Docs: https://www.mongodb.com/

- **Mongoose**: ODM (Object Data Modeling) library for MongoDB and Node.js.  
  Docs: https://mongoosejs.com/

- **Socket.IO**: Enables real-time, bidirectional, event-based communication between client and server.  
  Docs: https://socket.io/

- **jsonwebtoken (JWT)**: Used for secure authentication via token-based authorization.  
  Docs: https://jwt.io/

- **bcryptjs**: Library for hashing passwords securely.  
  Docs: https://www.npmjs.com/package/bcryptjs

- **Multer**: Middleware for handling multipart/form-data, mainly used for file uploads.  
  Docs: https://www.npmjs.com/package/multer

- **Express Validator**: Middleware for validating and sanitizing incoming requests.  
  Docs: https://express-validator.github.io/

- **Morgan**: HTTP request logger middleware for Node.js.  
  Docs: https://www.npmjs.com/package/morgan

- **CORS**: Middleware to enable Cross-Origin Resource Sharing.  
  Docs: https://www.npmjs.com/package/cors

- **Cookie Parser**: Middleware to parse cookies attached to client requests.  
  Docs: https://www.npmjs.com/package/cookie-parser

- **UUID**: Generates unique identifiers for resources.  
  Docs: https://www.npmjs.com/package/uuid

- **dotenv**: Loads environment variables from a `.env` file.  
  Docs: https://www.npmjs.com/package/dotenv

- **TypeScript**: Strongly typed superset of JavaScript for better scalability and maintainability.  
  Docs: https://www.typescriptlang.org/

- **TSX**: TypeScript execution environment for running TS files directly.  
  Docs: https://www.npmjs.com/package/tsx

---

### 🎨 Frontend

- **React.js**: Component-based library for building user interfaces.  
  Docs: https://react.dev/

- **React Router DOM**: Handles client-side routing in React applications.  
  Docs: https://reactrouter.com/

- **Redux Toolkit**: Simplified and scalable state management for React apps.  
  Docs: https://redux-toolkit.js.org/

- **Tailwind CSS**: Utility-first CSS framework for rapid UI development.  
  Docs: https://tailwindcss.com/

- **Axios**: Promise-based HTTP client for API communication.  
  Docs: https://axios-http.com/

- **Socket.IO Client**: Client-side library for real-time communication with the server.  
  Docs: https://socket.io/docs/v4/client-api/

- **React Hook Form**: Efficient form management with minimal re-renders.  
  Docs: https://react-hook-form.com/

- **Framer Motion**: Animation library for smooth UI transitions and interactions.  
  Docs: https://www.framer.com/motion/

- **Emoji Picker React**: Provides emoji selection UI for chat features.  
  Docs: https://www.npmjs.com/package/emoji-picker-react

- **Headless UI**: Unstyled, accessible UI components for React.  
  Docs: https://headlessui.com/

- **Heroicons**: SVG icon library designed for modern UI.  
  Docs: https://heroicons.com/

- **clsx**: Utility for constructing conditional className strings.  
  Docs: https://www.npmjs.com/package/clsx

- **date-fns**: Modern JavaScript date utility library.  
  Docs: https://date-fns.org/

- **React Intersection Observer**: Tracks visibility of components in viewport.  
   Docs: https://www.npmjs.com/package/react-intersection-observer

  ## 🌐 Live URL

  Visit: https://www.npmjs.com/package/
