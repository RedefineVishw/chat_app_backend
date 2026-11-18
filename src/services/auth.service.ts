import { createHash } from "crypto";
import { type RegisterInput } from "../types/auth.types.js";

import { comparePassword, hashPassword } from "../utils/password.utils.js";

import sendEmail from "../utils/email.utils.js";
import {
    generateAccessToken,
    generateRefreshToken,
    generateVerificationToken,
    verifyRefreshToken
} from "../utils/token.utils.js";
import {
    changePasswordByUserId,
    clearPasswordResetToken,
    completeLogin,
    createUser,
    findRegistrationConflicts,
    findUserByEmail,
    findUserForPasswordChange,
    findUserProfileById,
    handleFailedLogin,
    resetPasswordByTokenHash,
    revokeRefreshToken,
    rotateRefreshTokenHash,
    savePasswordResetToken,
    saveRefreshTokenHash,
    updateVerificationToken,
    verifyUserEmailByTokenHash
} from "../repositories/user.repository.js";

const isUniqueViolation = (error: unknown): boolean =>
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "23505";

// =============== Registration Service ===============
export const registerUser = async (data: RegisterInput) => {
    const { email, password, userName, displayName } = data;

    // 1. Check for existing email or username
    const conflicts = await findRegistrationConflicts(email, userName);
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedUsername = userName.trim().toLowerCase();

    if (conflicts.some((user) => user.email.toLowerCase() === normalizedEmail)) {
        throw Object.assign(new Error("Email already registered"), { statusCode: 409, });
    }

    if (conflicts.some((user) => user.userName.toLowerCase() === normalizedUsername)) {
        throw Object.assign(new Error("Username already taken"), { statusCode: 409, });
    }

    // 2. Hash password
    const passwordHash = await hashPassword(password);

    // 3. Generate email verification token
    const { token, tokenHash } = generateVerificationToken();
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000);

    let user: Awaited<ReturnType<typeof createUser>>;
    // 4. Create user
    try {
        user = await createUser({
            email: normalizedEmail,
            passwordHash,
            userName: normalizedUsername,
            displayName,
            isEmailVerified: false,
            emailVerificationTokenHash: tokenHash,
            emailVerificationExpires: expiresAt,
        });
    } catch (error) {
        if (isUniqueViolation(error)) {
            throw Object.assign(
                new Error("Email or username is already registered"),
                { statusCode: 409 },
            );
        }

        throw error;
    }

    // 5. Send verification email
    let emailSent = true;

    try {
        const verificationUrl = new URL("/verify-email", process.env.CLIENT_URI);
        verificationUrl.searchParams.set("token", token);
        await sendEmail({
            to: normalizedEmail,
            subject: "Verify your Zeno account",
            html: `
                <h2>Welcome to Zeno!</h2>
                <p>Please verify your email address by clicking below.</p>
                <a href="${verificationUrl.toString()}">Verify Email</a>
                <p>This link expires in 30 minutes.</p>
            `,
        });
    } catch (error) {
        emailSent = false;
        console.error("Verification email failed:", error);
    }

    // 6. Return safe response
    return {
        user: {
            id: user.id,
            email: user.email,
            userName: user.userName,
            displayName: user.displayName,
        },
        emailSent,
        message: emailSent
            ? "Registration successful. Please verify your email."
            : "Account created, but verification email could not be sent. Please request another email.",
    };
};

export const verifyEmailToken = async (token: string) => {
    // 1. Hash the received raw token
    const tokenHash = createHash("sha256").update(token).digest("hex");

    // 2. Verify user and consume token atomically
    const user = await verifyUserEmailByTokenHash(tokenHash);

    if (!user) {
        throw Object.assign(new Error("Invalid or expired verification link"), { statusCode: 400 },);
    }

    // 3. Return safe user details
    return { user, message: "Email verified successfully." };
}

