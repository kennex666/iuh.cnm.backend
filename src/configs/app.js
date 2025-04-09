const express = require("express");
require("dotenv").config();
const router = require("../routes/index");
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", router);

const conversationRoute = require("./routes/conversationRoute");
app.use("/api/conversations", conversationRoute);

const messageRoute = require("./routes/messageRoute");
app.use("/api/messages", messageRoute);

const friendRequestRoute = require("./routes/friendRequestRoute");
app.use("/api/friendRequests", friendRequestRoute);
module.exports = app;