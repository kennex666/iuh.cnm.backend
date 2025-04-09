const {getAllMessagesController, getMessageByIdController, createMessageController, updateMessageController, deleteMessageController} = require('../controllers/message-controller');
const express = require("express");
const messageRoute = express.Router();
const authMiddleware = require("../middlewares/auth");

//get all messages
messageRoute.get("/", authMiddleware, getAllMessagesController);
//get message by id
messageRoute.get("/:id", authMiddleware, getMessageByIdController);
//save message
messageRoute.post("/", authMiddleware, createMessageController);
//update message
messageRoute.put("/:id", authMiddleware, updateMessageController);
//delete message
messageRoute.delete("/:id", authMiddleware, deleteMessageController);

module.exports = messageRoute;

