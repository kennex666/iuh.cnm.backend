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

	async sendTrackToAllPeers(track, stream, type = "camera") {
		for (const id in windowEventHandler.peers) {
			const pc = windowEventHandler.peers[id];

			const sender = pc.addTrack(track, stream);
			sender._customType = type;

			const offer = await pc.createOffer();
			await pc.setLocalDescription(offer);

			this.socket.emit("signal", {
				to: id,
				type: "offer",
				data: offer,
			});
		}
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
			const incomingTrack = event.track;
			const trackId = incomingTrack.id;

			// ⛔ Nếu không phải video, bỏ qua
			if (incomingTrack.kind !== "video") {
				console.warn("❌ No camera/screen video track");
				return;
			}

			// ⛔ Nếu đã tồn tại trackId rồi → không render nữa
			if (document.querySelector(`[data-track-id="${trackId}"]`)) return;

			// ✅ Tạo stream riêng biệt
			const incomingStream = new MediaStream([incomingTrack]);

			var user = {
				socketId: socketId,
				name: socketId,
				avatar: "https://placehold.co/40x40",
			}
			if (socket.users){
				user = socket.users.find((user) => user.socketId == socketId);
			}


			// ✅ Render UI
			const div = document.createElement("div");
			div.dataset.trackId = trackId;
			div.dataset.type = "camera";
			div.setAttribute("data-socket-id", socketId);
			div.className =
				"relative aspect-video bg-black rounded-xl overflow-hidden ring-1 ring-white";

			const video = document.createElement("video");
			video.autoplay = true;
			video.playsInline = true;
			video.srcObject = incomingStream;
			video.className = "w-full h-full object-cover rounded-xl";

			// ✅ Info người dùng
			const divUser = document.createElement("div");
			divUser.className =
				"absolute bottom-2 left-2 flex items-center space-x-2 bg-black/60 px-3 py-1 rounded-full text-white text-sm backdrop-blur-md";

			const img = document.createElement("img");
			img.src = user?.avatar || "https://placehold.co/40x40";
			img.className = "w-6 h-6 rounded-full border border-white";

			const span = document.createElement("span");
			span.className = "font-medium";
			span.textContent = user?.name || socketId;

			divUser.appendChild(img);
			divUser.appendChild(span);
			div.appendChild(video);
			div.appendChild(divUser);
			windowEventHandler.groupVideo.appendChild(div);

			windowEventHandler.updateGridVideo();
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
