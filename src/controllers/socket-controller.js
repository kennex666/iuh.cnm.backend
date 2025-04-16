const messageModel = require('../models/message-model');
const Conversation = require('../models/conversation-model');
const User = require('../models/user-model');
const SocketService = require('../services/socket-service');

class SocketController {


    static async handleConnection(socket) {
        const user = socket.user;
        console.log(`User connected: ${user.name} (${user.id})`);
        // Update isOnline when user connects
        if (!user.isOnline) {
            await User.findOneAndUpdate({ id: user.id }, { isOnline: true });
            await SocketService.broadcastStatus(socket, true);
        }
        // Join user to all participated conversations
        await SocketService.joinConversationRooms(socket);

    }
}

module.exports = SocketController;