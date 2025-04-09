const mongoose = require('mongoose');
const { Schema, model } = mongoose;
const typeRequest = require('./type-request'); // Import typeRequest từ file typeRequest.js
const { create } = require('./message-model');
const { generateIdSnowflake } = require("../utils/id-generators");


// Định nghĩa schema cho FriendRequest
const friendRequestSchema = new Schema({
    id: { type: String ,default: generateIdSnowflake, unique: true },
    senderId: { type: String, required: true },
    receiverId: { type: String, required: true },
    status: { type: String, enum: typeRequest, default: 'pending' }, // 'peding' | 'accepted' | 'decline'
    createAt: { type: Date, default: Date.now },
    updateAt: { type: Date, default: Date.now },
});
// friendRequestSchema.pre('save', function (next) {
//     if (this.isNew || this.id === undefined) {
//         this.id = this._id.toString();
//     }
//     next();
// });

friendRequestSchema.statics.findById = function (id) {
	return this.findOne({ id: id })
};
friendRequestSchema.statics.findByIdAndDelete = function (id) {
    return this.findOneAndDelete({ id: id })
}

friendRequestSchema.statics.findByIdAndUpdate = function (id, update) {
    return this.findOneAndUpdate({ id: id }, update, { new: true });
}

friendRequestSchema.pre('save', function (next) {
    this.updateAt = Date.now();
    next();
});
const friendRequestModel = model('friendRequestModel', friendRequestSchema);
//export model FriendRequest
module.exports = friendRequestModel;