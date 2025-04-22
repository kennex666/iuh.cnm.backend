class SocketHandler {
    socket = null;
    constructor(socket) {
        this.socket = socket;
        this.roomHandler();
        this.joinHandler();
        this.signalHandler();
        this.userLeftHandler();
    }

    // 🔹 Khi socket kết nối
    // 🔹 Nhận danh sách người trong phòng → gọi offer
    roomHandler() {
        this.socket.on("room-users", async (users) => {
            windowEventHandler.updateGridVideo();
            users.forEach(async (otherSocketId) => {
                if (otherSocketId === windowEventHandler.myId) return;

                console.log("📞 Calling to:", otherSocketId);

                const pc = webrtc.createPeerConnection(otherSocketId);
                windowEventHandler.peers[otherSocketId] = pc;

                const offer = await pc.createOffer();
                await pc.setLocalDescription(offer);

                this.socket.emit("signal", {
                    to: otherSocketId,
                    type: "offer",
                    data: offer,
                });
            });
        })
    }

    // 🔹 Khi có người mới vào
    joinHandler() {
        this.socket.on("user-joined", (socketId) => {
            console.log("👤 New peer joined:", socketId);
            const pc = webrtc.createPeerConnection(socketId);
            windowEventHandler.peers[socketId] = pc;
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
			const { socketId, reason } = data;

			console.warn("❌ User left:", socketId, "\nReason:", reason);

			// Xoá video
			const video = document.getElementById(`video-${socketId}`);
			if (video) video.remove();

			// Dọn peer
			if (windowEventHandler.peers[socketId]) {
				windowEventHandler.peers[socketId].close();
				delete windowEventHandler.peers[socketId];
			}
			windowEventHandler.updateGridVideo();
		});
   }


}