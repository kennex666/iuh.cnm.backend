const express = require("express");
const {getAllConversationsController, getConversationByIdController, createConversationController, updateConversationController, deleteConversationController,addParticipantsController, removeParticipantsController, transferAdminController, grantModController} = require("../controllers/conversation-controller");
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
//add participants
conversationRoute.put("/add-participants/:id", addParticipantsController);
//remove participants
conversationRoute.put("/remove-participants/:id", removeParticipantsController);
//transfer admin role
conversationRoute.put("/transfer-admin/:id", transferAdminController);
//grant mod role
conversationRoute.put("/grant-mod-role/:id", grantModController);


module.exports = conversationRoute;