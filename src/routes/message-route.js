const {getAllMessagesController, getMessageByIdController, createMessageController, updateMessageController, deleteMessageController, getMessageByConversationIdController, getMessageBySenderIdController} = require('../controllers/message-controller');
const express = require("express");
const messageRoute = express.Router();
const authMiddleware = require("../middlewares/auth");

//get all messages
messageRoute.get("/",authMiddleware , getAllMessagesController);
//get message by id
messageRoute.get("/:id",authMiddleware,  getMessageByIdController);
//save message
messageRoute.post("/",authMiddleware,  createMessageController);
//update message
messageRoute.put("/:id",authMiddleware,  updateMessageController);
//delete message
messageRoute.delete("/:id",authMiddleware,  deleteMessageController);
//get message by conversationId
messageRoute.get("/conversation/:id",authMiddleware,  getMessageByConversationIdController);
//get message by senderId
messageRoute.get("/sender/:id",authMiddleware,  getMessageBySenderIdController);

module.exports = messageRoute;

