const { error } = require('console');
const {getAllConversations, getConversationById, createConversation, updateConversation, deleteConversation} = require('../services/conversation-service');
const {AppError,handleError,responseFormat } = require("../utils/response-format");
const getAllConversationsController = async (req, res) => {
    try {
        const conversations = await getAllConversations(req, res);
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
        const conversation = await getConversationById(req, res);
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
        console.log(req.body);
        const {
            id,
            isGroup,
            name,
            avatar,
            participants,
            adminIds,
            settings,
        } = req.body;
        const newConversation = await createConversation({
            id,
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
}

const updateConversationController = async (req, res) => {
    try {
        const updatedConversation = await updateConversation(req, res);
        if (!updatedConversation) {
            throw new AppError("Conversation not found", 404);
        }
        responseFormat(res, updatedConversation, "Update conversation successful", true, 200);
    } catch (error) {
        handleError(error, res, "Update conversation failed");
    }
}
const deleteConversationController = async (req, res) => {
    try {
        const deletedConversation = await deleteConversation(req, res);
        if (!deletedConversation) {
            throw new AppError("Conversation not found", 404);
        }
        responseFormat(res, deletedConversation, "Delete conversation successful", true, 200);
    } catch (error) {
        handleError(error, res, "Delete conversation failed");
    }
}

module.exports = {
    getAllConversationsController,
    getConversationByIdController,
    createConversationController,
    updateConversationController,
    deleteConversationController
};
