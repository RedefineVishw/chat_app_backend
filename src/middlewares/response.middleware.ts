import type { Request, Response, NextFunction } from "express";

export const responseMiddleware = (
    req: Request,
    res: Response,
    next: NextFunction
): void => {
    res.success = function <T>(data: T, message = "Success") {
        return this.status(200).json({
            success: true,
            message,
            data,
        });
    };

    res.created = function <T>(data: T, message = "Created successfully") {
        return this.status(201).json({
            success: true,
            message,
            data,
        });
    };

    res.error = function (message, statusCode = 500) {
        return this.status(statusCode).json({
            success: false,
            message,
        });
    };

    res.badRequest = function (message) {
        return this.error(message, 400);
    };

    res.unauthorized = function (message = "Unauthorized") {
        return this.error(message, 401);
    };

    res.forbidden = function (message = "Forbidden") {
        return this.error(message, 403);
    };

    res.notFound = function (message = "Resource not found") {
        return this.error(message, 404);
    };

    next();
};