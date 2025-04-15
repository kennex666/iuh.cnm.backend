const express = require("express");

const authMiddleware = require("../middlewares/auth");
const friendRequestRoute = express.Router();
const {
    getAllFriendRequestsController,
    getFriendRequestByIdController,
    createFriendRequestController,
    updateFriendRequestDeclineController,
    updateFriendRequestAcceptController,
    deleteFriendRequestController,
    getAllPendingFriendRequestsByReceiverIdController,
    getAllPendingFriendRequestsBySenderIdController,
    getAllFriendRequestsAcceptedController,
    getFriendByNameOrPhoneController,
} = require("../controllers/friendrequest-controller");

// Lấy tất cả yêu cầu kết bạn
friendRequestRoute.get("/", authMiddleware, getAllFriendRequestsController);
// Lấy yêu cầu kết bạn theo ID
friendRequestRoute.get("/:id", authMiddleware, getFriendRequestByIdController);
// Tạo yêu cầu kết bạn mới
friendRequestRoute.post("/", authMiddleware, createFriendRequestController);
// Cập nhật yêu cầu kết bạn thành từ chối
friendRequestRoute.put(
    "/decline/:id",
    authMiddleware,
    updateFriendRequestDeclineController
);
// Cập nhật yêu cầu kết bạn thành chấp nhận
friendRequestRoute.put(
    "/accept/:id",
    authMiddleware,
    updateFriendRequestAcceptController
);
// Xóa yêu cầu kết bạn
friendRequestRoute.delete(
    "/:id",
    authMiddleware,
    deleteFriendRequestController
);
// lời mời kết bạn gửi đến tôi mà đang PENDING
friendRequestRoute.get(
    "/pending/receiver",
    authMiddleware,
    getAllPendingFriendRequestsByReceiverIdController
);
// lời mời kết bạn tôi gửi mà đang PENDING
friendRequestRoute.get(
    "/pending/sender",
    authMiddleware,
    getAllPendingFriendRequestsBySenderIdController
);
// Lấy tất cả yêu cầu kết bạn đã chấp nhận
friendRequestRoute.get(
    "/accepted/userId",
    authMiddleware,
    getAllFriendRequestsAcceptedController
)
// Tìm kiếm bạn bè theo tên hoặc số điện thoại
friendRequestRoute.get(
    "/search/:query",
    authMiddleware,
    getFriendByNameOrPhoneController
);

module.exports = friendRequestRoute;