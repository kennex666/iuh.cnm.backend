
const { validationResult } = require('express-validator');

const validateBody = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(200).json({
			errorCode: 400,
			errorMessage: "Validation failed",
			errors: errors.array(),
		});
    };
    next();
}


module.exports = { validateBody }
