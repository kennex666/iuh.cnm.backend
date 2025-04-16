const {getAllMessagesController, getMessageByIdController, createMessageController, updateMessageController, deleteMessageController, getMessageByConversationIdController, getMessageBySenderIdController} = require('../controllers/message-controller');
const express = require("express");
const messageRoute = express.Router();
const {authMiddleware} = require("../middlewares/auth");

messageRoute.use(authMiddleware);
//get all messages
messageRoute.get("/" , getAllMessagesController);
//get message by id
messageRoute.get("/:id",  getMessageByIdController);
//save message
messageRoute.post("/",  createMessageController);
//update message
messageRoute.put("/:id",  updateMessageController);
//delete message
messageRoute.delete("/:id",  deleteMessageController);
//get message by conversationId
messageRoute.get("/conversation/:id/:number",  getMessageByConversationIdController);
//get message by senderId
messageRoute.get("/sender/:id",  getMessageBySenderIdController);

module.exports = messageRoute;

