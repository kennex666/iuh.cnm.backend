const { Schema, model } = require("mongoose");
const bcrypt = require("bcryptjs");

const JwtTokenSchema = new Schema({
    userId: { type: String, required: true },
    jwtId: { type: String, required: true },
    state: { type: String, enum: ["active", "inactive"], default: "active" },
    expiredAt: { type: Date, required: true },
}, { collection: "jwt-tokens", timestamps: true });

const JwtTokenModel = model("JwtToken", JwtTokenSchema);

JwtTokenModel.statics.findById = async function (id) {
    return this.findOne({ id: id, isDeleted: false });
};

module.exports = JwtTokenModel;