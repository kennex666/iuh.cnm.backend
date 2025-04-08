const express = require("express");
const {getAllConversationsController, getConversationByIdController, createConversationController, updateConversationController, deleteConversationController} = require("../controllers/conversationController");

const router = express.Router();

//get all conversations
router.get("/", getAllConversationsController);
//get conversation by id
router.get("/:id", getConversationByIdController);
//save conversation
router.post("/", createConversationController);
//update conversation
router.put("/:id", updateConversationController);
//delete conversation
router.delete("/:id", deleteConversationController);


module.exports = router;