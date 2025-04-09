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