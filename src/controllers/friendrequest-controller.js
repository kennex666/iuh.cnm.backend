const { getAllFriendRequests, getFriendRequestById, createFriendRequest, updateFriendRequestDecline, updateFriendRequestAccept, deleteFriendRequest,
    getAllAcceptedFriendRequests, getAllDeclinedFriendRequests, getAllPendingFriendRequests
} = require("../services/friendrequest-service");
const typeRequest = require("../models/type-request");
const { AppError, handleError, responseFormat } = require("../utils/response-format");


const getAllFriendRequestsController = async (req, res) => {
    try {
        const friendRequests = await getAllFriendRequests(req, res);
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
        const friendRequest = await getFriendRequestById(req, res);
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
        const status = typeRequest.PENDING;
        const { id, senderId, receiverId } = req.body;
        const newFriendRequest = await createFriendRequest({
            id,
            senderId,
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
        const friendRequest = await updateFriendRequestDecline(req, res);
        if (!friendRequest) {
            throw new AppError("Friend request not found", 404);
        }
        responseFormat(res, friendRequest, "Update friend request successfully", true, 200);
    } catch (error) {
        handleError(error, res, "Update friend request failed");
    }
}
const updateFriendRequestAcceptController = async (req, res) => {
    try {
        const friendRequest = await updateFriendRequestAccept(req, res);
        if (!friendRequest) {
            throw new AppError("Friend request not found", 404);
        }
        responseFormat(res, friendRequest, "Update friend request successfully", true, 200);
    } catch (error) {
        handleError(error, res, "Update friend request failed");
    }
}
const deleteFriendRequestController = async (req, res) => {
    try {
        const friendRequest = await deleteFriendRequest(req, res);
        if (!friendRequest) {
            throw new AppError("Friend request not found", 404);
        }
        responseFormat(res, friendRequest, "Delete friend request successfully", true, 200);
    } catch (error) {
        handleError(error, res, "Delete friend request failed");
    }
}

const getAllAcceptedFriendRequestsController = async (req, res) => {
    try {
        const friendRequests = await getAllAcceptedFriendRequests(req, res);
        if (!friendRequests) {
            throw new AppError("Friend requests not found", 404);
        }
        responseFormat(res, friendRequests, "Get all friend requests successfully", true, 200);
    } catch (error) {
        handleError(error, res, "Failed to retrieve friend requests");
    }
}
const getAllDeclinedFriendRequestsController = async (req, res) => {
    try {
        const friendRequests = await getAllDeclinedFriendRequests(req, res);
        if (!friendRequests) {
            throw new AppError("Friend requests not found", 404);
        }
        responseFormat(res, friendRequests, "Get all friend requests successfully", true, 200);
    } catch (error) {
        handleError(error, res, "Failed to retrieve friend requests");
    }
}
const getAllPendingFriendRequestsController = async (req, res) => {
    try {
        const friendRequests = await getAllPendingFriendRequests(req, res);
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
    getAllAcceptedFriendRequestsController,
    getAllDeclinedFriendRequestsController,
    getAllPendingFriendRequestsController,
};