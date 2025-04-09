const { body } = require("express-validator");
const { validateBody } = require("../middlewares/validation");
const AuthController = require("../controllers/auth-controller");
const authMiddleware = require("../middlewares/auth");
const express = require("express");
const { io } = require("./socket-routes");
const router = express.Router();

const validateRegister = [
    body("name").notEmpty().withMessage("Name is required").isString().withMessage("Name must be a string"),
    body("phone").notEmpty().withMessage("Phone is required").isString().withMessage("Phone must be a string").isMobilePhone("vi-VN").withMessage("Invalid Vietnamese phone number"),
    body("gender").notEmpty().withMessage("Gender is required").isIn(["male", "female", "other"]).withMessage("Gender must be male, female, or other"),
    body("password").notEmpty().withMessage("Password is required").isLength({ min: 6 }).withMessage("Password must be at least 6 characters long"),
    body("dob").notEmpty().withMessage("Date of birth is required").isISO8601().withMessage("Invalid date format (use ISO 8601, e.g., YYYY-MM-DD)"),
];

const validateLogin = [
    body("phone").notEmpty().withMessage("Phone is required").isString().withMessage("Phone must be a string").isMobilePhone().withMessage("Invalid phone number"),
    body("password").notEmpty().withMessage("Password is required"),
];

const validatePhone = [
    body("phone").notEmpty().withMessage("Phone is required").isString().withMessage("Phone must be a string").isMobilePhone().withMessage("Invalid phone number"),
];

const validateLogin2FA = [
    body("phone").notEmpty().withMessage("Phone is required").isString().withMessage("Phone must be a string").isMobilePhone().withMessage("Invalid phone number"),
    body("password").notEmpty().withMessage("Password is required"),
    body("otp").notEmpty().withMessage("OTP is required").isString().withMessage("OTP must be a string").isLength({ min: 6, max: 6 }).withMessage("OTP must be 6 digits long"),
];


const validateRefreshToken = [
    body("refreshToken").notEmpty().withMessage("Refresh token is required").isString().withMessage("Refresh token must be a string"),
];

router.post("/register", validateRegister, validateBody, AuthController.register);
router.post("/login", validateLogin, validateBody, AuthController.login);
router.post("/login-2fa", validateLogin2FA, validateBody, AuthController.login);
router.get("/logout", authMiddleware, AuthController.logout);
router.get("/me", authMiddleware, AuthController.getMe);
router.post("/refresh-token", validateRefreshToken, validateBody, AuthController.refreshToken);
router.post("/forgot-password", (req, res) => {
    const { phone, otp, password } = req.body;
    if (phone && otp && password) {
        return AuthController.resetPasswordOTP(req, res);
    } else if (phone && otp) {
        return AuthController.verifyOtp(req, res);
    }
    return AuthController.forgotPassword(req, res);

});
router.post("/verify-account", validatePhone, validateBody, AuthController.verifyOtp);
router.post("/resend-otp", validatePhone, validateBody, AuthController.resendOtp);
router.post("/login-qr", authMiddleware, AuthController.loginQR);

router.get("/devices", authMiddleware, AuthController.getDevices);

router.get("/logout-all", authMiddleware, AuthController.logoutAll);
router.post("/logout-device", authMiddleware, AuthController.logoutDevice);

router.post("/2fa/enable", authMiddleware, AuthController.enable2FA);
router.post("/2fa/disable", authMiddleware, AuthController.disable2FA);
router.get("/2fa/status", authMiddleware, AuthController.status2FA);


module.exports = router;