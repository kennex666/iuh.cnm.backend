class AppError extends Error {
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
        this.message = message;
        this.isOperational = true;
        Error.captureStackTrace(this, this.constructor);
    }
}

const responseFormat = (res, data, message, success, statusCode, error) => {
    const formattedData = data
        ? Array.isArray(data)
            ? { items: data }
            : { item: data }
        : {};

    const response = {
        data: formattedData,
        statusCode,
        success,
        message,
        error
    };
    res.status(statusCode).json(response);
};

const handleError = (error, res, strMessage) => {
    if (error instanceof AppError) {
        return responseFormat(
            res,
            null,
            strMessage,
            false,
            error.statusCode,
            error.message || "Unknown error"
        );
    }
    return responseFormat(
        res,
        null,
        strMessage,
        false,
        500,
        error.message || "Unknown error"
    );
};

module.exports = {
    AppError,
    responseFormat,
    handleError
};