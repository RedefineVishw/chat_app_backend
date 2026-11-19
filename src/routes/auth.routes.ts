import { Router } from "express";
import { authLimiter, loginLimiter, sensitiveAuthLimiter } from "../middlewares/rateLimiter.middleware.js";
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
router.post("/verify-email", sensitiveAuthLimiter, validate(verifyEmailSchema), verifyEmailController);
router.post("/resend-verification-email", sensitiveAuthLimiter, validate(resendVerificationEmailSchema), resendVerificationEmailController);
router.post("/login", loginLimiter, validate(loginUserSchema), LoginController);
router.post("/refresh", authLimiter, RefreshTokenController);
router.post("/logout", authLimiter, LogoutController)

router.post("/forgot-password", sensitiveAuthLimiter, validate(forgotPasswordSchema), forgotPasswordController);
router.post("/reset-password", sensitiveAuthLimiter, validate(verifyResetPasswordSchema), resetPasswordController)
router.patch("/change-password", sensitiveAuthLimiter, authenticateUser, validate(changePasswordSchema), changePasswordController);

router.get("/me", authenticateUser, getCurrentUserController);

export default router;