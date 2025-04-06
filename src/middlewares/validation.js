
const { validationResult } = require('express-validator');

const validateBody = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            data: {},
            statusCode: 400,
            success: false,
            message: 'Validation failed',
            error: errors.array()
        });
    };
    next();
}


module.exports = { validateBody }
