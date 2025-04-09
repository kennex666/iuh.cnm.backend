const express = require("express");
const {getAllConversationsController, getConversationByIdController, createConversationController, updateConversationController, deleteConversationController} = require("../controllers/conversation-controller");
const authMiddleware = require("../middlewares/auth");
const conversationRoute = express.Router();

//get all conversations
conversationRoute.get("/",authMiddleware, getAllConversationsController);
//get conversation by id
conversationRoute.get("/:id", authMiddleware, getConversationByIdController);
//save conversation
conversationRoute.post("/", authMiddleware, createConversationController);
//update conversation
conversationRoute.put("/:id", authMiddleware, updateConversationController);
//delete conversation
conversationRoute.delete("/:id", authMiddleware, deleteConversationController);


module.exports = conversationRoute;