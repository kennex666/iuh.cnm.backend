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

const socketRoutes = (io) => {
    io.on("connection", (socket) => {
        console.log(`✅ New client connected: ${socket.id}`);

        socket.on('ping', (data) => {
            console.log('Ping received:', data);
            socket.emit('pong', { message: 'Pong from server' });
        });

        socket.on("send_message", (data) => {
            console.log("Message received:", data);

            const { conversationId, senderId, content, type, repliedTold } = data;
            // Kiểm tra loại tin nhắn hợp lệ
            if (type !== "text" && type !== "image" && type !== "file") {
                console.error("Invalid message type:", type);
                return;
            }
            // Lưu tin nhắn vào MongoDB
            const newMessage = new messageModel({
                conversationId,
                senderId,
                content,
                type,
                repliedTold,
            });
            newMessage.save()
                .then(() => {       
                    // Phát tin nhắn tới tất cả người dùng trong phòng
                    io.emit("new_message", newMessage);
                })
                .catch((error) => {
                    console.error("Error saving message:", error);
                    socket.emit("error", { message: "Failed to send message" });
                });
        });

        socket.on("disconnect", () => {
            console.log(`❌ Client disconnected: ${socket.id}`);
        });
    });
}

module.exports = {
	initSocket,
	socketRoutes,
	getIO,
};