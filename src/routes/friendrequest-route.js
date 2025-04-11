const express = require("express");
const { getAllFriendRequestsController, getFriendRequestByIdController, createFriendRequestController, updateFriendRequestAcceptController, updateFriendRequestDeclineController, deleteFriendRequestController, getAllPendingFriendRequestsController, getAllAcceptedFriendRequestsController, getAllDeclinedFriendRequestsController } = require("../controllers/friendRequest-controller");

const friendRequestRoute = express.Router();

//get all friend requests
friendRequestRoute.get("/", getAllFriendRequestsController);
//get friend request by id
friendRequestRoute.get("/:id", getFriendRequestByIdController);
//save friend request
friendRequestRoute.post("/", createFriendRequestController);
//update friend request
friendRequestRoute.put("/accept/:id", updateFriendRequestAcceptController);
//update friend request
friendRequestRoute.put("/decline/:id", updateFriendRequestDeclineController);
//delete friend request
friendRequestRoute.delete("/:id", deleteFriendRequestController);
//get friend request status is pending
friendRequestRoute.get("/pending/:id", getAllPendingFriendRequestsController);
//get friend request status is accept
friendRequestRoute.get("/accepted/:id", getAllAcceptedFriendRequestsController);
//get friend request status is decline
friendRequestRoute.get("/decline/:id", getAllDeclinedFriendRequestsController);

module.exports = friendRequestRoute;