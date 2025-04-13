/**
 * @description Parses a time string into milliseconds.
 * @param {string} str - The time string to parse (e.g., "5m", "2h", "1d").
 * @returns {number} The time in milliseconds.
 * @example
 * // parseTimeJWT("5m"); // returns 300000
 * // parseTimeJWT("2h"); // returns 7200000
 * // parseTimeJWT("1d"); // returns 86400000
 */
function parseTimeJWT(str) {
	const match = /^(\d+)([smhd])$/.exec(str);
	if (!match) return 3600 * 1000; // default 1h

	const [, num, unit] = match;
	const timeMap = {
		s: 1000,
		m: 60 * 1000,
		h: 60 * 60 * 1000,
		d: 24 * 60 * 60 * 1000,
	};
	return parseInt(num) * timeMap[unit];
}

module.exports = {
    parseTimeJWT,
}