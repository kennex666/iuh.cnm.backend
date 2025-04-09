const mongoose = require("mongoose");
const { config } = require("dotenv");
config();

const connectDB = async () => {
    try {
        await mongoose.connect(
            "mongodb://localhost:27017/chat_web_app",
        );
        console.log("MongoDB Connected...");
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};
module.exports= connectDB;

