const express = require("express");
const {getAllConversationsController, getConversationByIdController, 
    createConversationController, updateConversationController, 
    deleteConversationController,addParticipantsController, removeParticipantsController, 
    transferAdminController, grantModController,updateAllowMessagingCotroller,
    pinMessageController,joinGroupByUrlController} = require("../controllers/conversation-controller");
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
//add participants
conversationRoute.put("/add-participants/:id", addParticipantsController);
//remove participants
conversationRoute.put("/remove-participants/:id", removeParticipantsController);
//transfer admin role
conversationRoute.put("/transfer-admin/:id", transferAdminController);
//grant mod role
conversationRoute.put("/grant-mod-role/:id", grantModController);
//update allow messaging (Nhắn vào là đổi trạng thái từ fasle thành true và ngược lại)
conversationRoute.put("/update-allow-messaging/:id", updateAllowMessagingCotroller);
//pin message
conversationRoute.put("/pin-message/:id", pinMessageController);
//join group by url
conversationRoute.put("/join-group-by-url", joinGroupByUrlController);

conversationRoute.put("/:id", updateConversationController);
//delete conversation
conversationRoute.delete("/:id", deleteConversationController);


module.exports = conversationRoute;