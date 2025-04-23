const { handleError, responseFormat } = require("../utils/response-format");
const AuthService = require("../services/auth-service");
const UserService = require("../services/user-service");
const { sendOtp } = require("../utils/twilio");
const { verify2FACode } = require("../utils/2fa-generator");
const { io, getIO } = require("../routes/socket-routes");
const { getTokensByUserId } = require("../services/jwt-token-service");
const UserModel = require("../models/user-model");
const { resendOtpHelper } = require("../utils/otp-helper");

class AuthController {
	async register(req, res) {
		try {
			const dataUser = req.body;
			const user = await AuthService.register(dataUser);
			const msg =
				"Ban tao tai khoan iMessify. TUYET DOI KHONG CHIA SE MA VOI BAT KI AI\n";
			// replace phonenumber with +84
			const phoneNumber = user.phone.replace(/^(0)/, "+84");
			const result = await UserService.createOTP(user.id);
			if (!user) {
				return responseFormat(
					res,
					null,
					"Failed to create OTP",
					false,
					500
				);
			}
			const otp = result.otp.code;
			await sendOtp({ phoneNumber, msg, otp });
			responseFormat(res, null, "OTP sent successfully", true, 200);
		} catch (error) {
			handleError(error, res, "Create user failed");
		}
	}

	async login(req, res) {
		try {
			const { phone, password, otp = null } = req.body;
			const result = await AuthService.login(phone, password);
			// if (!result) {
			// 	return responseFormat(
			// 		res,
			// 		null,
			// 		"Invalid phone or password",
			// 		false,
			// 		400
			// 	);
			// }
			// // Check if the user isnt verified
			// if (result?.user?.isVerified === false) {
			// 	resendOtpHelper(phone, "Ban dang thuc hien thao tac tao tai khoan tai iMessify.");
			// 	return responseFormat(
			// 		res,
			// 		null,
			// 		"Account not verified",
			// 		false,
			// 		207
			// 	);
			// }
			// // Check if the user has two-factor authentication enabled
			// if (result?.user?.settings?.twoFAEnabled) {
			// 	if (!otp) {
			// 		return responseFormat(
			// 			res,
			// 			null,
			// 			"OTP is required",
			// 			false,
			// 			203
			// 		);
			// 	}

			// 	// Check if the user has a twoFASecret
			// 	if (!result?.user?.settings?.twoFASecret) {
			// 		return responseFormat(
			// 			res,
			// 			null,
			// 			"Two-factor authentication secret not found",
			// 			false,
			// 			400
			// 		);
			// 	}

			// 	const isValid = await verify2FACode(
			// 		otp,
			// 		result.user.settings.twoFASecret
			// 	);
			// 	if (!isValid) {
			// 		return responseFormat(res, null, "Invalid OTP", false, 400);
			// 	}
			// }
			responseFormat(res, result, "Login successful", true, 200);
		} catch (error) {
			handleError(error, res, "Login failed");
		}
	}

	async loginQR(req, res) {
		try {
			const { socketId, deviceCode } = req.body;
			if (!socketId || !deviceCode) {
				return responseFormat(
					res,
					null,
					"Socket ID and device code are required",
					false,
					400
				);
			}

			if (deviceCode.length < 16) {
				return responseFormat(
					res,
					null,
					"Invalid device code",
					false,
					400
				);
			}

			const result = await AuthService.loginById(req.user.id);

			if (!result) {
				return responseFormat(
					res,
					null,
					"Invalid authenticate",
					false,
					400
				);
			}
			// console.log("result", result);
			console.log("socketId", socketId);
			console.log("deviceCode", deviceCode);

			try {
				getIO().to(socketId).emit("loginQR:verified", {
					errorCode: 200,
					message: "Accept login QR code",
					data: result,
				});
				responseFormat(
					res,
					null,
					"Login QR code sent successfully",
					true,
					200
				);
			} catch (error) {
				console.log(error);
				return responseFormat(
					res,
					null,
					"Failed to send QR login",
					false,
					400
				);
			}
		} catch (error) {
			console.log(error);
			handleError(error, res, "Login failed");
		}
	}

