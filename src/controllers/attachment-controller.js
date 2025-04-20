const typeMessage = require('../models/type-message');
const {getAllAttachments, getAttachmentById, createAttachment, deleteAttachment,getAttachmentByMessageId} = require('../services/attachment-service');
const {AppError,handleError,responseFormat } = require("../utils/response-format");
const {createMessage} = require('../services/message-service');
const getAllAttachmentsController = async (req, res) => {
    try {
        const attachments = await getAllAttachments(req, res);
        if (!attachments) {
            throw new AppError("Attachments not found", 404);
        }
        responseFormat(res, attachments, "Attachments retrieved successfully", true, 200);
    } catch (error) {
        handleError(error, res, "Failed to retrieve attachments");
    }
};

const getAttachmentByIdController = async (req, res) => {
    try {
        const attachmentId = req.params.id;
        const attachmentData = await getAttachmentById(req, res);
        if (!attachmentData) {
            throw new AppError("Attachment not found", 404);
        }
        responseFormat(res, attachmentData, "Attachment retrieved successfully", true, 200);
    } catch (error) {
        handleError(error, res, "Failed to retrieve attachment");
    }
}

const createAttachmentController = async (req, res) => {
    try {
        
        if (!req.file) {
            throw new AppError("Tệp đính kèm không được tìm thấy", 400);

        }

        const file = {
            buffer: req.file.buffer,
            fileName: req.file.originalname,
            contentType: req.file.mimetype
        };

        const userId = req.user.id; // Lấy userId từ token
        const conversationId = req.params.conversationId;
        console.log("conversationId:", conversationId); // In ra conversationId để kiểm tra
        console.log(file.fileName); // In ra userId để kiểm tra
        const repliedTold = req.body.repliedTold || null; // Lấy repliedTold từ body hoặc gán null nếu không có
        const readBy = [userId]; // Mảng chứa userId của người gửi tin nhắn
        const newMessage = await createMessage({
                    conversationId,
                    senderId: userId,
                    content: file.fileName,
                    type: typeMessage.FILE,
                    repliedTold,
                    readBy,
                });
        const messageId = newMessage.id; // Lấy messageId từ message mới tạo
        const attachment = await createAttachment({messageId, file });

        if (!attachment) {
            throw new AppError("Tệp đính kèm không được tạo", 400);

        }
        responseFormat(res, attachment, "Tạo tệp đính kèm thành công", true, 200);
    } catch (error) {
        handleError(error, res, "Tạo tệp đính kèm thất bại");
    }
};

const deleteAttachmentController = async (req, res) => {
    try {
        const attachmentId = req.params.id;
        const deletedAttachment = await deleteAttachment(req, res);
        if (!deletedAttachment) {
            throw new AppError("Attachment not found", 404);
        }
        responseFormat(res, deletedAttachment, "Attachment deleted successfully", true, 200);
    } catch (error) {
        handleError(error, res, "Failed to delete attachment");
    }
}

const getAttachmentByMessageIdController = async (req, res) => {
    try {
        const messageId = req.params.id;
        const attachmentData = await getAttachmentByMessageId(messageId);
        if (!attachmentData) {
            throw new AppError("Attachment not found", 404);
        }
        responseFormat(res, attachmentData, "Attachment retrieved successfully", true, 200);
    } catch (error) {
        handleError(error, res, "Failed to retrieve attachment");
    }
};

module.exports = {
    getAllAttachmentsController,
    getAttachmentByIdController,
    createAttachmentController,
    deleteAttachmentController,
    getAttachmentByMessageIdController
};