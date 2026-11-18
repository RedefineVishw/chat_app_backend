import type { NextFunction, Request, Response } from "express";
import { success, z } from "zod";
import { verifyAccessToken } from "../utils/token.utils.js";
import { findActiveUserById } from "../repositories/user.repository.js";

export const authenticateUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        // STEP 1:- Read access token from cookies
        const accessToken = req.cookies?.accessToken;

        if (!accessToken) {
            res.status(401).json({ success: false, message: "Unauthorized access" });
            return;
        }

        // STEP 2:- Verify token
        const decoded = verifyAccessToken(accessToken);

        // 3. Validate user ID
        if (!z.uuid().safeParse(decoded.userId).success) {
            res.status(401).json({ success: false, message: "Invalid access token" });
            return;
        }

        // 4. Find active user
        const user = await findActiveUserById(decoded.userId);

        if (!user) {
            res.status(401).json({ success: false, message: "User not found or account unavailable" });
            return;
        }

        // 4. Attach user ID to request
        req.user = {
            userId: decoded.userId,
        };

        next();
    } catch (error) {
        res.status(401).json({
            success: false,
            message: "Invalid or expired token",
        });
    }
};