class EventHandler {
	socket = null;
	screenStream = null;
	screenVideo = null;
	myId = null;
	peers = {}; // socketId -> RTCPeerConnection
	localStream = null;
    localVideo = null;
	groupVideo = null;
	user = null;

	constructor(roomId, userId, conversationId, messageId) {
		this.socket = io("/webrtc");
        this.groupVideo = document.getElementById("group-video");
        this.localVideo = document.getElementById("localVideo");
		this.myId = this.socket.id;
		this.user = {
			roomId: roomId,
			userId,
			conversationId,
			callId: messageId,
		};
	}

	// 🔹 Bắt đầu camera & mic
	async startLocalStream() {
		this.localStream = await navigator.mediaDevices.getUserMedia({
			video: true,
			audio: true,
		});
		this.localVideo.srcObject = this.localStream;
	}

	getSocket() {
		return this.socket;
	}

	updateGridVideo() {
		const videos = this.groupVideo.querySelectorAll("video");
		const numVideos = videos.length;

		if (numVideos > 0) {
			this.groupVideo.style.gridTemplateColumns = `repeat(${Math.min(
				numVideos,
				6
			)}, 1fr)`;
			this.groupVideo.style.gridTemplateRows = `repeat(${Math.ceil(
				numVideos / 6
			)}, 1fr)`;
		}
	}

	// 🔹 Rời phòng
	hangUp() {
		console.log("👋 Leaving room");
		this.socket.emit("leave-room", {
			roomId: ROOM_ID,
			userId,
			conversationId,
			callId: messageId,
		});

		Object.keys(peers).forEach((id) => {
			peers[id].close();
			delete peers[id];
		});

		this.localStream?.getTracks().forEach((track) => track.stop());
		this.localVideo.srcObject = null;
		this.socket.disconnect();

		window.location.href = "http://localhost:8081/";
	}

	// 🔹 Bật/tắt cam
	toggleCamera(button) {
		const videoTrack = localStream.getVideoTracks()[0];
		videoTrack.enabled = !videoTrack.enabled;
		button.textContent = videoTrack.enabled ? "Tắt cam" : "Bật cam";
	}

	// 🔹 Bật/tắt mic
	toggleMute(button) {
		const audioTrack = localStream.getAudioTracks()[0];
		audioTrack.enabled = !audioTrack.enabled;
		button.textContent = audioTrack.enabled ? "Tắt tiếng" : "Bật tiếng";
	}
}