	async logout(req, res) {
		try {
			await AuthService.logout(req.jwt.jti);
			responseFormat(res, null, "Logout successful", true, 200);
		} catch (error) {
			handleError(error, res, "Logout failed");
		}
	}

	async getMe(req, res) {
		try {
			const userId = req.user.id;
			const user = await AuthService.getMe(userId);
			responseFormat(res, user, "User retrieved successfully", true, 200);
		} catch (error) {
			handleError(error, res, "Failed to retrieve user");
		}
	}

	async refreshToken(req, res) {
		try {
			const { refreshToken } = req.body;
			const result = await AuthService.refreshToken(refreshToken);
			responseFormat(
				res,
				result,
				"Token refreshed successfully",
				true,
				200
			);
		} catch (error) {
			handleError(error, res, "Token refresh failed");
		}
	}

	async forgotPassword(req, res) {
		try {
			const { phone } = req.body;
			if (!phone || phone.trim() === "") {
				return responseFormat(
					res,
					null,
					"Phone number is required",
					false,
					400
				);
			}
			const result = await UserService.getUserByPhone(phone);

			if (!result) {
				return responseFormat(
					res,
					null,
					"Phone number not registered",
					false,
					404
				);
			}
			// Send OTP to the user's phone
			const msg =
				"Ban dang thuc hien thao tac doi mat khau. TUYET DOI KHONG CHIA SE MA VOI BAT KI AI\n";
			// replace phonenumber with +84
			const phoneNumber = result.phone.replace(/^(0)/, "+84");
			const user = await UserService.createOTP(result.id);
			if (!user) {
				return responseFormat(
					res,
					null,
					"Failed to create OTP",
					false,
					500
				);
			}
			const otp = user.otp.code;
			await sendOtp({ phoneNumber, msg, otp });
			responseFormat(res, null, "OTP sent successfully", true, 200);
		} catch (error) {
			console.log(error);
			handleError(error, res, "Failed to send password reset link");
		}
	}
	async verifyOtpValidate(req, res) {
		try {
			const { phone, otp } = req.body;

			if (!phone || phone.trim() === "") {
				return responseFormat(
					res,
					null,
					"Phone number is required",
					false,
					400
				);
			}
			const result = await AuthService.verifyOtp(phone, otp);
			if (!result) {
				return responseFormat(res, null, "Invalid OTP", false, 400);
			}
			responseFormat(res, null, "OTP verified successfully", true, 200);
		} catch (error) {
			console.log(error);
			handleError(error, res, "Failed to verify OTP");
		}
	}
	async verifyOtp(req, res) {
		try {
			const { phone, otp } = req.body;

			if (!phone || phone.trim() === "") {
				return responseFormat(
					res,
					null,
					"Phone number is required",
					false,
					400
				);
			}
			const result = await AuthService.verifyAccount(phone, otp);
			if (!result) {
				return responseFormat(res, null, "Invalid OTP", false, 400);
			}
			responseFormat(res, null, "OTP verified successfully", true, 200);
		} catch (error) {
			console.log(error);
			handleError(error, res, "Failed to verify OTP");
		}
	}

	async resetPasswordOTP(req, res) {
		try {
			const { phone, otp, password } = req.body;

			if (!phone || phone.trim() === "") {
				return responseFormat(
					res,
					null,
					"Phone number is required",
					false,
					400
				);
			}
			const result = await AuthService.resetPasswordOTP(
				phone,
				otp,
				password
			);
			if (!result) {
				return responseFormat(
					res,
					null,
					"Failed to reset password",
					false,
					400
				);
			}
			responseFormat(res, null, "Password reset successfully", true, 200);
		} catch (error) {
			handleError(error, res, "Failed to reset password");
		}
	}

