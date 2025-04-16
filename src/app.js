const app = require("./configs/app");
const connection = require("./database/connection");
const http = require("http");
const corsMiddleware = require("./middlewares/cors");
const router = require("./routes");
const PORT = process.env.PORT || 8087;
const HOST = process.env.HOST_NAME;
const { socketRoutes, initSocket } = require("./routes/socket-routes");
const webrtcRoutes = require("./routes/webrtc-route");

(async () => {
	try {
		await connection();
		console.log("MongoDB Connected...");

		const server = http.createServer(app);

		initSocket(server, (io) => {
			socketRoutes(io);
		});

		app.use(corsMiddleware);
		app.use("/call", webrtcRoutes);
		app.use("/api", router);
		server.listen(PORT, HOST, () => {
			console.log(`Server is listening on port ${PORT}`);
		});
	} catch (error) {
		console.log("BACKEND ERROR CONNECTING TO DBS: ", error);
	}
})();