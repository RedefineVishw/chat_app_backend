import type { Request, Response, NextFunction } from "express";
import { registerUser } from "../services/auth.service.js";

// =============== Registration Controller ===============
export const registerController = async (
    req: Request,
    res: Response,
    next: NextFunction,
): Promise<void> => {
    try {
        const result = await registerUser(req.body);

        res.status(201).json({
            success: true,
            message: result.message,
            emailSent: result.emailSent,
            user: result.user,
        });
    } catch (error) {
        next(error);
    }
};
