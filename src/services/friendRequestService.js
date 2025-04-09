const friendRequestModel = require('../models/friendRequestModel');
const typeRequest = require('../models/typeRequest');

// Lấy tất cả yêu cầu kết bạn
const getAllFriendRequests = async (req, res) => {
    try {
        const friendRequests = await friendRequestModel.find({});
        return friendRequests;
    } catch (error) {
        console.error("Error fetching friend requests:", error);
        if (error instanceof Error) {
            throw new Error("Không thể lấy danh sách yêu cầu kết bạn. Vui lòng thử lại sau.");
        } else {
            throw new Error("Lỗi không xác định. Vui lòng thử lại sau.");
        }
    }
}

// Lấy yêu cầu kết bạn theo ID
const getFriendRequestById = async (req, res) => {
    try {
        const friendRequestId = req.params.id;
        const friendRequestData = await friendRequestModel.findById(friendRequestId);
        return friendRequestData;
    } catch (error) {
        console.error("Error fetching friend request:", error);
        if (error instanceof Error) {
            throw new Error("Không thể lấy yêu cầu kết bạn. Vui lòng thử lại sau.");
        } else {
            throw new Error("Lỗi không xác định. Vui lòng thử lại sau.");
        }
    }
}

// Tạo yêu cầu kết bạn mới
const createFriendRequest = async (data) => {
    try {
        const newFriendRequest = new friendRequestModel(data);
        return await newFriendRequest.save();
    } catch (error) {
        console.error("Error creating friend request:", error);
        if (error instanceof Error) {
            throw new Error("Không thể tạo yêu cầu kết bạn. Vui lòng thử lại sau.");
        } else {
            throw new Error("Lỗi không xác định. Vui lòng thử lại sau.");
        }
    }
}

// Cập nhật status yêu cầu kết bạn thành từ chối
const updateFriendRequestDecline = async (req, res) => {
    try {
        const friendRequestId = req.params.id;
       // const status = typeRequest.DECLINE;
        const updatedFriendRequest = await friendRequestModel.findByIdAndUpdate(friendRequestId,{status:typeRequest.DECLINE}, { new: true });
        return updatedFriendRequest;
    } catch (error) {
        console.error("Error updating friend request:", error);
        if (error instanceof Error) {
            throw new Error("Không thể cập nhật yêu cầu kết bạn. Vui lòng thử lại sau.");
        } else {
            throw new Error("Lỗi không xác định. Vui lòng thử lại sau.");
        }
    }
}
// Cập nhật status yêu cầu kết bạn thành chấp nhận
const updateFriendRequestAccept = async (req, res) => {
    try {
        const friendRequestId = req.params.id;
        // const status = typeRequest.ACCEPT;
        const updatedFriendRequest = await friendRequestModel.findByIdAndUpdate(friendRequestId,{status:typeRequest.ACCEPTED}, { new: true });
        return updatedFriendRequest;
    } catch (error) {
        console.error("Error updating friend request:", error);
        if (error instanceof Error) {
            throw new Error("Không thể cập nhật yêu cầu kết bạn. Vui lòng thử lại sau.");
        } else {
            throw new Error("Lỗi không xác định. Vui lòng thử lại sau.");
        }
    }
}

// Xóa yêu cầu kết bạn
const deleteFriendRequest = async (req, res) => {
    try {
        const friendRequestId = req.params.id;
        const deletedFriendRequest = await friendRequestModel.findByIdAndDelete(friendRequestId);
        return deletedFriendRequest;
    } catch (error) {
        console.error("Error deleting friend request:", error);
        if (error instanceof Error) {
            throw new Error("Không thể xóa yêu cầu kết bạn. Vui lòng thử lại sau.");
        } else {
            throw new Error("Lỗi không xác định. Vui lòng thử lại sau.");
        }
    }
}
// Lấy tất cả yêu cầu kết bạn đang chờ xử lý(PENDING) và  requestId là id của người gửi yêu cầu kết bạn
const getAllPendingFriendRequests = async (req, res) => {
    try {
        const friendRequestId = req.params.id;
        const friendRequests = await friendRequestModel.find({status: typeRequest.PENDING, receiverId: friendRequestId});
        return friendRequests;
    } catch (error) {
        console.error("Error fetching pending friend requests:", error);
        if (error instanceof Error) {
            throw new Error("Không thể lấy danh sách yêu cầu kết bạn đang chờ xử lý. Vui lòng thử lại sau.");
        } else {
            throw new Error("Lỗi không xác định. Vui lòng thử lại sau.");
        }
    }
}

// Lấy tất cả yêu cầu kết bạn đã chấp nhận(ACCEPT)  
const getAllAcceptedFriendRequests = async (req, res) => {
    try {
        const friendRequestId = req.params.id;
        const friendRequests = await friendRequestModel.find({status: typeRequest.ACCEPTED, receiverId: friendRequestId});
        return friendRequests;
    } catch (error) {
        console.error("Error fetching accepted friend requests:", error);
        if (error instanceof Error) {
            throw new Error("Không thể lấy danh sách yêu cầu kết bạn đã chấp nhận. Vui lòng thử lại sau.");
        } else {
            throw new Error("Lỗi không xác định. Vui lòng thử lại sau.");
        }
    }
}
// Lấy tất cả yêu cầu kết bạn đã từ chối(DECLINE)
const getAllDeclinedFriendRequests = async (req, res) => {
    try {
        const friendRequests = await friendRequestModel.find({status: typeRequest.DECLINE, receiverId: req.params.id});
        return friendRequests;
    } catch (error) {
        console.error("Error fetching declined friend requests:", error);
        if (error instanceof Error) {
            throw new Error("Không thể lấy danh sách yêu cầu kết bạn đã từ chối. Vui lòng thử lại sau.");
        } else {
            throw new Error("Lỗi không xác định. Vui lòng thử lại sau.");
        }
    }
}

module.exports = {
    getAllFriendRequests,
    getFriendRequestById,
    createFriendRequest,
    updateFriendRequestDecline,
    updateFriendRequestAccept,
    deleteFriendRequest,
    getAllPendingFriendRequests,
    getAllAcceptedFriendRequests,
    getAllDeclinedFriendRequests,
};