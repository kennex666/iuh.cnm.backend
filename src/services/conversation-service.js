const conversation = require("../models/conversation-model");
const messageModel = require("../models/message-model");
const UserModel = require("../models/user-model");
const { AppError } = require("../utils/response-format");
const userService = require("./user-service");

const getAllConversations = async (userId) => {
  try {
    const conversations = await conversation
      .find({ participantIds: { $in: [userId] } })
      .populate({
        path: "lastMessage",
        options: { strictPopulate: false } // 💡 không lỗi nếu không có
      });

    // if not have lastMessage, set lastMessage.sentAt = updatedAt

    const sortedConversations = conversations
      .map((conversation) => ({
        ...conversation.toObject(),
        lastMessage: conversation.lastMessage || {
          sentAt: conversation.updatedAt,
          content: "Hãy gửi lời chào đến người bạn này nào!",
          type: "text",
          readBy: [userId]
        }
      }))
      .sort((a, b) => {
        const aDate = a.lastMessage?.sentAt
          ? new Date(a.lastMessage.sentAt)
          : 0;
        const bDate = b.lastMessage?.sentAt
          ? new Date(b.lastMessage.sentAt)
          : 0;
        return bDate - aDate;
      });

    return sortedConversations;
  } catch (error) {
    console.error("Error fetching conversations:", error);
    if (error instanceof Error) {
      throw new Error(
        "Không thể lấy danh sách cuộc trò chuyện. Vui lòng thử lại sau."
      );
    } else {
      throw new Error("Lỗi không xác định. Vui lòng thử lại sau.");
    }
  }
};
const getConversationById = async (userId, conversationId) => {
  try {
    const conversationData = await conversation
      .findOne({
        participantIds: { $in: [userId] },
        id: conversationId
      })
      .populate({
        path: "lastMessage",
        options: { strictPopulate: false } // 💡 không lỗi nếu không có
      });
    return conversationData;
  } catch (error) {
    console.error("Error fetching conversation:", error);
    if (error instanceof Error) {
      throw new Error("Không thể lấy cuộc trò chuyện. Vui lòng thử lại sau.");
    } else {
      throw new Error("Lỗi không xác định. Vui lòng thử lại sau.");
    }
  }
};

const getConversationByCvsId = async (conversationId) => {
  try {
    const conversationData = await conversation
      .findOne({
        id: conversationId
      })
      .populate({
        path: "lastMessage",
        options: { strictPopulate: false } // 💡 không lỗi nếu không có
      });
    return conversationData;
  } catch (error) {
    console.error("Error fetching conversation:", error);
    if (error instanceof Error) {
      throw new Error("Không thể lấy cuộc trò chuyện. Vui lòng thử lại sau.");
    } else {
      throw new Error("Lỗi không xác định. Vui lòng thử lại sau.");
    }
  }
};

const createConversation = async (data) => {
  try {
    const newConversation = new conversation(data);
    return await newConversation.save();
  } catch (error) {
    console.error("Error creating conversation:", err);
    if (err instanceof Error) {
      throw new Error("Không thể tạo cuộc trò truyện. Vui lòng thử lại sau.");
    } else {
      throw new Error("Lỗi không xác định. Vui lòng thử lại sau.");
    }
  }
};
const updateConversation = async (req, res) => {
  try {
    const conversationId = req.params.id;
    const updatedConversation = await conversation.findByIdAndUpdate(
      conversationId,
      req.body,
      { new: true }
    );
    return updatedConversation;
  } catch (error) {
    console.error("Error updating conversation:", error);
    if (error instanceof Error) {
      throw new Error(
        "Không thể cập nhật cuộc trò chuyện. Vui lòng thử lại sau."
      );
    } else {
      throw new Error("Lỗi không xác định. Vui lòng thử lại sau.");
    }
  }
};
const deleteConversation = async (req, res) => {
  try {
    const conversationId = req.params.id;
    const deletedConversation = await conversation.findByIdAndDelete(
      conversationId
    );
    return deletedConversation;
  } catch (error) {
    console.error("Error deleting conversation:", error);
    if (error instanceof Error) {
      throw new Error("Không thể xóa cuộc trò chuyện. Vui lòng thử lại sau.");
    } else {
      throw new Error("Lỗi không xác định. Vui lòng thử lại sau.");
    }
  }
};

