const mongoose = require('mongoose');
const { Schema, model } = mongoose;
const { generateIdSnowflake } = require("../utils/id-generators");
const typeMessage = require('./type-message');
const typeRoleUser = require('./type-role-user');
// Schema phụ cho participantInfo
const participantInfoSchema = new Schema({
	id: { type: String, required: true },
	name: { type: String, required: true },
	avt: { type: String, default: "" },
	nickname: { type: String, default: "" },
	role: { type: String, enum: typeRoleUser, default: 'member' },
}, { _id: false });

// Schema phụ cho tin nhắn pin
const pinMessageSchema = new Schema({
	id: { type: String, required: true },
	senderId: { type: String, required: true },
	content: { type: String, default: "" },
	type: { type: String, enum: typeMessage, required: true },
	sentAt: { type: Date, required: true },
}, { _id: false });

// Schema phụ cho pendingList trong settings
const pendingUserSchema = new Schema({
	id: { type: String, required: true },
	name: { type: String, required: true },
	avt: { type: String, default: "" }
}, { _id: false });

// Settings schema
const settingsSchema = new Schema({
	isReviewNewParticipant: { type: Boolean, default: false },
	pendingList: { type: [pendingUserSchema], default: [] },
	isAllowReadNewMessage: { type: Boolean, default: true },
	isAllowMessaging: { type: Boolean, default: true }
}, { _id: false });

// Main Conversation schema
const conversationSchema = new Schema({
	id: { type: String, default: generateIdSnowflake, unique: true },
	isGroup: { type: Boolean, default: false },
	name: { type: String, default: "" },
	avatarUrl: { type: String, default: "" },
	avatarGroup: { type: String, default: "" },
	type: { type: String, enum: ['1vs1', 'group'], required: true },
	url: { type: String, default: "" },
	participantIds: { type: [String], default: [] },
	participantInfo: { type: [participantInfoSchema], default: [] },
	pinMessages: { type: [pinMessageSchema], default: [] },
	settings: { type: settingsSchema, default: () => ({}) },
	createdAt: { type: Date, default: Date.now },
	updatedAt: { type: Date, default: Date.now },
}, {
	versionKey: false
});

// Cập nhật tự động updatedAt
conversationSchema.pre('findOneAndUpdate', function (next) {
	this.set({ updatedAt: Date.now() });
	next();
});

conversationSchema.pre('updateOne', function (next) {
	this.set({ updatedAt: Date.now() });
	next();
});

// Static methods (sử dụng id tự tạo)
conversationSchema.statics.findById = function (id) {
	return this.findOne({ id });
};

conversationSchema.statics.findByIdAndDelete = function (id) {
	return this.findOneAndDelete({ id });
};

conversationSchema.statics.findByIdAndUpdate = function (id, update) {
	return this.findOneAndUpdate({ id }, update, { new: true });
};

const Conversation = model('conversation', conversationSchema);
module.exports = Conversation;
