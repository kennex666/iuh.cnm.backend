const express = require("express");
const {getAllAttachmentsController, getAttachmentByIdController, createAttachmentController, deleteAttachmentController} = require("../controllers/attachment-controller");
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
attachmentRoute.post("/", authMiddleware,upload.single("file") ,createAttachmentController);
//delete attachment
attachmentRoute.delete("/:id", authMiddleware, deleteAttachmentController);

module.exports = attachmentRoute;