const { error } = require('console');
const {getAllConversations, getConversationById, createConversation, updateConversation, 
    deleteConversation, addParticipants, removeParticipants, transferAdminRole,
    grantModRole,updateAllowMessaging, pinMessage} = require('../services/conversation-service');
const {AppError,handleError,responseFormat } = require("../utils/response-format");
const userService = require('../services/user-service');
const { updateSearchIndex } = require('../models/conversation-model');
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
            avatarUrl,
            avatarGroup,
            participantIds = [],
            participantInfo = [],
            url,
            pinMessages = [],
            settings = {}
        } = req.body;
        // Đảm bảo userId của người tạo được thêm vào participants và adminIds
        if (!participantIds.includes(userId)) participantIds.push(userId);
        if (!participantInfo.some(info => info.id === userId)) {
            const user = await userService.getUserById(userId);
            participantInfo.push({ id: userId, name: user.name ,avatar: avatarUrl });
        }
        // if (!adminIds.includes(userId)) adminIds.push(userId);

        const newConversation = await createConversation({
            isGroup,
            name,
            avatarUrl,
            avatarGroup,
            type: isGroup ? "group" : "1vs1",
            participantIds,
            participantInfo,
            url,
            pinMessages,
            settings
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
        // const userId = req.user.id; // Lấy userId từ token
        // const conversationId = req.params.id;

        // // Lấy cuộc trò chuyện từ database
        // const conversation = await getConversationById(userId, conversationId);
        // //Kiểm tra quyền admin
        // console.log(conversation.id);
        // if (!Array.isArray(conversation.adminIds) || !conversation.adminIds.includes(userId)) {
        //     throw new AppError("You are not authorized to update this conversation", 403);
        // }

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
        // const userId = req.user.id; // Lấy userId từ token
        // const conversationId = req.params.id;

        // // Lấy cuộc trò chuyện từ database
        // const conversation = await getConversationById(userId,conversationId);

        // // Kiểm tra quyền admin
        // if (!conversation || !conversation.adminIds.includes(userId)) {
        //     throw new AppError("You are not authorized to delete this conversation", 403);
        // }

        const deletedConversation = await deleteConversation(req,res);

        if (!deletedConversation) {
            throw new AppError("Conversation not found", 404);
        }

        responseFormat(res, deletedConversation, "Delete conversation successful", true, 200);
    } catch (error) {
        handleError(error, res, "Delete conversation failed");
    }
};

const addParticipantsController = async (req, res) => {
    try {
        const userId = req.user.id; // Lấy userId từ token
        const conversationId = req.params.id;
        const { participantIds } = req.body;

        // Fetch participant information and avoid duplicates
        const fetchedParticipants = new Set(); // To track unique participant IDs
        const participantInfo = await Promise.all(participantIds.map(async (id) => {
            try {
                if (fetchedParticipants.has(id)) {
                    return null; // Skip duplicate IDs
                }
                const user = await userService.getUserById(id);
                fetchedParticipants.add(id); // Add ID to the set
                return { id: user.id, name: user.name, avatar: user.avatarUrl, nickname: user.name, role: 'member' };
            } catch (error) {
                console.error(`Failed to fetch user with id: ${id}`, error);
                return null; // Handle errors gracefully
            }
        })).then(results => results.filter(info => info !== null)); // Remove null values

        const updatedConversation = await addParticipants(conversationId, participantIds, participantInfo);

        if (!updatedConversation) {
            throw new AppError("Failed to add participants", 400);
        }

        responseFormat(res, updatedConversation, "Add participants successful", true, 200);
    } catch (error) {
        handleError(error, res, "Add participants failed");
    }
};

const removeParticipantsController = async (req, res) => {
    try {
        const userId = req.user.id; // Lấy userId từ token
        const conversationId = req.params.id;
        const { participantIds } = req.body;


        const updatedConversation = await removeParticipants(conversationId, participantIds);

        if (!updatedConversation) {
            throw new AppError("Failed to remove participants", 400);
        }

        responseFormat(res, updatedConversation, "Remove participants successful", true, 200);
    } catch (error) {
        handleError(error, res, "Remove participants failed");
    }
};

const transferAdminController = async (req, res) => {
    try {
        const fromUserId = req.user.id;
        const conversationId = req.params.id;
        const { toUserId } = req.body;

        if (!conversationId || !toUserId) {
            throw new Error('Missing conversationId or toUserId');
        }

        const updatedConversation = await transferAdminRole(conversationId, fromUserId, toUserId);

        responseFormat(res, updatedConversation, 'Transferred admin role successfully', true, 200);
    } catch (error) {
        handleError(error, res, 'Transfer admin failed');
    }
};
// Admin cấp quyền mod cho người dùng
const grantModController = async (req, res) => {
    try {
        const fromUserId = req.user.id; // Lấy userId từ token
        const conversationId = req.params.id;
        const { toUserId } = req.body;

        if (!conversationId || !toUserId) {
            throw new AppError('Missing conversationId or toUserId', 400);
        }

        const updatedConversation = await grantModRole(conversationId, fromUserId, toUserId);

        responseFormat(res, updatedConversation, 'Granted mod role successfully', true, 200);
    } catch (error) {
        handleError(error, res, 'Grant mod failed');
    }
};

// Cập nhật quyền nhắn tin trong nhóm
const updateAllowMessagingCotroller = async (req, res) => {
    try {
        const userId = req.user.id; // Lấy userId từ token
        const conversationId = req.params.id;
        const updatedConversation = await updateAllowMessaging(conversationId, userId);

        if (!updatedConversation) {
            throw new AppError("Failed to update allow messaging", 400);
        }

        responseFormat(res, updatedConversation, "Update allow messaging successful", true, 200);
    } catch (error) {
        handleError(error, res, "Update allow messaging failed");
    }
};

// Pin message in conversation
const pinMessageController = async (req, res) => {
    try {
        const conversationId = req.params.id;
        const { messageId } = req.body;

        if (!conversationId || !messageId) {
            throw new AppError('Missing conversationId or messageId', 400);
        }

        const updatedConversation = await pinMessage(conversationId, messageId);

        responseFormat(res, updatedConversation, 'Pinned message successfully', true, 200);
    } catch (error) {
        handleError(error, res, 'Pin message failed');
    }
};



module.exports = {
    getAllConversationsController,
    getConversationByIdController,
    createConversationController,
    updateConversationController,
    deleteConversationController,
    addParticipantsController,
    removeParticipantsController,
    transferAdminController,
    grantModController,
    updateAllowMessagingCotroller,
    pinMessageController
};
