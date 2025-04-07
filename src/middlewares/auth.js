const jwt = require("jsonwebtoken");
const { AppError, handleError } = require("../utils/responseFormat");

const authMiddleware = (req, res, next) => {
    const token = req.headers.authorization?.split(" ")[1]; // get token from "Bearer <token>"
    if (!token) {
        handleError(
            new AppError("No token provided", 401), res, "authentication failed"
        )
    }

    try {
        const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        handleError(
            new AppError("Invalid or expired token", 401), res, "authentication failed"
        )
    }
};

module.exports = authMiddleware;