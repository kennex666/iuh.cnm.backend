const express = require("express");
const { getAllFriendRequestsController, getFriendRequestByIdController, createFriendRequestController, updateFriendRequestAcceptController, updateFriendRequestDeclineController, deleteFriendRequestController, getAllPendingFriendRequestsController, getAllAcceptedFriendRequestsController, getAllDeclinedFriendRequestsController } = require("../controllers/friendRequest-controller");
const authMiddleware = require("../middlewares/auth");
const friendRequestRoute = express.Router();

//get all friend requests
friendRequestRoute.get("/", authMiddleware, getAllFriendRequestsController);
//get friend request by id
friendRequestRoute.get("/:id",  authMiddleware,getFriendRequestByIdController);
//save friend request
friendRequestRoute.post("/",  authMiddleware,createFriendRequestController);
//update friend request
friendRequestRoute.put("/accept/:id",  authMiddleware,updateFriendRequestAcceptController);
//update friend request
friendRequestRoute.put("/decline/:id",  authMiddleware,updateFriendRequestDeclineController);
//delete friend request
friendRequestRoute.delete("/:id",  authMiddleware,deleteFriendRequestController);
//get friend request status is pending
friendRequestRoute.get("/pending/:id",  authMiddleware,getAllPendingFriendRequestsController);
//get friend request status is accept
friendRequestRoute.get("/accepted/:id",  authMiddleware,getAllAcceptedFriendRequestsController);
//get friend request status is decline
friendRequestRoute.get("/decline/:id",  authMiddleware,getAllDeclinedFriendRequestsController);

module.exports = friendRequestRoute;