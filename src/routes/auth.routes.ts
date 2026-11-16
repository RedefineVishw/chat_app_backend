import { Router } from "express";
import { registerController } from "../controllers/auth.controller.js";
import validate from "../middlewares/validate.middleware.js";
import { registerUserSchema } from "../validation/user.validation.js";
import authLimiter from "../middlewares/rateLimiter.middleware.js";

const router = Router();

// POST /api/auth/register
router.post("/register", validate(registerUserSchema), authLimiter, registerController,);

export default router;
