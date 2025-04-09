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
};