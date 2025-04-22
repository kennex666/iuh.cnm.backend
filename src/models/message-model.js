const mongoose = require('mongoose');
const { Schema, model } = mongoose;
const typeMessage = require('./type-message'); // ['text', 'image', 'file', 'reaction', 'call', 'system']
const { generateIdSnowflake } = require("../utils/id-generators");

const messageSchema = new Schema({
    id: { type: String, default: generateIdSnowflake },
    conversationId: { type: String, required: true },
    senderId: { type: String, required: true },
    content: { type: String, default: '' },
    type: { type: String, enum: typeMessage, required: true }, // ['text', 'image', ...]
    repliedToId: { type: String, default: null }, // nullable
    sentAt: { type: Date, default: Date.now },
    readBy: { type: [String], default: [] }, // array of userId
    deleteBy: { type: [String], default: [] }, // array of userId đã xóa (soft delete)
    isRemove: { type: Boolean, default: false }, // tin nhắn bị xóa hoàn toàn (optional)
}, {
    timestamps: true
});

messageSchema.statics.findById = function (id) {
    return this.findOne({ id: id });
};
messageSchema.statics.findByIdAndDelete = function (id) {
    return this.findOneAndDelete({ id: id });
};
messageSchema.statics.findByIdAndUpdate = function (id, update) {
    return this.findOneAndUpdate({ id: id }, update, { new: true });
};

const Message = model('Message', messageSchema);
module.exports = Message;
