const urlParts = window.location.pathname.split("/");
const conversationId = urlParts[3];
const userId = urlParts[4];
const messageId = urlParts[5];
const ROOM_ID = `${conversationId}_room_${messageId}`;

function getParameterByName(name, url = window.location.href) {
  name = name.replace(/[\[\]]/g, "\\$&");
  var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
    results = regex.exec(url);
  if (!results) return null;
  if (!results[2]) return "";
  return decodeURIComponent(results[2].replace(/\+/g, " "));
}


const typeCall = getParameterByName("type");


const windowEventHandler = new EventHandler(ROOM_ID, userId, conversationId, messageId, typeCall || "personal");
const webrtc = new WebRTCHandler();
const socket = new SocketHandler(windowEventHandler.getSocket());
webrtc.setSocket(windowEventHandler.getSocket());
