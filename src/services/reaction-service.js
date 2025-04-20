const reactionModel = require("../models/reaction-model");
const S3FileManager = require("../services/s3-file-manager");

const getAllReactions = async (req, res) => {
  try {
    const reactions = await reactionModel.find({});
    return reactions;
  } catch (error) {
    console.error("Error fetching reactions:", error);
    if (error instanceof Error) {
      throw new Error(
        "Không thể lấy danh sách phản ứng. Vui lòng thử lại sau."
      );
    } else {
      throw new Error("Lỗi không xác định. Vui lòng thử lại sau.");
    }
  }
};

const getReactionById = async (req, res) => {
  try {
    const reactionId = req.params.id;
    const reactionData = await reactionModel.findById(reactionId);
    return reactionData;
  } catch (error) {
    console.error("Error fetching reaction:", error);
    if (error instanceof Error) {
      throw new Error("Không thể lấy phản ứng. Vui lòng thử lại sau.");
    } else {
      throw new Error("Lỗi không xác định. Vui lòng thử lại sau.");
    }
  }
};

const createReaction = async (data) => {
  try {
    if (!data.messageId || !data.userId || !data.file) {
      throw new Error("Thiếu dữ liệu messageId, userId hoặc emoji.");
    }

    const s3Result = await S3FileManager.pushObjectS3(data.file);

    if (!s3Result) {
      throw new Error("Không thể upload file lên S3.");
    }

    const newReaction = new reactionModel({
      id: data.id,
      messageId: data.messageId,
      userId: data.userId,
      emoji: s3Result.url
    });

    return await newReaction.save();
  } catch (error) {
    console.error("Error creating reaction:", error);
    throw new Error("Không thể tạo phản ứng. Vui lòng thử lại sau.");
  }
};

const deleteReaction = async (req, res) => {
  try {
    const reactionId = req.params.id;
    const deletedReaction = await reactionModel.findByIdAndDelete(reactionId);
    return deletedReaction;
  } catch (error) {
    console.error("Error deleting reaction:", error);
    if (error instanceof Error) {
      throw new Error("Không thể xóa phản ứng. Vui lòng thử lại sau.");
    } else {
      throw new Error("Lỗi không xác định. Vui lòng thử lại sau.");
    }
  }
};

module.exports = {
  getAllReactions,
  getReactionById,
  createReaction,
  deleteReaction
};
