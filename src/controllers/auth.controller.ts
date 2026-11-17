import type { Request, Response, NextFunction } from "express";
import { registerUser, verifyEmailToken, resendVerificationEmail } from "../services/auth.service.js";

// =============== Registration Controller ===============
export const registerController = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
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


export const verifyEmailController = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const result = await verifyEmailToken(req.body.token);
        res.status(200).json({
            success: true,
            message: result.message,
            user: result.user,
        });
    } catch (error) {
        next(error);
    }
}

export const resendVerificationEmailController = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const result = await resendVerificationEmail(req.body.email);
        res.status(200).json({
            success: true,
            message: result.message,
        });
    } catch (error) {
        next(error);
    }
}
