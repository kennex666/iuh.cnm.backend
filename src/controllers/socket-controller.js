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
const typeRoleUser = require('../models/type-role-user');
const friendRequestModel = require('../models/friendrequest-model');
const { createFriendRequest } = require('../services/friendrequest-service');
const typeRequest = require('../models/type-request');
const UserModel = require('../models/user-model');

class SocketController {
	static async handleLeaveGroup(io, socket, data) {
		const userId = socket.user.id;

		const { groupId } = data;
		// Tìm kiếm nhóm
		const conversation = await Conversation.findById(groupId);
		if (!conversation) {
			return socket.emit("group:error", { message: "Nhóm không tồn tại", status: false });
		}

		// Nếu là nhóm 1vs1 thì không cho phép rời
		if (conversation.type === "1vs1") {
			return socket.emit("group:error", { message: "Không thể rời nhóm 1-1", status: false });
		}

		// Kiểm tra xem user có phải là thành viên của nhóm không
		if (!conversation.participantIds.includes(userId)) {
			return socket.emit("group:error", { message: "Bạn không phải là thành viên của nhóm này", status: false });
		}

		// Kiểm tra xem user có phải là admin không
		const isAdmin = conversation.participantInfo.find(
			(participant) => participant.id === userId && participant.role === typeRoleUser.ADMIN
		);

		if (isAdmin) {
			// Nếu là admin, yêu cầu bầu admin mới trước khi rời
			return socket.emit("group:admin_required", {
				message: "Bạn là admin. Vui lòng bầu người khác làm admin trước khi rời nhóm.", status: false
			});
		}
		// Xóa user khỏi participantIds và participantInfo
		const updatedConversation = await Conversation.findByIdAndUpdate(
			groupId,
			{
				$pull: {
					participantIds: userId,
					participantInfo: { id: userId },
				},
			},
			{ new: true }
		);

		// Gửi thông báo cho các thành viên còn lại
		updatedConversation.participantIds.forEach((participantId) => {
			MemoryManager.getSocketList(participantId).forEach((socketId) => {
				io.to(socketId).emit("group:member-out", {
					userId,
					groupId,
					message: `${socket.user.name} đã rời nhóm`,
					status: true
				});
			});
		});

		// Gửi xác nhận về cho client
		socket.emit("group:leave_success", {
			message: "Đã rời nhóm thành công",
			groupId,
			status: true
		});

		// Nếu nhóm không còn thành viên, xóa nhóm
		if (updatedConversation.participantIds.length === 0) {
			await Conversation.findByIdAndDelete(groupId);
			console.log(`Nhóm ${groupId} đã bị xóa vì không còn thành viên`);
		}
	}
	static async handleDenyingFriendRequest(io, socket, data) {
		const { senderId, receiverId } = data;
		const user = socket.user;
		if (receiverId !== user.id) {
			throw new Error("Không thể hủy lời mời kết bạn của người khác");
		}
		const friendRequest = await friendRequestModel.findOneAndUpdate(
			{ senderId: senderId, receiverId: receiverId },
			{ status: typeRequest.DECLINE }
		);
		const socketList = MemoryManager.getSocketList(senderId);
		console.log("socketList", socketList);
		socketList.forEach((socketId) => {
			io.to(socketId).emit("friend_request:new_deny", { senderId, receiverId, status: "declined" });
		});
	}
	static async handleAcceptFriendRequest(io, socket, data) {
		console.log("send_accept_friend_request:", data);
		const { senderId, receiverId } = data;
		const user = socket.user;
		if (receiverId !== user.id) {
			throw new Error("Không thể chấp nhận lời mời kết bạn của người khác");
		}
		const friendRequest = await friendRequestModel.findOne({ senderId, receiverId });
		if (!friendRequest) {
			throw new Error("Lời mời kết bạn không tồn tại");
		}
		if (friendRequest.status !== typeRequest.PENDING) {
			throw new Error("Lời mời kết bạn đã được xử lý trước đó");
		}
		await friendRequestModel.deleteOne(
			{ id: friendRequest.id }
		);
		let id1, id2;
		if (BigInt(senderId) > BigInt(receiverId)) {
			id1 = senderId;
			id2 = receiverId
		} else {
			id1 = receiverId;
			id2 = senderId
		}
		await FriendList.create({ id1, id2 });
		const [user1, user2] = await Promise.all([
			UserModel.findOne({ id: id1 }),
			UserModel.findOne({ id: id2 }),
		]);
		console.log("user1", user1);
		console.log("user2", user2);
		const conversation = await Conversation.create({
			type: '1vs1',
			participantIds: [user.id, receiverId],
			participantInfo: [
				{ id: id1, name: user1.name, avt: user1.avatarUrl, nickname: user1.name },
				{ id: id2, name: user2.name, avt: user2.avatarUrl, nickname: user2.name }
			]
		});
		const socketList = MemoryManager.getSocketList(senderId);
		socketList.forEach((socketId) => {
			io.to(socketId).emit("friend_request:new_accept", { conversationId: conversation.id, user1, user2, status: "accepted" });
		});
	}
	static async handleSendFriendRequest(io, socket, data) {
		console.log("send_friend_request:", data);
		const { receiverId } = data;
		const user = socket.user;

		if (receiverId === user.id) {
			throw new Error("Không thể gửi lời mời kết bạn cho chính mình");
		}
		const friendRequest = await friendRequestModel.findOne(
			{
				$or: [
					{ senderId: user.id, receiverId: receiverId },
					{ senderId: receiverId, receiverId: user.id }
				]
			}
		);
		// user chưa gửi lời mời kết bạn cho người khác
		if (!friendRequest) {
			const newFriendRequest = await createFriendRequest(
				{
					senderId: user.id,
					receiverId: receiverId,
					status: typeRequest.PENDING,
				}
			);
			const socketList = MemoryManager.getSocketList(receiverId);
			socketList.forEach((socketId) => {
				io.to(socketId).emit("friend_request:new", newFriendRequest.toObject());
			});
			return;
		}
		// user đã gửi lời mời kết bạn cho người khác
		if (friendRequest.senderId === user.id) {
			if (friendRequest.status === typeRequest.PENDING) {
				throw new Error("Đã gửi lời mời kết bạn cho người này, đang đợi phản hồi");
			}
			if (friendRequest.status === typeRequest.DECLINE) {
				throw new Error("Không thể gửi lời mời kết bạn cho người này");
			}
		}
		// user đã nhận lời mời kết bạn từ người khác
		if (friendRequest.senderId === receiverId) {
			await friendRequestModel.deleteOne(
				{ id: friendRequest.id }
			);
			let id1, id2;
			if (BigInt(user.id) > BigInt(receiverId)) {
				id1 = user.id;
				id2 = receiverId
			} else {
				id1 = receiverId;
				id2 = user.id
			}
			await FriendList.create({ id1, id2 });
			const [user1, user2] = await Promise.all([
				UserModel.findOne({ id: id1 }, 'id name avatarUrl'),
				UserModel.findOne({ id: id2 }, 'id name avatarUrl'),
			]);
			const conversation = await Conversation.create({
				type: '1vs1',
				participantIds: [user.id, receiverId],
				participantInfo: [
					{ id: id1, name: user1.name, avatarUrl: user1.avatarUrl },
					{ id: id2, name: user2.name, avatarUrl: user2.avatarUrl }
				]
			});
			const socketList = MemoryManager.getSocketList(receiverId);
			socketList.forEach((socketId) => {
				io.to(socketId).emit("friend_request:new_accept", { conversationId: conversation.id, user1, user2, status: "accepted" });
			});
		}
	}
	static async handleDeleteMessage(io, socket, data) {
		const { messageId, forEveryone, conversationId } = data;
		const user = socket.user;

		if (!messageId || typeof forEveryone !== 'boolean' || !conversationId || typeof conversationId !== 'string') {
			throw new Error("Invalid request data");
		}

		const conversationTask = Conversation.findOne({ id: conversationId });
		const messageTask = messageModel.findOne({ id: messageId, conversationId });
		const [message, conversation] = await Promise.all([messageTask, conversationTask]);
		if (!message) {
			throw new Error("Message not found");
		}
		if (!conversation) {
			throw new Error("Conversation not found");
		}

		const isOwner = message.senderId === user.id;
		let isAdminOrMod = false;
		if (conversation.type === "group") {
			isAdminOrMod = conversation.participantInfo.some(p => p.id === user.id && (p.role === typeRoleUser.ADMIN || p.role === typeRoleUser.MOD));
		}
		if (forEveryone) {
			if (!(isOwner || isAdminOrMod)) {
				throw new Error("Only sender can delete for everyone");
			}

			// Thu hồi với tất cả
			message.isRemove = true;
			await message.save();

			// Gửi socket tới các thành viên khác
			const participants = conversation.participantIds.map((participant) =>
				participant.toString()
			);
			participants.forEach((participant) => {
				MemoryManager.getSocketList(participant).forEach((socketId) => {
					io.to(socketId).emit("message:deleted_for_everyone", message);
				});
			});

		} else {
			// Thu hồi với chính mình
			if (!message.deleteBy.includes(user.id)) {
				message.deleteBy.push(user.id);
				await message.save();
			}

			socket.emit("message:deleted_for_me", {
				messageId: message.id
			});
		}
	}
	static async handleBlockUser(io, socket, data) {
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
	}
	static async handleUnBlockUser(io, socket, data) {
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
			if (!conversation.participantIds.includes(userId)) {
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
			const participants = conversation.participantIds.map((participant) =>
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