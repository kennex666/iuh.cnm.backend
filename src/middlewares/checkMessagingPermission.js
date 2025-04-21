const conversations = require('../models/conversation-model');
const { AppError } = require('../utils/response-format');

const checkMessagingPermission = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { conversationId } = req.body;

        const conversation = await conversations.findOne({ id: conversationId });
        if (!conversation) {
            return res.status(404).json({
                success: false,
                errorCode: 404,
                errorMessage: 'Conversation not found',
            });
        }

        const { isAllowMessaging = true } = conversation.settings || {};
        const userInfo = conversation.participantInfo.find(p => p.id === userId);

        if (!userInfo) {
            return res.status(403).json({
                success: false,
                errorCode: 403,
                errorMessage: 'You are not a participant of this conversation',
            });
        }

        // Nếu được phép nhắn thì ai cũng nhắn được
        if (isAllowMessaging) return next();

        // Nếu bị hạn chế, chỉ admin hoặc mod mới được nhắn
        if (['admin', 'mod'].includes(userInfo.role)) return next();

        return res.status(403).json({
            success: false,
            errorCode: 403,
            errorMessage: 'You are not allowed to send messages in this conversation',
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            errorCode: 500,
            errorMessage: 'Internal server error',
            errors: error.message,
        });
    }
};

module.exports = checkMessagingPermission;