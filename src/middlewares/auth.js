const jwt = require("jsonwebtoken");
const { AppError } = require("../utils/responseFormat");

const authMiddleware = (req, res, next) => {
    const token = req.headers.authorization?.split(" ")[1]; // get token from "Bearer <token>"
    if (!token) {
        throw new AppError("No token provided", 401);
    }

    try {
        const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        throw new AppError("Invalid or expired token", 401);
    }
};

module.exports = authMiddleware;