const express = require("express");
const {getAllConversations, getConversationById, createConversation, updateConversation, deleteConversation} = require("../services/conversationService");
const conversation = require("../models/conversationModel");

const router = express.Router();

//get all conversations
router.get("/", async (req, res) => {
    try {
        const conversations = await getAllConversations(req, res);
        res.status(200).json(conversations);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});
//get conversation by id
router.get("/:id", async (req, res) => {
    try {
        const conversation = await getConversationById(req, res);
        res.status(200).json(conversation);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});
//save conversation
router.post("/", async (req, res) => {
    try {
        console.log(req.body);
        const {
            id,
            isGroup,
            name,
            avatar,
            participants,
            adminIds,
            settings,
        } = req.body;
        const newConversation = await createConversation({
            id,
            isGroup,
            name,
            avatar,
            participants,
            adminIds,
            settings,
        });
        res.status(201).json(newConversation);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});
//update conversation
router.put("/:id", async (req, res) => {
    try {
        const updatedConversation = await updateConversation(req, res);
        res.status(200).json(updatedConversation);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});
//delete conversation
router.delete("/:id", async (req, res) => {
    try {
        const deletedConversation = await deleteConversation(req, res);
        res.status(200).json(deletedConversation);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});


module.exports = router;