const twilio = require("twilio");
const TwilioMockupClient = require("../mockup/twilio-client-mockup");
const { generateOTP } = require("./2fa-generator");

const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_PHONENUMBER = process.env.TWILIO_PHONENUMBER || "+84123456789"; 
const accountSid = TWILIO_ACCOUNT_SID || "mockup_account_sid";
const authToken = TWILIO_AUTH_TOKEN || "";
console.log("authToken " + TWILIO_AUTH_TOKEN);

let client = (!authToken) ? TwilioMockupClient(accountSid, authToken) : twilio(accountSid, authToken);

/**
 * Gửi OTP qua SMS bằng Twilio
 * @param {string} phoneNumber - Số điện thoại người nhận (định dạng quốc tế, ví dụ: +84901234567)
 * @returns {Promise<string>} - Mã OTP đã gửi
 */
async function sendOtp({phoneNumber, msg, otp = null}) {
    if (!phoneNumber) {
        throw new Error("Số điện thoại không hợp lệ");
    }
	const otpStr = otp || generateOTP();
	const message = `${msg}\nMa OTP cua ban la: ${otpStr}`;

	await client.messages.create({
		body: message,
		to: phoneNumber, // ví dụ: +84901234567
		from: TWILIO_PHONENUMBER, // ví dụ: +12065551234
	});

	console.log("✅ OTP đã gửi:", otpStr);

	// Tuỳ bạn: Lưu OTP vào Redis, MongoDB, hoặc tạm thời cache để xác minh sau
	return otpStr;
}

module.exports = {
    sendOtp,
    generateOTP,
};