export const resendVerificationEmail = async (email: string) => {
    const normalizedEmail = email.trim().toLowerCase();

    // 1. Find user
    const user = await findUserByEmail(normalizedEmail);

    // 2. If user doesn't exist or is already verified, return a generic message
    if (!user || user.isEmailVerified) {
        return { message: "If an unverified account exists with this email, a verification link will be sent." };
    }

    // 3. Generate new verification token
    const { token, tokenHash } = generateVerificationToken();
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000);

    // 4. Update token in database
    const updatedUser = await updateVerificationToken(
        user.id,
        tokenHash,
        expiresAt,
    );

    if (!updatedUser) {
        return { message: "If an unverified account exists with this email, a verification link will be sent." };
    }

    // 5. Send verification email
    try {
        const verificationUrl = new URL("/verify-email", process.env.CLIENT_URI);
        verificationUrl.searchParams.set("token", token);
        await sendEmail({
            to: updatedUser.email,
            subject: "Verify your Zeno account",
            html: `
                <h2>Verify your Zeno account</h2>
                <p>Please click the link below to verify your email address.</p>
                <a href="${verificationUrl.toString()}">Verify Email</a>
                <p>This link expires in 30 minutes.</p>
            `,
        });
    } catch (error) {
        console.error("Resend verification email failed:", error);
        throw Object.assign(new Error("Unable to send verification email. Please try again later."), { statusCode: 500 });
    }
    return { message: "Verification email sent successfully." };
}

export const loginUser = async (email: string, password: string) => {
    // 1. Find user by email
    const user = await findUserByEmail(email);
    if (!user) {
        throw Object.assign(new Error("Invalid email or password"), { statusCode: 401 });
    }

    // 2. Check account status
    if (!user.isActive) {
        throw Object.assign(new Error("Your account is disabled"), { statusCode: 403 });
    }

    // 3. Check account lock
    if (user.lockUntil && user.lockUntil > new Date()) {
        throw Object.assign(new Error("Account temporarily locked. Try again later."), { statusCode: 423 },);
    }

    // 4. Check Credentials
    const isPasswordValid = await comparePassword(password, user.passwordHash);

    // 5. Handle failed login
    if (!isPasswordValid) {
        await handleFailedLogin(user.id);
        throw Object.assign(new Error("Invalid email or password"), { statusCode: 401 });
    }

    // 6. Check email verification status
    if (!user.isEmailVerified) {
        throw Object.assign(new Error("Please verify your email before logging in"), { statusCode: 403 });
    }

    // 7. Reset attempts and update last login
    await completeLogin(user.id);

    // 8. Generate Tokens
    const accessToken = generateAccessToken(user.id);
    const refreshToken = generateRefreshToken(user.id);
    const refreshTokenHash = createHash("sha256").update(refreshToken).digest("hex");
    await saveRefreshTokenHash(user.id, refreshTokenHash);

    // 9. Return safe user details and tokens
    return {
        user: {
            id: user.id,
            email: user.email,
            userName: user.userName,
            displayName: user.displayName,
        },
        accessToken,
        refreshToken,
        message: "Login successful",
    };
}

export const refreshUserToken = async (refreshToken: string) => {
    // 1. Verify refresh token
    let payload = verifyRefreshToken(refreshToken);

    // 2. Extract user ID
    const userId = payload.userId;
    if (!userId) {
        throw Object.assign(new Error("Invalid refresh token"), { statusCode: 401 });
    }

    // 3. Hash current refresh token
    const currentTokenHash = createHash("sha256").update(refreshToken).digest("hex");

    // 4. Generate new tokens
    const newAccessToken = generateAccessToken(userId);
    const newRefreshToken = generateRefreshToken(userId);

    // 5. Hash new refresh token
    const newTokenHash = createHash("sha256").update(newRefreshToken).digest("hex");

    // 6. Atomically rotate stored refresh token
    const user = await rotateRefreshTokenHash(userId, currentTokenHash, newTokenHash);

    if (!user) {
        throw Object.assign(new Error("Invalid or expired refresh token"), { statusCode: 401 });
    }

    // 7. Return new tokens and safe user details
    return {
        user,
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
        message: "Token refreshed successfully",
    };
};

export const logoutUser = async (refreshToken: string) => {
    if (refreshToken) {
        const tokenHash = createHash("sha256")
            .update(refreshToken)
            .digest("hex");

        await revokeRefreshToken(tokenHash);
    }

    return { message: "Logged out successfully" };
}

