
const UserModel = require("../models/user");
const { AppError } = require("../utils/responseFormat");
const S3FileManager = require("./s3FileManager");

class UserService {
    async getUserById(userId) {
        const user = await UserModel.findById(userId).select("-password");
        if (!user) throw new AppError("User not found", 404);
        return { ...user.toObject(), _id: user._id.toString() };
    }

    /**
     * Updates a user's information, including uploading avatar/cover to S3.
     * @param {string} userId - The ID of the user to update.
     * @param {Object} updateData - The data to update (name, gender, dob).
     * @param {Object} files - The uploaded files from multer.
     * @param {Object} [files.avatar] - The avatar file object.
     * @param {Object} [files.cover] - The cover file object.
     * @returns {Promise<Object>} The updated user object without password.
     * @throws {AppError} If user is not found (404) or upload fails.
     */
    async updateUser(userId, updateData, files) {
        const user = await UserModel.findById(userId).select("-password");
        if (!user) throw new AppError("User not found", 404);

        const allowedFields = ["name", "gender", "dob", "email"];
        Object.keys(updateData).forEach((key) => {
            if (allowedFields.includes(key)) {
                user[key] = updateData[key];
            }
        });

        // handle upload avatar to S3
        if (files && files.avatar) {
            const avatarFile = {
                buffer: files.avatar[0].buffer,
                contentType: files.avatar[0].mimetype,
                fileName: files.avatar[0].originalname,
            };
            const avatarResult = await S3FileManager.pushObjectS3(avatarFile);
            if (!avatarResult) throw new AppError("Failed to upload avatar", 500);

            // delete old avatar
            if (user.avatarUrl) {
                const oldKey = user.avatarUrl.split("/").slice(-2).join("/");
                await S3FileManager.deleteObjectS3(oldKey);
            }
            user.avatarUrl = avatarResult.url;
        }

        // handle upload cover to S3
        if (files && files.cover) {
            const coverFile = {
                buffer: files.cover[0].buffer,
                contentType: files.cover[0].mimetype,
                fileName: files.cover[0].originalname,
            };
            const coverResult = await S3FileManager.pushObjectS3(coverFile);
            if (!coverResult) throw new AppError("Failed to upload cover", 500);

            // Delete old cover
            if (user.coverUrl) {
                const oldKey = user.coverUrl.split("/").slice(-2).join("/");
                await S3FileManager.deleteObjectS3(oldKey);
            }
            user.coverUrl = coverResult.url;
        }

        await user.save();
        return { ...user.toObject(), _id: user._id.toString() };
    }

    async searchUsers(phoneQuery) {
        const users = await UserModel.find({
            phone: { $regex: phoneQuery, $options: "i" },
        }).select("-password");
        return users.map((user) => ({ ...user.toObject(), _id: user._id.toString() }));
    }
}

module.exports = new UserService();