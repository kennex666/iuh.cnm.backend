const UserModel = require("../models/user");
const { AppError } = require("../utils/responseFormat");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");



class AuthService {
    generateAccessToken(userId) {
        return jwt.sign(
            { id: userId },
            process.env.ACCESS_TOKEN_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || "1h" }  // Default: 1 hr
        );
    };

    generateRefreshToken(userId) {
        return jwt.sign(
            { id: userId },
            process.env.REFRESH_TOKEN_SECRET,
            { expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || "7d" } // Default: 7 day
        );
    };
    async encryptPassword(password) {
        const salt = await bcrypt.genSalt(10);
        const encryptedPassword = await bcrypt.hash(password, salt);
        return encryptedPassword;
    }

    // -------------------------
    async register(dataUser) {
        const { phone, password } = dataUser;
        const existingUser = await UserModel.findOne({ phone });
        if (existingUser) {
            throw new AppError("User phonenumber already exists", 400);
        }
        const user = { ...dataUser, password: await this.encryptPassword(password) };
        const userResult = await UserModel.create(user);
        return { ...userResult.toObject(), _id: userResult._id.toString() };
    }

    async login(phone, password) {
        const user = await UserModel.findOne({ phone });
        if (!user) throw new AppError("Invalid phone number or password", 401);

        //Validate password
        const isMatch = await user.comparePassword(password);
        if (!isMatch) throw new AppError("Invalid phone number or password", 401);

        const accessToken = this.generateAccessToken(user._id.toString());
        const refreshToken = this.generateRefreshToken(user._id.toString());

        user.isOnline = true;
        await user.save();
        const userData = { ...user.toObject(), _id: user._id.toString() };
        delete userData.password;

        return {
            accessToken,
            refreshToken,
            user: userData
        };
    }

    async logout(userId) {
        const user = await UserModel.findById(userId);
        if (!user) throw new AppError("User not found", 404);
        user.isOnline = false;
        await user.save();
        return true;
    }

    async getMe(userId) {
        const user = await UserModel.findById(userId).select("-password");
        if (!user) throw new AppError("User not found", 404);
        return { ...user.toObject(), _id: user._id.toString() };
    }

    async refreshToken(refreshToken) {
        try {
            const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
            const user = await UserModel.findById(decoded.id);
            if (!user) throw new AppError("User not found", 404);

            const accessToken = this.generateAccessToken(user._id.toString());
            return { accessToken };
        } catch (error) {
            throw new AppError("Invalid or expired refresh token", 401);
        }
    }
}

module.exports = new AuthService();