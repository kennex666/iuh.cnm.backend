const mongoose = require('mongoose');
const Conversation = require('../models/conversation-model');

class SocketService {
    static async broadcastStatus(socket, isOnline, options = {}) {
        const userId = socket.user.id;
        const conversations = await this.getConversations(userId, { type: 'private' });
        console.log("Danh sách trò chuyện private: ", conversations);

        if (conversations.length > 0) {
            conversations.forEach(conversation => {
                const roomId = `conversation:${conversation.id}`;
                console.log(`Sending user:status to room ${roomId}`);
                socket.to(roomId).emit('user:status', { userId, isOnline });
            });
        }
    }

    static async getConversations(userId, filter = {}) {
        if (!userId) {
            throw new Error('Invalid user ID');
        }

        let query = { participants: userId };
        if (filter.type) {
            query.isGroup = filter.type === 'group';
        }

        return await Conversation.find(query).select('id participants isGroup');
    }

    static async joinConversationRooms(socket, options = {}) {
        const { filter } = options;
        const conversations = await this.getConversations(socket.user.id.toString(), filter);
        console.log("Danh sách trò chuyện: ", conversations);

        if (conversations.length > 0) {
            await Promise.all(
                conversations.map(conversation => {
                    return socket.join(`conversation:${conversation.id}`);
                })
            );
        }

        return conversations;
    }
}

module.exports = SocketService;