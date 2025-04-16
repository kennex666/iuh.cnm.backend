const { Server } = require("socket.io");
const mongoose = require("mongoose");
const SocketController = require("../controllers/socket-controller");
const UserModel = require("../models/user-model");
const messageModel = require("../models/message-model");
const jwt = require("jsonwebtoken");
const friendRequestModel = require("../models/friendrequest-model");
const { createFriendRequest } = require("../services/friendrequest-service");
const typeRequest = require("../models/type-request");
const { authSocketMiddleware } = require("../middlewares/auth");
const MemoryManager = require("../utils/memory-manager");
const { updateSeen } = require("../services/message-service");
const { getConversationById, getConversationByCvsId } = require("../services/conversation-service");
const { sendMessage } = require("../services/socket-emit-service");
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
		maxHttpBufferSize: 10 * 1024 * 1024,
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

		socket.on("ping", (data) => {
			console.log("Ping received:", data);
			socket.emit("pong", { message: "Pong from server" });
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
					socketId: socket.id,
				},
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

		socket.on("attachment:send", async (data) => {
			console.log("attachment data from client", data);
			try {
				// Xác thực dữ liệu
				if (!data.conversationId || !data.fileData) {
					socket.emit("attachment:error", {
						message:
							"Thiếu thông tin tệp đính kèm hoặc cuộc trò chuyện",
					});
					return;
				}

				// data.fileData nên chứa: buffer, fileName, contentType
				const { conversationId, fileData, repliedTold } = data;

				// Gọi controller để xử lý tệp đính kèm
				await SocketController.handleSendAttachment(io, socket, {
					conversationId,
					fileData,
					repliedTold,
					senderId: socket.user.id,
				});
			} catch (error) {
				console.error("Lỗi khi xử lý attachment:send:", error);
				socket.emit("attachment:error", {
					message:
						"Không thể gửi tệp đính kèm. Vui lòng thử lại sau.",
				});
			}
		});
	});
};

const socketWebRTC = (io) => {
	const rooms = {}; // { roomId: Set(socket.id, ...) }
	const webRTC = io.of("/webrtc");

	webRTC.on("connection", (socket) => {
		console.log("👤 New connection:", socket.id);

		// Join room
		socket.on("join-room", (roomId) => {
			socket.roomId = roomId; // Lưu roomId vào socket để sử dụng sau này
			socket.join(roomId);
			if (!rooms[roomId]) {
				rooms[roomId] = new Set();
			}
			rooms[roomId].add(socket.id);

			console.log(`📦 ${socket.id} joined room ${roomId}`);
			console.log(`👥 Room ${roomId} has:`, [...rooms[roomId]]);

			// Gửi danh sách user hiện tại cho client vừa vào
			io.to(roomId).emit("room-users", [...rooms[roomId]]);

			// Gửi thông báo cho các peer trong phòng (trừ chính mình)
			// socket.to(roomId).emit("user-joined", socket.id);
		});

		// Gửi signal từ A → B (1-1)
		socket.on("signal", ({ targetId, data }) => {
			io.to(targetId).emit("signal", {
				from: socket.id,
				data,
			});
		});

		// Rời phòng
		socket.on("disconnecting", () => {
			// conversationId + "_room_" + messageId
			const roomId = socket.roomId;
			const conversationID  = roomId.split("_")[0];
			const messageId = roomId.split("_")[2];
			for (const roomId of socket.rooms) {
				if (rooms[roomId]) {
					rooms[roomId].delete(socket.id);
					socket.to(roomId).emit("user-left", socket.id);

					if (rooms[roomId].size === 0) {
						delete rooms[roomId]; // xoá room nếu rỗng
					}

					exitRoom(conversationID, 1);
				}
			}
		});

		socket.on("disconnect", () => {
			console.log("❌ Disconnected:", socket.id);
		});
	});
};

const exitRoom = async (conversationId, userId) => {
	const conversation = await getConversationByCvsId(conversationId);
	if (!conversation) {
		return res
			.status(200)
			.json({
				errorMessage: "conversationId không hợp lệ",
				errorCode: 100,
			});
	}
	// Check if the user is a participant in the conversation
	// if dataMessage type is "call" and content is "start" then create a new message

	const queryCall = {
		conversationId: conversationId,
		type: "call",
	};

	const recentlyMessage = await messageModel
		.findOne(queryCall)
		.sort({ sentAt: -1 })
		.limit(1);

	if (!recentlyMessage) {
		return res
			.status(200)
			.json({
				errorMessage: "Cuộc gọi chưa được bắt đầu",
				errorCode: 100,
			});
	}

	if (recentlyMessage.content != "start") {
		return res
			.status(200)
			.json({
				errorMessage: "Cuộc gọi chưa được bắt đầu",
				errorCode: 100,
			});
	}

	const dataMessage = {
		conversationId: conversationId,
		senderId: conversation.participants[0],
		type: "call",
		content: "end",
		readBy: userId,
	};

	const message = await messageModel.create(dataMessage);
	conversation.lastMessage = message._id;
	await conversation.save();
	sendMessage(getIO(), conversation.participants, message);
	return {
		errorCode: 200,
		errorMessage: "Cuộc gọi đã kết thúc",
		data: message,
	}
};
module.exports = {
	initSocket,
	socketRoutes,
	getIO,
	socketWebRTC,
};
