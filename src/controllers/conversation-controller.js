const { error } = require("console");
const {
  getAllConversations,
  getConversationById,
  createConversation,
  updateConversation,
  deleteConversation,
  addParticipants,
  removeParticipants,
  transferAdminRole,
  grantModRole,
  updateAllowMessaging,
  pinMessage,
  joinGroupByUrlService,
  removeModRole,
  updateConversationNew,
  removePinMessage
} = require("../services/conversation-service");
const {
  AppError,
  handleError,
  responseFormat
} = require("../utils/response-format");
const userService = require("../services/user-service");
const { updateSearchIndex } = require("../models/conversation-model");
const { generateIdSnowflake } = require("../utils/id-generators");
const conversation = require("../models/conversation-model");
const Conversation = require("../models/conversation-model");
const { sendMessage } = require("../services/socket-emit-service");
const { getIO } = require("../utils/socketio");
const { createMessage } = require("../services/message-service");
const getAllConversationsController = async (req, res) => {
  try {
    const userId = req.user.id;
    const conversations = await getAllConversations(userId);
    if (!conversations) {
      throw new AppError("Conversations not found", 404);
    }
    responseFormat(
      res,
      conversations,
      "Conversation retrieved successfully",
      true,
      200
    );
  } catch (error) {
    handleError(error, res, "Failed to retrieve user");
  }
};
const getConversationByIdController = async (req, res) => {
  try {
    const userId = req.user.id;
    const conversationId = req.params.id;
    const conversation = await getConversationById(userId, conversationId);
    if (!conversation) {
      throw new AppError("Conversation not found", 404);
    }
    responseFormat(res, conversation, "User retrieved successfully", true, 200);
  } catch (error) {
    handleError(error, res, "Failed to retrieve user");
  }
};
const createConversationController = async (req, res) => {
  try {
    const userId = req.user.id; // Lấy userId từ token

    const {
      isGroup,
      name,
      avatarUrl,
      avatarGroup,
      participantIds = [],
      participantInfo = [],
      pinMessages = [],
      settings = {}
    } = req.body;
    // // Đảm bảo userId của người tạo được thêm vào participants và adminIds
    // if (!participantIds.includes(userId)) participantIds.push(userId);
    // if (!participantInfo.some(info => info.id === userId)) {
    //     const user = await userService.getUserById(userId);
    //     participantInfo.push({ id: userId, name: user.name ,avatar: avatarUrl });
    // }
    // Đảm bảo userId của người tạo được thêm vào participants và participantInfo
    if (!participantIds.includes(userId)) participantIds.push(userId);

    // Bổ sung hoặc cập nhật thông tin participantInfo
    for (let i = 0; i < participantIds.length; i++) {
      const pid = participantIds[i];
      let info = participantInfo.find((p) => p.id === pid);

      // Nếu chưa có thì thêm mới
      if (!info) {
        const user = await userService.getUserById(pid);
        participantInfo.push({
          id: pid,
          name: user?.name || "Unknown",
          avatar: user?.avatar || "default",
          nickname: "",
          role: pid === userId ? "admin" : "member"
        });
      } else {
        // Nếu đã có mà thiếu name thì cập nhật lại
        if (!info.name) {
          const user = await userService.getUserById(pid);
          info.name = user?.name || "Unknown";
        }
      }
    }
    const conversationId = generateIdSnowflake(); // Tạo conversationId
    const url = `https://imessify.com/conversations/${conversationId}`;


    const newConversation = await createConversation({
      isGroup,
      name,
      avatarUrl,
      avatarGroup,
      type: isGroup ? "group" : "1vs1",
      participantIds,
      participantInfo,
      url,
      pinMessages,
      settings
    });

    const conversationObject = newConversation.toObject();

    if (!newConversation) {
      throw new AppError("Failed to create conversation", 400);
    }

    responseFormat(
      res,
      conversationObject,
      "Create conversation successful",
      true,
      200
    );
  } catch (error) {
    handleError(error, res, "Create conversation failed");
  }
};

const updateConversationController = async (req, res) => {
  try {
    // const userId = req.user.id; // Lấy userId từ token
    // const conversationId = req.params.id;

    // // Lấy cuộc trò chuyện từ database
    // const conversation = await getConversationById(userId, conversationId);
    // //Kiểm tra quyền admin
    // console.log(conversation.id);
    // if (!Array.isArray(conversation.adminIds) || !conversation.adminIds.includes(userId)) {
    //     throw new AppError("You are not authorized to update this conversation", 403);
    // }

    const updatedConversation = await updateConversation(req, res);

    if (!updatedConversation) {
      throw new AppError("Conversation not found", 404);
    }

    const currentName = updatedConversation.participantInfo.find(
      (p) => p.id === req.user.id
    )?.name;
  
    sendMessage(
      getIO(),
      updatedConversation.participantInfo.map((p) => p.id),
      {
        conversationId: updatedConversation.id,
        senderId: req.user.id,
        type: "system",
        content: `${currentName} đã cập nhật thông tin cuộc trò chuyện!`,
        readBy: [req.user.id],
      }
    );

    responseFormat(
      res,
      updatedConversation,
      "Update conversation successful",
      true,
      200
    );
  } catch (error) {
    handleError(error, res, "Update conversation failed");
  }
};

