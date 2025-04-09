const { getAllFriendRequests, getFriendRequestById, createFriendRequest, updateFriendRequestDecline,updateFriendRequestAccept, deleteFriendRequest,
    getAllAcceptedFriendRequests,getAllDeclinedFriendRequests,getAllPendingFriendRequests
 } = require("../services/friendrequest-service");
const typeRequest = require("../models/type-request");

const getAllFriendRequestsController = async (req, res) => {
    try {
        const friendRequests = await getAllFriendRequests(req, res);
        res.status(200).json({
            status: "200",
            message: "Get all friend requests successfully",
            data: friendRequests,
        });
    } catch (error) {
        res.status(200).json({
            status: "200",
            message: error.message,
            data: null,
        });
    }
}

const getFriendRequestByIdController = async (req, res) => {
    try {
        const friendRequest = await getFriendRequestById(req, res);
        res.status(200).json({
            status: "200",
            message: "Get friend request successfully",
            data: friendRequest,
        });
    } catch (error) {
        res.status(200).json({
            status: "200",
            message: error.message,
            data: null,
        });
    }
}
const createFriendRequestController = async (req, res) => {
    try {
        const status = typeRequest.PENDING;
        const { id, senderId, receiverId} = req.body;
        const newFriendRequest = await createFriendRequest({
            id,
            senderId,
            receiverId,
            status,
        });
        res.status(200).json({
            status: "200",
            message: "Create friend request successfully",
            data: newFriendRequest,
        });
    } catch (error) {
        res.status(200).json({
            status: "200",
            message: error.message,
            data: null,
        });
    }
}

const updateFriendRequestDeclineController = async (req, res) => {
    try {
        const friendRequest = await updateFriendRequestDecline(req, res);
        res.status(200).json({
            status: "200",
            message: "Update friend request successfully",
            data: friendRequest,
        });
    } catch (error) {
        res.status(200).json({
            status: "200",
            message: error.message,
            data: null,
        });
    }
}
const updateFriendRequestAcceptController = async (req, res) => {
    try {
        const friendRequest = await updateFriendRequestAccept(req, res);
        res.status(200).json({
            status: "200",
            message: "Update friend request successfully",
            data: friendRequest,
        });
    } catch (error) {
        res.status(200).json({
            status: "200",
            message: error.message,
            data: null,
        });
    }
}
const deleteFriendRequestController = async (req, res) => {
    try {
        const friendRequest = await deleteFriendRequest(req, res);
        res.status(200).json({
            status: "200",
            message: "Delete friend request successfully",
            data: friendRequest,
        });
    } catch (error) {
        res.status(200).json({
            status: "200",
            message: error.message,
            data: null,
        });
    }
}

const getAllAcceptedFriendRequestsController = async (req, res) => {
    try {
        const friendRequests = await getAllAcceptedFriendRequests(req, res);
        res.status(200).json({
            status: "200",
            message: "Get all friend requests successfully",
            data: friendRequests,
        });
    } catch (error) {
        res.status(200).json({
            status: "200",
            message: error.message,
            data: null,
        });
    }
}
const getAllDeclinedFriendRequestsController = async (req, res) => {
    try {
        const friendRequests = await getAllDeclinedFriendRequests(req, res);
        res.status(200).json({
            status: "200",
            message: "Get all friend requests successfully",
            data: friendRequests,
        });
    } catch (error) {
        res.status(200).json({
            status: "200",
            message: error.message,
            data: null,
        });
    }
}
const getAllPendingFriendRequestsController = async (req, res) => {
    try {
        const friendRequests = await getAllPendingFriendRequests(req, res);
        res.status(200).json({
            status: "200",
            message: "Get all friend requests successfully",
            data: friendRequests,
        });
    } catch (error) {
        res.status(200).json({
            status: "200",
            message: error.message,
            data: null,
        });
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