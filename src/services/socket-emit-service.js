const MemoryManager = require("../utils/memory-manager");

const sendMessage = (io, listParticipant, data) => {
    listParticipant = listParticipant || [];
    // lọc trùng
    listParticipant = [...new Set(listParticipant)];
    listParticipant.forEach((participant) => {
        if (participant) {
            const socketList = MemoryManager.getSocketList(participant);
            socketList.forEach((socketId) => {
                io.to(socketId).emit("message:new", data);
            });
        }
    });
};

module.exports = {
    sendMessage,
};