const mongoose = require("mongoose");
const { config } = require("dotenv");
config();

const connectDB = async () => {
    try {
        await mongoose.connect(
            process.env.DB_HOST, {
            dbName: process.env.DB_NAME
        }
        );
        console.log("MongoDB Connected...");
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};
module.exports = connectDB;

