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

router.use("/conversations", conversationRoute);

router.use("/messages", messageRoute);

router.use("/friendRequests", friendRequestRoute);
module.exports = router;