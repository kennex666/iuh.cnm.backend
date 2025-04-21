const conversation = require('../models/conversation-model');
const { AppError } = require('../utils/response-format');

const getAllConversations = async (userId) => {
    try {

        const conversations = await conversation
			.find({ participantIds: { $in: [userId] } })
			.populate({
				path: "lastMessage",
				options: { strictPopulate: false }, // 💡 không lỗi nếu không có
			});

        // if not have lastMessage, set lastMessage.sentAt = updatedAt

        const sortedConversations = conversations
			.map((conversation) => ({
				...conversation.toObject(),
				lastMessage: conversation.lastMessage || {
					sentAt: conversation.updatedAt,
					content: "Hãy gửi lời chào đến người bạn này nào!",
					type: "text",
					readBy: [userId]
				},
			}))
			.sort((a, b) => {
				const aDate = a.lastMessage?.sentAt
					? new Date(a.lastMessage.sentAt)
					: 0;
				const bDate = b.lastMessage?.sentAt
					? new Date(b.lastMessage.sentAt)
					: 0;
				return bDate - aDate;
			});
        
        return sortedConversations;
    } catch (error) {
        console.error("Error fetching conversations:", error);
        if (error instanceof Error) {
            throw new Error("Không thể lấy danh sách cuộc trò chuyện. Vui lòng thử lại sau.");
        } else {
            throw new Error("Lỗi không xác định. Vui lòng thử lại sau.");
        }
    }
}
const getConversationById = async (userId, conversationId) => {
    try {
        const conversationData = await conversation.findOne({
            participantIds: { $in: [userId] },
            id: conversationId,
        }).populate({
            path: 'lastMessage',
            options: { strictPopulate: false } // 💡 không lỗi nếu không có
        });
        return conversationData;
    } catch (error) {
        console.error("Error fetching conversation:", error);
        if (error instanceof Error) {
            throw new Error("Không thể lấy cuộc trò chuyện. Vui lòng thử lại sau.");
        } else {
            throw new Error("Lỗi không xác định. Vui lòng thử lại sau.");
        }
    }
}

const getConversationByCvsId = async(conversationId) => {
    try {
        const conversationData = await conversation.findOne({
            id: conversationId,
        }).populate({
            path: 'lastMessage',
            options: { strictPopulate: false } // 💡 không lỗi nếu không có
        });
        return conversationData;
    } catch (error) {
        console.error("Error fetching conversation:", error);
        if (error instanceof Error) {
            throw new Error("Không thể lấy cuộc trò chuyện. Vui lòng thử lại sau.");
        } else {
            throw new Error("Lỗi không xác định. Vui lòng thử lại sau.");
        }
    }
}

const createConversation = async (data) => {
    try {
        const newConversation = new conversation(data);
        return await newConversation.save();
    } catch (error) {
        console.error("Error creating conversation:", err);
        if (err instanceof Error) {
            throw new Error("Không thể tạo cuộc trò truyện. Vui lòng thử lại sau.");
        } else {
            throw new Error("Lỗi không xác định. Vui lòng thử lại sau.");
        }
    }
}
const updateConversation = async (req, res) => {
    try {
        const conversationId = req.params.id;
        const updatedConversation = await conversation.findByIdAndUpdate(conversationId, req.body, { new: true });
        return updatedConversation;
    } catch (error) {
        console.error("Error updating conversation:", error);
        if (error instanceof Error) {
            throw new Error("Không thể cập nhật cuộc trò chuyện. Vui lòng thử lại sau.");
        } else {
            throw new Error("Lỗi không xác định. Vui lòng thử lại sau.");
        }
    }
}
const deleteConversation = async (req, res) => {
    try {
        const conversationId = req.params.id;
        const deletedConversation = await conversation.findByIdAndDelete(conversationId);
        return deletedConversation;
    } catch (error) {
        console.error("Error deleting conversation:", error);
        if (error instanceof Error) {
            throw new Error("Không thể xóa cuộc trò chuyện. Vui lòng thử lại sau.");
        } else {
            throw new Error("Lỗi không xác định. Vui lòng thử lại sau.");
        }
    }
}

