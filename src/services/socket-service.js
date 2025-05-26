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
        const systemMessage = `
        Bạn là một trợ lý AI chuyên hỗ trợ các câu hỏi liên quan đến trường đại học. 
        Nếu người dùng hỏi câu hỏi không liên quan đến trường đại học, vui lòng trả lời: 
        "Xin lỗi, tôi chỉ hỗ trợ các câu hỏi liên quan đến trường đại học. Bạn có thể hỏi tôi về lịch học, môn học, học phí, hoặc các thông tin học vụ khác.
        Vui lòng không trả lời các câu hỏi ngoài chủ đề này.
        Trả lời liên quan đến câu hỏi, không dài dòng bằng tiếng Việt, tập trung giải quyết vấn đề chính của câu hỏi không hỏi người dùng lại trả lời đúng trọng tâm câu hỏi.
        Nội dung sau đây là câu hỏi của người dùng: 
        ` + message + ` `.trim();
        try {
            const response = await axios.post(
                `${API_URL}?key=${API_KEY}`,
                {
                    contents: [
                        {
                            role: 'user',
                            parts: [
                                {
                                    text: `${systemMessage}`,
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
            const responseText = responseData.candidates?.[0]?.content?.parts?.[0]?.text || '';
        
            return responseText;
            } catch (error) {
            console.error('Error:', error.response ? error.response.data : error.message);
            throw error;
        }
    }
}

module.exports = SocketService;