const {getAllMessages, getMessageById, createMessage, updateMessage, deleteMessage} = require("../services/message-service");

const getAllMessagesController = async (req, res) => {
    try {
        const messages = await getAllMessages(req, res);
        res.status(200).json({
            status:"200",
            message:"Get all messages successfully",
            data: messages,
        });
    } catch (error) {
        res.status(200).json({ 
            status:"200",
            message:error.message,
            data: null,
         });
    }
}

const getMessageByIdController = async (req, res) => {
    try {
        const message = await getMessageById(req, res);
        res.status(200).json({
            status:"200",
            message:"Get message successfully",
            data: message,
        });
    } catch (error) {
        res.status(500).json({ 
            status:"200",
            message:error.message,
            data: null,
         });
    }
}
const createMessageController = async (req, res) => {
    try {
        const { id,conversationId,senderId,content,type,repliedTold,readBy } = req.body;
        const newMessage = await createMessage({
            id,
            conversationId,
            senderId,
            content,
            type,
            repliedTold,
            readBy,
        });
        res.status(200).json({
            status:"200",
            message:"Create message successfully",
            data: newMessage,
        });
    } catch (error) {
        res.status(200).json({
            status:"200",
            message:error.message,
            data: null,
        });
    }
}
const updateMessageController = async (req, res) => {
    try {
        const updatedMessage = await updateMessage(req, res);
        res.status(200).json({
            status:"200",
            message:"Update message successfully",
            data: updatedMessage,
        });
    } catch (error) {
        res.status(200).json({ 
            status:"200",
            message:error.message,
            data: null,
         });
    }
}
const deleteMessageController = async (req, res) => {
    try {
        const deletedMessage = await deleteMessage(req, res);
        res.status(200).json({
            status:"200",
            message:"Delete message successfully",
            data: deletedMessage,
        });
    } catch (error) {
        res.status(200).json({
            status:"200",
            message:error.message,
            data: null,
        });
    }
}

module.exports = {
    getAllMessagesController,
    getMessageByIdController,
    createMessageController,
    updateMessageController,
    deleteMessageController
};