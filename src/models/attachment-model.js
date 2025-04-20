const mongoose = require('mongoose');
const { Schema, model } = mongoose;
const { generateIdSnowflake } = require("../utils/id-generators");

const attachmentSchema = new Schema({
    id: { type: String, default: generateIdSnowflake, unique: true },
    messageId: { type: String, required: true },
    url: { type: String, required: true },
    fileType: { type: String, required: true },
    fileName: { type: String, required: true },
    size: { type: Number, required: true },
});

attachmentSchema.statics.findById = function (id) {
    return this.findOne({ id: id })
};

const attachmentModel = model('attachmentModel', attachmentSchema);
module.exports = attachmentModel;