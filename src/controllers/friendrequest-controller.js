const { getAllFriendRequests, getFriendRequestById, createFriendRequest, updateFriendRequestDecline, updateFriendRequestAccept, deleteFriendRequest,
    getAllAcceptedFriendRequests, getAllDeclinedFriendRequests, getAllPendingFriendRequests,
    getAllFriendRequestAccepted,
    getAllPendingFriendRequestsBySenderId,
    getFriendByNameOrPhone,
    getAllPendingFriendRequestsByReceiverId
} = require("../services/friendrequest-service");
const typeRequest = require("../models/type-request");
const { AppError, handleError, responseFormat } = require("../utils/response-format");

const friendRequestModel = require("../models/friendrequest-model");
const { createConversation } = require("../services/conversation-service");


const getAllFriendRequestsController = async (req, res) => {
    try {
        const userId = req.user.id;
        const friendRequests = await getAllFriendRequests(userId);
        if (!friendRequests) {
            throw new AppError("Friend requests not found", 404);
        }
        responseFormat(res, friendRequests, "Get all friend requests successfully", true, 200);
    } catch (error) {
        handleError(error, res, "Failed to retrieve friend requests");
    }
}

const getFriendRequestByIdController = async (req, res) => {
    try {
        const userId = req.user.id;
        const friendRequestId = req.params.id;
        const friendRequest = await getFriendRequestById(userId, friendRequestId);
        if (!friendRequest) {
            throw new AppError("Friend request not found", 404);
        }
        responseFormat(res, friendRequest, "Get friend request successfully", true, 200);
    } catch (error) {
        handleError(error, res, "Failed to retrieve friend request");
    }
}
const createFriendRequestController = async (req, res) => {
    try {
        const userId = req.user.id; // Lấy userId từ token
        const status = typeRequest.PENDING;
        const { receiverId } = req.body;
        if(userId == receiverId) {

            throw new AppError("Cannot send friend request to yourself", 400);
        }
        const existingFriendRequest = await friendRequestModel.findOne({$or:[
            { senderId: userId, receiverId: receiverId },
            { senderId: receiverId, receiverId: userId },
        ]});
        console.log("existingFriendRequest:", existingFriendRequest); //
        if (existingFriendRequest) {
            throw new AppError("Friend request already exists", 400);
        }
        const newFriendRequest = await createFriendRequest({
            senderId: userId,
            receiverId,
            status,
        });
        if (!newFriendRequest) {
            throw new AppError("Failed to create friend request", 400);
        }
        responseFormat(res, newFriendRequest, "Create friend request successfully", true, 200);
    } catch (error) {
        handleError(error, res, "Create friend request failed");
    }
}

const updateFriendRequestDeclineController = async (req, res) => {
    try {
        // const userId = req.user.id;
        // const friendRequestId = req.params.id;
        // const friendRequest = await getFriendRequestById(userId, friendRequestId);
        // if (!friendRequest) {
        //     throw new AppError("Friend request not found", 404);
        // }
        const updatedFriendRequest = await updateFriendRequestDecline(req, res);
        if (!updatedFriendRequest) {
            throw new AppError("Friend request not found", 404);
        }
        responseFormat(res, updatedFriendRequest, "Update friend request successfully", true, 200);
    } catch (error) {
        handleError(error, res, "Update friend request failed");
    }
}
const updateFriendRequestAcceptController = async (req, res) => {
    try {
        const updatedFriendRequest = await updateFriendRequestAccept(req, res);
        if (!updatedFriendRequest) {
            throw new AppError("Friend request not found", 404);
        }
        const { senderId, receiverId,name,avatar } = updatedFriendRequest;
        console.log("senderId:", senderId); // 
        console.log("receiverId:", receiverId);
        
        const newConversation = await createConversation({
            isGroup: false,
            participants: [senderId, receiverId],
            name: name,
            avatar: avatar,
            adminIds: [],
            settings: {}
        });
        
        return res.status(200).json({
            success: true,
            message: "Đã chấp nhận yêu cầu kết bạn và tạo cuộc trò chuyện",
            data: {
                friendRequest: updatedFriendRequest,
                conversation: newConversation || null
            }
        });
        //responseFormat(res, updatedFriendRequest, "Update friend request successfully", true, 200);
    } catch (error) {
        handleError(error, res, "Update friend request failed");
    }
}
const deleteFriendRequestController = async (req, res) => {
    try {
        // const userId = req.user.id;
        // const friendRequestId = req.params.id;
        // const friendRequest = await getFriendRequestById(userId, friendRequestId);
        // if (!friendRequest) {
        //     throw new AppError("Friend request not found", 404);
        // }
        const deletedFriendRequest = await deleteFriendRequest(req, res);
        if (!deletedFriendRequest) {
            throw new AppError("Friend request not found", 404);
        }
        responseFormat(res, deletedFriendRequest, "Delete friend request successfully", true, 200);
    } catch (error) {
        handleError(error, res, "Delete friend request failed");
    }
}

// Lời mời kết bạn gửi đến tôi mà đang PENDING
const getAllPendingFriendRequestsByReceiverIdController = async (req, res) => {
    try {
        const userId = req.user.id;
        const friendRequests = await getAllPendingFriendRequestsByReceiverId(req, res);
        if (!friendRequests) {
            throw new AppError("Pending friend requests not found", 404);
        }
        responseFormat(res, friendRequests, "Get all pending friend requests successfully", true, 200);
    } catch (error) {
        handleError(error, res, "Failed to retrieve pending friend requests");
    }
}
// Lời mời kết bạn mà tôi đã gửi đi và đang PENDING
const getAllPendingFriendRequestsBySenderIdController = async (req, res) => {
    try {
        const userId = req.user.id;
        const friendRequests = await getAllPendingFriendRequestsBySenderId(req, res);
        if (!friendRequests) {
            throw new AppError("Pending friend requests not found", 404);
        }
        responseFormat(res, friendRequests, "Get all pending friend requests successfully", true, 200);
    } catch (error) {
        handleError(error, res, "Failed to retrieve pending friend requests");
    }
}

const getAllFriendRequestsAcceptedController = async (req, res) => {
    try {
        const friendRequests = await getAllFriendRequestAccepted(req, res);
        if (!friendRequests) {
            throw new AppError("Accepted friend requests not found", 404);
        }
        responseFormat(res, friendRequests, "Get all accepted friend requests successfully", true, 200);
    } catch (error) {
        handleError(error, res, "Failed to retrieve accepted friend requests");
    }
}

const getFriendByNameOrPhoneController = async (req, res) => {
    try {
        const friendRequests = await getFriendByNameOrPhone(req, res);
        if (!friendRequests) {
            throw new AppError("Friend requests not found", 404);
        }
        responseFormat(res, friendRequests, "Get all friend requests successfully", true, 200);
    } catch (error) {
        handleError(error, res, "Failed to retrieve friend requests");
    }
}

module.exports = {
    getAllFriendRequestsController,
    getFriendRequestByIdController,
    createFriendRequestController,
    updateFriendRequestDeclineController,
    updateFriendRequestAcceptController,
    deleteFriendRequestController,
    getAllPendingFriendRequestsByReceiverIdController,
    getAllPendingFriendRequestsBySenderIdController,
    getAllFriendRequestsAcceptedController,
    getFriendByNameOrPhoneController
}
