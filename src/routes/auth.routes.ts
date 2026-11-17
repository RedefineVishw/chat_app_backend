import { Router } from "express";
import {
    registerController,
    resendVerificationEmailController,
    verifyEmailController
} from "../controllers/auth.controller.js";
import validate from "../middlewares/validate.middleware.js";
import { registerUserSchema, verifyEmailSchema, resendVerificationEmailSchema } from "../validation/user.validation.js";
import authLimiter from "../middlewares/rateLimiter.middleware.js";

const router = Router();

router.post("/register", authLimiter, validate(registerUserSchema), registerController);
router.post("/verify-email", authLimiter, validate(verifyEmailSchema), verifyEmailController);
router.post("/resend-verification-email", authLimiter, validate(resendVerificationEmailSchema), resendVerificationEmailController);

export default router;