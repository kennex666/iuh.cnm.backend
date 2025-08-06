# 🛠️ iMessify – Backend Service

This is the backend service for **iMessify**, a real-time messaging application.
It handles authentication, messaging logic, WebSocket communication, and data persistence.

> Frontend repo: [iMessify React Native](https://github.com/kennex666/iuh.cnm.frontend)

---

## 🚀 Features

* 🔐 User registration & login with JWT
* 💬 Real-time messaging via **Socket.IO**
* 🧑‍🤝‍🧑 User presence & status updates
* 📜 Chat history & message persistence
* 📦 RESTful API for user & conversation management
* 🌐 CORS-ready for frontend connection
* 🧪 Ready for E2EE extension and message previews

---

## 🧱 Tech Stack

* Node.js + Express
* Socket.IO – WebSocket-based real-time engine
* MongoDB – NoSQL database for messages and users
* Mongoose – ODM for schema & validation
* JWT – Authentication and session management
* dotenv – Environment configuration

---

## 🛠️ Getting Started

### ⚙️ Prerequisites

* Node.js >= 16
* MongoDB (local or remote)
* \[Optional] PM2 / Docker for deployment

### 📥 Installation

Clone and install dependencies:

git clone [https://github.com/kennex666/iuh.cnm.backend.git](https://github.com/kennex666/iuh.cnm.backend.git)
cd iuh.cnm.backend
npm install

### ⚙️ Environment Setup

Create a `.env` file based on `.env.example`:

PORT=3000
MONGO\_URI=mongodb://localhost:27017/imessify
JWT\_SECRET=your\_jwt\_secret
CLIENT\_ORIGIN=[http://localhost:19006](http://localhost:19006)

### 🚀 Run Development Server

npm run dev

> Uses `nodemon` for hot-reload.

---

## 🔌 API Endpoints

### Auth

* POST /api/auth/register – Create new user
* POST /api/auth/login – Authenticate and receive JWT

### Users

* GET /api/users/me – Get current user info
* GET /api/users/\:id – Get user by ID

### Conversations

* GET /api/conversations – List user conversations
* POST /api/conversations – Create new chat

### Messages

* GET /api/messages/\:conversationId – Get message history
* POST /api/messages – Send message

> Full API docs coming soon.

---

## ⚡ WebSocket Events

* connect, disconnect
* user\:online, user\:offline
* message\:send, message\:receive
* typing\:start, typing\:stop

> JSON payloads are structured and ready for future E2EE support.

---

## 📡 Deployment

This backend can be deployed on any Node.js-friendly platform (Render, Railway, DigitalOcean, etc.)
Recommended with **PM2** for process management and **Nginx** as reverse proxy.

---

## 📃 License

MIT

---

## 📌 Contributors
Latest update at 06:28 P.M. 06/08/2025

| No. | Fullname  | Commits | ++ (Additions) | -- (Deletions) | Total Changes |
| :-: | :------------------- | :-----: | :------------: | :------------: | :-----------: |
|  01 | Dương Thái Bảo        |    76   |     16,607     |      4,276     |     20,883    |
|  02 | Lê Nguyễn Duy Khang |    80   |     13,143     |      3,324     |     16,467    |
|  03 | Trịnh Nam Trung   |    21   |      8,793     |      1,655     |     10,448    |
|  04 | Nguyễn Thành Luân          |    2    |       294      |       11       |      305      |
|  05 | Nguyễn Thiên Phú         |    3    |       241      |        6       |      247      |

