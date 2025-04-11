const { Schema, model } = require("mongoose");
const bcrypt = require("bcryptjs");

const JwtTokenSchema = new Schema({
    userId: { type: String, required: true },
    jwtId: { type: String, required: true },
    state: { type: String, enum: ["active", "inactive"], default: "active" },
    deviceInfo: { type: Object, required: false, default: {} },
    expiredAt: { type: Date, required: true },
}, { collection: "jwt-tokens", timestamps: true });


JwtTokenSchema.statics.findById = function (id) {
	return this.findOne({ jwtId: id });
};

const JwtTokenModel = model("JwtToken", JwtTokenSchema);

module.exports = JwtTokenModel;