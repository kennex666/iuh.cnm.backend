const mongoose = require('mongoose');

const friendListSchema = new mongoose.Schema({
    id1: {
        type: String,
        required: true
    },
    id2: {
        type: String,
        required: true
    }
}, {
    timestamps: true,
    collection: "friend-list"
});

const FriendList = mongoose.model('FriendList', friendListSchema);

module.exports = FriendList;