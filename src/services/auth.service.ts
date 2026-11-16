import { hashPassword } from "../utils/password.utils.js";
import { generateVerificationToken } from "../utils/token.utils.js";
import sendEmail from "../utils/email.utils.js";

import { createUser, findRegistrationConflicts, } from "../repositories/user.repository.js";
import { type RegisterInput } from "../types/auth.types.js";

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
            email,
            passwordHash,
            userName,
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
        const verificationUrl = `${process.env.CLIENT_URL}/verify-email?token=${token}`;
        await sendEmail({
            to: email,
            subject: "Verify your Zuno account",
            html: `
                <h2>Welcome to Zeno!</h2>
                <p>Please verify your email address by clicking below.</p>
                <a href="${verificationUrl}">Verify Email</a>
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
