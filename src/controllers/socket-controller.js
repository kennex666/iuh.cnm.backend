const messageModel = require("../models/message-model");
const Conversation = require("../models/conversation-model");
const User = require("../models/user-model");
const SocketService = require("../services/socket-service");
const MemoryManager = require("../utils/memory-manager");
const { createMessage, createVote, addVoteOption, removeVoteOption } = require("../services/message-service");
const { createAttachment } = require("../services/attachment-service");
const typeMessage = require('../models/type-message');

const {
	transferAdminController,
	updateAllowMessagingCotroller,
} = require("../controllers/conversation-controller");
const {
	addParticipants,
	removeParticipants,
	grantModRole,
	removePinMessage
} = require("../services/conversation-service");
const userService = require("../services/user-service");

const FriendList = require("../models/friend-list-model");
const BlockList = require("../models/block-list-model");
const typeRoleUser = require('../models/type-role-user');
const friendRequestModel = require('../models/friendrequest-model');
const { createFriendRequest } = require('../services/friendrequest-service');
const typeRequest = require('../models/type-request');
const UserModel = require('../models/user-model');
const { verifyToken } = require("../utils/authen");

class SocketController {
	static async handleUpdateNickNameInConversation(io, socket, data) {
		const { conversationId, userId, newNickname } = data;

		// Kiểm tra dữ liệu đầu vào
		if (!conversationId || !userId) {
			return socket.emit("conversation:error", {
				message: "Thiếu thông tin conversationId hoặc userId",
			});
		}

		// Tìm kiếm nhóm
		const conversation = await Conversation.findOne({ id: conversationId });
		if (!conversation) {
			return socket.emit("conversation:error", {
				message: "Nhóm không tồn tại",
			});
		}

		// Kiểm tra xem userId có tồn tại trong nhóm không
		const participant = conversation.participantInfo.find(
			(p) => p.id === userId
		);
		if (!participant) {
			return socket.emit("conversation:error", {
				message: "Người dùng không phải là thành viên của nhóm",
			});
		}

		// Kiểm tra newNickname
		const updatedNickname = newNickname && newNickname.trim() !== ""
			? newNickname
			: participant.name; // Nếu rỗng, đặt lại nickname là tên user

		// Cập nhật nickname
		conversation.participantInfo = conversation.participantInfo.map((p) =>
			p.id === userId ? { ...p, nickname: updatedNickname } : p
		);
		await conversation.save();

		// Gửi thông báo đến tất cả các thành viên trong nhóm
		conversation.participantIds.forEach((participantId) => {
			MemoryManager.getSocketList(participantId).forEach((socketId) => {
				io.to(socketId).emit("conversation:nickname_updated", {
					conversationId,
					userId,
					newNickname: updatedNickname,
				});
			});
		});

		// Xác nhận cho client
		socket.emit("conversation:update_nickname_success", {
			message: "Cập nhật nickname thành công",
			conversationId,
			userId,
			newNickname: updatedNickname,
		});
	}
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

		if (isAdmin && conversation.participantIds.length > 1) {
			// Nếu là admin, yêu cầu bầu admin mới trước khi rời
			return socket.emit("group:admin_required", {
				message: "Bạn là admin. Vui lòng bầu người khác làm admin trước khi rời nhóm.", status: false
			});
		}

		// Nếu nhóm không còn thành viên, xóa nhóm
		if (isAdmin && updatedConversation.participantIds.length <= 1) {
			await Conversation.findByIdAndDelete(groupId);
			console.log(`Nhóm ${groupId} đã bị xóa vì không còn thành viên`);
			return socket.emit("group:leave_success", {
				message: "Nhóm đã giải tán",
				groupId,
				status: true
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
				{ id: id1, name: user1.name, avatar: user1.avatarUrl, nickname: user1.name },
				{ id: id2, name: user2.name, avatar: user2.avatarUrl, nickname: user2.name }
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
				id: conversationId
			});
			if (!conversation) {
				throw new Error(`Conversation not found with ID: ${conversationId}`);
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
				repliedTold: repliedTold || repliedToId
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
			isOnline: isOnline
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
			await User.findOneAndUpdate({ id: socket.user.id }, { isOnline: false });
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
				id: conversationId
			});
			if (!conversation) {
				throw new Error(`Conversation not found with ID: ${conversationId}`);
			}

