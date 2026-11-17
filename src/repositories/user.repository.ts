import { and, eq, gt, isNull, or, sql } from "drizzle-orm";
import { db } from "../config/database.js";
import { users } from "../db/user.schema.js";

// Check if the error is a unique constraint violation (PostgreSQL error code 23505)
export const findRegistrationConflicts = async (email: string, userName: string) => {
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedUsername = userName.trim().toLowerCase();

    return db.select({ id: users.id, email: users.email, userName: users.userName, })
        .from(users).where(and(isNull(users.deletedAt), or(
            sql`lower(${users.email}) = ${normalizedEmail}`,
            sql`lower(${users.userName}) = ${normalizedUsername}`,
        ),),).limit(2);
};

// Create a new user in the database
export const createUser = async (data: typeof users.$inferInsert) => {
    const [user] = await db.insert(users).values(data)
        .returning({
            id: users.id,
            email: users.email,
            userName: users.userName,
            displayName: users.displayName,
            createdAt: users.createdAt,
        });

    if (!user) {
        throw new Error("User creation failed");
    }
    return user;
};

// Find a user by their email verification token hash
export const verifyUserEmailByTokenHash = async (tokenHash: string) => {
    const now = new Date();

    const [user] = await db.update(users).set({
        isEmailVerified: true,
        emailVerifiedAt: now,
        emailVerificationTokenHash: null,
        emailVerificationExpires: null,
    }).where(and(
        eq(users.emailVerificationTokenHash, tokenHash),
        gt(users.emailVerificationExpires, now),
        eq(users.isEmailVerified, false),
        isNull(users.deletedAt),
    ),).returning({ id: users.id, email: users.email, });
    return user;
};

// Find a user by their email address
export const findUserByEmail = async (email: string) => {
    const normalizedEmail = email.trim().toLowerCase();

    const [user] = await db.select({
        id: users.id, email: users.email, isEmailVerified: users.isEmailVerified
    }).
        from(users).where(
            and(sql`lower(${users.email}) = ${normalizedEmail}`, isNull(users.deletedAt),),
        ).limit(1);
    return user;
};

// Update the email verification token and its expiration for a user
export const updateVerificationToken = async (userId: string, tokenHash: string, expiresAt: Date) => {
    const [user] = await db.update(users).set({
        emailVerificationTokenHash: tokenHash,
        emailVerificationExpires: expiresAt,
        updatedAt: new Date(),
    }).where(and(
        eq(users.id, userId),
        eq(users.isEmailVerified, false),
        isNull(users.deletedAt),
    ),).returning({ id: users.id, email: users.email, });
    return user;
};



export const findUserByUsername = async (userName: string) => {
    const normalizedUsername = userName.trim().toLowerCase();
    const [user] = await db.select().from(users).where(
        and(sql`lower(${users.userName}) = ${normalizedUsername}`, isNull(users.deletedAt),
        )).limit(1);
    return user;
};

// Find a user by their ID Used for the sending verification email and verifying the email token
export const findUserById = async (id: string) => {
    const [user] = await db.select().from(users)
        .where(and(eq(users.id, id), isNull(users.deletedAt),),)
        .limit(1);
    return user;
};