export const getCurrentUser = async (userId: string) => {
    const user = await findUserProfileById(userId);
    if (!user) {
        throw Object.assign(new Error("User profile not found"), { statusCode: 404 });
    }
    return user;
}

export const forgotPassword = async (email: string) => {
    const message = "If an account with that email exists, a password reset link has been sent.";
    // STEP 1: Generate secure reset token
    const { token, tokenHash } = generateVerificationToken();

    // STEP 2: Set token expiry (15 minutes)
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    // STEP 3: Save hashed token in database
    const user = await savePasswordResetToken(email, tokenHash, expiresAt);

    // STEP 4: Prevent email enumeration
    if (!user) { return { message }; }

    // STEP 5: Generate reset URL
    const resetUrl = new URL("/reset-password", process.env.CLIENT_URI);
    resetUrl.searchParams.set("token", token);

    // STEP 6: Send reset email
    try {
        await sendEmail({
            to: user.email,
            subject: "Reset Your Zeno Password",
            html: `
                <h2>Password Reset</h2>
                <p>We received a request to reset your Zeno password.</p>
                <p>Click below to reset your password.</p>

                <a href="${resetUrl.toString()}">
                    Reset Password
                </a>

                <p>This link expires in 15 minutes.</p>
                <p>If you did not request this, you can safely ignore this email.</p>
            `,
        });
    } catch (error) {
        console.error("Password reset email failed:", error);
        try {
            await clearPasswordResetToken(user.id, tokenHash);
        } catch (cleanupError) {
            console.error(
                "Failed to clear password reset token:",
                cleanupError
            );
        }
    }

    // STEP 7: Always return the same response
    return { message };
}

export const resetPassword = async (token: string, newPassword: string) => {
    // STEP 1: Hash the received reset token
    const tokenHash = createHash("sha256").update(token).digest("hex");

    // STEP 2: Hash the new password
    const newPasswordHash = await hashPassword(newPassword);

    // STEP 3: Atomically validate token and update password
    const user = await resetPasswordByTokenHash(tokenHash, newPasswordHash);

    // STEP 4: Reject invalid, expired, or already-used tokens
    if (!user) {
        return { success: false as const, message: "Invalid or expired password reset link." };
    }

    // STEP 5: Return success
    return {
        success: true as const,
        message: "Your password has been reset successfully.",
    };
};

export const changePassword = async (userId: string, currentPassword: string, newPassword: string) => {
    // 1. Find user
    const user = await findUserForPasswordChange(userId);
    if (!user) {
        throw Object.assign(new Error("User not found."), { statusCode: 404, });
    }

    // STEP 2: Verify current password
    const isPasswordValid = await comparePassword(currentPassword, user.passwordHash);
    if (!isPasswordValid) {
        throw Object.assign(new Error("Current password is incorrect."), { statusCode: 400, });
    }

    // STEP 3: Hash new password
    const newPasswordHash = await hashPassword(newPassword);

    // STEP 4: Update password and invalidate refresh session
    const updatedUser = await changePasswordByUserId(userId, user.passwordHash, newPasswordHash);

    if (!updatedUser) {
        throw Object.assign(new Error("Unable to change password. Please try again."), { statusCode: 409, });
    }

    return {
        message: "Password changed successfully.",
    };
};



// Rate limit and hash cost: The registration limiter now runs before validation, which is good. It uses an in-memory store, so multiple server instances will need a shared store. SALT_ROUNDS = 10 is a cost setting, not a length limit; benchmark it under realistic load before deciding whether to change it.

// Redis Rate Limiter
// Multi Device Session Management
// Check Window Functions, Aggregate Queries, and Indexes for Performance
// Views and materialized views.
// Microservices and Event-Driven Architecture
// Retries, timeouts, circuit breakers
// Message queues. Kafka fundamentals. RabbitMQ fundamentals.
// Performance	Caching, batching, compression
// WebSockets, Socket.IO, SSE
// Load Balancing, Clustering, Horizontal Scaling
// CSRF, SSRF, XSS, SQL Injection, NoSQL Injection, Command Injection, Path Traversal, Open Redirects, Clickjacking, Security Headers, CORS Misconfigurations, Insecure Deserialization, Insecure Direct Object References (IDOR), Broken Authentication and Session Management, Insufficient Logging and Monitoring