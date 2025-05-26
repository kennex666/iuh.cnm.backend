const {getAllMessages, getMessageById, createMessage, updateMessage, 
    deleteMessage, getMessageByConversationId,getMessageBySenderId, getReactionsMessage, createVote,reactionsMessages,
    removeVoteOption,
    addVoteOption} = require("../services/message-service");
const {handleError,responseFormat,AppError } = require("../utils/response-format");
const getAllMessagesController = async (req, res) => {
    try {
        const userId = req.user.id;
        const messages = await getAllMessages(userId);
        if (!messages) {
            throw new AppError("Messages not found", 404);
        }
        responseFormat(res, messages, "Get all messages successfully", true, 200);
    } catch (error) {
        handleError(error, res, "Failed to retrieve messages");
    }
}

const getMessageByIdController = async (req, res) => {
    try {
        const userId = req.user.id;
        const messageId = req.params.id;
        const message = await getMessageById(userId, messageId);
        if (!message) {
            throw new AppError("Message not found", 404);
        }
        responseFormat(res, message, "Get message successfully", true, 200);
    } catch (error) {
        handleError(error, res, "Failed to retrieve message");
    }
}
const createMessageController = async (req, res) => {
    try {
        const userId = req.user.id; // Lấy userId từ token
        const { id,conversationId,content,type,repliedTold,readBy } = req.body;
        const newMessage = await createMessage({
            id,
            conversationId,
            senderId: userId,
            content,
            type,
            repliedTold,
            readBy,
        });
        if (!newMessage) {
            throw new AppError("Failed to create message", 400);
        }
        responseFormat(res, newMessage, "Create message successfully", true, 200);
    } catch (error) {
        handleError(error, res, "Create message failed");
    }
}
const updateMessageController = async (req, res) => {
    try {
        const userId = req.user.id;
        // const message = await getMessageById(userId, req.params.id);
        // if(!message || message.senderId !== userId) {
        //     throw new AppError("Message not found", 404);
        // }
        const updatedMessage = await updateMessage(req, res);
        if (!updatedMessage) {
            throw new AppError("Message not found", 404);
        }
        responseFormat(res, updatedMessage, "Update message successfully", true, 200);
    } catch (error) {
        handleError(error, res, "Update message failed");
    }
}
const deleteMessageController = async (req, res) => {
    try {
        // const userId = req.user.id; 
        // const message = await getMessageById(userId, req.params.id);
        // if(!message || message.senderId !== userId) {
        //     throw new AppError("Message not found", 404);
        // }
        const deletedMessage = await deleteMessage(req, res);
        if (!deletedMessage) {
            throw new AppError("Message not found", 404);
        }
        responseFormat(res, deletedMessage, "Delete message successfully", true, 200);
    } catch (error) {
        handleError(error, res, "Delete message failed");
    }
}

const getMessageByConversationIdController = async (req, res) => {
    try {
        const messages = await getMessageByConversationId(req, res);
        if (!messages) {
            throw new AppError("Messages not found", 404);
        }
        responseFormat(res, messages, "Get messages by conversation ID successfully", true, 200);
    } catch (error) {
        handleError(error, res, "Failed to retrieve messages by conversation ID");
    }
}

const getMessageBySenderIdController = async (req, res) => {
    try {
        const senderId = req.params.id;
        const message = await getMessageBySenderId(senderId);
        if (!message) {
            throw new AppError("Message not found", 404);
        }
        responseFormat(res, message, "Get message successfully", true, 200);
    } catch (error) {
        handleError(error, res, "Failed to retrieve message");
    }
}

const createVoteController = async (req, res) => {
    try {
      const userId = req.user.id;
      const { conversationId, question, options, multiple = false } = req.body;
  
      if (!question || !Array.isArray(options) || options.length < 2) {
        return res.status(400).json({ message: "Vote must have a question and at least 2 options" });
      }
  
      const result = await createVote({
        senderId: userId,
        conversationId,
        question,
        options,
        multiple
      });
  
      responseFormat(res, result, "Vote created successfully", true, 201);
    } catch (error) {
      handleError(error, res, "Create vote failed");
    }
  };
const removeVoteOptionController = async (req, res) => {
    try {
        const { messageId, optionId } = req.body;
        const result = await removeVoteOption(messageId, optionId);
        const result_JSON = JSON.parse(JSON.stringify(result));
        responseFormat(res, result_JSON, "Remove vote option successfully", true, 200);
    } catch (error) {
        handleError(error, res, "Remove vote option failed");
    } 
};

const addVoteOptionController = async (req, res) => {
    try {
        const { messageId, optionText } = req.body;
        const result = await addVoteOption(messageId, optionText);
        const result_JSON = JSON.parse(JSON.stringify(result));
        responseFormat(res, result_JSON, "Add vote option successfully", true, 200);
    } catch (error) {
        handleError(error, res, "Add vote option failed");
    }
};
  const reactionsMessageController = async (req, res) => {
    try {
        const { messageId } = req.params;
        userId = req.user.id; 
        const { reactionType } = req.body;

        if (!messageId || !userId) {
            return res.status(200).json({ message: "Missing required fields" });
        }

        const result = await reactionsMessages(messageId, userId, reactionType);
        responseFormat(res, result.reaction, "Reaction added successfully", true, 200);
    } catch (error) {
        handleError(error, res, "Failed to add reaction");
    }
}

 const getReactionsMessageController = async (req, res) => {
        try {
            const { messageId } = req.params;
            if (!messageId) {
                return res.status(400).json({ message: "Message ID is required" });
            }
            const reactions = await getReactionsMessage(messageId);
            responseFormat(res, reactions, "Get reactions successfully", true, 200);
        } catch (error) {
            handleError(error, res, "Failed to retrieve reactions");
        }
}

module.exports = {
    getAllMessagesController,
    getMessageByIdController,
    createMessageController,
    updateMessageController,
    deleteMessageController,
    getMessageByConversationIdController,
    getMessageBySenderIdController,
    createVoteController,
    reactionsMessageController,
    getReactionsMessageController,
    removeVoteOptionController,
    addVoteOptionController
};