			// Check if user has permission to send message
			if (!conversation.participantIds.includes(userId)) {
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
				readBy: [userId] // Mark as read by sender
			});

			console.log(`File message created:`, message);

			// Tạo attachment liên kết với tin nhắn
			const file = {
				buffer: fileData.buffer,
				fileName: fileData.fileName,
				contentType: fileData.contentType
			};

			const attachment = await createAttachment({
				messageId: message.id,
				file
			});

			// Gửi thông báo đến tất cả người tham gia cuộc trò chuyện
			const participants = conversation.participantIds.map((participant) =>
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
							contentType: fileData.contentType
						}
					};
					io.to(socketId).emit("message:new", messageWithAttachment);
				});
			});

			// Xác nhận cho người gửi
			socket.emit("attachment:sent", {
				success: true,
				messageId: message.id
			});
		} catch (error) {
			console.error(`Error sending attachment: ${error.message}`);
			socket.emit("attachment:error", {
				message: `Không thể gửi tệp đính kèm: ${error.message}`
			});
		}
	}
	static async handleAddParticipants(io, socket, data) {
		try {
			const { conversationId, participantIds } = data;

			if (
				!conversationId ||
				!participantIds ||
				!Array.isArray(participantIds)
			) {
				return socket.emit("conversation:error", {
					message: "Invalid data for adding participants"
				});
			}

			const fetchedParticipants = new Set(); // To track unique participant IDs
			const participantInfo = await Promise.all(
				participantIds.map(async (id) => {
					try {
						if (fetchedParticipants.has(id)) {
							return null; // Skip duplicate IDs
						}
						const user = await userService.getUserById(id);
						fetchedParticipants.add(id); // Add ID to the set
						return {
							id: user.id,
							name: user.name,
							avatar: user.avatarUrl,
							nickname: user.name,
							role: "member"
						};
					} catch (error) {
						console.error(`Failed to fetch user with id: ${id}`, error);
						return null; // Handle errors gracefully
					}
				})
			).then((results) => results.filter((info) => info !== null)); // Remove null values

			const updatedConversation = await addParticipants(
				conversationId,
				participantIds,
				participantInfo
			);

      // Notify all participants in the conversation
      const participants = updatedConversation.participantInfo.map((p) => p.id);
      participants.forEach((participantId) => {
        MemoryManager.getSocketList(participantId).forEach((socketId) => {
          io.to(socketId).emit("conversation:participants_added", {
            updatedConversation: updatedConversation,
          });
        });
      });
    } catch (error) {
      console.error("Error adding participants:", error);
      socket.emit("conversation:error", {
        message: "Failed to add participants"
      });
    }
  }

	static async handleRemoveParticipants(io, socket, data) {
		try {
			const { conversationId, participantIds } = data;

			if (
				!conversationId ||
				!participantIds ||
				!Array.isArray(participantIds)
			) {
				return socket.emit("conversation:error", {
					message: "Invalid data for removing participants"
				});
			}

			const updatedConversation = await removeParticipants(
				conversationId,
				participantIds
			);

			// Notify all remaining participants in the conversation
			const participants = updatedConversation.participantInfo.map((p) => p.id);
			participants.forEach((participantId) => {
				MemoryManager.getSocketList(participantId).forEach((socketId) => {
					io.to(socketId).emit("conversation:participants_removed", {
						conversationId,
						removedParticipants: participantIds
					});
				});
			});
		} catch (error) {
			console.error("Error removing participants:", error);
			socket.emit("conversation:error", {
				message: "Failed to remove participants"
			});
		}
	}

	static async handleTransferAdmin(io, socket, data) {
		try {
			const { conversationId, toUserId } = data;

			if (!conversationId || !toUserId) {
				return socket.emit("conversation:error", {
					message: "Invalid data for transferring admin role"
				});
			}

			const updatedConversation = await transferAdminController({
				params: { id: conversationId },
				body: { toUserId },
				user: { id: socket.user.id }
			});

			// Notify all participants in the conversation
			const participants = updatedConversation.participantInfo.map((p) => p.id);
			participants.forEach((participantId) => {
				MemoryManager.getSocketList(participantId).forEach((socketId) => {
					io.to(socketId).emit("conversation:admin_transferred", {
						conversationId,
						newAdminId: toUserId
					});
				});
			});
		} catch (error) {
			console.error("Error transferring admin role:", error);
			socket.emit("conversation:error", {
				message: "Failed to transfer admin role"
			});
		}
	}

	static async handleGrantMod(io, socket, data) {
		try {
			const { conversationId, toUserId } = data;

			if (!conversationId || !toUserId) {
				return socket.emit("conversation:error", {
					message: "Invalid data for granting mod role"
				});
			}

			const updatedConversation = await grantModRole(
				conversationId,
				socket.user.id,
				toUserId
			);

			// Notify all participants in the conversation
			const participants = updatedConversation.participantInfo.map((p) => p.id);
			participants.forEach((participantId) => {
				MemoryManager.getSocketList(participantId).forEach((socketId) => {
					io.to(socketId).emit("conversation:mod_granted", {
						conversationId,
						newModId: toUserId
					});
				});
			});
		} catch (error) {
			console.error("Error granting mod role:", error);
			socket.emit("conversation:error", {
				message: "Failed to grant mod role"
			});
		}
	}

	static async handleUpdateAllowMessaging(io, socket, data) {
		try {
			const { conversationId } = data;

			if (!conversationId) {
				return socket.emit("conversation:error", {
					message: "Invalid data for updating allow messaging"
				});
			}

			const updatedConversation = await updateAllowMessagingCotroller({
				params: { id: conversationId },
				user: { id: socket.user.id }
			});

			// Notify all participants in the conversation
			const participants = updatedConversation.participantInfo.map((p) => p.id);
			participants.forEach((participantId) => {
				MemoryManager.getSocketList(participantId).forEach((socketId) => {
					io.to(socketId).emit("conversation:allow_messaging_updated", {
						conversationId,
						isAllowMessaging: updatedConversation.settings.isAllowMessaging
					});
				});
			});
		} catch (error) {
			console.error("Error updating allow messaging:", error);
			socket.emit("conversation:error", {
				message: "Failed to update allow messaging"
			});
		}
	}

	static async handleCreateVote(io, socket, data) {
		try {
			const { conversationId, question, options, multiple } = data;

			if (
				!conversationId ||
				!question ||
				!Array.isArray(options) ||
				options.length < 2
			) {
				return socket.emit("vote:error", {
					message: "Invalid data for creating vote"
				});
			}

			const voteMessage = await createVote({
				senderId: socket.user.id,
				conversationId,
				question,
				options,
				multiple
			});

			// Gửi thông báo đến tất cả các thành viên trong cuộc trò chuyện
			const conversation = await Conversation.findOne({ id: conversationId });
			if (!conversation) {
				return socket.emit("vote:error", {
					message: "Conversation not found"
				});
			}

			conversation.participantInfo.forEach((participant) => {
				const sockets = MemoryManager.getSocketList(participant.id);
				sockets.forEach((socketId) => {
					io.to(socketId).emit("vote:created", {
						conversationId,
						vote: voteMessage
					});
				});
			});
		} catch (error) {
			console.error("Error creating vote:", error);
			socket.emit("vote:error", {
				message: "Failed to create vote"
			});
		}
	}

	static async handleSubmitVote(io, socket, data) {
    try {
        const { conversationId, voteId, optionId } = data;

        if (!conversationId || !voteId || !optionId) {
            return socket.emit("vote:error", {
                message: "Invalid data for submitting vote"
            });
        }

        const message = await messageModel.findOne({
            id: voteId,
            conversationId
        });
        if (!message) {
            return socket.emit("vote:error", {
                message: "Vote not found"
            });
        }

        const votePayload = JSON.parse(message.content);
        const option = votePayload.options.find((opt) => opt.id === optionId);

        if (!option) {
            return socket.emit("vote:error", {
                message: "Option not found"
            });
        }

        // Nếu đã vote rồi thì xóa user khỏi danh sách votes, ngược lại thì thêm vào
        const userIndex = option.votes.indexOf(socket.user.id);
        if (userIndex !== -1) {
            option.votes.splice(userIndex, 1); // Xóa user khỏi votes
        } else {
            option.votes.push(socket.user.id); // Thêm user vào votes
        }

        // Lưu lại kết quả vote
        message.content = JSON.stringify(votePayload);
        await message.save();

        // Gửi thông báo đến tất cả các thành viên trong cuộc trò chuyện
        const conversation = await Conversation.findOne({ id: conversationId });
        if (!conversation) {
            return socket.emit("vote:error", {
                message: "Conversation not found"
            });
        }

        conversation.participantInfo.forEach((participant) => {
            const sockets = MemoryManager.getSocketList(participant.id);
            sockets.forEach((socketId) => {
                io.to(socketId).emit("vote:updated", {
                    conversationId,
                    vote: message
                });
            });
        });
    } catch (error) {
        console.error("Error submitting vote:", error);
        socket.emit("vote:error", {
            message: "Failed to submit vote"
        });
    }
}

	static async handleGetVote(io, socket, data) {
		try {
			const { conversationId, voteId } = data;

			if (!conversationId || !voteId) {
				return socket.emit("vote:error", {
					message: "Invalid data for getting vote"
				});
			}

			const message = await messageModel.findOne({
				id: voteId,
				conversationId
			});
			if (!message) {
				return socket.emit("vote:error", {
					message: "Vote not found"
				});
			}
			console.log("Vote message:", message);

			socket.emit("vote:result", {
				conversationId,
				vote: message
			});
		} catch (error) {
			console.error("Error getting vote:", error);
			socket.emit("vote:error", {
				message: "Failed to get vote"
			});
		}
	}

	static async handleAddVoteOption(io, socket, data) {
		const { messageId, optionText } = data;
		if (!messageId || !optionText) {
			return socket.emit("vote:error", {
				message: "Invalid data for adding vote option"
			});
		}
		const message = await addVoteOption(messageId, optionText);
		if (!message) {
			return socket.emit("vote:error", {
				message: "Vote message not found"
			});
		}
		// Gửi thông báo đến tất cả các thành viên trong cuộc trò chuyện
		const conversation = await Conversation.findOne({ id: message.conversationId });
		if (!conversation) {
			return socket.emit("vote:error", {
				message: "Conversation not found"
			});
		}
		conversation.participantInfo.forEach((participant) => {
			const sockets = MemoryManager.getSocketList(participant.id);
			sockets.forEach((socketId) => {
				io.to(socketId).emit("vote:option_added", {
					conversationId: message.conversationId,
					vote: message
				});
			});
		});
	}

	static async handleRemoveVoteOption(io, socket, data) {
		const { messageId, optionId } = data;
		if (!messageId || !optionId) {
			return socket.emit("vote:error", {
				message: "Invalid data for adding vote option"
			});
		}
		const message = await removeVoteOption(messageId, optionId);
		if (!message) {
			return socket.emit("vote:error", {
				message: "Vote message not found"
			});
		}
		// Gửi thông báo đến tất cả các thành viên trong cuộc trò chuyện
		const conversation = await Conversation.findOne({ id: message.conversationId });
		if (!conversation) {
			return socket.emit("vote:error", {
				message: "Conversation not found"
			});
		}
		conversation.participantInfo.forEach((participant) => {
			const sockets = MemoryManager.getSocketList(participant.id);
			sockets.forEach((socketId) => {
				io.to(socketId).emit("vote:option_added", {
					conversationId: message.conversationId,
					vote: message
				});
			});
		});
	}

	static async handlePinMessage(io, socket, data) {
		try {
			const { conversationId, messageId } = data;

			// Kiểm tra dữ liệu đầu vào
			if (!conversationId || !messageId) {
				return socket.emit("message:error", {
					message: "Invalid data for pinning message"
				});
			}

			// Lấy thông tin cuộc trò chuyện
			const conversation = await Conversation.findOne({ id: conversationId });
			if (!conversation) {
				return socket.emit("message:error", {
					message: "Conversation not found"
				});
			}

			// Kiểm tra xem tin nhắn đã tồn tại trong danh sách ghim chưa
			const isPinned = conversation.pinMessages.some(
				(msg) => msg.id === messageId
			);
			if (isPinned) {
				console.log("Message is already pinned:", messageId);
				return socket.emit("message:error", {
					message: "Message is already pinned"
				});
			}

			// Lấy thông tin tin nhắn
			const message = await messageModel.findOne({ id: messageId });
			if (!message) {
				return socket.emit("message:error", {
					message: "Message not found"
				});
			}

			// Xóa tin nhắn đầu tiên nếu danh sách ghim đã đạt giới hạn 3 tin nhắn
			if (conversation.pinMessages.length >= 3) {
				conversation.pinMessages.shift();
			}

			// Thêm tin nhắn mới vào danh sách ghim
			conversation.pinMessages.push({
				id: message.id,
				conversationId: message.conversationId,
				senderId: message.senderId,
				content: message.content,
				type: message.type,
				repliedTold: message.repliedTold,
				sentAt: message.sentAt,
				readBy: message.readBy
			});

			// Lưu lại cuộc trò chuyện
			await conversation.save();

			// Gửi thông báo đến tất cả các thành viên trong cuộc trò chuyện
			const participants = conversation.participantInfo.map((p) => p.id);
			participants.forEach((participantId) => {
				const sockets = MemoryManager.getSocketList(participantId);
				sockets.forEach((socketId) => {
					io.to(socketId).emit("message:pinned", {
						conversationId,
						pinnedMessages: conversation.pinMessages
					});
				});
			});

			// Xác nhận cho người gửi
			socket.emit("message:pinned:success", {
				message: "Message pinned successfully"
			});
		} catch (error) {
			console.error("Error pinning message:", error);
			socket.emit("message:error", {
				message: error.message || "Failed to pin message"
			});
		}
	}

	static async handleRemovePinMessage(io, socket, data) {
    try {
        const { conversationId, messageId } = data;

        if (!conversationId || !messageId) {
            return socket.emit("message:error", {
                message: "Invalid data for removing pinned message"
            });
        }

        const conversation = await removePinMessage(conversationId, messageId);
        if (!conversation) {
            return socket.emit("message:error", {
                message: "Conversation not found"
            });
        }

        // Gửi thông báo đến tất cả các thành viên trong cuộc trò chuyện
        const participants = conversation.participantInfo.map((p) => p.id);
        participants.forEach((participantId) => {
            const sockets = MemoryManager.getSocketList(participantId);
            sockets.forEach((socketId) => {
                io.to(socketId).emit("message:unpinned", {
                    conversationId,
                    pinnedMessages: conversation.pinMessages
                });
            });
        });

        // Xác nhận cho người gửi
        socket.emit("message:unpinned:success", {
            message: "Message unpinned successfully"
        });
    } catch (error) {
        console.error("Error removing pinned message:", error);
        socket.emit("message:error", {
            message: error.message || "Failed to remove pinned message"
        });
    }
}

	static async handleDeleteConversation(io, socket, data) {
		try {
			const { conversationId } = data;

			// Kiểm tra dữ liệu đầu vào
			if (!conversationId) {
				return socket.emit("conversation:error", {
					message: "Invalid data for deleting conversation"
				});
			}

			// Lấy thông tin cuộc trò chuyện
			const conversation = await Conversation.findOne({ id: conversationId });
			if (!conversation) {
				return socket.emit("conversation:error", {
					message: "Conversation not found"
				});
			}

			// Lấy thông tin người dùng từ socket
			const userId = socket.user.id;

			// Kiểm tra quyền admin
			const isAdmin = conversation.participantInfo.some(
				(participant) =>
					participant.id === userId && participant.role === "admin"
			);

			if (!isAdmin) {
				return socket.emit("conversation:error", {
					message: "You are not authorized to delete this conversation"
				});
			}

			// Xóa cuộc trò chuyện
			const deletedConversation = await Conversation.findByIdAndDelete(
				conversationId
			);
			if (!deletedConversation) {
				return socket.emit("conversation:error", {
					message: "Failed to delete conversation"
				});
			}

			// Gửi thông báo đến tất cả các thành viên trong cuộc trò chuyện
			const participants = conversation.participantInfo.map((p) => p.id);
			participants.forEach((participantId) => {
				const sockets = MemoryManager.getSocketList(participantId);
				sockets.forEach((socketId) => {
					io.to(socketId).emit("conversation:deleted", {
						conversationId,
						message: "Conversation has been deleted"
					});
				});
			});

			// Xác nhận cho người gửi
			socket.emit("conversation:deleted:success", {
				message: "Conversation deleted successfully"
			});
		} catch (error) {
			console.error("Error deleting conversation:", error);
			socket.emit("conversation:error", {
				message: error.message || "Failed to delete conversation"
			});
		}
	}

	static async handleChatWithAI(io, socket, data) {
		try {
			const { message, token } = data;
			console.log("AI chat data:", data);

			if (!message) {
				return socket.emit("ai:error", {
					message: "Invalid data for AI chat"
				});
			}

			const aiResponse = await SocketService.getAIResponse(message);
			if (!aiResponse) {
				return socket.emit("ai:error", {
					message: "Failed to get AI response"
				});
			}

			const user = verifyToken(token);
			if (!user) {
				return socket.emit("ai:error", {
					message: "Invalid user token"
				});
			}

			const sockets = MemoryManager.getSocketList(user.id);
			console.log("Sockets for user:", sockets);
			sockets.forEach((socketId) => {
				io.to(socketId).emit("ai:response", {
					message: aiResponse,
				});
			});

			socket.emit("ai:response:success", {
				message: "AI response sent successfully"
			});
		} catch (error) {
			console.error("Error handling AI chat:", error);
			socket.emit("ai:error", {
				message: error.message || "Failed to handle AI chat"
			});
		}
	}
}

module.exports = SocketController;
