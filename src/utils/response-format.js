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
            ? [ ...data ]
            : { ...data }
        : {};

    const response = {
        data: formattedData,
        errorCode: statusCode,
        success,
        errorMessage: message,
        errors: error,
    };
    res.status(200).json(response); // trả về status 200 để fe đỡ handle exception
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