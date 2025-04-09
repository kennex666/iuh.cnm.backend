const twilio = require("twilio");
const TwilioMockupClient = require("../mockup/twilio-client-mockup");

const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN} = process.env;
const accountSid = TWILIO_ACCOUNT_SID || "mockup_account_sid";
const authToken = TWILIO_AUTH_TOKEN || "";

let client = (!authToken) ? TwilioMockupClient(accountSid, authToken) : twilio(accountSid, authToken);

/**
 * Tạo mã OTP ngẫu nhiên
 * @function
 * @param {number} length - Độ dài của mã OTP (mặc định là 6)
 * @return {number} - Mã OTP ngẫu nhiên
 */
function generateOTP(length = 6) {
	return Math.floor(
		Math.pow(10, length - 1) + Math.random() * 9 * Math.pow(10, length - 1)
	);
}

/**
 * Gửi OTP qua SMS bằng Twilio
 * @param {string} phoneNumber - Số điện thoại người nhận (định dạng quốc tế, ví dụ: +84901234567)
 * @returns {Promise<string>} - Mã OTP đã gửi
 */
async function sendOtp(phoneNumber) {
	const otp = generateOTP();
	const message = `Mã OTP của bạn là: ${otp}`;

	await client.messages.create({
		body: message,
		to: phoneNumber, // ví dụ: +84901234567
		from: "YOUR_TWILIO_PHONE_NUMBER", // ví dụ: +12065551234
	});

	console.log("✅ OTP đã gửi:", otp);

	// Tuỳ bạn: Lưu OTP vào Redis, MongoDB, hoặc tạm thời cache để xác minh sau
	return otp;
}


// 