const express = require("express");
require("dotenv").config();

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

//app.use("/v1/api", router);
const router = require("./routes/conversationRoute");
app.use("/api/conversations", router);

const messageRoute = require("./routes/messageRoute");
app.use("/api/messages", messageRoute);
module.exports = app;