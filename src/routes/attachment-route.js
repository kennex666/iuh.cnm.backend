const express = require("express");
const {getAllAttachmentsController, getAttachmentByIdController, createAttachmentController, deleteAttachmentController, getAttachmentByMessageIdController} = require("../controllers/attachment-controller");
const authMiddleware = require("../middlewares/auth");
const multer = require("multer");
const upload = multer();
const attachmentRoute = express.Router();


 // dùng memoryStorage mặc định
//get all attachments
attachmentRoute.get("/", authMiddleware, getAllAttachmentsController);
//get attachment by id
attachmentRoute.get("/:id", authMiddleware, getAttachmentByIdController);
//save attachment
attachmentRoute.post("/:conversationId", authMiddleware,upload.single("file") ,createAttachmentController);
//delete attachment
attachmentRoute.delete("/:id", authMiddleware, deleteAttachmentController);
//get attachment by messageId
attachmentRoute.get("/message/:id", authMiddleware, getAttachmentByMessageIdController);

module.exports = attachmentRoute;