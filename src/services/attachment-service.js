const attachmentModel = require('../models/attachment-model');
const S3FileManager = require("../services/s3-file-manager");

const getAllAttachments = async (req, res) => {
    try {
        const attachments = await attachmentModel.find({});
        return attachments;
    } catch (error) {
        console.error("Error fetching attachments:", error);
        if (error instanceof Error) {
            throw new Error("Không thể lấy danh sách tệp đính kèm. Vui lòng thử lại sau.");
        } else {
            throw new Error("Lỗi không xác định. Vui lòng thử lại sau.");
        }
    }
}

const getAttachmentById = async (req, res) => {
    try {
        const attachmentId = req.params.id;
        const attachmentData = await attachmentModel.findById(attachmentId);
        return attachmentData;
    } catch (error) {
        console.error("Error fetching attachment:", error);
        if (error instanceof Error) {
            throw new Error("Không thể lấy tệp đính kèm. Vui lòng thử lại sau.");
        } else {
            throw new Error("Lỗi không xác định. Vui lòng thử lại sau.");
        }
    }
}

const createAttachment = async (data) => {
    try {
        if (!data.file || !data.messageId) {
            throw new Error("Thiếu dữ liệu tệp hoặc messageId.");
        }

        const s3Result = await S3FileManager.pushObjectS3(data.file);

        if (!s3Result) {
            throw new Error("Không thể upload file lên S3.");
        }

        const newAttachment = new attachmentModel({
            id: data.id,
            messageId: data.messageId,
            url: s3Result.url,
            fileType: data.file.contentType,
            fileName: data.file.fileName,
            size: data.file.buffer.length
        });

        return await newAttachment.save();
    } catch (error) {
        console.error("Error creating attachment:", error);
        throw new Error("Không thể tạo tệp đính kèm. Vui lòng thử lại sau.");
    }
};


const deleteAttachment = async (req, res) => {
    try {
        const attachmentId = req.params.id;
        const deletedAttachment = await attachmentModel.findByIdAndDelete(attachmentId);
        if (!deletedAttachment) {
            throw new Error("Tệp đính kèm không tồn tại.");
        }
        return deletedAttachment;
    } catch (error) {
        console.error("Error deleting attachment:", error);
        if (error instanceof Error) {
            throw new Error("Không thể xóa tệp đính kèm. Vui lòng thử lại sau.");
        } else {
            throw new Error("Lỗi không xác định. Vui lòng thử lại sau.");
        }
        
    }
}

module.exports = {
    getAllAttachments,
    getAttachmentById,
    createAttachment,
    deleteAttachment
};
