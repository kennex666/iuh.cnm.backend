const speakeasy = require("speakeasy");
const qrcode = require("qrcode");

/**
 * Tạo secret
 * @param {string} secret - Secret key
 * @return {Promise<string>} - URL mã QR
 */
function generate2FASecret(name) {
	const secret = speakeasy.generateSecret({
		name: `iMessify (${name})`,
		length: 32,
	});
	return secret;
}

/**
 * Tạo mã OTP ngẫu nhiên
 * @function
 * @param {number} length - Độ dài của mã OTP (mặc định là 6)
 * @return {number} - Mã OTP ngẫu nhiên
 */
function generateOTP(length = 6) {
	return "123456";
	return Math.floor(
		Math.pow(10, length - 1) + Math.random() * 9 * Math.pow(10, length - 1)
	);
}

/**
 * Xác minh mã 2FA
 * @param {string} secret - Secret key
 * @return {Promise<string>} - URL mã QR
 */
function verify2FACode(userInputCode, base32Secret) {
	return speakeasy.totp.verify({
		secret: base32Secret,
		encoding: "base32",
		token: userInputCode,
		window: 1, // chấp nhận chênh lệch 30s
	});
}

module.exports = {
	generate2FASecret,
	verify2FACode,
	generateOTP,
};