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
const FriendList = require("../models/friend-list-model");
const Conversation = require("../models/conversation-model");
const typeRoleUser = require("../models/type-role-user");
const { setIO } = require("../utils/socketio");
const { generateString } = require("../utils/2fa-generator");
let io = null;


const rooms = {}; // { roomId: Set(socket.id, ...) }
const roomInfo = {};
const waitingListMessageId = []; // list id message

function waitingListMessageIdAdd(messageId) {
	waitingListMessageId.push(messageId);
	setTimeout(() => {
		const index = waitingListMessageId.indexOf(messageId);
		if (index > -1) {
			waitingListMessageId.splice(index, 1);
			messageModel.findById(messageId).then(async (message) => {
				if (message) {
					message.content = "end";
					const conversation = await getConversationByCvsId(
						message.conversationId
					);
					sendMessage(getIO(), conversation.participantIds, message.toObject());
					message.save();
			
				}
			});
		}
	}, 30000);
}

function kickConversation(messageId) {
	messageModel.findById(messageId).then(async (message) => {
		if (message) {
			message.content = "end";
			const conversation = await getConversationByCvsId(
				message.conversationId
			);
			sendMessage(
				getIO(),
				conversation.participantIds,
				message.toObject()
			);
			message.save();
		}
	});
}

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
	setIO(io);
	callback(io);
	console.log("Socket.io initialized");
}

function getIO() {
	if (!io) {
		throw new Error("❌ Socket.io chưa được khởi tạo");
	}
	return io;
}

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
			try {
				await SocketController.handleSendMessage(io, socket, data);
			} catch(e){
				console.error("Error sending message:", e);
			}
		});

		socket.on("message:seen", async (messageId) => {
			try {
				console.log("message:seen:", messageId);
				await updateSeen(messageId, socket.user.id);
			} catch (e){
				console.error("Error updating seen status:", e);
			}
		});

		socket.on("block-user:block", async (data) => {
			try {
				console.log("data block user", data);
				await SocketController.handleBlockUser(io, socket, data);
			} catch (error) {
				console.error("Error when blocking a user: ", error.message);
				socket.emit("block-user:error", {
					message: error.message
				});
			}
		});

		socket.on("conversation:update_nickname", async (data) => {
			try {
				console.log("data update_nickname user", data);
				await SocketController.handleUpdateNickNameInConversation(io, socket, data);
			} catch (error) {
				console.error("Error updating nickname:", error.message);
				socket.emit("conversation:error", {
					message: error.message,
				});
			}
		});

		socket.on("block-user:unblock", async (data) => {
			try {
				console.log("data unblock user", data);
				await SocketController.handleUnBlockUser(io, socket, data);
			} catch (error) {
				console.error("Error when unblocking a user: ", error.message);
				socket.emit("block-user:error", {
					message: error.message
				});
			}
		});
		socket.on("group:leave", async (data) => {
			try {
				console.log("data leave group", data);
				await SocketController.handleLeaveGroup(io, socket, data);
			} catch (error) {
				console.error("Error when leaving a group:", error.message);
				socket.emit("group:error", { message: error.message });
			}
		});

		socket.on("disconnect", () => {
			MemoryManager.removeSocket(socket.user.id, socket.id);
			console.log(`❌ Client disconnected: ${socket.id}`);
		});

		socket.on("message:delete_message", async (data) => {
			try {
				SocketController.handleDeleteMessage(io, socket, data);
			} catch (err) {
				console.error("Error deleting message:", err);
				socket.emit("message:delete_failed", {
					message: err.message
				});
			}
		});


		socket.on("friend_request:send", async (data) => {
			try {
				await SocketController.handleSendFriendRequest(io, socket, data);
				return;
			} catch (err) {
				console.error("Error sending friend request:", err.message);
				socket.emit("friend_request:error", {
					message: err.message
				});
			}
		});

		socket.on("friend_request:send_accept", async (data) => {
			try {
				await SocketController.handleAcceptFriendRequest(io, socket, data);
				return;
			} catch (err) {
				console.error("Error accepting friend request:", err.message);
				socket.emit("friend_request:error", {
					message: err.message
				});
			}
		});

		socket.on("friend_request:denying", async (data) => {
			try {
				await SocketController.handleDenyingFriendRequest(io, socket, data);
				return;
			} catch (err) {
				console.error("Error denying friend request:", err);
				socket.emit("friend_request:error", {
					message: err.message
				});
			}
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

		socket.on("conversation:add_participants", async (data) => {
			await SocketController.handleAddParticipants(io, socket, data);
		});

		socket.on("conversation:remove_participants", async (data) => {
			console.log("data remove participants", data);
			await SocketController.handleRemoveParticipants(io, socket, data);
		});

		socket.on("conversation:transfer_admin", async (data) => {
			await SocketController.handleTransferAdmin(io, socket, data);
		});

		socket.on("conversation:grant_mod", async (data) => {
			await SocketController.handleGrantMod(io, socket, data);
		});

		socket.on("conversation:update_allow_messaging", async (data) => {
			await SocketController.handleUpdateAllowMessaging(io, socket, data);
		});

		socket.on("vote:create", async (data) => {
			await SocketController.handleCreateVote(io, socket, data);
		});

		socket.on("vote:submit", async (data) => {
			await SocketController.handleSubmitVote(io, socket, data);
		});

		socket.on("vote:get", async (data) => {
			await SocketController.handleGetVote(io, socket, data);
		});

		socket.on("message:pin", async (data) => {
			await SocketController.handlePinMessage(io, socket, data);
		});

		socket.on("message:remove_pin", async (data) => {
			await SocketController.handleRemovePinMessage(io, socket, data);
		});

		socket.on("conversation:delete", async (data) => {
			await SocketController.handleDeleteConversation(io, socket, data);
		});

		socket.on("chatwithAI:send", async (data) => {
			await SocketController.handleChatWithAI(io, socket, data);
		});
	});
}

