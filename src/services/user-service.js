
const UserModel = require("../models/user-model");
const { generateOTP } = require("../utils/2fa-generator");
const { AppError } = require("../utils/response-format");
const S3FileManager = require("./s3-file-manager");

class UserService {
    async getUserById(userId) {
        const user = await UserModel.findById(userId).select("-password");
        if (!user) throw new AppError("User not found", 404);
        return { ...user.toObject(), id: user.id.toString() };
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
        return { ...user.toObject(), id: user.id.toString() };
    }

    async searchUsers(phoneQuery) {
        if (!phoneQuery) throw new AppError("Phone number is required", 400);
        const users = await UserModel.find({
            phone: { $regex: phoneQuery, $options: "i" },
        }).select("-password");
        return users.map((user) => ({ ...user.toObject(), id: user.id.toString() }));
    }

    async getUserByPhone(phone) {
        if (!phone) throw new AppError("Phone number is required", 400);
        const user = await UserModel.findOne({
            phone: { $regex: phone, $options: "i" },
        }).select("-password");
        if (!user) throw new AppError("User not found", 404);
        return user;
    }

    async createOTP(userId) {
        const user = await UserModel.findById(userId);
        if (!user) throw new AppError("User not found", 404);

        const otp = generateOTP();
        user.otp = {
			code: otp,
			expiredAt: Date.now() + 5 * 60 * 1000, // OTP valid for 5 minutes
			isUsed: false,
		};

        await user.save();
        return user;
    }

    async updateOTP(userId, otp) {
        const user = await UserModel.findById(userId);
        if (!user) throw new AppError("User not found", 404);
        if (!user.otp) throw new AppError("OTP not found", 404);

        if (user.otp.isUsed) throw new AppError("OTP already used", 400);

        if (new Date(user.otp.expiredAt) < new Date()) {
            throw new AppError("OTP expired", 400);
        }
        
        user.otp = {
            ...user.otp,
            ...otp
        }
        await user.save();
        return user;
    }
}

module.exports = new UserService();