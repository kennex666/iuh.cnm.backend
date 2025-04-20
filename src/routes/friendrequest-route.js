const express = require("express");

const { authMiddleware } = require("../middlewares/auth");
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

friendRequestRoute.use(authMiddleware);
// Lấy tất cả yêu cầu kết bạn
friendRequestRoute.get("/", getAllFriendRequestsController);
// Lấy tất cả yêu cầu kết bạn đã chấp nhận
friendRequestRoute.get(
	"/accepted/userId",
	getAllFriendRequestsAcceptedController
);
// Lấy yêu cầu kết bạn theo ID
friendRequestRoute.get("/:id", getFriendRequestByIdController);
// Tạo yêu cầu kết bạn mới
friendRequestRoute.post("/", createFriendRequestController);
// Cập nhật yêu cầu kết bạn thành từ chối
friendRequestRoute.put("/decline/:id", updateFriendRequestDeclineController);
// Cập nhật yêu cầu kết bạn thành chấp nhận
friendRequestRoute.put("/accept/:id", updateFriendRequestAcceptController);
// Xóa yêu cầu kết bạn
friendRequestRoute.delete("/:id", deleteFriendRequestController);
// lời mời kết bạn gửi đến tôi mà đang PENDING
friendRequestRoute.get(
	"/pending/receiver",
	getAllPendingFriendRequestsByReceiverIdController
);
// lời mời kết bạn tôi gửi mà đang PENDING
friendRequestRoute.get(
	"/pending/sender",
	getAllPendingFriendRequestsBySenderIdController
);
// Tìm kiếm bạn bè theo tên hoặc số điện thoại
friendRequestRoute.get("/search/:query", getFriendByNameOrPhoneController);

module.exports = friendRequestRoute;
