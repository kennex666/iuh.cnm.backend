const express = require("express");
const authRoutes = require("./auth-routes");
const userRoutes = require("./user-routes.js");
const friendRequestRoute = require("./friendrequest-route.js");
const conversationRoute = require("./conversation-route");
const messageRoute = require("./message-route.js");
const { generate2FASecret } = require("../utils/2fa-generator.js");

const router = express.Router();

router.get("/ping", (req, res) => {
    res.status(200).json({ message: "pong" });
});

router.use("/auth", authRoutes);

router.use("/user", userRoutes);

router.use("/api/conversations", conversationRoute);

router.use("/api/messages", messageRoute);

router.use("/api/friendRequests", friendRequestRoute);

router.get("/2fa/generate", (req, res) => {
    // Generate a new 2FA secret
    const secret = generate2FASecret();
    res.status(200).json(secret);
});
module.exports = router;