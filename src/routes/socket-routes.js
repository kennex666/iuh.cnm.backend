const { generateString } = require("../utils/2fa-generator");
const { Server } = require("socket.io");


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
        socket.data = {
            deviceCode: ""
        };

        console.log("New client connected");

        socket.on("disconnect", () => {
            console.log("Client disconnected");
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