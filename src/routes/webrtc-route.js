const express = require("express");
const { authMiddleware } = require("../middlewares/auth");
const messageModel = require("../models/message-model");

const { read } = require("fs");
const { getConversationById } = require("../services/conversation-service");
const { sendMessage } = require("../services/socket-emit-service");
const { getIO, waitingListMessageIdAdd } = require("./socket-routes");
const { error } = require("console");
const path = require("path");
// const { authMiddleware } = require("../middlewares/auth");

const webrtcRoute = express.Router();

// webrtcRoute.use(authMiddleware);

webrtcRoute.get("/", (req, res) => {
    res.json({
        message: "WebRTC route is working",
    });
});

webrtcRoute.get("/ping", (req, res) => {
    res.status(200).json({ message: "pong" });
}); 

webrtcRoute.get("/create-call/:conversationId", authMiddleware, async (req, res) => {
    const conversationId = req.params?.conversationId;
    const type = req.query?.type || "audio";
    const userId = req.user.id;
    if (!conversationId) {
        return res.status(200).json({errorMessage: "conversationId không được để trống", errorCode: 100});
    }
    // Check if the conversationId is valid
    console.log("webrtcRoute conversationId:", conversationId);
    const conversation = await getConversationById(userId, conversationId);
    if (!conversation) {
        return res.status(200).json({errorMessage: "conversationId không hợp lệ", errorCode: 100});
    }
    // Check if the user is a participant in the conversation
    const isParticipant = conversation.participantIds.includes(req.user.id);
    if (!isParticipant) {
        return res.status(200).json({errorMessage: "Bạn không phải là người tham gia cuộc trò chuyện này", errorCode: 100});
    }
    // if dataMessage type is "call" and content is "start" then create a new message

    const queryCall = {
        conversationId: conversationId,
        type: "call",
    }

    const recentlyMessage = await messageModel.findOne(queryCall).sort({ sentAt: -1 }).limit(1);

    if (recentlyMessage) {
        if (recentlyMessage.content === "start") {
            // update message content to "end"
            recentlyMessage.content = "end";
            recentlyMessage.readBy = [req.user.id];
            await recentlyMessage.save();
        }
    }

    const dataMessage = {
        conversationId: conversationId,
        senderId: req.user.id,
        type: "call",
        content: "start",
        readBy: [req.user.id],
    };

    const message = await messageModel.create(dataMessage);
    conversation.lastMessage = message._id;
    await conversation.save();
    sendMessage(getIO(), conversation.participantIds, message);
    waitingListMessageIdAdd(message.id);
    res.status(200).json({
        message: "Cuộc gọi đã được bắt đầu",
        data: message,
    });
});

webrtcRoute.get("/end-call/:conversationId", authMiddleware, async (req, res) => {
    const conversationId = req.params?.conversationId;
    const userId = req.user.id;
    if (!conversationId) {
        return res.status(200).json({errorMessage: "conversationId không được để trống", errorCode: 100});
    }
    // Check if the conversationId is valid
    console.log("webrtcRoute conversationId:", conversationId);
    const conversation = await getConversationById(userId, conversationId);
    if (!conversation) {
        return res.status(200).json({errorMessage: "conversationId không hợp lệ", errorCode: 100});
    }
    // Check if the user is a participant in the conversation
    const isParticipant = conversation.participantIds.includes(req.user.id);
    if (!isParticipant) {
        return res.status(200).json({errorMessage: "Bạn không phải là người tham gia cuộc trò chuyện này", errorCode: 100});
    }
    // if dataMessage type is "call" and content is "start" then create a new message

    const queryCall = {
        conversationId: conversationId,
        type: "call",
    }

    const recentlyMessage = await messageModel.findOne(queryCall).sort({ sentAt: -1 }).limit(1);

    if (!recentlyMessage) {
        return res.status(200).json({ errorMessage: "Cuộc gọi chưa được bắt đầu", errorCode: 100 });
    }
    
    if (recentlyMessage.content != "start") {
        return res.status(200).json({ errorMessage: "Cuộc gọi chưa được bắt đầu", errorCode: 100 });
    }

    const dataMessage = {
        conversationId: conversationId,
        senderId: req.user.id,
        type: "call",
        content: "end",
        readBy: [req.user.id],
    };

    const message = await messageModel.create(dataMessage);
    conversation.lastMessage = message._id;
    await conversation.save();
    sendMessage(getIO(), conversation.participantIds, message);
    res.status(200).json({
        message: "Cuộc gọi đã kết thúc",
        data: message,
    });
});

webrtcRoute.get("/call/:conversationId/:userId/:messageId", async (req, res) => {
	const { conversationId, messageId, userId } = req.params;
	if (!conversationId || !messageId || !userId) {
		return res
			.status(200)
			.json({
				errorMessage:
					"conversationId, messageId, userId không được để trống",
				errorCode: 100,
			});
	}

	// Check if the user is a participant in the conversation
	const conversation = await getConversationById(userId, conversationId);
	if (!conversation) {
		return res
			.status(200)
			.json({
				errorMessage: "conversationId không hợp lệ",
				errorCode: 100,
			});
	}

	const queryCall = {
		conversationId: conversationId,
		type: "call",
	};

	const recentlyMessage = await messageModel
		.findOne(queryCall)
		.sort({ sentAt: -1 })
		.limit(1);

	if (!recentlyMessage) {
		return res
			.status(200)
			.json({ errorMessage: "Cuộc gọi chưa bắt đầu", errorCode: 100 });
	}
	if (recentlyMessage) {
		if (recentlyMessage.content != "start") {
			return res
				.status(200)
				.json({
					errorMessage: "Cuộc gọi chưa bắt đầu",
					errorCode: 100,
				});
		}
		if (recentlyMessage.id.toString() != messageId) {
			return res
				.status(200)
				.json({
					errorMessage: "Cuộc gọi không hợp lệ",
					errorCode: 100,
				});
		}
	}

	// web rtc public html
	const filePath = path.join(__dirname, "..", "public", "webrtc.html");
	return res.sendFile(filePath);
})

module.exports = webrtcRoute;
