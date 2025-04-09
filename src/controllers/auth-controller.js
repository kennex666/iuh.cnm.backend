const { handleError, responseFormat } = require("../utils/response-format");
const AuthService = require("../services/auth-service");
const UserService = require("../services/user-service");
const { sendOtp } = require("../utils/twilio");
const { verify2FACode } = require("../utils/2fa-generator");
const { io, getIO } = require("../routes/socket-routes");

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
			const otp = user.otp.code;
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
            if (!result) {
                return responseFormat(res, null, "Invalid phone or password", false, 400);
            }
            // Check if the user isnt verified
            if (result?.user?.isVerified === false) {
                return responseFormat(res, null, "Account not verified", false, 207);
            }
            // Check if the user has two-factor authentication enabled
            if (result?.user?.settings?.twoFAEnabled) {
                if (!otp) {
                    return responseFormat(res, null, "OTP is required", false, 203);
                }

                // Check if the user has a twoFASecret
                if (!result?.user?.settings?.twoFASecret) {
                    return responseFormat(res, null, "Two-factor authentication secret not found", false, 400);
                }

                const isValid = await verify2FACode(otp, result.user.settings.twoFASecret);
                if (!isValid) {
                    return responseFormat(res, null, "Invalid OTP", false, 400);
                }
            }
            responseFormat(res, result, "Login successful", true, 200);
        } catch (error) {
            handleError(error, res, "Login failed");
        }
    }

    async loginQR(req, res) {
        try {
            const { socketId, deviceCode } = req.body;
            if (!socketId || !deviceCode) {
                return responseFormat(res, null, "Socket ID and device code are required", false, 400);
            }

            if (deviceCode.length < 16) {
                return responseFormat(res, null, "Invalid device code", false, 400);
            }

            const result = await AuthService.loginById(req.user.id);

            if (!result) {
                return responseFormat(res, null, "Invalid authenticate", false, 400);
            }
            // console.log("result", result);
            console.log("socketId", socketId);
            console.log("deviceCode", deviceCode);

            try {
                getIO().to(socketId).emit(
					"loginQR:verified",
					{
						errorCode: 200,
						message: "Accept login QR code",
						data: result,
					}
				);
                responseFormat(res, null, "Login QR code sent successfully", true, 200);
            } catch (error) {
                console.log(error);
                return responseFormat(res, null, "Failed to send QR login", false, 400);
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
            responseFormat(res, result, "Token refreshed successfully", true, 200);
        } catch (error) {
            handleError(error, res, "Token refresh failed");
        }
    }

    async forgotPassword(req, res) {
        try {
            const { phone } = req.body;
            if (!phone || phone.trim() === "") {
                return responseFormat(res, null, "Phone number is required", false, 400);
            }
            const result = await UserService.getUserByPhone(phone);

            if (!result) {
                return responseFormat(res, null, "Phone number not registered", false, 404);
            }
            // Send OTP to the user's phone
            const msg = "Ban dang thuc hien thao tac doi mat khau. TUYET DOI KHONG CHIA SE MA VOI BAT KI AI\n";
            // replace phonenumber with +84
            const phoneNumber = result.phone.replace(/^(0)/, "+84");
            const user = await UserService.createOTP(result.id);
            if (!user) {
                return responseFormat(res, null, "Failed to create OTP", false, 500);
            }
            const otp = user.otp.code;
            await sendOtp({ phoneNumber, msg, otp });
            responseFormat(res, null, "OTP sent successfully", true, 200);
        } catch (error) {
            console.log(error);
            handleError(error, res, "Failed to send password reset link");
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
            console.log(error)
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
            const result = await AuthService.resetPasswordOTP(phone, otp, password);
            if (!result) {
                return responseFormat(res, null, "Failed to reset password", false, 400);
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
            const result = await AuthService.changePassword(userId, oldPassword, newPassword);
            responseFormat(res, null, "Password changed successfully", true, 200);
        } catch (error) {
            handleError(error, res, "Failed to change password");
        }
    }

    async verifyAccount(req, res) {
        try {
            const { phone, otp } = req.body;
            if (!phone || phone.trim() === "") {
                return responseFormat(res, null, "Phone number is required", false, 400);
            }
            if (!otp || otp.trim() === "") {
                return responseFormat(res, null, "OTP is required", false, 400);
            }
            const result = await AuthService.verifyAccount(phone, otp);
            if (!result) {
                return responseFormat(res, null, "Failed to verify account", false, 400);
            }
            responseFormat(res, result, "Account verified successfully", true, 200);
        } catch (error) {
            handleError(error, res, "Failed to verify account");
        }
    }
           
    async resendOtp(req, res) {
        try {
            const { phone } = req.body;
            if (!phone || phone.trim() === "") {
                return responseFormat(res, null, "Phone number is required", false, 400);
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
                return responseFormat(res, null, "Wait for 1 minute to resent otp", false, 407);
            }

            
            const msg = "Ban da yeu cau lay lai OTP. TUYET DOI KHONG CHIA SE MA VOI BAT KI AI\n";
            // replace phonenumber with +84
            const phoneNumber = user.phone.replace(/^(0)/, "+84");
            const result = await UserService.createOTP(user.id);
            if (!result) {
                return responseFormat(res, null, "Failed to create OTP", false, 500);
            }
            const otp = result.otp.code;
            await sendOtp({ phoneNumber, msg, otp });
            responseFormat(res, null, "OTP resent successfully", true, 200);
        } catch (error) {
            handleError(error, res, "Failed to resend OTP");
        }
    }
}

module.exports = new AuthController();