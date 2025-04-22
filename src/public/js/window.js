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
	isPinned = false; // Biến để kiểm tra video có đang được ghim hay không

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
		this.connectHandler();
	}

	connectHandler() {
		this.socket.on("connect", async () => {
			windowEventHandler.myId = this.socket.id;
			await windowEventHandler.startLocalStream();
			this.socket.emit("join-room", this.user);
		});
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

		for (let i = 0; i < numVideos; i++) {
			const video = videos[i];
		}

        if (numVideos == 1) {
            videos[0].style.maxHeight = "70vh";
        }
		if (numVideos > 0 && !this.isPinned) {
			const cols = Math.min(numVideos, 3); // tối đa 3 cột cho đẹp
			this.groupVideo.style.gridTemplateColumns = `repeat(${cols}, minmax(0, 1fr))`;

			// auto rows tùy theo tổng số
			this.groupVideo.style.gridAutoRows = "minmax(0, 1fr)";
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
		const videoTrack = this.localStream.getVideoTracks()[0];
		videoTrack.enabled = !videoTrack.enabled;
		button.textContent = videoTrack.enabled ? "Tắt cam" : "Bật cam";
	}

	// 🔹 Bật/tắt mic
	toggleMute(button) {
		const audioTrack = this.localStream.getAudioTracks()[0];
		audioTrack.enabled = !audioTrack.enabled;
		button.textContent = audioTrack.enabled ? "Tắt tiếng" : "Bật tiếng";
	}

	async startScreenShare(btn) {
		try {
			this.screenStream = await navigator.mediaDevices.getDisplayMedia({
				video: true,
				audio: true, // Nếu muốn share âm thanh thì true
			});

			// Tạo thẻ video
			this.screenVideo = document.createElement("video");
			this.screenVideo.srcObject = this.screenStream;
			this.screenVideo.autoplay = true;
			this.screenVideo.playsInline = true;
			this.screenVideo.className =
				"bg-black w-full aspect-video rounded-xl shadow-lg ring-2 ring-yellow-500 object-cover transition-all duration-300 scale-95 opacity-0";

			// Thêm vào DOM
			const groupVideo = this.groupVideo;
			groupVideo.appendChild(this.screenVideo);

			// Animate cho ngọt
			requestAnimationFrame(() => {
				this.screenVideo.classList.remove("scale-95", "opacity-0");
			});

			// Cập nhật lại layout
			this.updateGridVideo();

            // Gửi stream đến các peer
            const screenTrack = this.screenStream.getVideoTracks()[0];

            webrtc.sendTrackToAllPeers(screenTrack, this.screenStream, "screen");
            
			// Xử lý khi người dùng dừng chia sẻ
			this.screenStream.getVideoTracks()[0].onended = async () => {
				this.stopScreenShare();
			};
		} catch (err) {
			console.error("❌ Không thể chia sẻ màn hình:", err);
		}
	}

	stopScreenShare() {
        
		if (this.screenStream) {
			this.screenStream.getTracks().forEach((track) => track.stop());
			this.screenStream = null;
		}
		if (this.screenVideo) {
			this.screenVideo.remove();
			this.screenVideo = null;
		}
		this.updateGridVideo();
	}

	layout(name) {
		switch (name) {
			case "PINNED":
				this.groupVideo.classList =
					"grid grid-cols-1 grid-rows-1 gap-4";
				this.groupVideo.style = "";
				break;
			case "NORMAL":
				this.groupVideo.classList = "grid gap-4";
				break;
			default:
				break;
		}
	}
}