const socketLoginQR = (io) => {
	io.of("/skloginQR").on("connection", (socket) => {
		console.log(`✅ New QR login client connected: ${socket.id}`);

		socket.on("loginQR:generate", () => {
			const deviceCode = generateString(16);
			socket.data.deviceCode = deviceCode;
			socket.emit("loginQR:generate", {
				errorCode: 200,
				message: "Đã tạo mã QR đăng nhập thành công",
				data: {
					deviceCode:
						"iMessify:QRLogin_" + deviceCode + ";" + socket.id,
					socketId: socket.id,
				},
			});
		});

		socket.on("disconnect", () => {
			console.log(`❌ QR login client disconnected: ${socket.id}`);
		});
	});
}

const socketWebRTC = (io) => {
	const pendingSockets = new Map(); // socketId -> timeout
	const webRTC = io.of("/webrtc");

	webRTC.on("connection", (socket) => {
		console.log("👤 New connection:", socket.id);

		// Tham gia phòng
		socket.on("join-room", async ({ roomId, userId, conversationId, callId }) => {
			socket.user = { id: userId, conversationId, callId, roomId };

			const conversationInfo = await getConversationById(userId, conversationId);

			if (!conversationInfo) {
				socket.emit("error", {
					message: "Cuộc trò chuyện không tồn tại",
				});
				return;
			}
			// remove messageId from waitingListMessageId
			const messageId = socket.user.callId;
			const index = waitingListMessageId.indexOf(messageId);
			if (index > -1) {
				waitingListMessageId.splice(index, 1);
			}

			const roomInf = roomInfo[roomId];
			const user = conversationInfo.participantInfo.filter(user => user.id == userId)[0];
			console.log("user", user);
			if (!roomInf) {
				roomInfo[roomId] = {
					participants: conversationInfo.participantInfo,
					type: conversationInfo.type,
					currentCall: [
						{
							userId: userId,
							socketId: socket.id,
							name: user.name,
							avatar: user.avatar,
						},
					],
				};
			} else {
				// check if userId is in currentCall
				const isInCurrentCall = roomInf.currentCall.some(user => user.userId == userId);
				if (isInCurrentCall) {
					socket.emit("error", {
						message: "Bạn đã tham gia cuộc gọi này rồi",
					});
					return;
				}
				roomInf.currentCall.push({
					userId: userId,
					socketId: socket.id,
					name: user.name,
					avatar: user.avatar,
				});
			}

			socket.join(roomId);

			if (!rooms[roomId]) rooms[roomId] = new Set();
			rooms[roomId].add(socket.id);

			console.log(`📦 ${socket.id} joined room ${roomId}`);
			console.log(`👥 Room ${roomId} has:`, [...rooms[roomId]]);

			io.to(roomId)
				.emit("user-list", [...roomInfo[roomId].currentCall]);
			socket.emit("room-users", [...roomInfo[roomId].currentCall]);
			socket.to(roomId).emit("user-joined", {
				socketId: socket.id,
				infoUser: conversationInfo.participantInfo.find(user => user.id == userId)[0]
			}
			);
		});

		socket.on("screen:share-start", (data) => {
			const roomId = socket?.user?.roomId;
			if (!roomId) return;

			socket.to(roomId).emit("screen:share-start", data);
		});

		// Gửi tín hiệu WebRTC
		socket.on("signal", ({ to, type, data }) => {
			const roomId = socket?.user?.roomId;
			if (!roomId) return;

			webRTC.to(to).emit("signal", {
				from: socket.id,
				type,
				data,
			});
		});

		// Ngắt kết nối tạm thời
		socket.on("disconnecting", () => {
			const roomId = socket?.user?.roomId;
			if (!roomId || !rooms[roomId]) return;

			const timeout = setTimeout(() => {
				try {
					rooms[roomId].delete(socket.id);

				} catch (error) {
					console.error("Error deleting socket from room:", error);
				}

				webRTC.to(roomId).emit("user-left", {
					socketId: socket.id,
					reason: "timeout",
					conversationType: roomInfo[roomId].type || "1vs1",
				});
				if (rooms[roomId].size === 0) {
					rooms[roomId] = undefined;
					kickConversation(socket.user.callId);
				} else {
					if (roomInfo[roomId].type === "1vs1") {
						kickConversation(socket.user.callId);
					}
				}
				pendingSockets.delete(socket.id);
			}, 10000); // giữ 10 giây để chờ reconnect

			pendingSockets.set(socket.id, timeout);
		});

		// Thoát chủ động
		socket.on("leave-room", () => {
			const roomId = socket?.user?.roomId;
			if (!roomId || !rooms[roomId]) return;
			try {
				rooms[roomId].delete(socket.id);
			} catch (error) {
				console.error("Error deleting socket from room:", error);
			}
			
			webRTC.to(roomId).emit("user-left", {
				socketId: socket.id,
				reason: "leave",
				conversationType: roomInfo[roomId].type || "1vs1",
			});

			if (rooms[roomId].size === 0) {
				rooms[roomId] = undefined;
				kickConversation(socket.user.callId);
			} else {
				if (roomInfo[roomId].type === "1vs1") {
					kickConversation(socket.user.callId);
				}
			}
		});

		// Reconnect kịp thời
		socket.on("reconnect", () => {
			const timeout = pendingSockets.get(socket.id);
			if (timeout) {
				clearTimeout(timeout);
				pendingSockets.delete(socket.id);
				console.log(`✅ ${socket.id} đã reconnect đúng lúc`);
			}
		});

		// Ngắt hoàn toàn
		socket.on("disconnect", () => {
			console.log("❌ Disconnected:", socket.id);
		});
	});
};

const exitRoom = async (conversationId, userId) => {
	const conversation = await getConversationByCvsId(conversationId);
	if (!conversation) {
		return {
			errorMessage: "Cuộc trò chuyện không tồn tại",
			errorCode: 100,
		}
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
		return {
			errorMessage: "Cuộc gọi không tồn tại",
			errorCode: 100,
		}
	}

	if (recentlyMessage.content != "start") {
		return {
			errorMessage: "Cuộc gọi chưa được bắt đầu",
			errorCode: 100,
		}
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
	waitingListMessageIdAdd,
	socketLoginQR,
};
