const {getAllConversations, getConversationById, createConversation, updateConversation, deleteConversation} = require('../services/conversation-service');

const getAllConversationsController = async (req, res) => {
    try {
        const conversations = await getAllConversations(req, res);
        res.status(200).json({
            status:"200",
            message:"success",
            data: conversations
        });
    } catch (error) {
        res.status(200).json({ 
            status:"200",
            message:error.message,
            data: null
         });
    }
}
const getConversationByIdController = async (req, res) => {
    try {
        const conversation = await getConversationById(req, res);
        res.status(200).json({
            status:"200",
            message:"success",
            data: conversation
        });
    } catch (error) {
        res.status(200).json({ 
            status:"200",
            message:error.message,
            data: null
         });
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
        res.status(200).json({
            status:"200",
            message:"success",
            data: newConversation
        });
    } catch (error) {
        res.status(200).json({
            status:"200",
            message:error.message,
            data: null
         });
    }
}

const updateConversationController = async (req, res) => {
    try {
        const updatedConversation = await updateConversation(req, res);
        res.status(200).json({
            status:"200",
            message:"success",
            data: updatedConversation
        });
    } catch (error) {
        res.status(200).json({ 
            status:"200",
            message:error.message,
            data: null
         });
    }
}
const deleteConversationController = async (req, res) => {
    try {
        const deletedConversation = await deleteConversation(req, res);
        res.status(200).json({
            status:"200",
            message:"success",
            data: deletedConversation
        });
    } catch (error) {
        res.status(200).json({ 
            status:"200",
            message:error.message,
            data: null
         });
    }
}

module.exports = {
    getAllConversationsController,
    getConversationByIdController,
    createConversationController,
    updateConversationController,
    deleteConversationController
};
