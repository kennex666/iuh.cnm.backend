
const jwt = require("jsonwebtoken");
const { AppError, handleError } = require("../utils/response-format");
const { getTokenById } = require("../services/jwt-token-service");
const UserModel = require("../models/user-model");

const authMiddleware = async (req, res, next) => {
    const token = req.headers.authorization?.split(" ")[1]; // get token from "Bearer <token>"
    if (!token) {
        handleError(
            new AppError("No token provided", 401), res, "authentication failed"
        )
    }

    try {
        const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        req.user = decoded;
        req.jwt = {jti: decoded.jti};

        const jwtToken = await getTokenById(decoded.jti);

        if (!jwtToken) {
            return handleError(
                new AppError("Token not found on Database", 401), res, "authentication failed"
            )
        }
        if (jwtToken.state != "active") {
            return handleError(
                new AppError("Token not active", 401), res, "authentication failed"
            )
        }

        next();
    } catch (error) {
        handleError(
            new AppError("Invalid or expired token", 401), res, "authentication failed"
        )
    }
};

const authSocketMiddleware = async (socket, next) => {
	try {
		// check token exists
		const token = socket.handshake.auth?.token || socket.handshake.headers?.token;
		if (!token) {
			throw new Error("No token provided");
		}
		// verify token
		const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
		const userId = decoded?.id;
		if (!userId) {
			throw new Error("Invalid userId");
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
};

module.exports = {
    authMiddleware,
    authSocketMiddleware,
};