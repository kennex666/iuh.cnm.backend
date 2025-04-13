const express = require("express");
const {getAllReactionsController, getReactionByIdController, createReactionController, deleteReactionController} = require("../controllers/reaction-controller");
const authMiddleware = require("../middlewares/auth");
const multer = require("multer");
const upload = multer();
const reactionRoute = express.Router();

//get all reactions
reactionRoute.get("/", authMiddleware, getAllReactionsController);
//get reaction by id
reactionRoute.get("/:id", authMiddleware, getReactionByIdController);
//save reaction
reactionRoute.post("/", authMiddleware, upload.single("file"), createReactionController);
//delete reaction
reactionRoute.delete("/:id", authMiddleware, deleteReactionController);

module.exports = reactionRoute;