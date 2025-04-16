// src/routes/user.js
const express = require("express");
const { body } = require("express-validator");
const { validateBody } = require("../middlewares/validation");
const UserController = require("../controllers/user-controller");
const {authMiddleware}= require("../middlewares/auth");
const multer = require("multer");
const router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const validateUpdateUser = [
    body("name")
        .optional()
        .isString().withMessage("Name must be a string"),
    body("gender")
        .optional()
        .isIn(["male", "female", "other"]).withMessage("Gender must be male, female, or other"),
    body("dob")
        .optional()
        .isISO8601().withMessage("Invalid date format (use ISO 8601, e.g., YYYY-MM-DD)"),
    body('email')
        .optional()
        .isEmail().withMessage('Invalid email format'),
];

// User routes
router.get("/search", UserController.searchUsers);
router.get("/:id", UserController.getUserById);
router.get("/search/:q", UserController.searchUsersByPhone);
router.put(
    "/update",
    authMiddleware,
    upload.fields([
        { name: "avatar", maxCount: 1 },
        { name: "cover", maxCount: 1 },
    ]),
    validateUpdateUser,
    validateBody,
    UserController.updateUser
);
// router.get("/:id/friends", authMiddleware, UserController.getUserFriends);


module.exports = router;