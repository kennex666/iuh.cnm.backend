class WebRTCHandler {
    socket = null; // socket.io client
	iceServers = [
		{
			url: "stun:global.stun.twilio.com:3478",
			urls: "stun:global.stun.twilio.com:3478",
		},
	];

	constructor() {}

    setSocket(socket) {
        this.socket = socket;
    }

	// Tạo kết nối peer
	createPeerConnection(socketId) {
		const pc = new RTCPeerConnection({ iceServers: this.iceServers });

        const localStream = windowEventHandler.localStream;
		// 🔸 Add local media
		localStream.getTracks().forEach((track) => {
			pc.addTrack(track, localStream);
		});

		// 🔸 Khi nhận media từ người khác
		pc.ontrack = (event) => {
			let remoteVideo = document.getElementById(`video-${socketId}`);
			if (!remoteVideo) {
				remoteVideo = document.createElement("video");
				remoteVideo.id = `video-${socketId}`;
				remoteVideo.autoplay = true;
				remoteVideo.playsInline = true;
				remoteVideo.className =
					"bg-black w-full aspect-video rounded-xl shadow-lg ring-2 ring-white object-cover transition-all duration-300 scale-95 opacity-0";
				windowEventHandler.groupVideo.appendChild(
					remoteVideo
				);
				requestAnimationFrame(() => {
					remoteVideo.classList.remove("scale-95", "opacity-0");
				});
			}
			if (event.streams && event.streams[0]) {
				remoteVideo.srcObject = event.streams[0];
			}
		};

		// 🔸 Khi có ICE Candidate
		pc.onicecandidate = (event) => {
			if (event.candidate) {
				this.socket.emit("signal", {
					to: socketId,
					type: "candidate",
					data: event.candidate,
				});
			}
		};

		return pc;
	}

	// 🔹 Xử lý tín hiệu từ peer khác
	async handleSignal(from, type, data) {
		let pc = windowEventHandler.peers[from];
		if (!pc) {
			pc = this.createPeerConnection(from);
			windowEventHandler.peers[from] = pc;
		}

		if (type === "offer") {
			await pc.setRemoteDescription(new RTCSessionDescription(data));
			const answer = await pc.createAnswer();
			await pc.setLocalDescription(answer);
			this.socket.emit("signal", {
				to: from,
				type: "answer",
				data: answer,
			});
		} else if (type === "answer") {
			await pc.setRemoteDescription(new RTCSessionDescription(data));
		} else if (type === "candidate") {
			if (data) await pc.addIceCandidate(new RTCIceCandidate(data));
		}
	}

	
}
