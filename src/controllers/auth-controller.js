const { handleError, responseFormat } = require("../utils/response-format");
const AuthService = require("../services/auth-service");
const UserService = require("../services/user-service");
const { sendOtp } = require("../utils/twilio");

class AuthController {
    async register(req, res) {
        try {
            const dataUser = req.body;
            const user = await AuthService.register(dataUser);
            responseFormat(res, user, "Create user successful", true, 201);
        } catch (error) {
            handleError(error, res, "Create user failed");
        }
    }

    async login(req, res) {
        try {
            const { phone, password } = req.body;
            const result = await AuthService.login(phone, password);
            responseFormat(res, result, "Login successful", true, 200);
        } catch (error) {
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
            const result = await UserService.getUserByPhone(phone);

            if (!result) {
                return responseFormat(res, null, "Phone number not registered", false, 404);
            }
            // Send OTP to the user's phone
            const msg = "Ban dang thuc hien thao tac doi mat khau. TUYET DOI KHONG CHIA SE MA VOI BAT KI AI\n";
            const phoneNumber = phone.replace(/^0/, "+84");
            const user = await UserService.createOTP(result.id);
            if (!user) {
                return responseFormat(res, null, "Failed to create OTP", false, 500);
            }
            const otp = user.otp.code;
            await sendOtp({ phoneNumber, msg, otp });
            responseFormat(res, null, "OTP sent successfully", true, 200);
        } catch (error) {
            handleError(error, res, "Failed to send password reset link");
        }
    }
}

module.exports = new AuthController();