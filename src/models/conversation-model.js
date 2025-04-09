const mongoose = require('mongoose');
const { Schema, model } = mongoose;
const { generateIdSnowflake } = require("../utils/id-generators");

// Định nghĩa schema cho Conversation
const conversationSchema = new Schema({
    id: { type: String, default: generateIdSnowflake, unique: true },
    isGroup: { type: Boolean, default: false },
    name: { type: String, default: '' },
    avatar: { type: String, default: '' },
    participants: { type: Array, default: [] },
    adminIds: { type: Array, default: [] }, 
    settings: { type: Object, default: {} },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
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

// Tạo model Conversation từ schema
const conversation = model('conversation', conversationSchema);

// Export model Conversation
module.exports = conversation;