// Thêm 1 hoặc nhiều thành viên vào cuộc trò chuyện và thêm vào cả participantInfo
const addParticipants = async (
  conversationId,
  participantIds,
  participantInfo
) => {
  try {
    const updatedConversation = await conversation.findByIdAndUpdate(
      conversationId,
      {
        $addToSet: {
          participantIds: { $each: participantIds },
          participantInfo: { $each: participantInfo }
        }
      },
      { new: true }
    );
    return updatedConversation;
  } catch (error) {
    console.error("Error adding participants:", error);
    if (error instanceof Error) {
      throw new Error(
        "Không thể thêm thành viên vào cuộc trò chuyện. Vui lòng thử lại sau."
      );
    } else {
      throw new Error("Lỗi không xác định. Vui lòng thử lại sau.");
    }
  }
};

// xóa 1 hoặc nhiều thành viên khỏi cuộc trò chuyện và xóa khỏi cả participantInfo
const removeParticipants = async (conversationId, participantIds) => {
  try {
    const updatedConversation = await conversation.findByIdAndUpdate(
      conversationId,
      {
        $pull: {
          participantIds: { $in: participantIds },
          participantInfo: { id: { $in: participantIds } }
        }
      },
      { new: true }
    );
    return updatedConversation;
  } catch (error) {
    console.error("Error removing participants:", error);
    if (error instanceof Error) {
      throw new Error(
        "Không thể xóa thành viên khỏi cuộc trò chuyện. Vui lòng thử lại sau."
      );
    } else {
      throw new Error("Lỗi không xác định. Vui lòng thử lại sau.");
    }
  }
};

const transferAdminRole = async (conversationId, fromUserId, toUserId) => {
  const conversations = await conversation.findOne({ id: conversationId });
  if (!conversations) throw new AppError("Conversation not found", 404);

  const currentUser = conversations.participantInfo.find(
    (p) => p.id === fromUserId
  );
  if (
    !currentUser ||
    (currentUser.role !== "admin" && currentUser.role !== "mod")
  ) {
    throw new AppError(
      "Permission denied. Only admin or mod can transfer role.",
      403
    );
  }

  const targetUser = conversations.participantInfo.find(
    (p) => p.id === toUserId
  );
  if (!targetUser) {
    throw new AppError("Target user not found in conversation", 404);
  }

  if (currentUser.role === "admin") {
    // Cập nhật role
    conversations.participantInfo = conversations.participantInfo.map((p) => {
      if (p.id === toUserId) return { ...p, role: "admin" };
      return p;
    });
    conversations.participantInfo = conversations.participantInfo.map((p) => {
      if (p.id === fromUserId) return { ...p, role: "member" };
      return p;
    });
  }

  if (currentUser.role === "mod") {
    // Cập nhật role
    conversations.participantInfo = conversations.participantInfo.map((p) => {
      if (p.id === toUserId) return { ...p, role: "mod" };
      return p;
    });
    conversations.participantInfo = conversations.participantInfo.map((p) => {
      if (p.id === fromUserId) return { ...p, role: "member" };
      return p;
    });
  }
  await conversations.save();
  return conversations;
};

// admin cấp quyền cho mod
const grantModRole = async (conversationId, fromUserId, toUserId) => {
  const conversations = await conversation.findOne({ id: conversationId });
  if (!conversations) throw new AppError("Conversation not found", 404);

  const currentUser = conversations.participantInfo.find(
    (p) => p.id === fromUserId
  );
  if (!currentUser || currentUser.role !== "admin") {
    throw new AppError(
      "Permission denied. Only admin can grant mod role.",
      403
    );
  }

  const targetUser = conversations.participantInfo.find(
    (p) => p.id === toUserId
  );
  if (!targetUser) {
    throw new AppError("Target user not found in conversation", 404);
  }

  // Cập nhật role
  conversations.participantInfo = conversations.participantInfo.map((p) => {
    if (p.id === toUserId) return { ...p, role: "mod" };
    return p;
  });

  await conversations.save();
  return conversations;
};

// Đổi trạng thái isAllowMessaging của cuộc trò chuyện(true đuợc nhắn tin, false không được nhắn tin)
const updateAllowMessaging = async (conversationId, userId) => {
  const conversations = await conversation.findOne({ id: conversationId });
  if (!conversations) throw new AppError("Conversation not found", 404);

  const currentUser = conversations.participantInfo.find(
    (p) => p.id === userId
  );
  if (
    !currentUser ||
    (currentUser.role !== "admin" && currentUser.role !== "mod")
  ) {
    throw new AppError(
      "Permission denied. Only admin or mod can update messaging status.",
      403
    );
  }

  // Cập nhật trạng thái isAllowMessaging
  conversations.settings.isAllowMessaging =
    !conversations.settings.isAllowMessaging;
  await conversations.save();
  return conversations;
};

