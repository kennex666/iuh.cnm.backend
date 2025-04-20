const mongoose = require('mongoose');
const { Schema, model } = mongoose;
const { generateIdSnowflake } = require("../utils/id-generators");

const reactionSchema = new Schema({
    id: { type: String, default: generateIdSnowflake, unique: true },
    messageId: { type: String, required: true },
    userId: { type: String, required: true },
    emoji: { type: String, required: true },
});

reactionSchema.statics.findById = function (id) {
    return this.findOne({ id: id })
};

reactionSchema.statics.findByIdAndDelete = function (id) {
    return this.findOneAndDelete({ id: id })
};

const reactionModel = model('reactionModel', reactionSchema);

module.exports = reactionModel;