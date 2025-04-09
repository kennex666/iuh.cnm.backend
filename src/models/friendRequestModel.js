const mongoose = require('mongoose');
const { Schema, model } = mongoose;
const typeRequest = require('./typeRequest'); // Import typeRequest từ file typeRequest.js
const { create } = require('./messageModel');

// Định nghĩa schema cho FriendRequest
const friendRequestSchema = new Schema({
    id: { type: String },
    senderId: { type: String, required: true },
    receiverId: { type: String, required: true },
    status: { type: String, enum: typeRequest, default: 'pending' }, // 'peding' | 'accepted' | 'decline'
    createAt: { type: Date, default: Date.now },
    updateAt: { type: Date, default: Date.now },
});
friendRequestSchema.pre('save', function (next) {
    if (this.isNew || this.id === undefined) {
        this.id = this._id.toString();
    }
    next();
});
friendRequestSchema.pre('save', function (next) {
    this.updateAt = Date.now();
    next();
});
const friendRequestModel = model('friendRequestModel', friendRequestSchema);
//export model FriendRequest
module.exports = friendRequestModel;