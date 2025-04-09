const mongoose = require('mongoose');
const { Schema, model } = mongoose;
const typeMessage = require('./typeMessage'); // Import typeMessage từ file typeMessage.js

// Định nghĩa schema cho Message
const messageSchema = new Schema({
    id: { type: String },
    conversationId: { type: String, required: true },
    senderId: { type: String, required: true },
    content: { type: String, default: '' },
    type: { type: String, enum: typeMessage,require:true}, //type: 'text' | 'image' | 'file' | 'reaction'
    repliedTold:{ type: String, default: '' },
    sentAt: { type: Date, default: Date.now },
    readBy: { type: Array, default: [] },
});
messageSchema.pre('save', function (next) {
    if (this.isNew || this.id === undefined) {
        this.id = this._id.toString();
    }
    next();
});

const messageModel = model('messageModel', messageSchema);
//export model Message
module.exports = messageModel;