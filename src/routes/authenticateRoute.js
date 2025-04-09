const express = require("express");
const { loginController } = require("../controllers/authenticateController");

const router = express.Router();

// Login
router.post("/login", loginController);

// Register

module.exports = router;