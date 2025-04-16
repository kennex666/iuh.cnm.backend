const { Server } = require("socket.io");
const mongoose = require('mongoose');
const SocketController = require('../controllers/socket-controller');
const { generateString } = require("../utils/2fa-generator");
const UserModel = require("../models/user-model");
const jwt = require("jsonwebtoken");
require("dotenv").config();
let io = null;

function initSocket(server, callback) {
	io = new Server(server, {
		path: "/socket.io",
		cors: {
			origin: "*",
			methods: ["GET", "POST"],
			allowedHeaders: ["Content-Type"],
			credentials: true
		}
	});
	callback(io);
	console.log("Socket.io initialized");
}

function getIO() {
	if (!io) {
		throw new Error("Socket.io chưa được khởi tạo");
	}
	return io;
}

function socketRoutes(io) {

	io.on("connection", (socket) => {

		// Event loginQR:generate
		socket.on("loginQR:generate", () => {
			const deviceCode = generateString(16);
			socket.data.deviceCode = deviceCode;
			socket.emit("loginQR:generate", {
				errorCode: 200,
				message: "Đã tạo mã QR đăng nhập thành công",
				data: {
					deviceCode: "iMessify:QRLogin_" + deviceCode,
					socketId: socket.id
				}
			});
		});
	});
}

module.exports = { initSocket, socketRoutes, getIO };