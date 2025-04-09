function jsonResponse({res, errorCode, errorMessage, data = null}) {
    return res.status(200).json({
        errorCode,
        errorMessage,
        data
    });
}

module.exports = {
    jsonResponse
}