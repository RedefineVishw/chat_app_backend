import type { ErrorRequestHandler } from "express";

const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
    console.error(err);

    const statusCode =
        typeof err === "object" &&
        err !== null &&
        "statusCode" in err &&
        typeof err.statusCode === "number" &&
        err.statusCode >= 400 &&
        err.statusCode < 600
            ? err.statusCode
            : 500;
    const message =
        statusCode < 500 &&
        typeof err === "object" &&
        err !== null &&
        "message" in err &&
        typeof err.message === "string"
            ? err.message
            : "Internal Server Error";

    res.status(statusCode).json({
        success: false,
        message,
    });
};

export default errorHandler;