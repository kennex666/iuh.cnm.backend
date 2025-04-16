const conversation = require('../models/conversation-model');

const getAllConversations = async (userId) => {
    try {

        const conversations = await conversation.find({participants: { $in: [userId] }});
        return conversations;
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
            participants: { $in: [userId] },
            id: conversationId,
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

module.exports = {
    getAllConversations,
    getConversationById,
    createConversation,
    updateConversation,
    deleteConversation,
}