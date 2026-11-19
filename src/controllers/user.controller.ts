import type { Request, Response, NextFunction } from "express";
import { deleteAvatarService, getPublicUserProfileService, updateUserProfileService, uploadAvatarService } from "../services/user.service.js";

export const updateUserProfileController = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const user = await updateUserProfileService(req.user!.userId, req.body);
        res.status(200).json({ success: true, message: "Profile updated successfully", user });
    } catch (error) {
        next(error);
    }
};

// Get public user profile
export const getPublicUserProfileController = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const username = req.params.username;
        if (typeof username !== "string") {
            res.status(400).json({ success: false, message: "Invalid username" });
            return;
        }
        const user = await getPublicUserProfileService(username);
        res.status(200).json({ success: true, user });
    } catch (error) {
        next(error);
    }
};

export const uploadAvatarController = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        if (!req.file) {
            res.status(400).json({ success: false, message: "Avatar image is required", });
            return;
        }
        const user = await uploadAvatarService(req.user!.userId, req.file.buffer);
        res.status(200).json({
            success: true,
            message: "Avatar updated successfully",
            avatarKey: user.avatarKey,
        });
    } catch (error) {
        next(error);
    }
};


export const deleteAvatarController = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const user = await deleteAvatarService(req.user!.userId);
        res.status(200).json({
            success: true,
            message: "Avatar removed successfully",
            avatarKey: user.avatarKey,
        });
    } catch (error) {
        next(error);
    }
};