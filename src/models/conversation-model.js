const mongoose = require('mongoose');
const { Schema, model } = mongoose;
const { generateIdSnowflake } = require("../utils/id-generators");
const typeMessage = require('./type-message');

const participantInfoSchema = new Schema({
	id: { type: String, required: true },
	name: { type: String, required: true },
	avatar: { type: String, default: "" },
	nickname: { type: String, default: "" },
	role: { type: String, enum: ['member', 'admin', 'mod'], default: 'member' }
}, { _id: false });
participantInfoSchema.pre('validate', function (next) {
	if (!this.nickname || this.nickname.trim() === "") {
		this.nickname = this.name;
	}
	next();
});
const messageSchema = new Schema({
	id: { type: String , required: true },
	conversationId: { type: String, required: true },
	senderId: { type: String, required: true },
	content: { type: String, default: '' },
	type: { type: String, enum: typeMessage,require:true}, //type: 'text' | 'image' | 'file' | 'reaction' | 'call'
	repliedTold:{ type: String, default: '' },
	sentAt: { type: Date, default: Date.now },
	readBy: { type: Array, default: [] },
}, { _id: false }); // Vì embedded nên không cần _id

const pendingUserSchema = new Schema({
	id: { type: String, required: true },
	name: { type: String },
	avatar: { type: String },
	requestedAt: { type: Date, default: Date.now },
}, { _id: false });

const settingsSchema = new Schema({
	isReviewNewParticipant: { type: Boolean, default: false }, // để biết cuộc trò chuyện có cần review?
	isAllowReadNewMessage: { type: Boolean, default: false },  // để biết người dùng có được phép xem tin nhắn gần nhất (người mới)
	isAllowMessaging: { type: Boolean, default: true },	// cho phép nhắn tin không? (Chỉ phó, trưởng được nhắn)
	pendingList: { type: [pendingUserSchema], default: [] } // Danh sách người dùng đang chờ phê duyệt tham gia nhóm
}, { _id: false });

// Định nghĩa schema cho Conversation
const conversationSchema = new Schema({
	id: { type: String, default: generateIdSnowflake, unique: true },
	isGroup: { type: Boolean, default: false },
	name: { type: String, default: "" },
	avatarUrl: { type: String, default: "" },
	avatarGroup: { type: String, default: "" },
	type: { type: String, enum: ['1vs1', 'group'], required: true },
	participantIds: { type: [String], default: [] },
	participantInfo: { type: [participantInfoSchema], default: [] },
	url: { type: String, required: true, unique: true },
	pinMessages: { type: [messageSchema], default: [], validate: [arr => arr.length <= 3, '{PATH} exceeds the limit of 3'] },
	settings: { type: settingsSchema, default: () => ({}) },
	lastMessage: {
		type: mongoose.Schema.Types.ObjectId,
		ref: "messageModel",
		default: null,
	},
	createdAt: { type: Date, default: Date.now },
	updatedAt: { type: Date, default: Date.now },
});

// Middleware: tự động gán 'id' từ '_id' của MongoDB khi lưu
// conversationSchema.pre('save', function (next) {
//     if (this.isNew || this.id === undefined) {
//         this.id = this._id.toString();
//     }
//     next();
// });

// Middleware: tự động cập nhật 'updatedAt' khi tài liệu được cập nhật
conversationSchema.pre('findOneAndUpdate', function (next) {
    this.set({ updatedAt: Date.now() });
    next();
});

// Middleware: tự động cập nhật 'updatedAt' khi tài liệu được cập nhật
conversationSchema.pre('updateOne', function (next) {
    this.set({ updatedAt: Date.now() });
    next();
});

conversationSchema.statics.findById = function (id) {
	return this.findOne({ id: id })
};

conversationSchema.statics.findByIdAndDelete = function (id) {
    return this.findOneAndDelete({ id: id })
}

conversationSchema.statics.findByIdAndUpdate = function (id, update) {
    return this.findOneAndUpdate({ id: id }, update, { new: true });
}

// Tạo model Conversation từ schema
const conversation = model('conversation', conversationSchema);

// Export model Conversation
module.exports = conversation;
