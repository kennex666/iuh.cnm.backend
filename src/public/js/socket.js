class SocketHandler {
    socket = null;
    users = null;
    constructor(socket) {
        this.socket = socket;
        this.roomHandler();
        this.joinHandler();
        this.signalHandler();
        this.userLeftHandler();
        this.screenShare();
        this.errorHandler();
    }

    // 🔹 Khi socket kết nối
    // 🔹 Nhận danh sách người trong phòng → gọi offer
    roomHandler() {
        this.socket.on("room-users", async (users) => {
            windowEventHandler.updateGridVideo();
            this.users = users;
            users.forEach(async (other) => {
                if (other.socketId === windowEventHandler.myId) return;

                console.log("📞 Calling to:", other.socketId);

                const pc = webrtc.createPeerConnection(other.socketId);
                windowEventHandler.peers[other.socketId] = pc;

                const offer = await pc.createOffer();
                await pc.setLocalDescription(offer);

                this.socket.emit("signal", {
                    to: other.socketId,
                    type: "offer",
                    data: offer,
                });
            });
        })
    }

    // 🔹 Khi có lỗi xảy ra
    errorHandler() {
        this.socket.on("error", (error) => {
            document.getElementById("error").classList.toggle("hidden", false);
            document.getElementById("error-message").innerText = error.message;
        });
    }

    // 🔹 Khi có người mới vào
    joinHandler() {
        this.socket.on("user-joined", ({ socketId, infoUser }) => {
			console.log("👤 New peer joined:", socketId);
			console.log("👤 User info:", infoUser);
			const pc = webrtc.createPeerConnection(socketId);
			windowEventHandler.peers[socketId] = pc;
			windowEventHandler.updateGridVideo();
		});

        this.socket.on("user-list", (users) => {
            console.log("👤 User list:", users);
            this.users = users;
            windowEventHandler.updateGridVideo();
        });
    }

    // 🔹 Nhận tín hiệu từ peer
    signalHandler() {
        this.socket.on("signal", async ({ from, type, data }) => {
            console.log("📡 Signal:", from, type);
            await webrtc.handleSignal(from, type, data);
            windowEventHandler.updateGridVideo();
        });
    }

    // 🔹 Khi ai đó rời
   userLeftHandler(){
     this.socket.on("user-left", (data) => {
			const { socketId, reason, conversationType } = data;

			console.warn("❌ User left:", socketId, "\nReason:", reason);

			// query data-socket-id
            const video = document.querySelectorAll(`[data-socket-id="${socketId}"]`);
            (video.length > 0) && video.forEach((el) => {
                el.remove();
            });

			// Dọn peer
			if (windowEventHandler.peers[socketId]) {
				windowEventHandler.peers[socketId].close();
				delete windowEventHandler.peers[socketId];
			}

            if (conversationType == "1vs1") {
                document.getElementById("call-ended").classList.toggle("hidden", false);
            }
            
			windowEventHandler.updateGridVideo();
		});
   }

   // 🔹 Catch screen sharing
   screenShare () {
        this.socket.on("screen:share-start", data => {
            setTimeout(() => {
                console.log("📺 Screen sharing started:", data);
				const { from, trackId } = data;
				const trackElement = document.querySelector(
					`[data-track-id="${trackId}"]`
				);
				if (trackElement) {
					trackElement.dataset.type = "screen";
					trackElement.classList.add("screen-sharing", "ring-2", "ring-yellow-500");
					const span = trackElement.querySelector("div > span");
					span.innerText = "[Screen sharing] " + span.innerText;
				} else {
					console.warn("❌ No screen video track");
				}
            }, 500)
        });

        this.socket.on("screen:share-stop", data => {
        });
   }


}