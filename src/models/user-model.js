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
				"https://chat-web-application.s3.ap-southeast-1.amazonaws.com/Clock+-+Copy.jpg",
		},
		coverUrl: {
			type: String,
			default:
				"https://chat-web-application.s3.ap-southeast-1.amazonaws.com/Clock+-+Copy.jpg",
		},
		dob: { type: Date, required: true },
		isOnline: { type: Boolean, default: false },
	},
	{ collection: "users", timestamps: true }
);

UserSchema.methods.comparePassword = async function (candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
};

UserSchema.statics.findById = async function (id) {
	return this.findOne({ id: id, isDeleted: false });
};

const UserModel = model("User", UserSchema);

module.exports = UserModel;