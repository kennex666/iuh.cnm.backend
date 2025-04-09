
const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();
const { DB_HOST, DB_NAME } = process.env;

const stateConnection = [
    { value: 0, name: "disconnected" },
    { value: 1, name: "connected" },
    { value: 2, name: "connecting" },
    { value: 3, name: "disconnecting" },
    { value: 99, name: "uninitialized" }
]

const connectDB = async () => {
    try {
        await mongoose.connect(DB_HOST, {
            dbName: DB_NAME,
        })
        const connectionState = mongoose.connection.readyState;
        const currentState = stateConnection.find(state => state.value === connectionState);
        console.log("Connection status: ", currentState.name);
    } catch (error) {
        console.log("Error connecting to the database: ", error);
        process.exit(1);
    }
}


module.exports = connectDB;