import { Router } from "express";
import validate from "../middlewares/validate.middleware.js";
import { authenticateUser } from "../middlewares/auth.middleware.js"
import { sendConnectionRequestSchema } from "../validation/connection.validation.js";
import { sendConnectionRequestController } from "../controllers/connection.controller.js";

const router = Router();

router.post("/request", authenticateUser, validate(sendConnectionRequestSchema), sendConnectionRequestController);

export default router;