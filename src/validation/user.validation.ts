import { z } from "zod";

// ============= Register User Schema =============
export const registerUserSchema = z.object({
    email: z.string().trim().toLowerCase().pipe(z.email().max(100)),
    password: z.string().min(8).max(20).regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/,
        "Password must contain uppercase, lowercase, number and special character"),
    userName: z.string().trim().min(1, "User name is required").max(30),
    displayName: z.string().trim().min(1, "Display name is required").max(50),
}).strict();

// ============= Login User Schema =============
export const loginUserSchema = z.object({
    email: z.string().trim().toLowerCase().pipe(z.email().max(100)),
    password: z.string().min(1).max(20),
}).strict();

export type RegisterUserInput = z.infer<typeof registerUserSchema>;
export type LoginUserInput = z.infer<typeof loginUserSchema>;