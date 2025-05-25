const mongoose = require('mongoose');
const Conversation = require('../models/conversation-model');
const axios = require('axios');
dotenv = require('dotenv');
dotenv.config();
const API_URL = process.env.API_URL || 'http://localhost:3000/api/v1';
const API_KEY = process.env.API_KEY || 'your_api_key_here';

class SocketService {
    // Broadcast user status (online/offline) to all participants in private conversations
    static async broadcastStatus(socket, isOnline) {
        const userId = socket.user.id;
        const conversations = await this.getConversations(userId, { type: 'private' });
        console.log("list conversation private: ", conversations);

        if (conversations.length > 0) {
            conversations.forEach(conversation => {
                const roomId = `conversation:${conversation.id}`;
                console.log(`Sending user:status to room ${roomId}`);
                socket.to(roomId).emit('user:status', { userId, isOnline });
            });
        }
    }
    // get all conversation of user
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
    // join user to room
    static async joinConversationRooms(socket) {
        const conversations = await this.getConversations(socket.user.id.toString());
        console.log("list conversation: ", conversations);

        if (conversations.length > 0) {
            await Promise.all(
                conversations.map(conversation => {
                    return socket.join(`conversation:${conversation.id}`);
                })
            );
        }

        return conversations;
    }

    static async getAIResponse(message) {
        try {
            const response = await axios.post(
                `${API_URL}?key=${API_KEY}`,
                {
                contents: [
                    {
                    parts: [
                        {
                        text: message,
                        },
                    ],
                    },
                ],
                },
                {
                headers: {
                    'Content-Type': 'application/json',
                },
                }
            );
        
            const responseData = response.data;
            const responseText = responseData.candidates[0]?.content?.parts[0]?.text || '';
        
            return responseText;
            } catch (error) {
            console.error('Error:', error.response ? error.response.data : error.message);
            throw error;
        }
    }
}

module.exports = SocketService;