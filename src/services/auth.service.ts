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


// Important consistency and security improvements
// Email length differs: user.validation.ts caps email at 100 characters, while the database column in user.schema.ts allows 254. Align these limits. Also, the current validation chain trims after validating the email, so whitespace-wrapped input may be rejected before trimming.
// Password byte length: bcrypt has a 72-byte input limit; a 72-character limit is not always 72 bytes for Unicode passwords. Define and enforce a clear byte-length policy in validation. Keep password hashing deliberately expensive, but benchmark its cost and protect it with rate limiting.
// Config consistency: app.ts uses CLIENT_URI, while auth.service.ts uses CLIENT_URL. Standardize these and validate required configuration at startup. Review the CORS behavior when the allowed origin is missing, especially because credentials are enabled.
// JWT verification: token.utils.ts casts verified JWT data to TokenPayload without checking its runtime shape. Validate required claims, and configure the expected algorithm, issuer, and audience.
// Logging: app.ts uses Morgan’s dev format unconditionally. Use production-appropriate structured logs and avoid logging sensitive query parameters or tokens.
// Request limits: Set an explicit, suitably small JSON body limit in app.ts. The URL-encoded parser may not be needed for a JSON API; if retained, limit its input too.
// Secrets: A .env file is present. I did not inspect it. Ensure it is ignored by version control; if secrets were ever committed, rotate them.
// Scaling and resilience work
// Database pool sizing: database.ts sets max: 10 per process. That may be reasonable, but total connections multiply across instances. Measure database limits and consider a connection pooler before simply increasing the pool.
// Graceful shutdown: server.ts doesn’t retain the HTTP server handle or close the database pool on shutdown. Add graceful shutdown so deploys and restarts can finish in-flight requests.
// Health checks: health.routes.ts checks the database on every health request. Separate a lightweight liveness check from a readiness check that verifies dependencies.
// Observability and tests: Add request/error metrics, database latency and pool monitoring, and tests for registration validation, duplicate handling, and concurrent inserts. There are no test scripts in package.json, and a build alone won’t establish capacity; use load tests against a production-like database and deployment.
// Email configuration: email.utils.ts reads SMTP configuration when the module loads, so missing email settings can prevent the whole app from starting. Decide explicitly whether that should be a startup requirement or whether email setup should be isolated from unrelated endpoints.

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
