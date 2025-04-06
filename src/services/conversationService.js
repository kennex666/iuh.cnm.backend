const conversation = require('../models/conversationModel');

const getAllConversations = async (req, res) => {
    try {
        const conversations = await conversation.find({});
        res.status(200).json(conversations);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}
const getConversationById = async (req, res) => {
    try {
        const conversationId = req.params.id;
        const conversationData = await conversation.findById(conversationId);
        if (!conversationData) {
            return res.status(404).json({ message: "Conversation not found" });
        }
        res.status(200).json(conversationData);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}
const createConversation = async (data) => {
    try {
        const newConversation = new conversation(data);
        return await newConversation.save();
    } catch (error) {
        console.error("Error creating post:", err);
        if (err instanceof Error) {
            throw new Error("Không thể tạo bài viết. Vui lòng thử lại sau.");
        } else {
            throw new Error("Lỗi không xác định. Vui lòng thử lại sau.");
        }
    }
}
const updateConversation = async (req, res) => {
    try {
        const conversationId = req.params.id;
        const updatedConversation = await conversation.findByIdAndUpdate(conversationId, req.body, { new: true });
        if (!updatedConversation) {
            return res.status(404).json({ message: "Conversation not found" });
        }
        res.status(200).json(updatedConversation);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}
const deleteConversation = async (req, res) => {
    try {
        const conversationId = req.params.id;
        const deletedConversation = await conversation.findByIdAndDelete(conversationId);
        if (!deletedConversation) {
            return res.status(404).json({ message: "Conversation not found" });
        }
        res.status(200).json({ message: "Conversation deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

module.exports = {
    getAllConversations,
    getConversationById,
    createConversation,
    updateConversation,
    deleteConversation
}