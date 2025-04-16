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
	io.use(async (socket, next) => {
		try {
			// check token exists
			const token = socket.handshake.query.token || socket.handshake.token;
			if (!token) {
				throw new Error('No token provided');
			}
			// verify token
			const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
			const userId = decoded?.id;
			if (!userId) {
				throw new Error('Invalid userId');
			}
			// check user exists
			const user = await UserModel.findOne({ id: userId });
			if (!user) {
				throw new Error(`User not found: ${userId}`);
			}

			socket.user = { id: user.id, name: user.name, isOnline: user.isOnline };
			next();
		} catch (error) {
			console.error(`Authentication failed: ${error.message}`);
			next(new Error(`Authentication failed: ${error.message}`));
		}
	});

	io.on("connection", (socket) => {
		// Event connection, handle on connection
		SocketController.handleConnection(socket);

		// Listen for events after connection
		// Even disconnect
		socket.on("disconnect", async () => {
			await SocketController.handleDisconnect(io, socket);
		});

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