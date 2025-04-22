const messageModel = require('../models/message-model');
const Conversation = require('../models/conversation-model');
const User = require('../models/user-model');
const SocketService = require('../services/socket-service');
const MemoryManager = require('../utils/memory-manager');
const { createMessage, createVote } = require('../services/message-service');
const { createAttachment } = require("../services/attachment-service");
const typeMessage = require('../models/type-message');

const {getAllConversationsController, getConversationByIdController, 
	createConversationController, updateConversationController, 
	deleteConversationController,addParticipantsController, removeParticipantsController, 
	transferAdminController, grantModController,
	updateAllowMessagingCotroller,pinMessageController} = require("../controllers/conversation-controller");


class SocketController {
	static async handleSendMessage(io, socket, data) {
		try {
			// Check data message send from client
			if (!data || !data.conversationId || !data.content) {
				throw new Error(
					"Data message invalid: conversationId and content are required"
				);
			}

			const { conversationId, content, type, repliedTold, repliedToId} = data;

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
	static async handleAddParticipants(io, socket, data) {
		try {
			const { conversationId, participantIds } = data;
	
			if (!conversationId || !participantIds || !Array.isArray(participantIds)) {
				return socket.emit("conversation:error", {
					message: "Invalid data for adding participants",
				});
			}
	
			const updatedConversation = await addParticipantsController({
				params: { id: conversationId },
				body: { participantIds },
				user: { id: socket.user.id },
			});
	
			// Notify all participants in the conversation
			const participants = updatedConversation.participantInfo.map((p) => p.id);
			participants.forEach((participantId) => {
				MemoryManager.getSocketList(participantId).forEach((socketId) => {
					io.to(socketId).emit("conversation:participants_added", {
						conversationId,
						participants: participantIds,
					});
				});
			});
		} catch (error) {
			console.error("Error adding participants:", error);
			socket.emit("conversation:error", {
				message: "Failed to add participants",
			});
		}
	}

	static async handleRemoveParticipants(io, socket, data) {
		try {
			const { conversationId, participantIds } = data;
	
			if (!conversationId || !participantIds || !Array.isArray(participantIds)) {
				return socket.emit("conversation:error", {
					message: "Invalid data for removing participants",
				});
			}
	
			const updatedConversation = await removeParticipantsController({
				params: { id: conversationId },
				body: { participantIds },
				user: { id: socket.user.id },
			});
	
			// Notify all remaining participants in the conversation
			const participants = updatedConversation.participantInfo.map((p) => p.id);
			participants.forEach((participantId) => {
				MemoryManager.getSocketList(participantId).forEach((socketId) => {
					io.to(socketId).emit("conversation:participants_removed", {
						conversationId,
						removedParticipants: participantIds,
					});
				});
			});
		} catch (error) {
			console.error("Error removing participants:", error);
			socket.emit("conversation:error", {
				message: "Failed to remove participants",
			});
		}
	}

	static async handleTransferAdmin(io, socket, data) {
		try {
			const { conversationId, toUserId } = data;
	
			if (!conversationId || !toUserId) {
				return socket.emit("conversation:error", {
					message: "Invalid data for transferring admin role",
				});
			}
	
			const updatedConversation = await transferAdminController({
				params: { id: conversationId },
				body: { toUserId },
				user: { id: socket.user.id },
			});
	
			// Notify all participants in the conversation
			const participants = updatedConversation.participantInfo.map((p) => p.id);
			participants.forEach((participantId) => {
				MemoryManager.getSocketList(participantId).forEach((socketId) => {
					io.to(socketId).emit("conversation:admin_transferred", {
						conversationId,
						newAdminId: toUserId,
					});
				});
			});
		} catch (error) {
			console.error("Error transferring admin role:", error);
			socket.emit("conversation:error", {
				message: "Failed to transfer admin role",
			});
		}
	}

	static async handleGrantMod(io, socket, data) {
		try {
			const { conversationId, toUserId } = data;
	
			if (!conversationId || !toUserId) {
				return socket.emit("conversation:error", {
					message: "Invalid data for granting mod role",
				});
			}
	
			const updatedConversation = await grantModController({
				params: { id: conversationId },
				body: { toUserId },
				user: { id: socket.user.id },
			});
	
			// Notify all participants in the conversation
			const participants = updatedConversation.participantInfo.map((p) => p.id);
			participants.forEach((participantId) => {
				MemoryManager.getSocketList(participantId).forEach((socketId) => {
					io.to(socketId).emit("conversation:mod_granted", {
						conversationId,
						newModId: toUserId,
					});
				});
			});
		} catch (error) {
			console.error("Error granting mod role:", error);
			socket.emit("conversation:error", {
				message: "Failed to grant mod role",
			});
		}
	}

	static async handleUpdateAllowMessaging(io, socket, data) {
		try {
			const { conversationId } = data;
	
			if (!conversationId) {
				return socket.emit("conversation:error", {
					message: "Invalid data for updating allow messaging",
				});
			}
	
			const updatedConversation = await updateAllowMessagingCotroller({
				params: { id: conversationId },
				user: { id: socket.user.id },
			});
	
			// Notify all participants in the conversation
			const participants = updatedConversation.participantInfo.map((p) => p.id);
			participants.forEach((participantId) => {
				MemoryManager.getSocketList(participantId).forEach((socketId) => {
					io.to(socketId).emit("conversation:allow_messaging_updated", {
						conversationId,
						isAllowMessaging: updatedConversation.settings.isAllowMessaging,
					});
				});
			});
		} catch (error) {
			console.error("Error updating allow messaging:", error);
			socket.emit("conversation:error", {
				message: "Failed to update allow messaging",
			});
		}
	}

	static async handleCreateVote(io, socket, data){
		try {
			const { conversationId, question, options, multiple } = data;
	
			if (!conversationId || !question || !Array.isArray(options) || options.length < 2) {
				return socket.emit("vote:error", {
					message: "Invalid data for creating vote",
				});
			}
	
			const voteMessage = await createVote({
				senderId: socket.user.id,
				conversationId,
				question,
				options,
				multiple,
			});
	
			// Gửi thông báo đến tất cả các thành viên trong cuộc trò chuyện
			const conversation = await Conversation.findOne({ id: conversationId });
			if (!conversation) {
				return socket.emit("vote:error", {
					message: "Conversation not found",
				});
			}
	
			conversation.participantInfo.forEach((participant) => {
				const sockets = MemoryManager.getSocketList(participant.id);
				sockets.forEach((socketId) => {
					io.to(socketId).emit("vote:created", {
						conversationId,
						vote: voteMessage,
					});
				});
			});
		} catch (error) {
			console.error("Error creating vote:", error);
			socket.emit("vote:error", {
				message: "Failed to create vote",
			});
		}
	}

	static async handleSubmitVote(io, socket, data){
		try {
			const { conversationId, voteId, optionId } = data;
	
			if (!conversationId || !voteId || !optionId) {
				return socket.emit("vote:error", {
					message: "Invalid data for submitting vote",
				});
			}
	
			const message = await messageModel.findOne({ _id: voteId, conversationId });
			if (!message) {
				return socket.emit("vote:error", {
					message: "Vote not found",
				});
			}
	
			const votePayload = JSON.parse(message.content);
			const option = votePayload.options.find((opt) => opt.id === optionId);
	
			if (!option) {
				return socket.emit("vote:error", {
					message: "Option not found",
				});
			}
	
			// Kiểm tra nếu người dùng đã vote
			if (option.votes.includes(socket.user.id)) {
				return socket.emit("vote:error", {
					message: "You have already voted for this option",
				});
			}
	
			// Cập nhật danh sách người đã vote
			option.votes.push(socket.user.id);
	
			// Lưu lại kết quả vote
			message.content = JSON.stringify(votePayload);
			await message.save();
	
			// Gửi thông báo đến tất cả các thành viên trong cuộc trò chuyện
			const conversation = await Conversation.findOne({ id: conversationId });
			if (!conversation) {
				return socket.emit("vote:error", {
					message: "Conversation not found",
				});
			}
	
			conversation.participantInfo.forEach((participant) => {
				const sockets = MemoryManager.getSocketList(participant.id);
				sockets.forEach((socketId) => {
					io.to(socketId).emit("vote:updated", {
						conversationId,
						vote: message,
					});
				});
			});
		} catch (error) {
			console.error("Error submitting vote:", error);
			socket.emit("vote:error", {
				message: "Failed to submit vote",
			});
		}
		
	}

	static async handleGetVote(io, socket, data){
		try {
			const { conversationId, voteId } = data;
	
			if (!conversationId || !voteId) {
				return socket.emit("vote:error", {
					message: "Invalid data for getting vote",
				});
			}
	
			const message = await messageModel.findOne({ _id: voteId, conversationId });
			if (!message) {
				return socket.emit("vote:error", {
					message: "Vote not found",
				});
			}
	
			socket.emit("vote:result", {
				conversationId,
				vote: message,
			});
		} catch (error) {
			console.error("Error getting vote:", error);
			socket.emit("vote:error", {
				message: "Failed to get vote",
			});
		}
	}
}

module.exports = SocketController;