const express = require("express");
const { authMiddleware } = require("../middlewares/auth");

// const { authMiddleware } = require("../middlewares/auth");

const webrtcRoute = express.Router();

// webrtcRoute.use(authMiddleware);

webrtcRoute.get("/", (req, res) => {
    res.json({
        message: "WebRTC route is working",
    });
});

webrtcRoute.get("/ping", (req, res) => {
    res.status(200).json({ message: "pong" });
}); 

webrtcRoute.get("/create-call", authMiddleware, (req, res) => {
    const { listIds } = req.query;
    console.log("List of IDs:", listIds);
    
});

module.exports = webrtcRoute;
