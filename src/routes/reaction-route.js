const express = require("express");
const {getAllReactionsController, getReactionByIdController, createReactionController, deleteReactionController} = require("../controllers/reaction-controller");
const {authMiddleware} = require("../middlewares/auth");
const multer = require("multer");
const upload = multer();
const reactionRoute = express.Router();

reactionRoute.use(authMiddleware);
//get all reactions
reactionRoute.get("/", getAllReactionsController);
//get reaction by id
reactionRoute.get("/:id", getReactionByIdController);
//save reaction
reactionRoute.post("/", upload.single("file"), createReactionController);
//delete reaction
reactionRoute.delete("/:id", deleteReactionController);

module.exports = reactionRoute;
