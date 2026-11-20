import { Router } from "express";
import validate from "../middlewares/validate.middleware.js";
import { authenticateUser } from "../middlewares/auth.middleware.js"
import { connectionActionSchema, sendConnectionRequestSchema } from "../validation/connection.validation.js";
import { sendConnectionRequestController, acceptConnectionRequestController } from "../controllers/connection.controller.js";

const router = Router();

router.post("/request", authenticateUser, validate(sendConnectionRequestSchema), sendConnectionRequestController);
router.patch("/requests/:connectionId/accept", authenticateUser, validate(connectionActionSchema, "params"), acceptConnectionRequestController);

export default router;