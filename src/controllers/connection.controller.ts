import type { Request, Response, NextFunction } from "express";
import { sendConnectionRequestService } from "../services/connection.service.js";

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