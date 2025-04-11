const {getAllMessagesController, getMessageByIdController, createMessageController, updateMessageController, deleteMessageController} = require('../controllers/message-controller');
const express = require("express");
const messageRoute = express.Router();

//get all messages
messageRoute.get("/", getAllMessagesController);
//get message by id
messageRoute.get("/:id", getMessageByIdController);
//save message
messageRoute.post("/", createMessageController);
//update message
messageRoute.put("/:id", updateMessageController);
//delete message
messageRoute.delete("/:id", deleteMessageController);

module.exports = messageRoute;

