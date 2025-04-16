const { Server } = require("socket.io");
const mongoose = require('mongoose');
const SocketController = require('../controllers/socket-controller');
const UserModel = require("../models/user-model");
const messageModel = require("../models/message-model");
const jwt = require("jsonwebtoken");
const friendRequestModel = require("../models/friendrequest-model");
const { createFriendRequest } = require("../services/friendrequest-service");
const typeRequest = require("../models/type-request");const { authSocketMiddleware } = require("../middlewares/auth");
const MemoryManager = require("../utils/memory-manager");
const { updateSeen } = require("../services/message-service");
let io = null;

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
    io.use(authSocketMiddleware);

    io.on("connection", (socket) => {
        console.log(`✅ New client connected: ${socket.id}`);

        // Add to list user
        MemoryManager.addSocketToUser(socket.user.id, socket.id);

        socket.on('ping', (data) => {
            console.log('Ping received:', data);
            socket.emit('pong', { message: 'Pong from server' });
        });

        socket.join(socket.user.id);

        // socket.on('join_conversation', (conversationId) => {
        //     console.log("join_conversation:", conversationId);
        //     socket.join(conversationId);
        // });

        // socket.on('leave_conversation', (conversationId) => {
        //     console.log("leave_conversation:", conversationId);
        //     socket.leave(conversationId);
        // });

        
		// Event message:send
		/**
		 * @param {Object} data
		 * @param {string} data.conversationId 
		 * @param {string} data.content 
         * @param {string} data.type
         * @param {string} data.repliedTold
         * 
		 */
		socket.on("message:send", async (data) => {
			console.log("data send from client", data);
			await SocketController.handleSendMessage(io, socket, data);
		});

        socket.on("message:seen", async (messageId) => {
			console.log("message:seen:", messageId);
			await updateSeen(messageId, socket.user.id);
		});

        // not handled yet
        socket.on("message:delete_message", (data) => {
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
            const socketList = MemoryManager.getSocketList(receiverId);
            socketList.forEach(socketId => {
                io.to(socketId).emit("friend_request", data);
            });
        });

        // Event loginQR:generate
		socket.on("loginQR:generate", () => {
			const deviceCode = generateString(16);
			socket.data.deviceCode = deviceCode;
			socket.emit("loginQR:generate", {
				errorCode: 200,
				message: "Đã tạo mã QR đăng nhập thành công",
				data: {
					deviceCode: "iMessify:QRLogin_" + deviceCode,
					socketId: socket.id
				}
			});
		});

        socket.on("disconnect", () => {
            MemoryManager.removeSocket(socket.user.id, socket.id);
            console.log(`❌ Client disconnected: ${socket.id}`);
        });

        socket.on("message:delete_message", (data) => {
			console.log("send_delete_message:", data);
			const { messageId } = data;
		});

		socket.on("friend_request:send", async (data) => {
			console.log("send_friend_request:", data);
			if (data.senderId !== socket.user.id) {
				return;
			}
			const { receiverId } = data;
			if (receiverId === socket.user.id) {
				console.log("Không thể gửi lời mời kết bạn cho chính mình");
				return;
			}
			const socketList = MemoryManager.getSocketList(receiverId);
			socketList.forEach((socketId) => {
				io.to(socketId).emit("friend_request:new", data);
			});
		});

		socket.on("friend_request:send_accept", (data) => {
			console.log("send_accept_friend_request:", data);
			const { senderId } = data;
			if (senderId !== socket.user.id) {
				return;
			}
			const { receiverId } = data;
			const socketList = MemoryManager.getSocketList(receiverId);
			socketList.forEach((socketId) => {
				io.to(socketId).emit("friend_request:new_accept", data);
			});
		});

		socket.on("friend_request:delete", (data) => {
			console.log("send_remove_friend_request:", data);
			const { senderId } = data;
			if (senderId !== socket.user.id) {
				return;
			}
			const { receiverId } = data;
			const socketList = MemoryManager.getSocketList(receiverId);
			console.log("socketList", socketList);
			socketList.forEach((socketId) => {
				io.to(socketId).emit("friend_request:new_delete", data);
			});
		});
    });
}

module.exports = {
    initSocket,
    socketRoutes,
    getIO,
};