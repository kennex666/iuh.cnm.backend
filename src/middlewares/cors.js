// Access to XMLHttpRequest at 'http://192.168.1.25:8087/api/auth/login' from origin 'http://localhost:8081' has been blocked by CORS policy: Request header field authorization is not allowed by Access-Control-Allow-Headers in preflight response.
// const express = require("express");
const cors = require("cors");
const corsOptions = {
	origin: "http://localhost:8081",
	methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
	preflightContinue: false,
	optionsSuccessStatus: 204,
	allowedHeaders: [
		"Authorization",
		"Content-Type",
		"X-Requested-With",
		"Accept",
		"Origin",
	],
};
const corsMiddleware = cors(corsOptions);
module.exports = corsMiddleware;