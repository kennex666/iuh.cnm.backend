const socketUsers = new Map();
const MemoryManager = {
    addSocketToUser: (userId, socketId) => {
        // Check if userId is already in the map
        if (socketUsers.has(userId)) {
            const user = socketUsers.get(userId);
            // Check if socketId is already in the user's array
            if (!user.includes(socketId)) {
                user.push(socketId);
            }
            socketUsers.set(userId, user);
        } else {
            socketUsers.set(userId, [socketId])
        }
    },
    removeSocket: (userId, socketId) => {
        if (socketUsers.has(userId)) {
			const user = socketUsers.get(userId);
			// Check if socketId is already in the user's array
			if (user.includes(socketId)) {
				user.splice(user.indexOf(socketId), 1);
			}
            socketUsers.set(userId, user);
		}
    },
    getSocketList: (userId) => {
        return socketUsers.get(userId) || [];
    },
    getAllUsers: () => {
        return Array.from(socketUsers.entries());
    }
};
module.exports = MemoryManager;