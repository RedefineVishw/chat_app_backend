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
        const verificationUrl = `${process.env.CLIENT_URI}/verify-email?token=${token}`;
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



// Rate limit and hash cost: The registration limiter now runs before validation, which is good. It uses an in-memory store, so multiple server instances will need a shared store. SALT_ROUNDS = 10 is a cost setting, not a length limit; benchmark it under realistic load before deciding whether to change it.
// JWT verification: token.utils.ts casts verified JWT data to TokenPayload without checking its runtime shape. Validate required claims, and configure the expected algorithm, issuer, and audience.
// const payload = jwt.verify(token, secret, {
//     algorithms: ["HS256"],
//     issuer: "your-app",
//     audience: "your-api",
// });

// if (
//     typeof payload !== "object" ||
//     payload === null ||
//     typeof payload.userId !== "string" ||
//     payload.userId.length === 0
// ) {
//     throw new Error("Invalid token payload");
// }

// return { userId: payload.userId };

// Redis Rate Limiter
// Multi Device Session Management
// Refresh Token Rotation
// Check Window Functions, Aggregate Queries, and Indexes for Performance
// Views and materialized views.
// Microservices and Event-Driven Architecture
// Retries, timeouts, circuit breakers
// Message queues. Kafka fundamentals. RabbitMQ fundamentals.
// Performance	Caching, batching, compression
// WebSockets, Socket.IO, SSE
// Load Balancing, Clustering, Horizontal Scaling
// CSRF, SSRF, XSS, SQL Injection, NoSQL Injection, Command Injection, Path Traversal, Open Redirects, Clickjacking, Security Headers, CORS Misconfigurations, Insecure Deserialization, Insecure Direct Object References (IDOR), Broken Authentication and Session Management, Insufficient Logging and Monitoring
