const express = require("express");
const { loginController } = require("../controllers/authenticate-controller");

const router = express.Router();

// Login
router.post("/login", loginController);

// Register

module.exports = router;