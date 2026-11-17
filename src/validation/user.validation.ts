import { z } from "zod";


export const emailSchema = z.string().trim().toLowerCase().pipe(z.email().max(100));


// ============= Register User Schema =============
export const registerUserSchema = z.object({
    email: emailSchema,
    password: z.string().min(8).max(20).regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/,
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