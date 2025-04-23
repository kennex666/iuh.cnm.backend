const express = require("express");
const { authMiddleware } = require("../middlewares/auth");
const messageModel = require("../models/message-model");

const { read } = require("fs");
const { getConversationById } = require("../services/conversation-service");
const { sendMessage } = require("../services/socket-emit-service");
const { getIO } = require("./socket-routes");
const { error } = require("console");
const path = require("path");
// const { authMiddleware } = require("../middlewares/auth");

const testRoutes = express.Router();

testRoutes.get("/", (req, res) => {
    res.json({
        message: "WebRTC route is working",
    });
});

testRoutes.get("/ping", (req, res) => {
    res.status(200).json({ message: "pong" });
}); 
testRoutes.get("/call/:conversationId/:userId/:messageId", async (req, res) => {
	const { conversationId, messageId, userId } = req.params;

	// web rtc public html
	const filePath = path.join(__dirname, "..", "public", "webrtc.html");
	return res.sendFile(filePath);
})

module.exports = testRoutes;
