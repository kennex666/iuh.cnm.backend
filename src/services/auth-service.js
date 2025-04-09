const UserModel = require("../models/user-model");
const { generateIdSnowflake } = require("../utils/id-generators");
const { AppError } = require("../utils/response-format");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { saveTokenJWT, updateToken } = require("./jwt-token-service");
const { parseTimeJWT } = require("../utils/date-time-formatter");
const UserService = require("./user-service");



class AuthService {
	generateAccessToken(userId) {
		const data = {
			userId: userId,
			jwtId: generateIdSnowflake().toString(),
			state: "active",
			expiredAt: new Date(
				Date.now() + parseTimeJWT(process.env.JWT_EXPIRES_IN || "1h")
			),
		};

		saveTokenJWT(data);

		return jwt.sign(
			{ id: data.userId },
			process.env.ACCESS_TOKEN_SECRET,
			{ expiresIn: process.env.JWT_EXPIRES_IN || "1h", jwtid: data.jwtId } // Default: 1 hr
		);
	}

	generateRefreshToken(userId) {
		return jwt.sign(
			{ id: userId },
			process.env.REFRESH_TOKEN_SECRET,
			{ expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || "7d" } // Default: 7 day
		);
	}
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
		const user = {
			...dataUser,
			password: await this.encryptPassword(password),
		};
		const userResult = await UserModel.create(user);
		return { ...userResult.toObject(), id: userResult.id.toString() };
	}

	async login(phone, password) {
		const user = await UserModel.findOne({ phone });
		if (!user) throw new AppError("Invalid phone number or password", 401);

		//Validate password
		const isMatch = await user.comparePassword(password);
		if (!isMatch)
			throw new AppError("Invalid phone number or password", 401);

		const accessToken = this.generateAccessToken(user.id.toString());
		const refreshToken = this.generateRefreshToken(user.id.toString());

		user.isOnline = true;
		await user.save();
		const userData = { ...user.toObject(), id: user.id.toString() };
		delete userData.password;

		return {
			accessToken,
			refreshToken,
			user: userData,
		};
	}

	async logout(jti) {
		updateToken(jti, { state: "inactive" });
		return true;
	}

	async getMe(userId) {
		const user = await UserModel.findById(userId).select("-password");
		if (!user) throw new AppError("User not found", 404);
		return { ...user.toObject(), id: user.id.toString() };
	}

	async refreshToken(refreshToken) {
		try {
			const decoded = jwt.verify(
				refreshToken,
				process.env.REFRESH_TOKEN_SECRET
			);
			const user = await UserModel.findById(decoded.id);
			if (!user) throw new AppError("User not found", 404);

			const accessToken = this.generateAccessToken(user.id.toString());
			return { accessToken };
		} catch (error) {
			throw new AppError("Invalid or expired refresh token", 401);
		}
	}

	// forgot-password send otp
	async forgotPassword(phone) {
		try {
			if (!phone) {
				throw new AppError("Phone number is required", 400);
			}
			const user = await UserService.getUserByPhone(phone);
			if (!user) {
				throw new AppError("User not found", 404);
			}
			const otp = Math.floor(100000 + Math.random() * 900000).toString();
			const otpData = await UserService.createOTP(user.id, otp);
			if (!otpData) {
				throw new AppError("Failed to create OTP", 500);
			}
			return user;
		} catch (error) {
			throw new AppError("Error sending password reset link", 500);
		}
	}

	async verifyOtp(phone, otp) {
		try {
			if (!phone || !otp) {
				throw new AppError("Phone number and OTP are required", 400);
			}
			let user = await UserService.getUserByPhone(phone);
            console.log(user)
			if (!user) {
				throw new AppError("User not found", 404);
			}
			const otpData = user.otp;
			if (!otpData) {
				throw new AppError("Invalid OTP", 400);
			}

			if (new Date(otpData.expiredAt) < new Date()) {
				throw new AppError("OTP expired", 400);
			}

			if (otpData.isUsed) {
				throw new AppError("OTP already used or invalid OTP", 400);
			}

			if (otpData.code != otp) {
				throw new AppError("Invalid OTP", 400);
			}

			user = await UserService.updateOTP(user.id, {
				expiredAt: Date.now() + 5 * 60 * 1000, // OTP valid for 5 minutes to change password
			});

			return user;
		} catch (error) {
            console.log(error)
			throw new AppError("Error verifying OTP", 500);
		}
	}

	async resetPasswordOTP(phone, otp, password) {
		try {
			if (!phone || !otp || !password) {
				throw new AppError(
					"Phone number, OTP and password are required",
					400
				);
			}
			let user = await UserService.getUserByPhone(phone);
			if (!user) {
				throw new AppError("User not found", 404);
			}
			const otpData = user.otp;
			if (!otpData) {
				throw new AppError("Invalid OTP", 400);
			}

			if (new Date(otpData.expiredAt) < new Date()) {
				throw new AppError("OTP expired", 400);
			}

			if (otpData.isUsed) {
				throw new AppError("OTP already used or invalid OTP", 400);
			}

			if (otpData.code != otp) {
				throw new AppError("Invalid OTP", 400);
			}

			user.password = await this.encryptPassword(password);
			user.otp = {
				...user.otp,
				isUsed: true,
			};

			await user.save();
			return { ...user.toObject(), id: user.id.toString() };
		} catch (error) {
            console.log(error)
			throw new AppError("Error changing password", 500);
		}
	}

    async verifyAccount(phone, otp) {
        try {
            if (!phone || !otp) {
                throw new AppError("Phone number and OTP are required", 400);
            }
            let user = await UserService.getUserByPhone(phone);
            if (!user) {
                throw new AppError("User not found", 404);
            }
            const otpData = user.otp;
            if (!otpData) {
                throw new AppError("Invalid OTP", 400);
            }

            if (new Date(otpData.expiredAt) < new Date()) {
                throw new AppError("OTP expired", 400);
            }

            if (otpData.isUsed) {
                throw new AppError("OTP already used or invalid OTP", 400);
            }

            if (otpData.code != otp) {
                throw new AppError("Invalid OTP", 400);
            }

            user.otp = {
                ...user.otp,
                isUsed: true,
            };

            user.isVerified = true;

            await user.save();
            return { ...user.toObject(), id: user.id.toString() };
        } catch (error) {
            console.log(error)
            throw new AppError("Error verifying account", 500);
        }
    }

    async changePassword(userId, oldPassword, newPassword) {
        try {
            if (!oldPassword || !newPassword) {
                throw new AppError("Old password and new password are required", 400);
            }
            const user = await UserModel.findById(userId);
            if (!user) {
                throw new AppError("User not found", 404);
            }
            const isMatch = await user.comparePassword(oldPassword);
            if (!isMatch) {
                throw new AppError("Invalid old password", 401);
            }
            user.password = await this.encryptPassword(newPassword);
            await user.save();
            return { ...user.toObject(), id: user.id.toString() };
        } catch (error) {
            console.log(error)
            throw new AppError("Error changing password", 500);
        }
    }
    
}

module.exports = new AuthService();