	async changePassword(req, res) {
		try {
			const { oldPassword, newPassword } = req.body;
			const userId = req.user.id;
			const result = await AuthService.changePassword(
				userId,
				oldPassword,
				newPassword
			);
			responseFormat(
				res,
				null,
				"Password changed successfully",
				true,
				200
			);
		} catch (error) {
			handleError(error, res, "Failed to change password");
		}
	}

	async verifyAccount(req, res) {
		try {
			const { phone, otp } = req.body;
			if (!phone || phone.trim() === "") {
				return responseFormat(
					res,
					null,
					"Phone number is required",
					false,
					400
				);
			}
			if (!otp || otp.trim() === "") {
				return responseFormat(res, null, "OTP is required", false, 400);
			}
			const result = await AuthService.verifyAccount(phone, otp);
			if (!result) {
				return responseFormat(
					res,
					null,
					"Failed to verify account",
					false,
					400
				);
			}
			responseFormat(
				res,
				result,
				"Account verified successfully",
				true,
				200
			);
		} catch (error) {
			handleError(error, res, "Failed to verify account");
		}
	}

	async resendOtp(req, res) {
		try {
			const { phone } = req.body;
			if (!phone || phone.trim() === "") {
				return responseFormat(
					res,
					null,
					"Phone number is required",
					false,
					400
				);
			}
			const user = await UserService.getUserByPhone(phone);
			if (!user) {
				return responseFormat(res, null, "User not found", false, 404);
			}

			const dateRecentlySend = new Date(user.otp.expiredAt);
			// revert 5 mins to get time create
			dateRecentlySend.setMinutes(dateRecentlySend.getMinutes() - 5);
			const currentDate = new Date();
			// check if otp create in 1 mins

			currentDate.setMinutes(currentDate.getMinutes() - 1);

			if (dateRecentlySend > currentDate) {
				return responseFormat(
					res,
					null,
					"Wait for 1 minute to resent otp",
					false,
					407
				);
			}

			const msg =
				"Ban da yeu cau lay lai OTP. TUYET DOI KHONG CHIA SE MA VOI BAT KI AI\n";
			// replace phonenumber with +84
			const phoneNumber = user.phone.replace(/^(0)/, "+84");
			const result = await UserService.createOTP(user.id);
			if (!result) {
				return responseFormat(
					res,
					null,
					"Failed to create OTP",
					false,
					500
				);
			}
			const otp = result.otp.code;
			await sendOtp({ phoneNumber, msg, otp });
			responseFormat(res, null, "OTP resent successfully", true, 200);
		} catch (error) {
			handleError(error, res, "Failed to resend OTP");
		}
	}

	async getDevices(req, res) {
		try {
			const userId = req.user.id;
			const devices = await getTokensByUserId(userId);
			if (!devices || devices.length === 0) {
				return responseFormat(
					res,
					null,
					"No devices found",
					false,
					404
				);
			}
			// Filter out the devices that are not active
			responseFormat(
				res,
				devices,
				"Devices retrieved successfully",
				true,
				200
			);
		} catch (error) {
			handleError(error, res, "Failed to retrieve devices");
		}
	}

	async logoutAll(req, res) {
		try {
			const userId = req.user.id;
			await AuthService.logoutAll(userId);
			responseFormat(res, null, "Logged out from all devices", true, 200);
		} catch (error) {
			handleError(error, res, "Failed to log out from all devices");
		}
	}

	async logoutDevice(req, res) {
		try {
			const { deviceId } = req.body;
			if (!deviceId || deviceId.trim() === "") {
				return responseFormat(
					res,
					null,
					"Device ID is required",
					false,
					400
				);
			}
			const result = await AuthService.logout(deviceId);
			if (!result) {
				return responseFormat(
					res,
					null,
					"Failed to log out from device",
					false,
					400
				);
			}
			responseFormat(
				res,
				null,
				"Logged out from device successfully",
				true,
				200
			);
		} catch (error) {
			handleError(error, res, "Failed to log out from device");
		}
	}