const deleteConversationController = async (req, res) => {
  try {
    // const userId = req.user.id; // Lấy userId từ token
    // const conversationId = req.params.id;

    // // Lấy cuộc trò chuyện từ database
    // const conversation = await getConversationById(userId,conversationId);

    // // Kiểm tra quyền admin
    // if (!conversation || !conversation.adminIds.includes(userId)) {
    //     throw new AppError("You are not authorized to delete this conversation", 403);
    // }

    const deletedConversation = await deleteConversation(req, res);

    if (!deletedConversation) {
      throw new AppError("Conversation not found", 404);
    }

    sendMessage(
      getIO(),
      deletedConversation.participantInfo.map((p) => p.id),
      {
        conversationId: deletedConversation.id,
        senderId: req.user.id,
        type: "deleted_conversation",
        content: "end",
        readBy: [req.user.id],
      }
    );
    responseFormat(
      res,
      deletedConversation,
      "Delete conversation successful",
      true,
      200
    );
  } catch (error) {
    console.log(error)
    handleError(error, res, "Delete conversation failed");
  }
};

const leftConversationController = async (req, res) => {
	try {
		const userId = req.user.id; // Lấy userId từ token
		const conversationId = req.params.id;
		// Lấy cuộc trò chuyện từ database
    console.log("userId", userId);
    console.log("conversationId", conversationId);
		const conversation = await getConversationById(userId, conversationId);
    console.log("conversation", conversation);
    if (!conversation) {
			throw new AppError("Conversation not found", 404);
		}
		const participantIds = conversation.participantInfo.map((p) => p.id);
		if (!participantIds.includes(userId)) {
			throw new AppError(
				"You are not a participant in this conversation",
				403
			);
		}
		conversation.participantInfo = conversation.participantInfo.filter(
			(p) => p.id !== userId
		);

		conversation.participantIds = participantIds;
		const updatedConversation = await updateConversationNew(
			conversationId,
			{
				participantInfo: conversation.participantInfo,
				participantIds: conversation.participantInfo.map((p) => p.id),
			}
		);

		if (!updatedConversation) {
			throw new AppError("Failed to left conversation", 400);
		}

		const message = await createMessage({
			conversationId: conversation.id,
			senderId: userId,
			type: "left_conversation",
			content: "end",
			readBy: [userId],
		});

		// Gửi thông báo cho tất cả người tham gia cuộc trò chuyện
		if (!message) {
			throw new AppError(
				"Failed to create left conversation message",
				400
			);
		}

		sendMessage(getIO(), participantIds, message);

		responseFormat(
			res,
			updatedConversation,
			"Left conversation successful",
			true,
			200
		);
	} catch (error) {
		console.error("Error in leftConversarionController:", error);
		handleError(error, res, "Left conversation failed");
	}
};

const addParticipantsController = async (req, res) => {
  try {
    const userId = req.user.id; // Lấy userId từ token
    const conversationId = req.params.id;
    const { participantIds } = req.body;

    const conversation = await getConversationById(userId, conversationId);
    if (!conversation) {
      throw new AppError("Conversation not found", 404);
    }

    const currentName = conversation.participantInfo.find(
      (p) => p.id === userId
    )?.name;

    // Fetch participant information and avoid duplicates
    const fetchedParticipants = new Set(); // To track unique participant IDs
    const participantInfo = await Promise.all(
      participantIds.map(async (id) => {
        try {
          if (fetchedParticipants.has(id)) {
            return null; // Skip duplicate IDs
          }
          const user = await userService.getUserById(id);
          fetchedParticipants.add(id); // Add ID to the set
          return {
            id: user.id,
            name: user.name,
            avatar: user.avatarUrl,
            nickname: user.name,
            role: "member"
          };
        } catch (error) {
          console.error(`Failed to fetch user with id: ${id}`, error);
          return null; // Handle errors gracefully
        }
      })
    ).then((results) => results.filter((info) => info !== null)); // Remove null values

    const newNameParticipants = participantInfo.map((info) => info.name);

    const updatedConversation = await addParticipants(
      conversationId,
      participantIds,
      participantInfo
    );

    if (!updatedConversation) {
      throw new AppError("Failed to add participants", 400);
    }

    const message = await createMessage({
        conversationId: updatedConversation.id,
        senderId: userId,
        type: "system",
        content: `${currentName} đã thêm thành viên mới: ${newNameParticipants.join(
          ", "
        )}`,
        readBy: [userId],
    });


    // Gửi thông báo cho tất cả người tham gia cuộc trò chuyện
    sendMessage(
      getIO(),
      updatedConversation.participantInfo.map((p) => p.id),
      message
    );

    responseFormat(
      res,
      updatedConversation,
      "Add participants successful",
      true,
      200
    );
  } catch (error) {
    handleError(error, res, "Add participants failed");
  }
};

