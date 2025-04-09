

const express = require("express");
const authRoutes = require("./authRoutes");
const userRoutes = require("./userRoutes");
const friendRequestRoute = require("./friendRequestRoute");
const conversationRoute = require("./conversationRoute");
const messageRoute = require("./messageRoute");

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