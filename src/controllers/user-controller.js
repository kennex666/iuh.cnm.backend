// src/controllers/user.controller.js
const { handleError, responseFormat } = require("../utils/response-format");
const UserService = require("../services/user-service");

class UserController {
    async getUserById(req, res) {
        try {
            const userId = req.params.id;
            const user = await UserService.getUserById(userId);
            responseFormat(res, user, "User retrieved successfully", true, 200);
        } catch (error) {
            handleError(error, res, "Failed to retrieve user");
        }
    }

    /**
     * Updates a user's information, including avatar/cover upload to S3.
     * @param {Object} req - The HTTP request object.
     * @param {Object} req.params - The request parameters.
     * @param {string} req.params.id - The ID of the user to update.
     * @param {Object} req.user - The authenticated user data from middleware.
     * @param {string} req.user.id - The ID of the authenticated user.
     * @param {Object} req.body - The data to update (name, gender, dob).
     * @param {Object} req.files - The uploaded files from multer.
     * @param {Object} [req.files.avatar] - The avatar file.
     * @param {Object} [req.files.cover] - The cover file.
     * @param {Object} res - The HTTP response object.
     * @returns {void} Responds with updated user data or an error.
     */
    async updateUser(req, res) {
        try {
            const userId = req.user.id;
            const updateData = req.body;
            const files = req.files;
            const updatedUser = await UserService.updateUser(userId, updateData, files);
            responseFormat(res, updatedUser, "User updated successfully", true, 200);
        } catch (error) {
            handleError(error, res, "Failed to update user");
        }
    }

    async searchUsers(req, res) {
        try {
            const phoneQuery = req.query.q;
            if (!phoneQuery) {
                throw new Error("Phone number query is required", 400);
            }
            const users = await UserService.searchUsers(phoneQuery);
            responseFormat(res, users, "Users found successfully", true, 200);
        } catch (error) {
            handleError(error, res, "Failed to search users");
        }
    }
}

module.exports = new UserController();