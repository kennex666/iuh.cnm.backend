const friendRequestModel = require('../models/friendrequest-model');
const typeRequest = require('../models/type-request');

// Lấy tất cả yêu cầu kết bạn
const getAllFriendRequests = async (userId) => {
    try {
        const friendRequests = await friendRequestModel.find({senderId: userId});
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
const getFriendRequestById = async (userId,friendRequestId ) => {
    try {
        const friendRequestData = await friendRequestModel.findOne({senderId: userId, id: friendRequestId});
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
// lời mời kết bạn gửi đến tôi mà đang PENDING
const getAllPendingFriendRequestsByReceiverId = async (req, res) => {
    try {
        const userId = req.user.id;
        const friendRequests = await friendRequestModel.find({status: typeRequest.PENDING, receiverId: userId});
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
// lời mời kết bạn tôi gửi mà đang PENDING
const getAllPendingFriendRequestsBySenderId = async (req, res) => {
    try {
        const userId = req.user.id;
        const friendRequests = await friendRequestModel.find({status: typeRequest.PENDING, senderId: userId});
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

// // Lấy tất cả yêu cầu kết bạn đã chấp nhận(ACCEPT)  
// const getAllAcceptedFriendRequests = async (req, res) => {
//     try {
//         const friendRequestId = req.params.id;
//         const friendRequests = await friendRequestModel.find({status: typeRequest.ACCEPTED, receiverId: friendRequestId});
//         return friendRequests;
//     } catch (error) {
//         console.error("Error fetching accepted friend requests:", error);
//         if (error instanceof Error) {
//             throw new Error("Không thể lấy danh sách yêu cầu kết bạn đã chấp nhận. Vui lòng thử lại sau.");
//         } else {
//             throw new Error("Lỗi không xác định. Vui lòng thử lại sau.");
//         }
//     }
// }
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

// lay yeu cau ket ban da chap nhan
const getAllFriendRequestAccepted = async (req, res) => {
    try {
        const userId = req.user.id;
        const friendRequests = await friendRequestModel.find({status: typeRequest.ACCEPTED,
            $or: [
                { receiverId: userId },
                { senderId: userId }
              ]
        });
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

// tìm kiếm bạn bè theo tên và số điện thoại
const getFriendByNameOrPhone = async (req, res) => {
    try {
        const userId = req.user.id;
        const query = req.params.query;
        const friendRequests = await friendRequestModel.find({
            status: typeRequest.ACCEPTED,
            $or: [
                { receiverId: userId },
                { senderId: userId }
              ],
            $or: [
                { name: { $regex: query, $options: 'i' } },
                { phone: { $regex: query, $options: 'i' } }
            ]
        });
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



module.exports = {
    getAllFriendRequests,
    getFriendRequestById,
    createFriendRequest,
    updateFriendRequestDecline,
    updateFriendRequestAccept,
    deleteFriendRequest,
    getAllPendingFriendRequestsByReceiverId,
    getAllPendingFriendRequestsBySenderId,
    getAllDeclinedFriendRequests,
    getAllFriendRequestAccepted,
    getFriendByNameOrPhone
};