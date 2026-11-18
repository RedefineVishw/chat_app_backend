import type { Request, Response, NextFunction } from "express";
import {
    registerUser,
    verifyEmailToken,
    resendVerificationEmail,
    loginUser,
    refreshUserToken,
    logoutUser,
    getCurrentUser,
    forgotPassword,
    resetPassword,
    changePassword,
} from "../services/auth.service.js";
import { clearAuthCookies, setAuthCookies } from "../utils/cookies.utils.js";

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

export const LoginController = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const result = await loginUser(req.body.email, req.body.password);
        setAuthCookies(res, result.accessToken, result.refreshToken);
        res.status(200).json({
            success: true,
            message: result.message,
            user: result.user,
        });
    } catch (error) {
        next(error);
    }
}

export const RefreshTokenController = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const refreshToken = req.cookies?.refreshToken;
        if (!refreshToken) {
            res.status(401).json({ success: false, message: "Refresh token missing" });
            return;
        }
        const result = await refreshUserToken(req.cookies.refreshToken);
        setAuthCookies(res, result.accessToken, result.refreshToken);
        res.status(200).json({
            success: true,
            message: "Token refreshed successfully",
            user: result.user,
        });

    } catch (error) {
        next(error);
    }
}

export const LogoutController = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const refreshToken = req.cookies?.refreshToken;
        await logoutUser(refreshToken);
        clearAuthCookies(res);

        res.status(200).json({
            success: true,
            message: "Logged out successfully",
        });
    } catch (error) {
        next(error);
    }
}

export const getCurrentUserController = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const userId = req.user!.userId;
        const user = await getCurrentUser(userId);

        res.status(200).json({
            success: true,
            message: "User profile retrieved successfully",
            user,
        });
    } catch (error) {
        next(error);
    }
}

export const forgotPasswordController = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { email } = req.body;
        const result = await forgotPassword(email);
        res.status(200).json({ success: true, message: result.message })
    } catch (error) {
        next(error);
    }
}

// =============== Reset Password Controller ===============
export const resetPasswordController = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { token, password } = req.body;
        const result = await resetPassword(token, password);

        if (!result.success) {
            res.status(400).json({ success: false, message: result.message, });
            return;
        }
        clearAuthCookies(res);   // Clear existing authentication cookies
        res.status(200).json({ success: true, message: result.message, });
    } catch (error) {
        next(error);
    }
};

export const changePasswordController = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const result = await changePassword(req.user!.userId, req.body.currentPassword, req.body.newPassword);
        clearAuthCookies(res);

        res.status(200).json({
            success: true,
            message: result.message,
        });
    } catch (error) {
        next(error);
    }
};