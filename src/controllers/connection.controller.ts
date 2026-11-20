import type { Request, Response, NextFunction } from "express";
import { acceptConnectionRequestService, sendConnectionRequestService } from "../services/connection.service.js";

export const sendConnectionRequestController = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const connection = await sendConnectionRequestService({ requesterId: req.user!.userId, addresseeId: req.body.addresseeId });
        res.status(201).json({
            success: true,
            message: "Connection request sent successfully",
            data: connection,
        });
    } catch (error) {
        next(error);
    }
};

export const acceptConnectionRequestController = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { connectionId } = res.locals.validatedData;
        const connection = await acceptConnectionRequestService({ connectionId, userId: req.user!.userId });
        return res.success(connection, "Connection request accepted successfully");
    } catch (error) {
        next(error);
    }
};