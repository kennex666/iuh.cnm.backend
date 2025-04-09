const express = require("express");
require("dotenv").config();
const router = require("../routes/index");
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

module.exports = app;