const removeParticipantsController = async (req, res) => {
  try {
		const userId = req.user.id; // Lấy userId từ token
		const conversationId = req.params.id;
		const { participantIds } = req.body;

		const conversation = await getConversationById(userId, conversationId);
		if (!conversation) {
			throw new AppError("Conversation not found", 404);
		}

		const participants = conversation.participantInfo;

		const isAuthorized = participants.some(
			(p) => p.id === userId && p.role != "member" // Kiểm tra xem người dùng có quyền admin hoặc mod
		);

		if (!isAuthorized) {
			throw new AppError(
				"You are not authorized to remove participants",
				403
			);
		}

		// if in array participantIds, participantIds in conversation is admin
		const isAdmin = participantIds.some((id) => {
			const participant = participants.find((p) => p.id === id);
			return participant && participant.role === "admin";
		});
    // Kiểm tra xem người dùng có quyền admin trong cuộc trò chuyện hay không
    if (isAdmin) {
      throw new AppError(
        "You are not authorized to remove admin",
        403
      );
    }

		const updatedConversation = await removeParticipants(
			conversationId,
			participantIds
		);

		if (!updatedConversation) {
			throw new AppError("Failed to remove participants", 400);
		}

		const currentName = conversation.participantInfo.find(
			(p) => p.id === userId
		)?.name;

		const removed = participants.filter(
			(p) => !updatedConversation.participantIds.includes(p.id)
		);

		const message = await createMessage({
			conversationId: updatedConversation.id,
			senderId: userId,
			type: "system",
			content: `${currentName} xoá thành viên: ${removed
				.map((p) => p.name)
				.join(", ")}`,
			readBy: [userId],
		});

		// Gửi thông báo cho tất cả người tham gia cuộc trò chuyện
		sendMessage(
			getIO(),
			updatedConversation.participantInfo.map((p) => p.id),
			message
		);

		responseFormat(
			res,
			updatedConversation,
			"Remove participants successful",
			true,
			200
		);
  } catch (error) {
    handleError(error, res, "Remove participants failed");
  }
};

const transferAdminController = async (req, res) => {
  try {
    const fromUserId = req.user.id;
    const conversationId = req.params.id;
    const { toUserId } = req.body;

    if (!conversationId || !toUserId) {
      throw new Error("Missing conversationId or toUserId");
    }

    const updatedConversation = await transferAdminRole(
      conversationId,
      fromUserId,
      toUserId
    );

    if (!updatedConversation) {
      throw new AppError("Failed to transfer admin role", 400);
    }
    
		const currentName = updatedConversation.participantInfo.find(
			(p) => p.id === fromUserId
		)?.name;
    
		const toName = updatedConversation.participantInfo.find(
			(p) => p.id === toUserId
		)?.name;



    const message = await createMessage({
        conversationId: updatedConversation.id,
        senderId: fromUserId,
        type: "system",
        content: `${currentName} đã chuyển trưởng nhóm cho ${toName}`,
        readBy: [fromUserId],
    });


    // Gửi thông báo cho tất cả người tham gia cuộc trò chuyện
    sendMessage(
      getIO(),
      updatedConversation.participantInfo.map((p) => p.id),
      message
    );

    responseFormat(
      res,
      updatedConversation,
      "Transferred admin role successfully",
      true,
      200
    );
  } catch (error) {
    handleError(error, res, "Transfer admin failed");
  }
};
// Admin cấp quyền mod cho người dùng
const grantModController = async (req, res) => {
  try {
    const fromUserId = req.user.id; // Lấy userId từ token
    const conversationId = req.params.id;
    const { toUserId } = req.body;

    if (!conversationId || !toUserId) {
      throw new AppError("Missing conversationId or toUserId", 400);
    }

    const updatedConversation = await grantModRole(
      conversationId,
      fromUserId,
      toUserId
    );
      const currentName = updatedConversation.participantInfo.find(
      (p) => p.id === fromUserId
    )?.name;

    const toName = updatedConversation.participantInfo.find(
      (p) => p.id === toUserId
    )?.name;

    const message = await createMessage({
      conversationId: updatedConversation.id,
      senderId: fromUserId,
      type: "system",
      content: `${currentName} đã thăng chức cho ${toName} trở thành mod`,
      readBy: [fromUserId],
    });

    // Gửi thông báo cho tất cả người tham gia cuộc trò chuyện
    sendMessage(
      getIO(),
      updatedConversation.participantInfo.map((p) => p.id),
      message
    );


    responseFormat(
      res,
      updatedConversation,
      "Granted mod role successfully",
      true,
      200
    );
  } catch (error) {
    handleError(error, res, "Grant mod failed");
  }
};