// ghin tên nhắn và tối đa là 3, nếu ghin tin nhắn thứ 4 thì xóa tin nhắn đầu tiên
const pinMessage = async (conversationId, messageId) => {
  const conversations = await conversation.findOne({ id: conversationId });
  if (!conversations) throw new AppError("Conversation not found", 404);

  // Kiểm tra xem tin nhắn đã được ghim chưa
  const isPinned = conversations.pinMessages.some(
    (msg) => msg.id === messageId
  );
  if (isPinned) {
    throw new AppError("Message already pinned", 400);
  }

  // lấy toàn bộ thông tin của tin nhắn
  const message = await messageModel.findOne({ id: messageId });
  if (!message) throw new AppError("Message not found", 404);

  // Ghim tin nhắn
  if (conversations.pinMessages.length >= 3) {
    // Xóa tin nhắn đầu tiên nếu đã có 3 tin nhắn ghim
    conversations.pinMessages.shift();
  }
  conversations.pinMessages.push({
    id: message.id,
    conversationId: message.conversationId,
    senderId: message.senderId,
    content: message.content,
    type: message.type,
    repliedTold: message.repliedTold,
    sentAt: message.sentAt,
    readBy: message.readBy
  });

  await conversations.save();
  return conversations;
};

// Bỏ ghim một tin nhắn khỏi cuộc trò chuyện
const removePinMessage = async (conversationId, messageId) => {
  const conversations = await conversation.findOne({ id: conversationId });
  if (!conversations) throw new AppError("Conversation not found", 404);

  // Tìm vị trí tin nhắn cần bỏ ghim
  const index = conversations.pinMessages.findIndex(msg => msg.id === messageId);
  if (index === -1) {
    throw new AppError("Pinned message not found", 404);
  }

  // Xóa tin nhắn khỏi danh sách pinMessages
  conversations.pinMessages.splice(index, 1);

  await conversations.save();
  return conversations;
};

const joinGroupByUrlService = async (userId, url) => {
  // Tìm cuộc trò chuyện dựa trên URL
  const conversations = await conversation.findOne({ url });
  const user = await userService.getUserById(userId);
  console.log(user);
  if (!conversations) {
    console.error(`Conversation with URL ${url} not found`);
    throw new AppError("Conversation not found", 404);
  }

  // Kiểm tra xem người dùng đã là thành viên chưa
  const isAlreadyParticipant = conversations.participantIds.includes(userId);
  if (isAlreadyParticipant) {
    return {
      data: conversations,
      message: "You are already a participant in this group"
    };
  }

  // Kiểm tra xem nhóm có yêu cầu xác thực không
  if (conversations.settings.isReviewNewParticipant) {
    const isAlreadyParticipant = conversations.settings.pendingList.some(
      (p) => p.id === userId
    );
    if (isAlreadyParticipant) {
      return {
        data: conversations,
        message: "You are pending a participant in this group"
      };
    }

    conversations.settings.pendingList.push({
      id: userId,
      name: user.name || "Unknown",
      avatar: user.avatarUrl || "default",
      requestedAt: new Date()
    });

    await conversations.save();

    return {
      data: null,
      message: "Your request to join the group is pending approval"
    };
  }

  // Nếu không cần xác thực, thêm người dùng vào nhóm
  conversations.participantIds.push(userId);
  conversations.participantInfo.push({
    id: userId,
    name: user.name || "Unknown",
    avatar: user.avatarUrl || "default",
    nickname: user.name || "Unknown",
    role: "member"
  });

  await conversations.save();

  return {
    data: conversations,
    message: "You have successfully joined the group"
  };
};

// Xóa quyền mod của người dùng
const removeModRole = async (conversationId, fromUserId, toUserId) => {
  const conversations = await conversation.findOne({ id: conversationId });
  if (!conversations) throw new AppError("Conversation not found", 404);
  
  const currentUser = conversations.participantInfo.find(
    (p) => p.id === fromUserId
  );
  if (!currentUser || currentUser.role !== "admin") {
    throw new AppError(
      "Permission denied. Only admin can remove mod role.",
      403
    );
  }

  const targetUser = conversations.participantInfo.find(
    (p) => p.id === toUserId
  );
  if (!targetUser) {
    throw new AppError("Target user not found in conversation", 404);
  }

  // Cập nhật role
  conversations.participantInfo = conversations.participantInfo.map((p) => {
    if (p.id === toUserId) return { ...p, role: "member" };
    return p;
  });

  await conversations.save();
  return conversations;
};

module.exports = {
  getAllConversations,
  getConversationById,
  createConversation,
  updateConversation,
  deleteConversation,
  getConversationByCvsId,
  addParticipants,
  removeParticipants,
  transferAdminRole,
  grantModRole,
  updateAllowMessaging,
  pinMessage,
  joinGroupByUrlService,
  removeModRole,
  removePinMessage
};
