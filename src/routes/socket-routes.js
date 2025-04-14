const { generateString } = require("../utils/2fa-generator");
const { Server } = require("socket.io");
const messageModel = require("../models/message-model");
const typeMessage = require("../models/type-message"); // Import typeMessage từ file typeMessage.js


var io = null;

function initSocket(server, callback) {
    io = new Server(server, {
		path: "/socket.io",
		cors: {
			origin: "*",
			methods: ["GET", "POST"],
			allowedHeaders: ["Content-Type"],
			credentials: true,
		},
	});
    callback(io);
    console.log("Socket.io initialized");
}


function getIO() {
	if (!io) {
		throw new Error("❌ Socket.io chưa được khởi tạo");
	}
	return io;
}
const sendMessageToRoom = (io, conversationId, message) => {
    io.to(conversationId).emit("receiveMessage", message);
    console.log(`Message sent to room ${conversationId}:`, message.content);
};

const socketRoutes = (io) => {
    io.on("connection", (socket) => {
        console.log(`✅ New client connected: ${socket.id}`);

        // Lắng nghe sự kiện tham gia phòng
        socket.on("joinRoom", async ({ conversationId, senderId }) => {
			try {
				socket.join(conversationId);
				console.log(`User ${senderId} joined room ${conversationId}`);
		
				// Lấy tất cả tin nhắn trong phòng từ MongoDB
				const messages = await messageModel.find({ conversationId }).sort({ sentAt: 1 });
		
				// Gửi tất cả tin nhắn tới người dùng vừa tham gia
				socket.emit("loadMessages", messages);
		
				// Thông báo cho các thành viên khác trong phòng
				socket.to(conversationId).emit("userJoined", { senderId, conversationId });
			} catch (error) {
				console.error("Error loading messages:", error);
				socket.emit("error", { message: "Failed to load messages" });
			}
		});

        // Lắng nghe sự kiện gửi tin nhắn
        socket.on("sendMessage", async ({ conversationId, senderId, content, type, repliedTold }) => {
			try {
				// Lưu tin nhắn vào MongoDB
				type = "text";
				repliedTold =""; // Kiểm tra loại tin nhắn hợp lệ
				const newMessage = new messageModel({
					conversationId,
					senderId,
					content,
					type,
					repliedTold,
				});
				await newMessage.save();
		
				// Phát tin nhắn tới tất cả người dùng trong phòng
				io.to(conversationId).emit("receiveMessage", newMessage);
				console.log(`Message sent to room ${conversationId}:`, content);
			} catch (error) {
				console.error("Error saving message:", error);
				socket.emit("error", { message: "Failed to send message" });
			}
		});
		// Lắng nghe sự kiện rời phòng
        socket.on("leaveRoom", ({ conversationId, senderId }) => {
            socket.leave(conversationId);
            console.log(`User ${senderId} left room ${conversationId}`);
            socket.to(conversationId).emit("userLeft", { senderId, conversationId });
        });

        // Xử lý khi client ngắt kết nối
        socket.on("disconnect", () => {
            console.log(`❌ Client disconnected: ${socket.id}`);
        });

        socket.on("loginQR:generate", () => {
            console.log("Login QR code generated");
            // Generate a random device code
            const deviceCode = generateString(16);
            socket.data.deviceCode = deviceCode;
            console.log("Device code: ", deviceCode);
            // Emit the device code to the client
            socket.emit("loginQR:generate", {
				errorCode: 200,
				message: "Login QR code generated",
				data: {
					deviceCode: "iMessify:QRLogin_" + deviceCode,
					socketId: socket.id,
				},
			});
        });
    });
}

module.exports = {
	initSocket,
	socketRoutes,
	getIO,
};