// Thêm 1 hoặc nhiều thành viên vào cuộc trò chuyện và thêm vào cả participantInfo
const addParticipants = async (conversationId, participantIds, participantInfo) => {
    try {
        const updatedConversation = await conversation.findByIdAndUpdate(
            conversationId,
            {
                $addToSet: { participantIds: { $each: participantIds }, participantInfo: { $each: participantInfo } },
            },
            { new: true }
        );
        return updatedConversation;
    } catch (error) {
        console.error("Error adding participants:", error);
        if (error instanceof Error) {
            throw new Error("Không thể thêm thành viên vào cuộc trò chuyện. Vui lòng thử lại sau.");
        } else {
            throw new Error("Lỗi không xác định. Vui lòng thử lại sau.");
        }
    }
}

// xóa 1 hoặc nhiều thành viên khỏi cuộc trò chuyện và xóa khỏi cả participantInfo
const removeParticipants = async (conversationId, participantIds) => {
    try {
        const updatedConversation = await conversation.findByIdAndUpdate(
            conversationId,
            {
                $pull: { participantIds: { $in: participantIds }, participantInfo: { id: { $in: participantIds } } },
            },
            { new: true }
        );
        return updatedConversation;
    } catch (error) {
        console.error("Error removing participants:", error);
        if (error instanceof Error) {
            throw new Error("Không thể xóa thành viên khỏi cuộc trò chuyện. Vui lòng thử lại sau.");
        } else {
            throw new Error("Lỗi không xác định. Vui lòng thử lại sau.");
        }
    }
}


const transferAdminRole = async (conversationId, fromUserId, toUserId) => {
    const conversations = await conversation.findOne({ id: conversationId });
    if (!conversations) throw new AppError('Conversation not found', 404);

    const currentUser = conversations.participantInfo.find(p => p.id === fromUserId);
    if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'mod')) {
        throw new AppError('Permission denied. Only admin or mod can transfer role.', 403);
    }

    const targetUser = conversations.participantInfo.find(p => p.id === toUserId);
    if (!targetUser) {
        throw new AppError('Target user not found in conversation', 404);
    }

    if(currentUser.role === 'admin') {
            // Cập nhật role
        conversations.participantInfo = conversations.participantInfo.map(p => {
            if (p.id === toUserId) return { ...p, role: 'admin' };
            return p;
        });
        conversations.participantInfo = conversations.participantInfo.map(p => {
            if (p.id === fromUserId) return { ...p, role: 'member' };
            return p;
         });
    }

    if(currentUser.role === 'mod') {
        // Cập nhật role
    conversations.participantInfo = conversations.participantInfo.map(p => {
        if (p.id === toUserId) return { ...p, role: 'mod' };
        return p;
    });
    conversations.participantInfo = conversations.participantInfo.map(p => {
        if (p.id === fromUserId) return { ...p, role: 'member' };
        return p;
    });
    }
    await conversations.save();
    return conversations;
};

// admin cấp quyền cho mod
const grantModRole = async (conversationId, fromUserId, toUserId) => {
    const conversations = await conversation.findOne({ id: conversationId });
    if (!conversations) throw new AppError('Conversation not found', 404);

    const currentUser = conversations.participantInfo.find(p => p.id === fromUserId);
    if (!currentUser || currentUser.role !== 'admin') {
        throw new AppError('Permission denied. Only admin can grant mod role.', 403);
    }

    const targetUser = conversations.participantInfo.find(p => p.id === toUserId);
    if (!targetUser) {
        throw new AppError('Target user not found in conversation', 404);
    }

    // Cập nhật role
    conversations.participantInfo = conversations.participantInfo.map(p => {
        if (p.id === toUserId) return { ...p, role: 'mod' };
        return p;
    });

    await conversations.save();
    return conversations;
};

// Đổi trạng thái isAllowMessaging của cuộc trò chuyện(true đuợc nhắn tin, false không được nhắn tin)
const updateAllowMessaging = async (conversationId, userId) => {
    const conversations = await conversation.findOne({ id: conversationId });
    if (!conversations) throw new AppError('Conversation not found', 404);

    const currentUser = conversations.participantInfo.find(p => p.id === userId);
    if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'mod')) {
        throw new AppError('Permission denied. Only admin or mod can update messaging status.', 403);
    }

    // Cập nhật trạng thái isAllowMessaging
    conversations.settings.isAllowMessaging = !conversations.settings.isAllowMessaging;
    await conversations.save();
    return conversations;
}



module.exports = {
	getAllConversations,
	getConversationById,
	createConversation,
	updateConversation,
	deleteConversation,
	getConversationByCvsId,
    addParticipants,
    removeParticipants,
    transferAdminRole,
    grantModRole,
    updateAllowMessaging
};