// Admin xóa quyền mod của người dùng
const removeModController = async (req, res) => {
  try {
    const fromUserId = req.user.id; // Lấy userId từ token
    const conversationId = req.params.id;
    const { toUserId } = req.body;

    if (!conversationId || !toUserId) {
      throw new AppError("Missing conversationId or toUserId", 400);
    }

    const updatedConversation = await removeModRole(
      conversationId,
      fromUserId,
      toUserId
    );

    if (!updatedConversation) {
      throw new AppError("Failed to remove mod role", 400);
    }
    const currentName = updatedConversation.participantInfo.find(
      (p) => p.id === fromUserId
    )?.name;
    const toName = updatedConversation.participantInfo.find(
      (p) => p.id === toUserId
    )?.name;
    const message = await createMessage({
      conversationId: updatedConversation.id,
      senderId: fromUserId,
      type: "system",
      content: `${currentName} đã thu hồi quyền mod của ${toName}`,
      readBy: [fromUserId],
    });
    // Gửi thông báo cho tất cả người tham gia cuộc trò chuyện
    sendMessage(
      getIO(),
      updatedConversation.participantInfo.map((p) => p.id),
      message
    );

    responseFormat(
      res,
      updatedConversation,
      "Removed mod role successfully",
      true,
      200
    );
  } catch (error) {
    handleError(error, res, "Remove mod failed");
  }
}

// Cập nhật quyền nhắn tin trong nhóm
const updateAllowMessagingCotroller = async (req, res) => {
  try {
    const userId = req.user.id; // Lấy userId từ token
    const conversationId = req.params.id;
    const updatedConversation = await updateAllowMessaging(
      conversationId,
      userId
    );

    if (!updatedConversation) {
      throw new AppError("Failed to update allow messaging", 400);
    }

    responseFormat(
      res,
      updatedConversation,
      "Update allow messaging successful",
      true,
      200
    );
  } catch (error) {
    handleError(error, res, "Update allow messaging failed");
  }
};

// Pin message in conversation
const pinMessageController = async (req, res) => {
  try {
    const conversationId = req.params.id;
    const { messageId } = req.body;

    if (!conversationId || !messageId) {
      throw new AppError("Missing conversationId or messageId", 400);
    }

    const updatedConversation = await pinMessage(conversationId, messageId);
    
    responseFormat(
      res,
      updatedConversation,
      "Pinned message successfully",
      true,
      200
    );
  } catch (error) {
    handleError(error, res, "Pin message failed");
  }
};
// Remove pinned message from conversation
const removePinMessageController = async (req, res) => {
  try {
    const conversationId = req.params.id;
    const { messageId } = req.body;

    if (!conversationId || !messageId) {
      throw new AppError("Missing conversationId or messageId", 400);
    }

    const updatedConversation = await removePinMessage(conversationId, messageId);

    responseFormat(
      res,
      updatedConversation,
      "Removed pinned message successfully",
      true,
      200
    );
  } catch (error) {
    handleError(error, res, "Remove pinned message failed");
  }
};
const joinGroupByUrlController = async (req, res) => {
  try {
    const userId = req.user.id; // Lấy userId từ token
    const { url } = req.body; // Lấy URL từ request

    // Gọi service để xử lý logic
    const result = await joinGroupByUrlService(userId, url);

    // Trả về kết quả
    responseFormat(res, result, result.message, true, 200);
  } catch (error) {
    console.error("Error in joinGroupByUrlController:", error);
    handleError(error, res, "Failed to join group");
  }
  
};

const checkUrlExistController = async (req, res) => {
  try {
    const { url } = req.body; // Lấy URL từ request
    const conversations = await Conversation.findOne({ url });
    // Gọi service để kiểm tra URL

    if (!conversations) {
      return responseFormat(res, null, "URL does not exist", false, 404);
    }

    // Trả về kết quả
    const conversationObject = conversations.toObject();
    responseFormat(res, conversationObject, conversations.message, true, 200);
  } catch (error) {
    console.error("Error in checkUrlExistController:", error);
    handleError(error, res, "Failed to check URL existence");
  }
}

module.exports = {
	getAllConversationsController,
	getConversationByIdController,
	createConversationController,
	updateConversationController,
	deleteConversationController,
	addParticipantsController,
	removeParticipantsController,
	transferAdminController,
	grantModController,
	updateAllowMessagingCotroller,
	pinMessageController,
	joinGroupByUrlController,
	checkUrlExistController,
	removeModController,
	leftConversationController,
  removePinMessageController
};
