const urlParts = window.location.pathname.split("/");
const conversationId = urlParts[3];
const userId = urlParts[4];
const messageId = urlParts[5];
const ROOM_ID = `${conversationId}_room_${messageId}`;

const windowEventHandler = new EventHandler(ROOM_ID, userId, conversationId, messageId);
const webrtc = new WebRTCHandler();
const socket = new SocketHandler(windowEventHandler.getSocket());
webrtc.setSocket(windowEventHandler.getSocket());
