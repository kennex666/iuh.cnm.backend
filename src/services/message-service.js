const { date } = require('joi');
const messageModel = require('../models/message-model');
const conversation = require("../models/conversation-model");
const { generateIdSnowflake } = require('../utils/id-generators');
const typeMessage = require('../models/type-message');


const getAllMessages = async (userId) => {
    try {
        const messages = await messageModel.find({senderId: userId});
        return messages;
    } catch (err) {
        console.error("Error creating message:", err);
        if (err instanceof Error) {
            throw new Error("Không tìm thấy tin nhắn. Vui lòng thử lại sau.");
        } else {
            throw new Error("Lỗi không xác định. Vui lòng thử lại sau.");
        }
    }
}
const getMessageById = async (userId, messageId) => {
    try {
        const messageData = await conversation.findOne({
            senderId: userId,
            id: messageId,
        });
        return messageData;
    } catch (error) {
        console.error("Error while fetching message:", error);
        throw new Error("Không thể tìm thấy tin nhắn. Vui lòng thử lại sau.");
    }
}

const getMessageByConversationId = async (req, res) => {
    try {
        const userId = req.user.id;
        const conversationId = req.params.id;
        const number = req.query.number
        const messageData = await messageModel.find({conversationId })
        .sort({createdAt: -1})
        .limit(number);
        
        // update readBy first
        // messageData[].readBy = messageData.readBy || [];
        // if (!messageData.readBy.includes(userId)) {
        //     messageData.readBy.push(userId);
        // }
        if (messageData.length > 0) {
            await messageModel.updateMany(
                { conversationId },
                { $addToSet: { readBy: userId } }
            );
        }
        return messageData;
    } catch (error) {
        console.error("Error while fetching message:", error);
        throw new Error("Không thể tìm thấy tin nhắn. Vui lòng thử lại sau.");
    }
}

const createMessage = async (data) => {
    try {
        data.readBy = [data.senderId]; // Đảm bảo rằng người gửi luôn có trong danh sách readBy
        const newMessage = new messageModel(data);
        const message = await newMessage.save();
        await conversation.updateOne(
			{ id: newMessage.conversationId }, // 👈 dùng `id` theo cách em setup
			{ $set: { lastMessage: message._id } }
		);
        return message;
    } catch (error) {
        console.error("Error creating post:", err);
        if (err instanceof Error) {
            throw new Error("Không thể tạo bài viết. Vui lòng thử lại sau.");
        } else {
            throw new Error("Lỗi không xác định. Vui lòng thử lại sau.");
        }
    }
}

const updateSeen = async ( messageId, userId) => {
    try {
        const message = await messageModel.findById(messageId);
        if (!message) {
            throw new Error("Message not found");
        }
        if (!message.readBy) {
            message.readBy = [];
        }
        if (!message.readBy.includes(userId)) {
            message.readBy.push(userId);
        }
        await message.save();
    } catch (error) {
        console.error("Error while updating seen status:", error);
        throw new Error("Không thể cập nhật trạng thái đã xem. Vui lòng thử lại sau.");
    }
}

const updateMessage = async (req, res) => {
    try {
        const messageId = req.params.id;
        const updateMessage = await messageModel.findByIdAndUpdate(messageId, req.body, { new: true });
        await conversation.updateOne(
			{ id: updateMessage.conversationId }, // 👈 dùng `id` theo cách em setup
			{ $set: { lastMessage: updateMessage._id } }
		);
		return updateMessage;
    } catch (error) {
        console.error("Error while updating message:", error);
        throw new Error("Không thể cập nhật tin nhắn. Vui lòng thử lại sau.");   
    }
}

const deleteMessage = async (req, res) => {
    try {
        const messageId = req.params.id;
        const deletedMessage = await messageModel.findByIdAndDelete(messageId);
        return deletedMessage;
    } catch (error) {
        console.error("Error while deleting message:", error);
        throw new Error("Không thể xóa tin nhắn. Vui lòng thử lại sau.");
    }
}

const getMessageBySenderId = async (userId) => {
    try {
        const messageData = await messageModel.find({
            senderId: userId,
        });
        return messageData;
    } catch (error) {
        console.error("Error while fetching message:", error);
        throw new Error("Không thể tìm thấy tin nhắn. Vui lòng thử lại sau.");
    }
}

const createVote = async ({ senderId, conversationId, question, options, multiple = false }) => {
    const voteOptions = options.map(text => ({
      id: generateIdSnowflake().toString(),
      text,
      votes: [] // danh sách userId đã vote
    }));
  
    const votePayload = {
      question,
      options: voteOptions,
      multiple
    };
  
    const message = await messageModel.create({
      conversationId,
      senderId,
      content: JSON.stringify(votePayload),
      type: typeMessage.VOTE,
      sentAt: new Date(),
      readBy: [senderId]
    });
  
    return message;
  };



module.exports = {
	getAllMessages,
	getMessageById,
	createMessage,
	updateMessage,
	deleteMessage,
	getMessageByConversationId,
	getMessageBySenderId,
	updateSeen,
    createVote
};