const app = require("./configs/app");
const connection = require("./database/connection");
const http = require("http");
const corsMiddleware = require("./middlewares/cors");
const router = require("./routes");
const PORT = process.env.PORT || 8087;
const HOST = process.env.HOST_NAME;
const { socketRoutes, initSocket, socketWebRTC, socketLoginQR } = require("./routes/socket-routes");
const webrtcRoutes = require("./routes/webrtc-route");
const express = require("express");
const path = require("path");
const testRoutes = require("./routes/test-routes");

(async () => {
	try {
		await connection();
		console.log("MongoDB Connected...");

		const server = http.createServer(app);

		initSocket(server, (io) => {
			socketRoutes(io);
			socketWebRTC(io);
			socketLoginQR(io);
		});

		
		app.use(express.static(path.join(__dirname, "public")));

		app.use(corsMiddleware);
		app.use("/webrtc", webrtcRoutes);
		app.use("/test", testRoutes);
		app.use("/api", router);
		server.listen(PORT, HOST, () => {
			console.log(`Server is listening on port ${PORT}`);
		});
	} catch (error) {
		console.log("BACKEND ERROR CONNECTING TO DBS: ", error);
	}
})();