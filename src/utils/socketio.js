const socket = {
    io: null,
}
const setIO = (io) => {
    socket.io = io;
}

const getIO = () => {
    return socket.io;
}

module.exports = {
    setIO,
    getIO,
}