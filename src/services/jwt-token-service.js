const JwtTokenModel = require("../models/jwt-token-model");

const getTokensByUserId = async (userId) => {
    try {
        const tokens = await JwtTokenModel.find({ userId, state: "active" });
        return tokens;
    } catch (error) {
        if (error instanceof Error) {
            throw new Error("Cannot get jti");
        } else {
            throw new Error("Unknown error");
        }
    }
}

const saveTokenJWT = async (data) => {
    try {
        const jwtToken = new JwtTokenModel(data);
        return await jwtToken.save();
    } catch (error) {
        console.log(error)
        if (error instanceof Error) {
            throw new Error("Cannot save jti");
        } else {
            throw new Error("Unknown error");
        }
    }
}

const getTokenById = async (id) => {
    try {
        const token = await JwtTokenModel.findById(id);
        return token;
    } catch (error) {
        if (error instanceof Error) {
            throw new Error("Cannot get jti");
        } else {
            throw new Error("Unknown error");
        }
    }
}

const updateToken = async (id, data) => {
    try {
        const token  = await JwtTokenModel.findById(id);
        if (!token) {
            throw new Error("Token not found");
        }
        token.state = data?.state || token.state;
        token.expiredAt = data?.expiredAt || token.expiredAt;
        await token.save();
        return token;
    } catch (error) {
        if (error instanceof Error) {
            throw new Error("Cannot update jti");
        } else {
            throw new Error("Unknown error");
        }
    }
}

module.exports = {
	saveTokenJWT,
	getTokenById,
	updateToken,
	getTokensByUserId,
};