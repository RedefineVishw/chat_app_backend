import { z } from "zod";

// ============= Register User Schema =============
export const registerUserSchema = z.object({
    email: z.email().max(100).trim().toLowerCase(),
    password: z.string().min(8).max(72).regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/,
        "Password must contain uppercase, lowercase, number and special character"),
    userName: z.string().trim().min(1, "User name is required").max(30),
    displayName: z.string().trim().min(1, "Display name is required").max(50),
}).strict();

// ============= Login User Schema =============
export const loginUserSchema = z.object({
    email: z.email().max(100).trim().toLowerCase(),
    password: z.string().min(1).max(72),
}).strict();

export type RegisterUserInput = z.infer<typeof registerUserSchema>;
export type LoginUserInput = z.infer<typeof loginUserSchema>;