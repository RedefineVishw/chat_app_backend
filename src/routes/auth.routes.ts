import { Router } from "express";
import authLimiter from "../middlewares/rateLimiter.middleware.js";
import validate from "../middlewares/validate.middleware.js";

import {
    registerUserSchema,
    verifyEmailSchema,
    resendVerificationEmailSchema,
    loginUserSchema
} from "../validation/user.validation.js";
import {
    registerController,
    resendVerificationEmailController,
    verifyEmailController,
    LoginController,
    RefreshTokenController,
    LogoutController
} from "../controllers/auth.controller.js";

const router = Router();

router.post("/register", authLimiter, validate(registerUserSchema), registerController);
router.post("/verify-email", authLimiter, validate(verifyEmailSchema), verifyEmailController);
router.post("/resend-verification-email", authLimiter, validate(resendVerificationEmailSchema), resendVerificationEmailController);
router.post("/login", authLimiter, validate(loginUserSchema), LoginController);
router.post("/refresh", authLimiter, RefreshTokenController);
router.post("/logout", authLimiter, LogoutController)

export default router;