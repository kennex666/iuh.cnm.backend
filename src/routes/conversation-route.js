const express = require("express");
const {getAllConversationsController, getConversationByIdController, createConversationController, updateConversationController, deleteConversationController} = require("../controllers/conversation-controller");
const {authMiddleware} = require("../middlewares/auth");
const conversationRoute = express.Router();

conversationRoute.use(authMiddleware);
//get all conversations
conversationRoute.get("/", getAllConversationsController);
//get conversation by id
conversationRoute.get("/:id", getConversationByIdController);
//save conversation
conversationRoute.post("/", createConversationController);
//update conversation
conversationRoute.put("/:id", updateConversationController);
//delete conversation
conversationRoute.delete("/:id", deleteConversationController);


module.exports = conversationRoute;