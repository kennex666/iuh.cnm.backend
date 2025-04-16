const { Server } = require("socket.io");
const messageModel = require("../models/message-model");
const jwt = require("jsonwebtoken");
const friendRequestModel = require("../models/friendrequest-model");
const { createFriendRequest } = require("../services/friendrequest-service");
const typeRequest = require("../models/type-request");

var io = null;

function initSocket(server, callback) {
    io = new Server(server, {
        path: "/socket.io",
        cors: {
            origin: "*",
            methods: ["GET", "POST"],
            allowedHeaders: ["Content-Type", "Authorization"],
            credentials: true,
        },
    });

    callback(io);
    console.log("Socket.io initialized");
}

function getIO() {
    if (!io) {
        throw new Error("❌ Socket.io chưa được khởi tạo");
    }
    return io;
}

const users = new Map();

const socketRoutes = (io) => {

    io.on("connection", (socket) => {
        console.log(`✅ New client connected: ${socket.id}`);

        console.log("Socket:", socket.handshake.auth.token);
        const decoded = jwt.verify(socket.handshake.auth.token, process.env.ACCESS_TOKEN_SECRET);
        socket.user = decoded;

        users.set(socket.user.id, socket.id);
        console.log("users:", users);

        socket.on('ping', (data) => {
            console.log('Ping received:', data);
            socket.emit('pong', { message: 'Pong from server' });
        });

        socket.join(socket.user.id);

        socket.on('join_conversation', (conversationId) => {
            console.log("join_conversation:", conversationId);
            socket.join(conversationId);
        });

        socket.on('leave_conversation', (conversationId) => {
            console.log("leave_conversation:", conversationId);
            socket.leave(conversationId);
        });

        socket.on("send_message", (data) => {
            console.log("Message received:", data);

            const { conversationId, senderId, content, type, repliedTold } = data;
            if(senderId !== socket.user.id) {
                return;
            }
            // Kiểm tra loại tin nhắn hợp lệ
            if (type !== "text" && type !== "image" && type !== "file") {
                console.error("Invalid message type:", type);
                return;
            }

            console.log("conversationId:", conversationId);
            // Lưu tin nhắn vào MongoDB
            const newMessage = new messageModel({
                conversationId,
                senderId,
                content,
                type,
                repliedTold,
            });

            newMessage.save()
                .then(() => {
                    io.to(conversationId).emit("new_message", newMessage);
                })
                .catch((error) => {
                    console.error("Error saving message:", error);
                });
        });

        socket.on("send_delete_message", (data) => {
            console.log("send_delete_message:", data);
            const { messageId } = data;
        });

        socket.on("send_friend_request", async (data) => {
            console.log("send_friend_request:", data);
            if(data.senderId !== socket.user.id) {
                return;
            }
            const { receiverId } = data;
            if(receiverId === socket.user.id) {
                console.log("Không thể gửi lời mời kết bạn cho chính mình");
                return;
            };
            console.log("users:", users);
            const userSocketId = users.get(receiverId);
            if(userSocketId) {
                io.to(userSocketId).emit("friend_request", data);
            }
        });

        socket.on("disconnect", () => {
            console.log(`❌ Client disconnected: ${socket.id}`);
        });
    });
}

module.exports = {
    initSocket,
    socketRoutes,
    getIO,
};