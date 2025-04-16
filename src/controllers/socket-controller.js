const messageModel = require('../models/message-model');
const Conversation = require('../models/conversation-model');
const User = require('../models/user-model');
const SocketService = require('../services/socket-service');
const MemoryManager = require('../utils/memory-manager');

class SocketController {

    static async handleSendMessage(io, socket, data) {
        try {
            // Check data message send from client
            if (!data || !data.conversationId || !data.content) {
                throw new Error('Data message invalid: conversationId and content are required');
            }

            const { conversationId, content, type, repliedTold } = data;

            const userId = socket.user.id;

            // Get conversation
            const conversation = await Conversation.findOne({ id: conversationId });
            if (!conversation) {
                throw new Error(`Conversation not found with ID: ${conversationId}`);
            }

            // Check if user has permission to send message
            if (!conversation.participants.includes(userId)) {
                throw new Error('You do not have permission to send messages in this conversation');
            }

            const message = await messageModel.create({
				conversationId: conversationId,
				senderId: userId,
				content,
				type,
				repliedTold,
			});
            console.log(`Message created:`, message);

            // get all participants of conversation
            const participants = conversation.participants.map(participant => participant.toString());
            participants.forEach(participant => {
                MemoryManager.getSocketList(participant).forEach((socketId) => {
                        io.to(socketId).emit('message:new', message);
                });
            });
        } catch (error) {
            console.error(`Error sending message: ${error.message}`);
            throw error;
        }
    }

    static async broadcastStatus(socket, isOnline) {
        const user = socket.user;
        const status = {
            userId: user.id,
            isOnline: isOnline,
        };
        socket.broadcast.emit('user:status', status);
    }

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

    static async handleDisconnect(socket) {
        const user = socket.user;
        console.log(`User disconnected: ${user.name} (${user.id})`);
        // Update isOnline when user disconnects
        if (user.isOnline) {
            await User.findOneAndUpdate({ id: socket.user.id }, { isOnline: false });
            await SocketService.broadcastStatus(socket, false);
        }
    }
}

module.exports = SocketController;