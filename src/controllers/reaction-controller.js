
const {getAllReactions, getReactionById, createReaction, deleteReaction} = require('../services/reaction-service');
const {AppError,handleError,responseFormat } = require("../utils/response-format");

const getAllReactionsController = async (req, res) => {
    try {
        const reactions = await getAllReactions(req, res);
        if (!reactions) {
            throw new AppError("Reactions not found", 404);
        }
        responseFormat(res, reactions, "Reactions retrieved successfully", true, 200);
    } catch (error) {
        handleError(error, res, "Failed to retrieve reactions");
    }
}

const getReactionByIdController = async (req, res) => {
    try {
        const reactionId = req.params.id;
        const reactionData = await getReactionById(req, res);
        if (!reactionData) {
            throw new AppError("Reaction not found", 404);
        }
        responseFormat(res, reactionData, "Reaction retrieved successfully", true, 200);
    } catch (error) {
        handleError(error, res, "Failed to retrieve reaction");
    }
}

const createReactionController = async (req, res) => {
    try {
        const {id,messageId, emoji} = req.body;
        const userId = req.user.id; // Assuming user ID is stored in req.user

        if (!messageId || !userId || !emoji) {
            throw new AppError("Missing messageId, userId or emoji", 400);
        }

        // const file = {
        //     buffer: req.file.buffer,
        //     fileName: req.file.originalname,
        //     contentType: req.file.mimetype
        // };

        const reaction = await createReaction({ id,messageId, userId, emoji });

        if (!reaction) {
            throw new AppError("Reaction not created", 400);
        }
        responseFormat(res, reaction, "Create reaction successfully", true, 200);
    } catch (error) {
        handleError(error, res, "Create reaction failed");
    }
};

const deleteReactionController = async (req, res) => {
    try {
        const reactionId = req.params.id;
        const deletedReaction = await deleteReaction(req, res);
        if (!deletedReaction) {
            throw new AppError("Reaction not found", 404);
        }
        responseFormat(res, deletedReaction, "Delete reaction successfully", true, 200);
    } catch (error) {
        handleError(error, res, "Delete reaction failed");
    }
};

module.exports = {
    getAllReactionsController,
    getReactionByIdController,
    createReactionController,
    deleteReactionController
};