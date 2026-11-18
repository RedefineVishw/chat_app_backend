import { z } from "zod";


export const emailSchema = z.string().trim().toLowerCase().pipe(z.email().max(100));

// ============= Register User Schema =============
export const registerUserSchema = z.object({
    email: emailSchema,
    password: z.string().min(8).max(20).regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/,
        "Password must contain uppercase, lowercase, number and special character"),
    userName: z.string().trim().min(1, "User name is required").max(30),
    displayName: z.string().trim().min(1, "Display name is required").max(50),
}).strict();

// ============= Login User Schema =============
export const loginUserSchema = z.object({
    email: emailSchema,
    password: z.string().min(1).max(20),
}).strict();

// ============= Verify Email Schema =============
export const verifyEmailSchema = z.object({ token: z.string().min(1, "Verification token is required") }).strict();
export const resendVerificationEmailSchema = z.object({ email: emailSchema }).strict();
export const forgotPasswordSchema = z.object({ email: emailSchema, }).strict();
export const verifyResetPasswordSchema = z.object({
    password: z.string().min(8).max(20).regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/,
        "Password must contain uppercase, lowercase, number and special character"),
    token: z.string().min(1, "Verification token is required"),
}).strict();


export const changePasswordSchema = z.object({
    currentPassword: z.string().min(1, "Current password is required").max(20),
    newPassword: z.string().min(8, "Password must be at least 8 characters").max(20)
        .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).+$/,
            "Password must contain uppercase, lowercase, number and special character"),
}).strict().refine((data) => data.currentPassword !== data.newPassword,
    {
        message: "New password must be different from current password",
        path: ["newPassword"],
    }
);