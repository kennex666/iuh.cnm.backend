const { error } = require('console');
const {getAllConversations, getConversationById, createConversation, updateConversation, deleteConversation} = require('../services/conversation-service');
const {AppError,handleError,responseFormat } = require("../utils/response-format");
const getAllConversationsController = async (req, res) => {
    try {
        const userId = req.user.id;
        const conversations = await getAllConversations(userId);
        if (!conversations) {
            throw new AppError("Conversations not found", 404);
        }
        responseFormat(res, conversations, "User retrieved successfully", true, 200);
    } catch (error) {
        handleError(error, res, "Failed to retrieve user");
    }
}
const getConversationByIdController = async (req, res) => {
    try {
        const userId = req.user.id;
        const conversationId = req.params.id;
        const conversation = await getConversationById(userId, conversationId);
        if (!conversation) {
            throw new AppError("Conversation not found", 404);
        }
        responseFormat(res, conversation, "User retrieved successfully", true, 200);
    } catch (error) {
        handleError(error, res, "Failed to retrieve user");
    }
}
const createConversationController = async (req, res) => {
    try {
        const userId = req.user.id; // Lấy userId từ token
        const {
            isGroup,
            name,
            avatar,
            participants = [],
            adminIds = [],
            settings,
        } = req.body;

        // Đảm bảo userId của người tạo được thêm vào participants và adminIds
        if (!participants.includes(userId)) participants.push(userId);
        if (!adminIds.includes(userId)) adminIds.push(userId);

        const newConversation = await createConversation({
            isGroup,
            name,
            avatar,
            participants,
            adminIds,
            settings,
        });

        if (!newConversation) {
            throw new AppError("Failed to create conversation", 400);
        }

        responseFormat(res, newConversation, "Create conversation successful", true, 200);
    } catch (error) {
        handleError(error, res, "Create conversation failed");
    }
};

const updateConversationController = async (req, res) => {
    try {
        const userId = req.user.id; // Lấy userId từ token
        const conversationId = req.params.id;

        // Lấy cuộc trò chuyện từ database
        const conversation = await getConversationById(userId, conversationId);
        //Kiểm tra quyền admin
        console.log(conversation.id);
        if (!Array.isArray(conversation.adminIds) || !conversation.adminIds.includes(userId)) {
            throw new AppError("You are not authorized to update this conversation", 403);
        }

        const updatedConversation = await updateConversation(req,res);

        if (!updatedConversation) {
            throw new AppError("Conversation not found", 404);
        }

        responseFormat(res, updatedConversation, "Update conversation successful", true, 200);
    } catch (error) {
        handleError(error, res, "Update conversation failed");
    }
};
const deleteConversationController = async (req, res) => {
    try {
        const userId = req.user.id; // Lấy userId từ token
        const conversationId = req.params.id;

        // Lấy cuộc trò chuyện từ database
        const conversation = await getConversationById(userId,conversationId);

        // Kiểm tra quyền admin
        if (!conversation || !conversation.adminIds.includes(userId)) {
            throw new AppError("You are not authorized to delete this conversation", 403);
        }

        const deletedConversation = await deleteConversation(req,res);

        if (!deletedConversation) {
            throw new AppError("Conversation not found", 404);
        }

        responseFormat(res, deletedConversation, "Delete conversation successful", true, 200);
    } catch (error) {
        handleError(error, res, "Delete conversation failed");
    }
};

module.exports = {
    getAllConversationsController,
    getConversationByIdController,
    createConversationController,
    updateConversationController,
    deleteConversationController
};
