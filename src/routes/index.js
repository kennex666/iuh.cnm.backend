const express = require("express");
const authRoutes = require("./auth-routes");
const userRoutes = require("./user-routes.js");
const friendRequestRoute = require("./friendrequest-route.js");
const conversationRoute = require("./conversation-route");
const messageRoute = require("./message-route.js");

const router = express.Router();

router.get("/ping", (req, res) => {
    res.status(200).json({ message: "pong" });
});

router.use("/auth", authRoutes);

router.use("/user", userRoutes);

router.use("/api/conversations", conversationRoute);

router.use("/api/messages", messageRoute);

router.use("/api/friendRequests", friendRequestRoute);
module.exports = router;