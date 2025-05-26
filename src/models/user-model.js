const { Schema, model } = require("mongoose");
const bcrypt = require("bcryptjs");
const { generateIdSnowflake } = require("../utils/id-generators");

const UserSchema = new Schema(
	{
		id: { type: String, default: generateIdSnowflake, unique: true },
		name: { type: String, required: true },
		email: { type: String, default: null },
		phone: { type: String, required: true },
		gender: {
			type: String,
			enum: ["male", "female", "other"],
			required: true,
		},
		password: { type: String, required: true },
		avatarUrl: {
			type: String,
			default:
				"https://s3.ap-southeast-2.amazonaws.com/iuh.lab.k17/avt-default.png",
		},
		coverUrl: {
			type: String,
			default: "default",
		},
		dob: { type: Date, required: true },
		isOnline: { type: Boolean, default: false },
		isVerified: { type: Boolean, default: false },
		settings: {
			twoFAEnabled: { type: Boolean, default: false },
			twoFASecret: { type: String, default: null },
		},
		otp: {
			code: { type: String, default: null },
			expiredAt: { type: Date, default: null },
			isUsed: { type: Boolean, default: false },
		},
	},
	{ collection: "users", timestamps: true }
);

UserSchema.methods.comparePassword = async function (candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
};

UserSchema.statics.findById = function (id) {
	return this.findOne({ id: id })
};

const UserModel = model("User", UserSchema);

module.exports = UserModel;