	async enable2FA(req, res) {
		try {
			const { secret, otp } = req.body;
			const userId = req.user.id;
			if (!secret || secret.trim() === "") {
				return responseFormat(
					res,
					null,
					"Secret is required",
					false,
					400
				);
			}
			const check = await verify2FACode(otp, secret);
			if (!check) {
				return responseFormat(res, null, "Invalid OTP", false, 400);
			}
			const result = await AuthService.enable2FA(userId, secret);
			if (!result) {
				return responseFormat(
					res,
					null,
					"Failed to enable 2FA",
					false,
					400
				);
			}
			responseFormat(res, result, "2FA enabled successfully", true, 200);
		} catch (error) {
			handleError(error, res, "Failed to enable 2FA");
		}
	}

	async disable2FA(req, res) {
		try {
			const { otp } = req.body;
			const userId = req.user.id;
			if (!otp || otp.trim() === "") {
				return responseFormat(res, null, "OTP is required", false, 400);
			}
			const user = await UserService.getUserById(userId);
			if (!user) {
				return responseFormat(res, null, "User not found", false, 404);
			}
			if (!user.settings.twoFAEnabled) {
				return responseFormat(
					res,
					null,
					"Two-factor authentication is not enabled",
					false,
					400
				);
			}

			const check = await verify2FACode(otp, user.settings.twoFASecret);
			if (!check) {
				return responseFormat(res, null, "Invalid OTP", false, 400);
			}
			const result = await AuthService.disable2FA(userId);
			if (!result) {
				return responseFormat(
					res,
					null,
					"Failed to disable 2FA",
					false,
					400
				);
			}
			responseFormat(res, null, "2FA disabled successfully", true, 200);
		} catch (error) {
			handleError(error, res, "Failed to disable 2FA");
		}
	}

	async status2FA(req, res) {
		try {
			const userId = req.user.id;
			const result = await UserService.getUserById(userId);
			if (!result) {
				return responseFormat(
					res,
					null,
					"Failed to get 2FA status",
					false,
					400
				);
			}
			if (!result.settings.twoFAEnabled) {
				return responseFormat(
					res,
					null,
					"Two-factor authentication is not enabled",
					false,
					404
				);
			}
			responseFormat(
				res,
				result,
				"2FA status retrieved successfully",
				true,
				200
			);
		} catch (error) {
			handleError(error, res, "Failed to get 2FA status");
		}
	}

	// changePassword
	async changePassword(req, res) {
		try {
			const { oldPassword, newPassword } = req.body;
			const userId = req.user.id;
			if (!oldPassword || oldPassword.trim() === "") {
				return responseFormat(
					res,
					null,
					"Old password is required",
					false,
					400
				);
			}
			if (!newPassword || newPassword.trim() === "") {
				return responseFormat(
					res,
					null,
					"New password is required",
					false,
					400
				);
			}
			// leng >6
			if (newPassword.length < 6) {
				return responseFormat(
					res,
					null,
					"New password must be at least 6 characters long",
					false,
					400
				);
			}

			const result = await UserModel.findOne({ id: userId });
			if (!result) {
				return responseFormat(res, null, "User not found", false, 404);
			}
			// Check if the old password is correct
			const isMatch = await result.comparePassword(oldPassword);
			if (!isMatch) {
				return responseFormat(
					res,
					null,
					"Invalid old password",
					false,
					401
				);
			}
			const hashedPassword = await AuthService.encryptPassword(
				newPassword
			);
			result.password = hashedPassword;
			await result.save();
			responseFormat(
				res,
				null,
				"Password changed successfully",
				true,
				200
			);
		} catch (error) {
			handleError(error, res, "Failed to change password");
		}
	}
}

module.exports = new AuthController();