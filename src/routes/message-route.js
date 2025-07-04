const {getAllMessagesController, getMessageByIdController, createMessageController, 
    updateMessageController, deleteMessageController, getMessageByConversationIdController,
     getMessageBySenderIdController,createVoteController, reactionsMessageController, getReactionsMessageController, searchMessagesController,
     removeVoteOptionController,
     addVoteOptionController} = require('../controllers/message-controller');
const express = require("express");
const messageRoute = express.Router();
const {authMiddleware} = require("../middlewares/auth");
const checkMessagingPermission = require("../middlewares/checkMessagingPermission");

messageRoute.use(authMiddleware);

messageRoute.get("/" , getAllMessagesController);
//get message by id
messageRoute.get("/:id",  getMessageByIdController);
//save message
messageRoute.post("/", checkMessagingPermission ,createMessageController);
//update message
messageRoute.put("/:id",  updateMessageController);
//delete message
messageRoute.delete("/:id",  deleteMessageController);
//get message by conversationId
messageRoute.get("/conversation/:id",  getMessageByConversationIdController);
//get message by senderId
messageRoute.get("/sender/:id",  getMessageBySenderIdController);
//create vote
messageRoute.post("/vote", checkMessagingPermission ,createVoteController);

messageRoute.post("/reactions/:messageId", reactionsMessageController);

messageRoute.get("/reactions/:messageId", getReactionsMessageController);

//search messages
messageRoute.get("/search/:id", searchMessagesController);
//remove vote option
messageRoute.put("/vote/remove-option",removeVoteOptionController);
//add vote option
messageRoute.put("/vote/add-option",addVoteOptionController);

module.exports = messageRoute;

