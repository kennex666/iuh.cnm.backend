function TwilioMockupClient(accountSid, authToken) {
	console.log("📦 [MOCK Twilio] Initialized with SID:", accountSid);

	return {
		messages: {
			create: async ({ body, to, from }) => {
				console.log("📨 [MOCK SMS]");
				console.log("From:", from);
				console.log("To:", to);
				console.log("Message:", body);

				// Giả lập kết quả giống Twilio thật
				return {
					sid: "SMxxxxxxxxxxxxxxxxxxxxxxxxx",
					status: "sent",
					to,
					from,
					body,
				};
			},
		},
	};
}

module.exports = TwilioMockupClient;
