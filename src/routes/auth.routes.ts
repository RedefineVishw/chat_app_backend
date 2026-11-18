import { Router } from "express";
import authLimiter from "../middlewares/rateLimiter.middleware.js";
import validate from "../middlewares/validate.middleware.js";
import { authenticateUser } from "../middlewares/auth.middleware.js"

import {
    registerUserSchema,
    verifyEmailSchema,
    resendVerificationEmailSchema,
    loginUserSchema,
    forgotPasswordSchema,
    verifyResetPasswordSchema,
    changePasswordSchema
} from "../validation/user.validation.js";
import {
    registerController,
    resendVerificationEmailController,
    verifyEmailController,
    LoginController,
    RefreshTokenController,
    LogoutController,
    forgotPasswordController,
    resetPasswordController,
    getCurrentUserController,
    changePasswordController
} from "../controllers/auth.controller.js";

const router = Router();

router.post("/register", authLimiter, validate(registerUserSchema), registerController);
router.post("/verify-email", authLimiter, validate(verifyEmailSchema), verifyEmailController);
router.post("/resend-verification-email", authLimiter, validate(resendVerificationEmailSchema), resendVerificationEmailController);
router.post("/login", authLimiter, validate(loginUserSchema), LoginController);
router.post("/refresh", authLimiter, RefreshTokenController);
router.post("/logout", authLimiter, LogoutController)

router.post("/forgot-password", authLimiter, validate(forgotPasswordSchema), forgotPasswordController);
router.post("/reset-password", authLimiter, validate(verifyResetPasswordSchema), resetPasswordController)
router.patch("/change-password", authLimiter, authenticateUser, validate(changePasswordSchema), changePasswordController);

router.get("/me", authLimiter, authenticateUser, getCurrentUserController);

export default router;