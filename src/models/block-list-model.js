const mongoose = require('mongoose');

const blockListSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true
    },
    blockedId: {
        type: String,
        required: true
    }
}, {
    timestamps: true,
    collection: "block-list"
});

const BlockList = mongoose.model('BlockList', blockListSchema);

module.exports = BlockList;