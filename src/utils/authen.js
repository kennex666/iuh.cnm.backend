const jwt = require("jsonwebtoken");

function verifyToken(token) {
    try {
        const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        return decoded.user || decoded; // assuming user info is in decoded.user
    } catch (err) {
        return null;
    }
}

module.exports = { verifyToken };