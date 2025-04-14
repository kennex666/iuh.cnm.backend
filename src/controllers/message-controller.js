const {getAllMessages, getMessageById, createMessage, updateMessage, deleteMessage, getMessageByConversationId} = require("../services/message-service");
const {handleError,responseFormat,AppError } = require("../utils/response-format");
const getAllMessagesController = async (req, res) => {
    try {
        const userId = req.user.id;
        const messages = await getAllMessages(userId);
        if (!messages) {
            throw new AppError("Messages not found", 404);
        }
        responseFormat(res, messages, "Get all messages successfully", true, 200);
    } catch (error) {
        handleError(error, res, "Failed to retrieve messages");
    }
}

const getMessageByIdController = async (req, res) => {
    try {
        const userId = req.user.id;
        const messageId = req.params.id;
        const message = await getMessageById(userId, messageId);
        if (!message) {
            throw new AppError("Message not found", 404);
        }
        responseFormat(res, message, "Get message successfully", true, 200);
    } catch (error) {
        handleError(error, res, "Failed to retrieve message");
    }
}
const createMessageController = async (req, res) => {
    try {
        const userId = req.user.id; // Lấy userId từ token
        const { id,conversationId,content,type,repliedTold,readBy } = req.body;
        const newMessage = await createMessage({
            id,
            conversationId,
            senderId: userId,
            content,
            type,
            repliedTold,
            readBy,
        });
        if (!newMessage) {
            throw new AppError("Failed to create message", 400);
        }
        responseFormat(res, newMessage, "Create message successfully", true, 200);
    } catch (error) {
        handleError(error, res, "Create message failed");
    }
}
const updateMessageController = async (req, res) => {
    try {
        const userId = req.user.id;
        const message = await getMessageById(userId, req.params.id);
        if(!message || message.senderId !== userId) {
            throw new AppError("Message not found", 404);
        }
        const updatedMessage = await updateMessage(req, res);
        if (!updatedMessage) {
            throw new AppError("Message not found", 404);
        }
        responseFormat(res, updatedMessage, "Update message successfully", true, 200);
    } catch (error) {
        handleError(error, res, "Update message failed");
    }
}
const deleteMessageController = async (req, res) => {
    try {
        const userId = req.user.id; 
        const message = await getMessageById(userId, req.params.id);
        if(!message || message.senderId !== userId) {
            throw new AppError("Message not found", 404);
        }
        const deletedMessage = await deleteMessage(req, res);
        if (!deletedMessage) {
            throw new AppError("Message not found", 404);
        }
        responseFormat(res, deletedMessage, "Delete message successfully", true, 200);
    } catch (error) {
        handleError(error, res, "Delete message failed");
    }
}

const getMessageByConversationIdController = async (req, res) => {
    try {
        const messages = await getMessageByConversationId(req, res);
        if (!messages) {
            throw new AppError("Messages not found", 404);
        }
        responseFormat(res, messages, "Get messages by conversation ID successfully", true, 200);
    } catch (error) {
        handleError(error, res, "Failed to retrieve messages by conversation ID");
    }
}
module.exports = {
    getAllMessagesController,
    getMessageByIdController,
    createMessageController,
    updateMessageController,
    deleteMessageController,
    getMessageByConversationIdController,
};