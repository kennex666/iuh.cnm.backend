const messageModel = require('../models/message-model');
const Conversation = require('../models/conversation-model');
const User = require('../models/user-model');
const SocketService = require('../services/socket-service');
const MemoryManager = require('../utils/memory-manager');
const { createMessage } = require('../services/message-service');
const { createAttachment } = require("../services/attachment-service");
const typeMessage = require('../models/type-message');
const FriendList = require("../models/friend-list-model");
const BlockList = require("../models/block-list-model");

class SocketController {
	static async handleBlockUser(io, socket, data) {
		try {
			const user = socket.user;
			const { blockId } = data;
			// Check data block user send from client
			if (!data || !blockId) {
				throw new Error(
					"Data blockId invalid"
				);
			}
			const isNumeric = /^\d+$/.test(blockId);
			if (blockId.length < 0 || !isNumeric) {
				throw new Error("blockId invalid");
			}
			if (blockId === user.id) {
				throw new Error("Can't block myself");
			}
			let id1, id2;
			if (BigInt(user.id) > BigInt(blockId)) {
				id1 = user.id;
				id2 = blockId
			} else {
				id1 = blockId;
				id2 = user.id
			}
			const blockListExistTask = BlockList.findOne({ $or: [{ userId: user.id, blockedId: blockId }, { userId: blockId, blockedId: user.id }] });
			const friendListExistTask = FriendList.findOne({ id1, id2 });
			const [blockListExist, friendListExist] = await Promise.all([blockListExistTask, friendListExistTask]);
			if (blockListExist) {
				throw new Error("blocked userpreviously performed block action");
			}
			if (friendListExist) {
				const newBlockList = await BlockList.create({ userId: user.id, blockedId: blockId });
				MemoryManager.getSocketList(blockId).forEach((socketId) => {
					io.to(socketId).emit("block-user:blocked", newBlockList.toObject());
				});
			} else {
				throw new Error("blockedId is not friend of user");
			}
		} catch (error) {
			console.error("Error when blocking a user: ", error.message);
			throw new Error(error);
		}
	}
	static async handleUnBlockUser(io, socket, data) {
		try {
			const user = socket.user;
			const { blockId } = data;
			// Check data block user send from client
			if (!data || !blockId) {
				throw new Error(
					"Data blockId invalid"
				);
			}
			const isNumeric = /^\d+$/.test(blockId);
			if (blockId.length < 0 || !isNumeric) {
				throw new Error("blockId invalid");
			}
			// Check if unblock myself
			if (blockId === user.id) {
				throw new Error("Can't unblock myself");
			}

			const blockListExist = await BlockList.findOne({ userId: user.id, blockedId: blockId });
			console.log(blockListExist);
			console.log({ userId: user.id, blockedId: blockId });
			if (blockListExist) {
				await BlockList.findOneAndDelete({ _id: blockListExist._id });
				MemoryManager.getSocketList(blockId).forEach((socketId) => {
					io.to(socketId).emit("block-user:unblocked", { unblockStatus: true });
				});
			} else {
				throw new Error("you do not have permission to unblock");
			}
		} catch (error) {
			console.error("Error when unblocking a user: ", error.message);
			throw new Error(error);
		}
	};
	static async handleSendMessage(io, socket, data) {
		try {
			// Check data message send from client
			if (!data || !data.conversationId || !data.content) {
				throw new Error(
					"Data message invalid: conversationId and content are required"
				);
			}

			const { conversationId, content, type, repliedTold, repliedToId } = data;

			const userId = socket.user.id;

			// Get conversation
			const conversation = await Conversation.findOne({
				id: conversationId,
			});
			if (!conversation) {
				throw new Error(
					`Conversation not found with ID: ${conversationId}`
				);
			}

			// Check if user has permission to send message
			if (!conversation.participants.includes(userId)) {
				throw new Error(
					"You do not have permission to send messages in this conversation"
				);
			}

			const message = await createMessage({
				conversationId: conversationId,
				senderId: userId,
				content,
				type,
				repliedTold: repliedTold || repliedToId,
			});
			console.log(`Message created:`, message);

			// get all participants of conversation
			const participants = conversation.participants.map((participant) =>
				participant.toString()
			);
			participants.forEach((participant) => {
				MemoryManager.getSocketList(participant).forEach((socketId) => {
					io.to(socketId).emit("message:new", message);
				});
			});
		} catch (error) {
			console.error(`Error sending message: ${error.message}`);
			throw error;
		}
	}

	static async broadcastStatus(socket, isOnline) {
		const user = socket.user;
		const status = {
			userId: user.id,
			isOnline: isOnline,
		};
		socket.broadcast.emit("user:status", status);
	}

	static async handleConnection(socket) {
		const user = socket.user;
		console.log(`User connected: ${user.name} (${user.id})`);
		// Update isOnline when user connects
		if (!user.isOnline) {
			await User.findOneAndUpdate({ id: user.id }, { isOnline: true });
			await SocketService.broadcastStatus(socket, true);
		}
		// Join user to all participated conversations
		await SocketService.joinConversationRooms(socket);
	}

	static async handleDisconnect(socket) {
		const user = socket.user;
		console.log(`User disconnected: ${user.name} (${user.id})`);
		// Update isOnline when user disconnects
		if (user.isOnline) {
			await User.findOneAndUpdate(
				{ id: socket.user.id },
				{ isOnline: false }
			);
			await SocketService.broadcastStatus(socket, false);
		}
	}

	static async handleSendAttachment(io, socket, data) {
		try {
			// Check data required for attachment
			if (!data || !data.conversationId || !data.fileData) {
				throw new Error(
					"Data invalid: conversationId and fileData are required"
				);
			}

			const { conversationId, fileData, repliedTold } = data;
			const userId = socket.user.id;

			// Get conversation
			const conversation = await Conversation.findOne({
				id: conversationId,
			});
			if (!conversation) {
				throw new Error(
					`Conversation not found with ID: ${conversationId}`
				);
			}

			// Check if user has permission to send message
			if (!conversation.participants.includes(userId)) {
				throw new Error(
					"You do not have permission to send messages in this conversation"
				);
			}

			// Tạo tin nhắn mới với type FILE
			const message = await messageModel.create({
				conversationId: conversationId,
				senderId: userId,
				content: fileData.fileName,
				type: typeMessage.FILE,
				repliedTold,
				readBy: [userId], // Mark as read by sender
			});

			console.log(`File message created:`, message);

			// Tạo attachment liên kết với tin nhắn
			const file = {
				buffer: fileData.buffer,
				fileName: fileData.fileName,
				contentType: fileData.contentType,
			};

			const attachment = await createAttachment({
				messageId: message.id,
				file,
			});

			// Gửi thông báo đến tất cả người tham gia cuộc trò chuyện
			const participants = conversation.participants.map((participant) =>
				participant.toString()
			);
			participants.forEach((participant) => {
				MemoryManager.getSocketList(participant).forEach((socketId) => {
					// Thêm thông tin attachment vào để client có thể hiển thị trước
					const messageWithAttachment = {
						...message.toObject(),
						attachment: {
							id: attachment.id,
							fileName: fileData.fileName,
							contentType: fileData.contentType,
						},
					};
					io.to(socketId).emit("message:new", messageWithAttachment);
				});
			});

			// Xác nhận cho người gửi
			socket.emit("attachment:sent", {
				success: true,
				messageId: message.id,
			});
		} catch (error) {
			console.error(`Error sending attachment: ${error.message}`);
			socket.emit("attachment:error", {
				message: `Không thể gửi tệp đính kèm: ${error.message}`,
			});
		}
	}
}

module.exports = SocketController;