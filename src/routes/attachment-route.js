const express = require("express");
const {getAllAttachmentsController, getAttachmentByIdController, createAttachmentController, deleteAttachmentController, getAttachmentByMessageIdController} = require("../controllers/attachment-controller");
const {authMiddleware} = require("../middlewares/auth");
const multer = require("multer");
const upload = multer();
const attachmentRoute = express.Router();


attachmentRoute.use(authMiddleware);
 // dùng memoryStorage mặc định
//get all attachments
attachmentRoute.get("/", getAllAttachmentsController);
//get attachment by id
attachmentRoute.get("/:id", getAttachmentByIdController);
//save attachment
attachmentRoute.post("/",upload.single("file") ,createAttachmentController);
//delete attachment
attachmentRoute.delete("/:id", deleteAttachmentController);
//get attachment by messageId
attachmentRoute.get("/message/:id", getAttachmentByMessageIdController);

module.exports = attachmentRoute;